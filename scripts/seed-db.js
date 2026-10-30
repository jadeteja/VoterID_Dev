import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Reads from .env or environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Note: Inserting initial data requires either service_role key or an admin token if RLS is enabled
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Please provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) in your environment or .env file.');
  console.log('Example:');
  console.log('  $env:VITE_SUPABASE_URL="https://your-ref.supabase.co"');
  console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.log('  node scripts/seed-db.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dataPath = path.resolve('public/data/ward81_voters.json');

if (!fs.existsSync(dataPath)) {
  console.error('Data file not found at:', dataPath);
  process.exit(1);
}

const voters = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
console.log(`Loaded ${voters.length} records to seed into database...`);

async function seed() {
  // 1. Create or retrieve active import batch
  const batchId = '00000000-0000-0000-0000-000000000001';
  console.log('Creating initial import batch record...');
  const { error: batchErr } = await supabase.from('import_batches').upsert({
    id: batchId,
    original_filename: 'Ward81 Voter List New.xlsx',
    file_size: 28888204,
    import_status: 'active',
    expected_rows: voters.length,
    imported_rows: voters.length,
    skipped_rows: 0,
    failed_rows: 0,
  });

  if (batchErr) {
    console.warn('Warning inserting import batch (RLS or table missing?):', batchErr.message);
  }

  // 2. Insert records in chunks of 500
  const CHUNK_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < voters.length; i += CHUNK_SIZE) {
    const chunk = voters.slice(i, i + CHUNK_SIZE).map((v) => ({
      serial_number: v.serial_number,
      import_batch_id: batchId,
      voter_name: v.voter_name,
      voter_name_search: v.voter_name_search,
      voter_name_romanized: v.voter_name_romanized,
      relation: v.relation,
      relative_name: v.relative_name,
      relative_name_search: v.relative_name_search,
      relative_name_romanized: v.relative_name_romanized,
      age: v.age,
      gender: v.gender,
      door_number: v.door_number,
      epic_number: v.epic_number,
      polling_station: v.polling_station,
      ac_part_sl_number: v.ac_part_sl_number,
      pdf_page: v.pdf_page,
      ocr_review: v.ocr_review,
      polling_station_description: v.polling_station_description,
      source_sheet: v.source_sheet,
      source_row: v.source_row,
      is_active: true,
    }));

    const { error } = await supabase.from('voters').insert(chunk);

    if (error) {
      console.error(`Error inserting chunk ${i} - ${i + chunk.length}:`, error.message);
    } else {
      inserted += chunk.length;
      process.stdout.write(`\rProgress: ${inserted} / ${voters.length} records inserted...`);
    }
  }

  console.log('\nDatabase seeding completed successfully!');
}

seed().catch((err) => {
  console.error('Fatal error seeding database:', err);
});
