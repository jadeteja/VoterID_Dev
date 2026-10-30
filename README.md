# Ward 81 — Telugu & English Voter Data Search Website
## వార్డు 81 ఓటర్ల శోధన – విజయవాడ మున్సిపల్ కార్పొరేషన్

Production-grade, zero-cost-hosted web application for searching electoral records imported from an Excel workbook, supporting bilingual search (Telugu & English) across all fields with high-performance phonetic matching.

---

## 1. Key Features

- **Bilingual Bidirectional Search**: Search voter records using either Telugu Unicode (`రమేష్`, `లక్ష్మి`) or English Romanized phonetics (`Ramesh`, `Lakshmi`, `Laxmi`), Door Number (`77-37/1-A/1`), or EPIC Voter ID (`TMO3560539`).
- **All 10,307 Records Supported**: Canonical extraction from the `All Voters` worksheet across all 11 polling stations (`81/1` to `81/11`).
- **Client-Side Streaming Parser**: Processes the 29 MB workbook directly in the administrator's browser with memory-efficient chunks, avoiding Edge Function payload limits.
- **Robust Role-Based Access Control (RBAC)**: Distinguishes between `admin` (upload, replace, export, manage users) and `search_user` (search-only, no write permissions).
- **Government Record Dashboard**: Clean, responsive design adhering to the deep blue government aesthetic (`#123D73`), with dedicated mobile card views and accessible desktop tables.
- **100% Free Tier Architecture**: Designed for ₹0/month operating cost using **Cloudflare Pages** (frontend CDN) and **Supabase** (PostgreSQL + Auth + RLS).

---

## 2. Quick Local Setup

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### Installation & Run
```bash
# Clone the repository
git clone <your-repo-url>
cd VoterId_Dev

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, React Router DOM, TanStack Table & Query.
- **Backend**: Supabase PostgreSQL with `pg_trgm` extension, Row Level Security (RLS), and custom RPC ranked search.
- **Excel Engine**: ExcelJS in-browser streaming parser with custom Telugu diacritic normalizer and Romanizer.
- **Hosting**: Cloudflare Pages for React SPA (`pages.dev`), Supabase free tier for database and authentication.

---

## 4. Documentation Index

Detailed architectural and operational documentation is located in the `docs/` folder:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System design, components, and data flow.
- [`docs/DATABASE.md`](docs/DATABASE.md) — PostgreSQL schema, indexes, and RLS policies.
- [`docs/EXCEL_IMPORT.md`](docs/EXCEL_IMPORT.md) — Excel ingestion pipeline and column mapping.
- [`docs/BILINGUAL_SEARCH.md`](docs/BILINGUAL_SEARCH.md) — Telugu & English transliteration engine details.
- [`docs/SECURITY.md`](docs/SECURITY.md) — RBAC, credential isolation, and audit logging.
- [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md) — Step-by-step local development setup.
- [`docs/FREE_HOSTING_DEPLOYMENT.md`](docs/FREE_HOSTING_DEPLOYMENT.md) — Zero-cost deployment to Cloudflare Pages & Supabase.
- [`docs/TESTING.md`](docs/TESTING.md) — Test cases for search, parsing, and security.
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) — Common issues and fixes.
