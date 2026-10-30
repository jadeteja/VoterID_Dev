# Bilingual Search Engine
## Ward 81 Voter Search (వార్డు 81 ఓటర్ల శోధన)

### 1. The Bilingual Challenge

Voter electoral rolls in Andhra Pradesh are originally prepared in Telugu Unicode. Users and booth agents frequently search using English spellings (e.g. typing `Ramesh` or `Lakshmi`) or direct Telugu keyboard input (`రమేష్` or `లక్ష్మి`). Furthermore, romanized spellings vary significantly (`Laxmi` vs `Lakshmi`, `Srinivas` vs `Sreenivas`).

### 2. Search Engine Pipeline

1. **Language Detection**:
   Input text is checked against the Telugu Unicode block (`\u0C00` to `\u0C7F`).
   - If Telugu characters are detected: queries are matched directly against `voter_name` and `voter_name_search`.
   - If Roman alphanumeric characters are detected: queries are matched against `epic_number`, `door_number`, `polling_station`, and phonetic Romanized representations (`voter_name_romanized`).

2. **Telugu Normalization**:
   - Cleans zero-width characters (`\u200C`, `\u200D`).
   - Normalizes composite glyphs using Unicode NFC.
   - Cleans leading, trailing, and duplicate whitespaces.

3. **Romanization Phonetics Engine**:
   - Maps Telugu aksharas (vowels, consonants, matras, and viramas) to standard phonetic Roman clusters.
   - Generates spelling variations for common Telugu name aliases:
     - `lax` $\leftrightarrow$ `laksh`
     - `ee` $\leftrightarrow$ `i`
     - `oo` $\leftrightarrow$ `u`
     - `v` $\leftrightarrow$ `w`
     - `sh` $\leftrightarrow$ `s`

4. **Multi-tier Relevance Ranking**:
   - Exact EPIC Match: 1,000 points.
   - Exact Telugu Name Match: 800 points.
   - Exact Romanized Name Match: 700 points.
   - Exact Door Number Match: 600 points.
   - Partial / Substring Match: 250–400 points.
