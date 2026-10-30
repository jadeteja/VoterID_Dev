# Database Architecture & Schema
## Ward 81 Voter Search (వార్డు 81 ఓటర్ల శోధన)

### 1. Database Specifications

- **Database Engine**: PostgreSQL 15 (Supabase managed).
- **Core Extensions**:
  - `uuid-ossp`: For generating unique UUID identifiers.
  - `pg_trgm`: PostgreSQL trigram module providing fast partial, fuzzy, and substring matching across Telugu and Romanized text columns.

### 2. Entity Relational Diagram

```
+--------------------+       1:N       +----------------------+
|  import_batches    |----------------<|       voters         |
+--------------------+                 +----------------------+
| id (PK)            |                 | id (PK)              |
| original_filename  |                 | import_batch_id (FK) |
| file_size          |                 | serial_number        |
| import_status      |                 | voter_name (Telugu)  |
| expected_rows      |                 | voter_name_romanized |
| imported_rows      |                 | relative_name        |
| started_at         |                 | epic_number          |
+--------------------+                 | door_number          |
                                       | polling_station      |
+--------------------+                 | age                  |
|   user_profiles    |                 | gender               |
+--------------------+                 | ocr_review           |
| id (PK)            |                 +----------------------+
| display_name       |
| role               |
| active             |
+--------------------+
```

### 3. Key Indexes

- `idx_voters_epic`: B-Tree index on `epic_number` for instant Voter ID lookups.
- `idx_voters_door`: B-Tree index on `door_number`.
- `idx_voters_polling_station`: B-Tree index on `polling_station`.
- `idx_voters_name_trgm`: GIN Trigram index on `voter_name` for fast Telugu substring queries.
- `idx_voters_name_rom_trgm`: GIN Trigram index on `voter_name_romanized` for English phonetic matches.
