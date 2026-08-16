# Staging remote migration history

The remote **staging** database is the source of truth for the current BUOD MVP backend contract.

- The staging database currently contains remote migrations through `036_add_publication_state_projection`.
- The repository's historical migration files currently stop at `012`.
- This difference is a known migration-history reconciliation task.
- Do not run a destructive reset or a database push in an attempt to repair this drift.
- Do not fabricate the missing migration SQL or re-apply the staging contract from this repository.
- Before any production promotion, the local and remote migration histories must be deliberately baselined and reconciled.

Until that reconciliation is completed, frontend staging work must consume the documented remote RPC, RLS, and private-storage contracts as they exist.
