-- Remove anonymous grants from internal tables that are not part of the
-- public catalog contract. RLS already denied their rows, but revoking the
-- table privilege provides an independent fail-closed boundary.

revoke select on table public.buod_reference_counters from anon;
revoke select on table public.product_review_actions from anon;
revoke select on table public.product_revisions from anon;
revoke select on table public.profiles from anon;
revoke select on table public.project_product_instances from anon;
