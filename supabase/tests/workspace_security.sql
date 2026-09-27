-- Run as the migration/test administrator against staging. All fixtures roll back.
-- JWT claims are simulated here to exercise actual grants, RLS and RPC functions.
begin;
select set_config('test.workspace_a', gen_random_uuid()::text, true);
select set_config('test.workspace_b', gen_random_uuid()::text, true);
insert into auth.users(id, email, raw_user_meta_data) values
  (current_setting('test.workspace_a')::uuid, current_setting('test.workspace_a') || '@workspace-test.invalid', '{}'),
  (current_setting('test.workspace_b')::uuid, current_setting('test.workspace_b') || '@workspace-test.invalid', '{}');
select set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('test.workspace_a'),'role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
do $$
declare first public.user_workspaces; repeated public.user_workspaces; next public.user_workspaces; affected integer;
begin
  first := public.save_my_workspace('[{"id":"a","name":"Private A","products":[]}]',0,gen_random_uuid());
  assert first.revision = 1 and first.owner_id = auth.uid(), 'first save owner and revision';
  repeated := public.save_my_workspace(first.projects,0,first.last_mutation_id);
  assert repeated.revision = 1, 'idempotent insert retry';
  next := public.save_my_workspace('[{"id":"b","name":"Revised A","products":[]}]',1,gen_random_uuid());
  assert next.revision = 2, 'revision advances';
  repeated := public.save_my_workspace(next.projects,1,next.last_mutation_id);
  assert repeated.revision = 2, 'idempotent update retry';
  begin
    perform public.save_my_workspace('[]',1,gen_random_uuid());
    raise exception 'Stale update was accepted';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.save_my_workspace('[]',0,gen_random_uuid());
    raise exception 'Stale create was accepted';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.save_my_workspace('[{"id":"bad","name":"Missing products"}]',2,gen_random_uuid());
    raise exception 'Invalid payload was accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_my_workspace('[{"id":"x","name":"X","products":[]},{"id":"x","name":"Y","products":[]}]',2,gen_random_uuid());
    raise exception 'Duplicate project was accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_my_workspace((select jsonb_agg(jsonb_build_object('id',i::text,'name','X','products','[]'::jsonb)) from generate_series(1,51) i),2,gen_random_uuid());
    raise exception 'Over-limit payload was accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_my_workspace('[]',-1,gen_random_uuid());
    raise exception 'Negative revision was accepted';
  exception when invalid_parameter_value then null; end;
  begin
    update public.user_workspaces set revision=100 where owner_id=auth.uid();
    raise exception 'Revision jump was accepted';
  exception when check_violation then null; end;
  begin
    update public.user_workspaces set owner_id=current_setting('test.workspace_b')::uuid where owner_id=auth.uid();
    raise exception 'Owner mutation was accepted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.user_workspaces where owner_id=auth.uid();
    raise exception 'Direct delete was accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.user_workspaces(owner_id,projects,revision,last_mutation_id)
      values(current_setting('test.workspace_b')::uuid,'[]',1,gen_random_uuid());
    raise exception 'Cross-user insert was accepted';
  exception when insufficient_privilege then null; end;
  assert (select revision from public.user_workspaces where owner_id=auth.uid()) = 2, 'rejected writes preserved data';
end;
$$;
reset role;
select set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('test.workspace_b'),'role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
do $$
declare affected integer;
begin
  assert not exists(select from public.user_workspaces), 'other owner data not readable';
  update public.user_workspaces set projects='[]',revision=revision+1,last_mutation_id=gen_random_uuid()
    where owner_id=current_setting('test.workspace_a')::uuid;
  get diagnostics affected = row_count;
  assert affected = 0, 'other owner data not writable';
  perform public.save_my_workspace('[]',0,gen_random_uuid());
  assert (select count(*) from public.user_workspaces) = 1, 'only own row visible';
end;
$$;
reset role;
select set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('test.workspace_a'),'role','authenticated','is_anonymous',true)::text,true);
set local role authenticated;
do $$ begin
  assert not exists(select from public.user_workspaces), 'anonymous auth cannot read private workspace';
  begin
    perform public.save_my_workspace('[]',2,gen_random_uuid());
    raise exception 'Anonymous auth write was accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role anon;
do $$ begin
  begin
    perform * from public.user_workspaces;
    raise exception 'Unauthenticated read was accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_my_workspace('[]',0,gen_random_uuid());
    raise exception 'Unauthenticated RPC was accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: workspace ownership, revisions, idempotency, validation and anonymous denial' as result;
rollback;
