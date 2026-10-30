# System Architecture
## Ward 81 Voter Search (వార్డు 81 ఓటర్ల శోధన)

### 1. High-Level Architecture

The system is architected as a decoupled, zero-maintenance, zero-cost stack:

```
[ Client Browser ]
  ├── React 18 + TypeScript + Vite SPA
  ├── Bilingual Search & Transliteration Module
  └── In-Browser ExcelJS Streaming Parser
            │
            ├── HTTPS (PostgREST / Auth)
            ▼
[ Supabase Free Tier ]
  ├── GoTrue Authentication (JWT with RBAC role claims)
  ├── PostgreSQL 15 Database (pg_trgm indexes)
  └── Row Level Security (RLS) Policies
```

### 2. Zero-Cost Infrastructure Allocation

1. **Frontend Hosting — Cloudflare Pages**:
   - Zero monthly cost.
   - Unlimited bandwidth and edge caching.
   - Automatic SSL certificates.
   - Built with SPA fallback (`_redirects`: `/* /index.html 200`).

2. **Backend & Database — Supabase Free Tier**:
   - 500 MB database quota (Ward 81 voter dataset with indexes takes ~22 MB).
   - 50,000 monthly active users.
   - No dedicated Node.js or Spring Boot server required.

### 3. Client-Side Chunked Ingestion Pipeline

To avoid sending the 28.89 MB Excel workbook in one HTTP payload (which would exceed free-tier request size limits), parsing is executed inside the administrator's browser:
1. `ExcelJS` opens the workbook in-memory.
2. The canonical `All Voters` worksheet is parsed row by row.
3. Telugu names are normalized and Romanized phonetically in the browser.
4. Validated records are displayed for preview before being committed in 500-record batches to PostgreSQL.
