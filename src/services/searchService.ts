import type { VoterRecord, SearchFilters, SearchResultSummary } from '@/types';
import { INITIAL_MOCK_VOTERS } from './mockData';
import {
  isTeluguText,
  normalizeTeluguText,
  normalizeEnglishText,
  getRomanPhoneticVariants,
} from '@/lib/transliteration';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Local storage key for persistent parsed voter data in offline / client demo mode
const LOCAL_STORAGE_KEY = 'ward81_active_voters_dataset';
const LOCAL_STORAGE_META_KEY = 'ward81_dataset_metadata';

export interface DatasetMetadata {
  sourceWorkbook?: string;
  lastUpdated?: string;
  status: 'active' | 'empty';
}

let memoryDataset: VoterRecord[] | null = null;
let loadPromise: Promise<VoterRecord[]> | null = null;

export async function loadVoterDataset(): Promise<VoterRecord[]> {
  if (memoryDataset && memoryDataset.length > 6) {
    return memoryDataset;
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    // 1. First attempt to load bundled static master dataset
    try {
      let response = await fetch('/data/ward81_voters.json');
      if (!response.ok) {
        response = await fetch('/data/voters.json');
      }
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          memoryDataset = data;
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not load static voter dataset', e);
    }

    // 2. Try localStorage
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryDataset = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read dataset from localStorage', e);
    }

    // 3. Fallback to initial mock voters
    memoryDataset = INITIAL_MOCK_VOTERS;
    return INITIAL_MOCK_VOTERS;
  })();

  return loadPromise;
}

export function getDatasetMetadata(): DatasetMetadata {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_META_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read dataset metadata from localStorage', e);
  }
  return {
    sourceWorkbook: 'Ward81 Voter List New.xlsx',
    status: 'active',
  };
}

export function getActiveDataset(): VoterRecord[] {
  if (memoryDataset && memoryDataset.length > 0) {
    return memoryDataset;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 6) {
        memoryDataset = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read dataset from localStorage', e);
  }
  loadVoterDataset().catch(() => {});
  return INITIAL_MOCK_VOTERS;
}

export function saveActiveDataset(records: VoterRecord[], sourceWorkbook?: string): void {
  memoryDataset = records;
  loadPromise = Promise.resolve(records);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Could not persist full dataset to localStorage (memory cache active):', e);
  }
  try {
    const meta: DatasetMetadata = {
      sourceWorkbook: sourceWorkbook || (records.length === 0 ? 'None' : 'Ward81 Voter List New.xlsx'),
      lastUpdated: new Date().toISOString(),
      status: records.length > 0 ? 'active' : 'empty',
    };
    localStorage.setItem(LOCAL_STORAGE_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to store dataset metadata in localStorage', e);
  }
}

export async function uploadDatasetToSupabase(
  filename: string,
  fileSize: number,
  records: Omit<VoterRecord, 'id' | 'import_batch_id' | 'is_active' | 'created_at' | 'updated_at'>[],
  onProgress?: (inserted: number, total: number) => void
): Promise<{ batchId: string; total: number }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
  }

  const batchId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // 1. Create Import Batch
  const { error: batchErr } = await supabase.from('import_batches').insert({
    id: batchId,
    original_filename: filename,
    file_size: fileSize,
    import_status: 'active',
    expected_rows: records.length,
    imported_rows: 0,
    started_at: timestamp,
  });

  if (batchErr) {
    throw new Error(`Failed to create import batch: ${batchErr.message}`);
  }

  // 2. Insert records in chunks of 500
  const CHUNK_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE).map((r, idx) => ({
      import_batch_id: batchId,
      serial_number: r.serial_number || (i + idx + 1),
      voter_name: r.voter_name,
      voter_name_search: r.voter_name_search,
      voter_name_romanized: r.voter_name_romanized,
      relation: r.relation,
      relative_name: r.relative_name,
      relative_name_search: r.relative_name_search,
      relative_name_romanized: r.relative_name_romanized,
      age: r.age,
      gender: r.gender,
      door_number: r.door_number,
      epic_number: r.epic_number,
      polling_station: r.polling_station,
      ac_part_sl_number: r.ac_part_sl_number,
      pdf_page: r.pdf_page,
      ocr_review: r.ocr_review,
      polling_station_description: r.polling_station_description,
      source_sheet: r.source_sheet,
      source_row: r.source_row,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    }));

    const { error: insertErr } = await supabase.from('voters').insert(chunk);
    if (insertErr) {
      console.error(`Chunk insert error (${i}-${i + chunk.length}):`, insertErr);
      throw new Error(`Failed to insert voters chunk: ${insertErr.message}`);
    }

    inserted += chunk.length;
    onProgress?.(inserted, records.length);
  }

  // 3. Mark batch completed
  await supabase
    .from('import_batches')
    .update({
      imported_rows: inserted,
      completed_at: new Date().toISOString(),
      import_status: 'active',
    })
    .eq('id', batchId);

  return { batchId, total: inserted };
}

