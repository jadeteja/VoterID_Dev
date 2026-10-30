# Security Architecture & Access Control
## Ward 81 Voter Search (వార్డు 81 ఓటర్ల శోధన)

### 1. Row Level Security (RLS) Policy

PostgreSQL RLS ensures data isolation at the database engine level:
- **Anonymous Users**: All `SELECT`, `INSERT`, `UPDATE`, `DELETE` operations are denied by default.
- **Search Users (`search_user`)**:
  - Can only `SELECT` records where `is_active = true`.
  - Cannot export or perform bulk extractions.
  - No write or delete permissions.
- **Administrators (`admin`)**:
  - Full permissions to upload, stage, activate, and replace datasets.
  - Authorized to manage user roles and view audit logs.

### 2. Credential Protection

- The Supabase `service_role` secret key is **never bundled** or referenced in any client-side JavaScript file.
- Only the restricted public `anon` key is exposed via `VITE_SUPABASE_ANON_KEY`, strictly bounded by RLS.

### 3. Protection of Voter Privacy

- The real 28.89 MB voter workbook is gitignored (`.gitignore`) and never checked into source control.
- Voter exports are restricted to authenticated administrators and rate-limited.
- All administrative operations (dataset replacement, user status changes) are written to `public.audit_logs`.
