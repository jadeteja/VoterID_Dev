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

export function getActiveDataset(): VoterRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read dataset from localStorage', e);
  }
  return INITIAL_MOCK_VOTERS;
}

export function saveActiveDataset(records: VoterRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to store dataset in localStorage', e);
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
  const dataset = getActiveDataset();
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
