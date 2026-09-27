import { supabase } from '../lib/supabase';

// Every operation runs with the signed-in user's JWT; RLS is the authority.
export function workspaceService(owner) {
  return {
    async read(signal) {
      const { data, error } = await supabase.from('user_workspaces')
        .select('owner_id,projects,revision,last_mutation_id,updated_at')
        .eq('owner_id', owner).abortSignal(signal).maybeSingle();
      if (error) throw error;
      if (data && data.owner_id !== owner) throw new Error('Workspace owner mismatch');
      return data;
    },
    async save(pending, signal) {
      const { data, error } = await supabase.rpc('save_my_workspace', {
        p_projects: pending.projects,
        p_expected_revision: pending.expectedRevision,
        p_mutation_id: pending.id,
      }).abortSignal(signal);
      if (error) throw error;
      if (!data || data.owner_id !== owner) throw new Error('Invalid workspace response');
      return data;
    },
  };
}
