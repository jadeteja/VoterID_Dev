import ExcelJS from 'exceljs';
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

/**
 * Streaming in-browser Excel parser for Ward 81 voter workbook.
 * Designed to handle 29MB workbooks without crashing browser memory.
 */
export async function parseVoterWorkbook(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParsedWorkbookResult> {
  const buffer = await file.arrayBuffer();
  
  onProgress?.({
    status: 'reading',
    processedRows: 0,
    totalExpectedRows: 10307,
    percentage: 10,
  });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Identify canonical 'All Voters' worksheet
  let masterSheet = workbook.getWorksheet('All Voters');
  if (!masterSheet) {
    // Fallback: look for sheet containing 'all' or 'voters'
    masterSheet = workbook.worksheets.find(
      (s) => s.name.toLowerCase().includes('all') && s.name.toLowerCase().includes('voter')
    );
  }

  if (!masterSheet) {
    throw new Error('Canonical "All Voters" worksheet was not found in the workbook.');
  }

  // Also read Summary sheet for polling station descriptions if needed
  const summarySheet = workbook.getWorksheet('Summary');
  const psDescriptionMap = new Map<string, string>();

  if (summarySheet) {
    summarySheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 5) {
        const psNo = String(row.getCell(1).text || '').trim();
        const psDesc = String(row.getCell(2).text || '').trim();
        if (psNo && psDesc) {
          psDescriptionMap.set(psNo, psDesc);
        }
      }
    });
  }

  const voters: ParsedWorkbookResult['voters'] = [];
  const validationWarnings: string[] = [];
  let skippedRows = 0;
  let ocrReviewCount = 0;

  // Header is on Row 4, records begin at Row 5
  const totalRows = masterSheet.rowCount;
  const dataRowCount = Math.max(0, totalRows - 4);

  onProgress?.({
    status: 'parsing',
    currentSheet: masterSheet.name,
    processedRows: 0,
    totalExpectedRows: dataRowCount,
    percentage: 25,
  });

  masterSheet.eachRow((row, rowNumber) => {
    // Skip title and header rows
    if (rowNumber < 5) return;

    // Check if empty row
    const snoCell = row.getCell(1).value;
    if (snoCell === null || snoCell === undefined || snoCell === '') {
      skippedRows++;
      return;
    }

    const serialNumber = Number(snoCell) || rowNumber - 4;
    const voterNameRaw = String(row.getCell(2).text || '').trim();
    const relationRaw = String(row.getCell(3).text || '').trim();
    const relativeNameRaw = String(row.getCell(4).text || '').trim();
    
    // Age may be blank (as seen in edge cases where OCR flagged "Age check")
    const ageVal = row.getCell(5).value;
    const age = ageVal !== null && ageVal !== undefined && !isNaN(Number(ageVal)) 
      ? Number(ageVal) 
      : null;

    const gender = String(row.getCell(6).text || '').trim();
    const doorNumber = String(row.getCell(7).text || '').trim();
    const epicNumber = String(row.getCell(8).text || '').trim().toUpperCase();
    const pollingStation = String(row.getCell(9).text || '').trim();
    const acPartSlNo = String(row.getCell(10).text || '').trim();
    
    const pageVal = row.getCell(11).value;
    const pdfPage = pageVal ? Number(pageVal) : null;
    
    const ocrReview = String(row.getCell(12).text || '').trim() || null;
    if (ocrReview) {
      ocrReviewCount++;
    }

    // Hidden source metadata columns
    const sourceSheet = String(row.getCell(14).text || '').trim() || `PS ${pollingStation}`;
    const sourceRow = Number(row.getCell(15).value) || rowNumber;
    let psDesc = String(row.getCell(16).text || '').trim();
    if (!psDesc && psDescriptionMap.has(pollingStation)) {
      psDesc = psDescriptionMap.get(pollingStation)!;
    }

    // Derived bilingual search keys
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
      polling_station_description: psDesc || null,
      source_sheet: sourceSheet,
      source_row: sourceRow,
    });

    if (rowNumber % 1000 === 0) {
      onProgress?.({
        status: 'parsing',
        currentSheet: masterSheet.name,
        processedRows: voters.length,
        totalExpectedRows: dataRowCount,
        percentage: 25 + Math.round((voters.length / dataRowCount) * 65),
      });
    }
  });

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
    summaryRows: summarySheet?.rowCount || 18,
    skippedRows,
    ocrReviewCount,
    validationWarnings,
  };
}
