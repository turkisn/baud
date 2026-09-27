-- Keep auth function calls directly inside scalar SELECTs so both the planner
-- and Supabase's RLS advisor recognize the per-statement initialization plans.
alter policy workspace_owner_read on public.user_workspaces
  using (owner_id = (select auth.uid()) and coalesce((select auth.jwt())->>'is_anonymous','false') <> 'true');
alter policy workspace_owner_insert on public.user_workspaces
  with check (owner_id = (select auth.uid()) and coalesce((select auth.jwt())->>'is_anonymous','false') <> 'true');
alter policy workspace_owner_update on public.user_workspaces
  using (owner_id = (select auth.uid()) and coalesce((select auth.jwt())->>'is_anonymous','false') <> 'true')
  with check (owner_id = (select auth.uid()) and coalesce((select auth.jwt())->>'is_anonymous','false') <> 'true');
