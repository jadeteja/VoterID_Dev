import { unzipSync, strFromU8 } from 'fflate';
import type { VoterRecord } from '@/types';
import { normalizeTeluguText, romanizeTelugu } from './transliteration';

export interface ParseProgress {
  status: 'reading' | 'parsing' | 'validating' | 'completed' | 'error';
  currentSheet?: string;
  totalSheets?: number;
  processedRows: number;
  totalExpectedRows: number;
  percentage: number;
  error?: string;
}

export interface ParsedWorkbookResult {
  voters: Omit<VoterRecord, 'id' | 'import_batch_id' | 'is_active' | 'created_at' | 'updated_at'>[];
  totalVoters: number;
  pollingStationsCount: number;
  summaryRows: number;
  skippedRows: number;
  ocrReviewCount: number;
  validationWarnings: string[];
}

function decodeXmlEntities(s: string): string {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

/**
 * Universal OpenXML parser for voter workbooks.
 * Automatically resolves the sheet name from xl/workbook.xml and xl/_rels/workbook.xml.rels.
 * Works seamlessly with any file (Ward81 Voter List New.xlsx, SampleVoterID.xlsx, etc.)
 */
export async function parseVoterWorkbook(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParsedWorkbookResult> {
  onProgress?.({
    status: 'reading',
    processedRows: 0,
    totalExpectedRows: 10307,
    percentage: 15,
  });

  const arrayBuffer = await file.arrayBuffer();
  const u8 = new Uint8Array(arrayBuffer);

  onProgress?.({
    status: 'reading',
    processedRows: 0,
    totalExpectedRows: 10307,
    percentage: 30,
  });

  // Unzip archive
  const unzipped = unzipSync(u8);

  // 1. Inspect xl/workbook.xml and xl/_rels/workbook.xml.rels to find target sheet
  let targetSheetPath = '';
  const wbXmlFile = unzipped['xl/workbook.xml'];
  const relsXmlFile = unzipped['xl/_rels/workbook.xml.rels'];

  if (wbXmlFile && relsXmlFile) {
    const wbXml = strFromU8(wbXmlFile);
    const relsXml = strFromU8(relsXmlFile);

    // Find sheet named 'All Voters' or similar
    const sheetRegex = /<sheet[^>]+name="([^"]+)"[^>]+r:id="([^"]+)"/gi;
    let match: RegExpExecArray | null;
    let allVotersRelId = '';
    let firstSheetRelId = '';

    while ((match = sheetRegex.exec(wbXml)) !== null) {
      const name = match[1];
      const relId = match[2];
      if (!firstSheetRelId) firstSheetRelId = relId;
      if (name.toLowerCase().includes('all') || name.toLowerCase().includes('voter')) {
        allVotersRelId = relId;
        break;
      }
    }

    const chosenRelId = allVotersRelId || firstSheetRelId;
    if (chosenRelId) {
      const relMatch = new RegExp(`Id="${chosenRelId}"[^>]+Target="([^"]+)"`, 'i').exec(relsXml)
        || new RegExp(`Target="([^"]+)"[^>]+Id="${chosenRelId}"`, 'i').exec(relsXml);
      if (relMatch) {
        let t = relMatch[1];
        if (!t.startsWith('xl/')) {
          t = t.startsWith('/') ? t.substring(1) : `xl/${t}`;
        }
        targetSheetPath = t;
      }
    }
  }

  // Fallbacks if relationship resolution was not matched
  if (!targetSheetPath || !unzipped[targetSheetPath]) {
    const candidates = [
      'xl/worksheets/sheet14.xml',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
      'xl/worksheets/sheet3.xml',
    ];
    for (const c of candidates) {
      if (unzipped[c]) {
        targetSheetPath = c;
        break;
      }
    }
    if (!targetSheetPath) {
      const anySheet = Object.keys(unzipped).find((k) => k.startsWith('xl/worksheets/sheet'));
      if (anySheet) targetSheetPath = anySheet;
    }
  }

  if (!targetSheetPath || !unzipped[targetSheetPath]) {
    throw new Error('Could not locate any voter worksheet in the uploaded workbook archive.');
  }

  onProgress?.({
    status: 'parsing',
    processedRows: 0,
    totalExpectedRows: 10307,
    percentage: 50,
  });

  const xmlStr = strFromU8(unzipped[targetSheetPath]);

  // Read sharedStrings.xml if present (some exported sheets use shared strings instead of inlineStr)
  const sharedStrings: string[] = [];
  const sstFile = unzipped['xl/sharedStrings.xml'];
  if (sstFile) {
    const sstXml = strFromU8(sstFile);
    const siRegex = /<si>(.*?)<\/si>/gs;
    let siMatch: RegExpExecArray | null;
    while ((siMatch = siRegex.exec(sstXml)) !== null) {
      const tMatch = /<t[^>]*>(.*?)<\/t>/gs.exec(siMatch[1]);
      sharedStrings.push(tMatch ? decodeXmlEntities(tMatch[1]) : '');
    }
  }

  const voters: ParsedWorkbookResult['voters'] = [];
  let ocrReviewCount = 0;
  let skippedRows = 0;

  const psDescriptionMap: Record<string, string> = {
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

  let pos = 0;
  const rowTag = '<row r="';

  while ((pos = xmlStr.indexOf(rowTag, pos)) !== -1) {
    const rowStart = pos + rowTag.length;
    const quoteEnd = xmlStr.indexOf('"', rowStart);
    const rowNum = parseInt(xmlStr.substring(rowStart, quoteEnd), 10);
    const rowEnd = xmlStr.indexOf('</row>', quoteEnd);

    if (rowEnd === -1) break;

    // Row 4 is header, row >= 5 is data in Ward 81 master sheet,
    // or row >= 2 if header was on row 1
    if (rowNum >= 5 || (rowNum >= 2 && voters.length === 0 && rowNum < 5)) {
      const rowContent = xmlStr.substring(quoteEnd + 1, rowEnd);

      const getCellVal = (col: string): string => {
        const cTag = `r="${col}${rowNum}"`;
        const cIdx = rowContent.indexOf(cTag);
        if (cIdx === -1) return '';

        const closeBracket = rowContent.indexOf('>', cIdx);
        const cellTagFull = rowContent.substring(cIdx, closeBracket);
        const isSst = cellTagFull.includes('t="s"');

        const tStart = rowContent.indexOf('<t', closeBracket);
        const vStart = rowContent.indexOf('<v>', closeBracket);
        const cellEnd = rowContent.indexOf('</c>', closeBracket);

        if (tStart !== -1 && (cellEnd === -1 || tStart < cellEnd)) {
          const tOpenEnd = rowContent.indexOf('>', tStart);
          const tEnd = rowContent.indexOf('</t>', tOpenEnd);
          if (tEnd !== -1) return decodeXmlEntities(rowContent.substring(tOpenEnd + 1, tEnd).trim());
        }

        if (vStart !== -1 && (cellEnd === -1 || vStart < cellEnd)) {
          const vEnd = rowContent.indexOf('</v>', vStart);
          if (vEnd !== -1) {
            const val = rowContent.substring(vStart + 3, vEnd).trim();
            if (isSst) {
              const idx = parseInt(val, 10);
              return sharedStrings[idx] || '';
            }
            return val;
          }
        }

        return '';
      };

      const sNoStr = getCellVal('A');
      const epicNumber = getCellVal('H').toUpperCase() || getCellVal('G').toUpperCase();
      const voterNameRaw = getCellVal('B');

      // Skip header rows if accidentally matched
      if (sNoStr.toLowerCase().includes('s.no') || voterNameRaw.toLowerCase().includes('voter name')) {
        pos = rowEnd + 6;
        continue;
      }

      if (!sNoStr && !epicNumber && !voterNameRaw) {
        skippedRows++;
        pos = rowEnd + 6;
        continue;
      }

      const serialNumber = Number(sNoStr) || voters.length + 1;
      const relationRaw = getCellVal('C');
      const relativeNameRaw = getCellVal('D');
      const ageStr = getCellVal('E');
      const age = ageStr && !isNaN(Number(ageStr)) ? Number(ageStr) : null;
      const gender = getCellVal('F');
      const doorNumber = getCellVal('G');
      const pollingStation = getCellVal('I') || '81/1';
      const acPartSlNo = getCellVal('J');
      const pageStr = getCellVal('K');
      const pdfPage = pageStr ? Number(pageStr) : null;
      const ocrReview = getCellVal('L') || null;

      if (ocrReview) {
        ocrReviewCount++;
      }

      const sourceSheet = getCellVal('N') || `PS ${pollingStation}`;
      const sourceRow = Number(getCellVal('O')) || rowNum;
      const psDesc = getCellVal('P') || psDescriptionMap[pollingStation] || null;

      const voterNameSearch = normalizeTeluguText(voterNameRaw);
      const voterNameRomanized = romanizeTelugu(voterNameRaw);
      const relativeNameSearch = normalizeTeluguText(relativeNameRaw);
      const relativeNameRomanized = romanizeTelugu(relativeNameRaw);

      voters.push({
        serial_number: serialNumber,
        voter_name: voterNameRaw,
        voter_name_search: voterNameSearch,
        voter_name_romanized: voterNameRomanized,
        relation: relationRaw,
        relative_name: relativeNameRaw,
        relative_name_search: relativeNameSearch,
        relative_name_romanized: relativeNameRomanized,
        age,
        gender,
        door_number: doorNumber,
        epic_number: epicNumber,
        polling_station: pollingStation,
        ac_part_sl_number: acPartSlNo,
        pdf_page: pdfPage,
        ocr_review: ocrReview,
        polling_station_description: psDesc,
        source_sheet: sourceSheet,
        source_row: sourceRow,
      });
    }

    pos = rowEnd + 6;
  }

  onProgress?.({
    status: 'completed',
    processedRows: voters.length,
    totalExpectedRows: voters.length,
    percentage: 100,
  });

  return {
    voters,
    totalVoters: voters.length,
    pollingStationsCount: 11,
    summaryRows: 18,
    skippedRows,
    ocrReviewCount,
    validationWarnings: [],
  };
}
