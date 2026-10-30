-- ==============================================================================
-- MULTI-SHEET & FAST BILINGUAL SEARCH SETUP FOR SUPABASE / POSTGRESQL
-- Enables uploading multiple Excel files (import_batches), filtering by sheet,
-- and searching across all voter records with PostgreSQL trigram matching.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Import Batches Table (Tracks each uploaded Excel file)
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  import_status TEXT NOT NULL DEFAULT 'active' CHECK (import_status IN ('staged', 'active', 'archived', 'failed')),
  expected_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  skipped_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  completed_at TIMESTAMPTZ,
  error_summary TEXT
);

-- 3. Master Voters Table
CREATE TABLE IF NOT EXISTS public.voters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  serial_number INT NOT NULL,
  voter_name TEXT,
  voter_name_search TEXT,
  voter_name_romanized TEXT,
  relation VARCHAR(50),
  relative_name TEXT,
  relative_name_search TEXT,
  relative_name_romanized TEXT,
  age INT,
  gender VARCHAR(20),
  door_number VARCHAR(50),
  epic_number VARCHAR(50) NOT NULL,
  polling_station VARCHAR(50),
  ac_part_sl_number VARCHAR(50),
  pdf_page INT,
  ocr_review TEXT,
  polling_station_description TEXT,
  source_sheet VARCHAR(100),
  source_row INT,
  additional_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Fast Query & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_voters_batch_active ON public.voters (import_batch_id, is_active);
CREATE INDEX IF NOT EXISTS idx_voters_epic ON public.voters (epic_number);
CREATE INDEX IF NOT EXISTS idx_voters_door ON public.voters (door_number);
CREATE INDEX IF NOT EXISTS idx_voters_ps ON public.voters (polling_station);
CREATE INDEX IF NOT EXISTS idx_voters_gender ON public.voters (gender);
CREATE INDEX IF NOT EXISTS idx_voters_sno ON public.voters (serial_number);

-- 5. Trigram Indexes for Fast Bilingual Substring Search
CREATE INDEX IF NOT EXISTS idx_voters_name_trgm ON public.voters USING gin (voter_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_name_rom_trgm ON public.voters USING gin (voter_name_romanized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_rel_trgm ON public.voters USING gin (relative_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_rel_rom_trgm ON public.voters USING gin (relative_name_romanized gin_trgm_ops);

-- 6. Row Level Security: Allow public / anon access for Web App
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_batches_all" ON public.import_batches;
CREATE POLICY "anon_batches_all" ON public.import_batches FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_voters_all" ON public.voters;
CREATE POLICY "anon_voters_all" ON public.voters FOR ALL TO public USING (true) WITH CHECK (true);
