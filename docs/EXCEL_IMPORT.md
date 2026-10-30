# Excel Import & Ingestion Pipeline
## Ward 81 Voter Search (వార్డు 81 ఓటర్ల శోధన)

### 1. Ingestion Overview

The Excel workbook `Ward81 Voter List New.xlsx` contains 14 worksheets:
- 11 individual polling station sheets (`PS 81-1` to `PS 81-11`).
- 1 `Summary` sheet containing metadata and official counts.
- 1 `Search` sheet with Excel formula functions.
- 1 **`All Voters`** master worksheet containing all 10,307 records.

### 2. Ingestion Flow

1. **Inspection**:
   The parser inspects workbook structure and targets the canonical `All Voters` worksheet.
2. **Streaming Parse**:
   Rows 1 to 4 are skipped (title and headers). Records are read starting at Row 5 through Row 10,311.
3. **Data Normalization & Transliteration**:
   - Telugu name is preserved bit-for-bit in `voter_name`.
   - Invisible zero-width non-joiners are stripped in `voter_name_search`.
   - Romanized phonetic search tokens are created in `voter_name_romanized`.
4. **Validation Preview**:
   Before committing, the admin reviews record counts, polling station distributions, and OCR review flags.
5. **Atomic Commit**:
   Records are activated atomically, preventing dataset corruption.
