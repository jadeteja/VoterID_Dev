# Quality Assurance & Testing Guide
## Ward 81 Voter Search (వార్డు 81 ఓటర్ల శోధన)

### 1. Bilingual Search Test Cases

| Input | Language | Target Column | Expected Result |
|---|---|---|---|
| `రమేష్` | Telugu | `voter_name` | Matches all voters with Telugu name containing రమేష్ |
| `Ramesh` | English | `voter_name_romanized` | Matches corresponding Telugu names phonetically |
| `Lakshmi` | English | `voter_name_romanized` | Matches Telugu names containing లక్ష్మి / లక్ష్మీ |
| `Laxmi` | English | `voter_name_romanized` | Matches using `lax` $\leftrightarrow$ `laksh` alias |
| `TMO3560539` | Alphanumeric | `epic_number` | Exact Voter ID match at rank score 1,000 |
| `77-37/1-A/1` | String | `door_number` | Matches exact household door number |
| `81/1` | String | `polling_station` | Filters to Booth 81/1 (948 voters) |

### 2. OCR Edge Case Validations

- **Blank Age Handling**: Rows flagged with `"Age check"` where age is null render as `"Check"` rather than displaying NaN or 0.
- **Unread Names**: Rows where name was illegible in source scan render gracefully without application crash.
