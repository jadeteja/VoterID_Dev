export type UserRole = 'admin' | 'search_user';

export interface UserProfile {
  id: string;
  display_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export type ImportStatus = 'staged' | 'active' | 'archived' | 'failed';

export interface ImportBatch {
  id: string;
  original_filename: string;
  file_size: number;
  imported_by: string;
  import_status: ImportStatus;
  expected_rows: number;
  imported_rows: number;
  skipped_rows: number;
  failed_rows: number;
  started_at: string;
  completed_at?: string | null;
  error_summary?: string | null;
}

export interface VoterRecord {
  id: string;
  import_batch_id: string;
  serial_number: number;
  voter_name: string;
  voter_name_search: string;
  voter_name_romanized: string;
  relation: string;
  relative_name: string;
  relative_name_search: string;
  relative_name_romanized: string;
  age: number | null;
  gender: string;
  door_number: string;
  epic_number: string;
  polling_station: string;
  ac_part_sl_number: string;
  pdf_page: number | null;
  ocr_review: string | null;
  polling_station_description: string | null;
  source_sheet: string;
  source_row: number;
  additional_data?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  query?: string;
  batchId?: string;
  voterName?: string;
  relativeName?: string;
  epicNumber?: string;
  doorNumber?: string;
  pollingStation?: string;
  gender?: string;
  relation?: string;
  ageMin?: number;
  ageMax?: number;
  ocrReviewOnly?: boolean;
}

export interface SearchResultSummary {
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: VoterRecord[];
}

export interface PollingStationSummary {
  stationNumber: string;
  buildingNameTelugu: string;
  doorNoFrom: string;
  doorNoTo: string;
  sNoFrom: number;
  sNoTo: number;
  totalVoters: number;
  maleVoters: number;
  femaleVoters: number;
  reviewRows: number;
}
