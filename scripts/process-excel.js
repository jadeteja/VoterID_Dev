import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const EXCEL_PATH = 'C:/Users/jadet/Downloads/Ward81 Voter List New.xlsx';
const OUTPUT_DIR = path.resolve('public/data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'ward81_voters.json');

// Telugu transliteration
const TELUGU_TO_ROMAN_MAP = {
  'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo',
  'ఋ': 'ru', 'ౠ': 'roo', 'ఎ': 'e', 'ఏ': 'e', 'ఐ': 'ai', 'ఒ': 'o',
  'ఓ': 'o', 'ఔ': 'au', 'అం': 'am', 'అః': 'aha',
  'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng',
  'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
  'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n',
  'త': 't', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
  'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
  'య': 'y', 'ర': 'r', 'ఱ': 'r', 'ల': 'l', 'ళ': 'l',
  'వ': 'v', 'శ': 'sh', 'ష': 'sh', 'స': 's', 'హ': 'h',
  'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo',
  'ృ': 'ru', 'ౄ': 'roo', 'ె': 'e', 'ే': 'e', 'ై': 'ai',
  'ొ': 'o', 'ో': 'o', 'ౌ': 'au', 'ం': 'm', 'ః': 'h',
  '్': '',
};

function isConsonant(char) {
  const code = char.charCodeAt(0);
  return code >= 0x0C15 && code <= 0x0C39;
}

function isMatra(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x0C3E && code <= 0x0C4C) || code === 0x0C02 || code === 0x0C03;
}

function normalizeTeluguText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFC')
    .replace(/[\u200C\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function romanizeTelugu(teluguText) {
  if (!teluguText) return '';
  const text = normalizeTeluguText(teluguText);
  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    if (char === ' ') {
      result += ' ';
      continue;
    }

    if (TELUGU_TO_ROMAN_MAP[char] !== undefined) {
      const rom = TELUGU_TO_ROMAN_MAP[char];
      if (nextChar && TELUGU_TO_ROMAN_MAP[nextChar] !== undefined && isMatra(nextChar)) {
        result += rom + TELUGU_TO_ROMAN_MAP[nextChar];
        i++;
      } else if (nextChar === '్') {
        result += rom;
        i++;
      } else if (isConsonant(char)) {
        result += rom + 'a';
      } else {
        result += rom;
      }
    } else {
      result += char;
    }
  }

  return result.toLowerCase().replace(/\s+/g, ' ').trim();
}

console.log('Reading Excel workbook from:', EXCEL_PATH);
const wb = xlsx.readFile(EXCEL_PATH);
const sheetName = 'All Voters';
const sheet = wb.Sheets[sheetName];

if (!sheet) {
  console.error('Could not find sheet:', sheetName);
  process.exit(1);
}

const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
console.log('Total raw rows in sheet:', rawRows.length);

const psDescriptions = {
  '81/1': 'చలసాని సూర్య ప్రకాశరావు ఎలిమెంటరీ స్కూల్, దక్షిణ వైపు భవనంలో పడమర వైపు నుండి రెండవ గది',
  '81/2': 'చలసాని సూర్య ప్రకాశరావు ఎలిమెంటరీ స్కూల్, దక్షిణ వైపు భవనంలో పడమర వైపు నుండి మూడవ గది',
  '81/3': 'చలసాని సూర్య ప్రకాశరావు ఎలిమెంటరీ స్కూల్, దక్షిణ వైపు భవనంలో పడమర వైపు నుండి నాలుగవ గది',
  '81/4': 'మండల ప్రజా పరిషత్ ప్రాథమిక పాఠశాల, తూర్పు వైపు భవనం',
  '81/5': 'మండల ప్రజా పరిషత్ ప్రాథమిక పాఠశాల, పడమర వైపు భవనం',
  '81/6': 'కార్పొరేషన్ హైస్కూల్, ఉత్తర వైపు గది',
  '81/7': 'కార్పొరేషన్ హైస్కూల్, తూర్పు వైపు గది',
  '81/8': 'విద్యా నికేతన్ స్కూల్, మొదటి గది',
  '81/9': 'విద్యా నికేతన్ స్కూల్, రెండవ గది',
  '81/10': 'శాంతి నికేతన్ స్కూల్, ప్రధాన హాలు',
  '81/11': 'శాంతి నికేతన్ స్కూల్, తూర్పు గది',
};

const voters = [];
const batchId = 'batch-' + Date.now();
const timestamp = new Date().toISOString();

// Data starts at row index 4 (5th row)
for (let i = 4; i < rawRows.length; i++) {
  const row = rawRows[i];
  if (!row || row.length === 0) continue;

  const sNoRaw = row[0];
  const voterNameRaw = row[1];
  const relationRaw = row[2];
  const relativeNameRaw = row[3];
  const ageRaw = row[4];
  const genderRaw = row[5];
  const doorNoRaw = row[6];
  const epicRaw = row[7];
  const psRaw = row[8];
  const acPartRaw = row[9];
  const pdfPageRaw = row[10];
  const ocrReviewRaw = row[11];
  const sourceSheetRaw = row[13] || '';
  const sourceRowRaw = row[14] || i + 1;
  const psDescRaw = row[15] || '';

  const voterName = String(voterNameRaw || '').trim();
  const epic = String(epicRaw || '').trim().toUpperCase();

  if (!voterName && !epic) continue;

  const serialNumber = Number(sNoRaw) || (voters.length + 1);
  const relativeName = String(relativeNameRaw || '').trim();
  const relation = String(relationRaw || '').trim() || 'Other';
  const age = ageRaw && !isNaN(Number(ageRaw)) ? Number(ageRaw) : null;
  const gender = String(genderRaw || '').trim() || 'Unknown';
  const doorNumber = String(doorNoRaw || '').trim();
  const ps = String(psRaw || '').trim() || '81/1';
  const acPart = String(acPartRaw || '').trim();
  const pdfPage = pdfPageRaw && !isNaN(Number(pdfPageRaw)) ? Number(pdfPageRaw) : null;
  const ocrReview = ocrReviewRaw ? String(ocrReviewRaw).trim() : null;
  const psDesc = psDescRaw || psDescriptions[ps] || '';

  voters.push({
    id: `voter-${serialNumber}`,
    import_batch_id: batchId,
    serial_number: serialNumber,
    voter_name: voterName,
    voter_name_search: normalizeTeluguText(voterName),
    voter_name_romanized: romanizeTelugu(voterName),
    relation: relation,
    relative_name: relativeName,
    relative_name_search: normalizeTeluguText(relativeName),
    relative_name_romanized: romanizeTelugu(relativeName),
    age: age,
    gender: gender,
    door_number: doorNumber,
    epic_number: epic,
    polling_station: ps,
    ac_part_sl_number: acPart,
    pdf_page: pdfPage,
    ocr_review: ocrReview,
    polling_station_description: psDesc,
    source_sheet: String(sourceSheetRaw),
    source_row: Number(sourceRowRaw) || (i + 1),
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  });
}

console.log(`Parsed ${voters.length} valid voter records.`);
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(voters));
const stats = fs.statSync(OUTPUT_PATH);
console.log(`Saved to ${OUTPUT_PATH} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