export async function fetchImportBatches(): Promise<{ id: string; original_filename: string; imported_rows: number; started_at: string }[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('import_batches')
    .select('id, original_filename, imported_rows, started_at')
    .order('started_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

export function clearActiveDataset(): void {
  memoryDataset = [];
  loadPromise = Promise.resolve([]);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    const meta: DatasetMetadata = {
      sourceWorkbook: 'None',
      lastUpdated: new Date().toISOString(),
      status: 'empty',
    };
    localStorage.setItem(LOCAL_STORAGE_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to clear dataset from localStorage', e);
  }
}

/**
 * Perform ranked search supporting Telugu Unicode, English Romanized phonetics,
 * Door number, Polling station, and EPIC identifiers.
 */
export async function searchVoters(
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResultSummary> {
  // If Supabase is configured, use PostgreSQL search with pg_trgm
  if (isSupabaseConfigured) {
    try {
      let queryBuilder = supabase
        .from('voters')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (filters.query) {
        const q = filters.query.trim();
        if (isTeluguText(q)) {
          const norm = normalizeTeluguText(q);
          queryBuilder = queryBuilder.or(`voter_name.ilike.%${norm}%,relative_name.ilike.%${norm}%`);
        } else {
          const normEng = normalizeEnglishText(q);
          queryBuilder = queryBuilder.or(
            `epic_number.ilike.%${q}%,door_number.ilike.%${q}%,voter_name_romanized.ilike.%${normEng}%,polling_station.eq.${q}`
          );
        }
      }

      if (filters.batchId) {
        queryBuilder = queryBuilder.eq('import_batch_id', filters.batchId);
      }
      if (filters.epicNumber) {
        queryBuilder = queryBuilder.ilike('epic_number', `%${filters.epicNumber}%`);
      }
      if (filters.pollingStation) {
        queryBuilder = queryBuilder.eq('polling_station', filters.pollingStation);
      }
      if (filters.gender) {
        queryBuilder = queryBuilder.eq('gender', filters.gender);
      }
      if (filters.doorNumber) {
        queryBuilder = queryBuilder.ilike('door_number', `%${filters.doorNumber}%`);
      }
      if (filters.ocrReviewOnly) {
        queryBuilder = queryBuilder.not('ocr_review', 'is', null);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await queryBuilder
        .range(from, to)
        .order('serial_number', { ascending: true });

      if (!error && data) {
        return {
          totalRecords: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
          records: data as VoterRecord[],
        };
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local dataset engine', err);
    }
  }

  // Client-side high-performance indexed search engine
  const dataset = await loadVoterDataset();
  let results = [...dataset];

  const rawQuery = filters.query?.trim();

  if (rawQuery) {
    const isTel = isTeluguText(rawQuery);
    const normTelugu = isTel ? normalizeTeluguText(rawQuery) : '';
    const normEng = !isTel ? normalizeEnglishText(rawQuery) : '';
    const romanVariants = !isTel ? getRomanPhoneticVariants(normEng) : [];
    const upperQuery = rawQuery.toUpperCase();

    interface ScoredItem {
      record: VoterRecord;
      score: number;
    }

    const scored: ScoredItem[] = [];

    for (const v of results) {
      let score = 0;

      // 1. Exact EPIC Match (Highest Priority)
      if (v.epic_number.toUpperCase() === upperQuery) {
        score += 1000;
      } else if (v.epic_number.toUpperCase().includes(upperQuery)) {
        score += 400;
      }

      // 2. Exact Door Number Match
      if (v.door_number.toLowerCase() === rawQuery.toLowerCase()) {
        score += 500;
      } else if (v.door_number.toLowerCase().includes(rawQuery.toLowerCase())) {
        score += 250;
      }

      // 3. Polling Station Match
      if (v.polling_station === rawQuery || v.polling_station.includes(rawQuery)) {
        score += 200;
      }

      // 4. Telugu search
      if (isTel) {
        if (v.voter_name === rawQuery || v.voter_name_search === normTelugu) {
          score += 800;
        } else if (v.voter_name.includes(rawQuery) || v.voter_name_search.includes(normTelugu)) {
          score += 350;
        }
        if (v.relative_name?.includes(rawQuery) || v.relative_name_search?.includes(normTelugu)) {
          score += 250;
        }
      } else {
        // 5. English / Romanized Phonetic Search
        for (const variant of romanVariants) {
          if (v.voter_name_romanized === variant) {
            score += 700;
            break;
          } else if (v.voter_name_romanized.startsWith(variant)) {
            score += 380;
            break;
          } else if (v.voter_name_romanized.includes(variant)) {
            score += 300;
            break;
          }
          if (v.relative_name_romanized?.includes(variant)) {
            score += 200;
            break;
          }
        }
      }

      if (score > 0) {
        scored.push({ record: v, score });
      }
    }

    scored.sort((a, b) => b.score - a.score || a.record.serial_number - b.record.serial_number);
    results = scored.map((s) => s.record);
  }

  // Apply column-specific filters
  if (filters.batchId) {
    results = results.filter((v) => v.import_batch_id === filters.batchId);
  }
  if (filters.voterName) {
    const q = filters.voterName.toLowerCase();
    results = results.filter(
      (v) =>
        v.voter_name.includes(q) ||
        v.voter_name_romanized.toLowerCase().includes(q)
    );
  }
  if (filters.relativeName) {
    const q = filters.relativeName.toLowerCase();
    results = results.filter(
      (v) =>
        v.relative_name?.includes(q) ||
        v.relative_name_romanized?.toLowerCase().includes(q)
    );
  }
  if (filters.epicNumber) {
    const q = filters.epicNumber.toUpperCase();
    results = results.filter((v) => v.epic_number.includes(q));
  }
  if (filters.doorNumber) {
    const q = filters.doorNumber.toLowerCase();
    results = results.filter((v) => v.door_number.toLowerCase().includes(q));
  }
  if (filters.pollingStation) {
    results = results.filter((v) => v.polling_station === filters.pollingStation);
  }
  if (filters.gender) {
    results = results.filter((v) => v.gender.toLowerCase() === filters.gender?.toLowerCase());
  }
  if (filters.relation) {
    results = results.filter((v) => v.relation.toLowerCase() === filters.relation?.toLowerCase());
  }
  if (filters.ageMin !== undefined) {
    results = results.filter((v) => v.age !== null && v.age >= filters.ageMin!);
  }
  if (filters.ageMax !== undefined) {
    results = results.filter((v) => v.age !== null && v.age <= filters.ageMax!);
  }
  if (filters.ocrReviewOnly) {
    results = results.filter((v) => v.ocr_review !== null && v.ocr_review !== '');
  }

  const totalRecords = results.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIdx = (page - 1) * pageSize;
  const paginatedRecords = results.slice(startIdx, startIdx + pageSize);

  return {
    totalRecords,
    page,
    pageSize,
    totalPages,
    records: paginatedRecords,
  };
}
