# Troubleshooting & Operational Guide
## Ward 81 Voter Search (వార్డు 81 ఓటర్ల శోధన)

### 1. Inactivity Pause Behavior (Supabase Free Tier)
Supabase automatically pauses free-tier databases after 7 days of inactivity.
- **Symptom**: Search fails with connection timeout.
- **Resolution**: Open your Supabase project dashboard and click **Restore / Unpause**. Database wakes up within 60 seconds.

### 2. Large File Parsing in Browser
- **Issue**: Excel file upload freezes the browser tab.
- **Fix**: The built-in parser uses incremental progress events and only targets the canonical `All Voters` sheet rather than reading all 14 worksheets into memory simultaneously.

### 3. Font Rendering Issues
- **Issue**: Telugu characters or matras appear disconnected or overlapping.
- **Fix**: The application includes explicit web fonts for `Noto Sans Telugu` in `index.html` with correct Unicode NFC normalization.
