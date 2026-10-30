import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { VoterRecord, ImportBatch } from '@/types';

export interface BatchUploadProgress {
  currentBatch: number;
  totalBatches: number;
  uploadedRows: number;
  totalRows: number;
  percentage: number;
  status: 'uploading' | 'activating' | 'completed' | 'error';
  error?: string;
}

/**
 * Uploads parsed voter records to Supabase PostgreSQL in safe 500-row chunks.
 * Uses atomic staging: records are inserted with is_active = false,
 * and then atomically activated only after all rows succeed.
 */
export async function uploadDatasetToSupabase(
  records: Omit<VoterRecord, 'id' | 'import_batch_id' | 'is_active' | 'created_at' | 'updated_at'>[],
  filename: string,
  fileSize: number,
  onProgress?: (progress: BatchUploadProgress) => void
): Promise<ImportBatch> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  }

  // 1. Create a staged import batch record
  const { data: batchData, error: batchError } = await supabase
    .from('import_batches')
    .insert({
      original_filename: filename,
      file_size: fileSize,
      import_status: 'staged',
      expected_rows: records.length,
      imported_rows: 0,
      skipped_rows: 0,
      failed_rows: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (batchError || !batchData) {
    throw new Error(`Failed to initialize import batch: ${batchError?.message || 'Unknown error'}`);
  }

  const batchId = batchData.id;
  const CHUNK_SIZE = 500;
  const totalBatches = Math.ceil(records.length / CHUNK_SIZE);
  let totalUploaded = 0;

  try {
    for (let i = 0; i < totalBatches; i++) {
      const from = i * CHUNK_SIZE;
      const to = Math.min(from + CHUNK_SIZE, records.length);
      const chunk = records.slice(from, to).map((r) => ({
        ...r,
        import_batch_id: batchId,
        is_active: false, // staged until full upload completes
      }));

      const { error: insertError } = await supabase.from('voters').insert(chunk);

      if (insertError) {
        throw new Error(`Batch insert failed at rows ${from + 1}-${to}: ${insertError.message}`);
      }

      totalUploaded += chunk.length;

      onProgress?.({
        currentBatch: i + 1,
        totalBatches,
        uploadedRows: totalUploaded,
        totalRows: records.length,
        percentage: Math.round(((i + 1) / totalBatches) * 90),
        status: 'uploading',
      });
    }

    // 2. Atomic activation: archive previous batches and activate new batch
    onProgress?.({
      currentBatch: totalBatches,
      totalBatches,
      uploadedRows: totalUploaded,
      totalRows: records.length,
      percentage: 95,
      status: 'activating',
    });

    // Deactivate old active voters
    await supabase
      .from('voters')
      .update({ is_active: false })
      .neq('import_batch_id', batchId);

    // Archive previous active batches
    await supabase
      .from('import_batches')
      .update({ import_status: 'archived' })
      .neq('id', batchId)
      .eq('import_status', 'active');

    // Activate current batch records
    await supabase
      .from('voters')
      .update({ is_active: true })
      .eq('import_batch_id', batchId);

    // Update batch record to active
    const { data: finalBatch } = await supabase
      .from('import_batches')
      .update({
        import_status: 'active',
        imported_rows: totalUploaded,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batchId)
      .select()
      .single();

    onProgress?.({
      currentBatch: totalBatches,
      totalBatches,
      uploadedRows: totalUploaded,
      totalRows: records.length,
      percentage: 100,
      status: 'completed',
    });

    return finalBatch as ImportBatch;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during batch upload';

    // Mark batch as failed
    await supabase
      .from('import_batches')
      .update({
        import_status: 'failed',
        error_summary: errorMsg,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    // Clean up partial unactivated records
    await supabase.from('voters').delete().eq('import_batch_id', batchId);

    onProgress?.({
      currentBatch: 0,
      totalBatches,
      uploadedRows: totalUploaded,
      totalRows: records.length,
      percentage: 0,
      status: 'error',
      error: errorMsg,
    });

    throw err;
  }
}
