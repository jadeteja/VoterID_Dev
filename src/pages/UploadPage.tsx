import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { parseVoterWorkbook, type ParseProgress, type ParsedWorkbookResult } from '@/lib/excel-parser';
import { saveActiveDataset } from '@/services/searchService';
import type { VoterRecord } from '@/types';
import { useNavigate } from 'react-router-dom';

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedWorkbookResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCommitted, setIsCommitted] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
        setError('Please select an Excel workbook (.xlsx or .xls)');
        return;
      }
      setFile(selected);
      setError(null);
      setParsedResult(null);
      setIsCommitted(false);
    }
  };

  const handleStartParse = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseVoterWorkbook(file, (p) => {
        setProgress(p);
      });
      setParsedResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse Excel workbook';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitDataset = () => {
    if (!parsedResult) return;

    // Convert parsed records to VoterRecord format
    const fullVoterRecords: VoterRecord[] = parsedResult.voters.map((v, idx) => ({
      ...v,
      id: `voter-${idx + 1}`,
      import_batch_id: `batch-${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    saveActiveDataset(fullVoterRecords);
    setIsCommitted(true);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Upload Excel Workbook / ఎక్సెల్ అప్‌లోడ్
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-telugu mt-0.5">
          వార్డు 81 ఓటర్ల మాస్టర్ ఎక్సెల్ ఫైల్ అప్‌లోడ్ మరియు సమీక్ష
        </p>
      </div>

      {!isCommitted ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* File Picker Drag & Drop Box */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center transition bg-slate-50/50">
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="hidden"
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {file ? file.name : 'Click to select or drag & drop Ward 81 Excel workbook'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports .xlsx workbooks (e.g. Ward81 Voter List New.xlsx)
                </p>
                {file && (
                  <p className="text-xs font-mono text-blue-600 font-semibold mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Action Button & Parsing Status */}
          {file && !parsedResult && (
            <div className="flex flex-col items-center space-y-3">
              <button
                onClick={handleStartParse}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing in browser...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Validate & Inspect Workbook</span>
                  </>
                )}
              </button>

              {progress && (
                <div className="w-full max-w-md space-y-1.5 text-center">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {progress.status === 'reading' && 'Loading workbook into memory...'}
                    {progress.status === 'parsing' &&
                      `Parsing canonical All Voters sheet: ${progress.processedRows.toLocaleString()} / ${progress.totalExpectedRows.toLocaleString()} rows`}
                    {progress.status === 'completed' && 'Extraction complete! Ready to commit.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview & Confirmation Card */}
          {parsedResult && (
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Workbook Validated Successfully</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block">Total Voters</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {parsedResult.totalVoters.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block">Polling Stations</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {parsedResult.pollingStationsCount}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block">OCR Review Rows</span>
                  <span className="text-base font-bold text-amber-600 font-mono">
                    {parsedResult.ocrReviewCount.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block">Skipped Blanks</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {parsedResult.skippedRows}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCommitDataset}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Activate Dataset for Search (యాక్టివేట్ చేయండి)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Screen 4: Upload Success Screen */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Dataset Activated Successfully!</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto font-telugu">
            వార్డు 81 కి సంబంధించిన {parsedResult?.totalVoters.toLocaleString()} ఓటర్ల రికార్డులు సిద్ధంగా ఉన్నాయి.
            ఇకపై మీరు ఎప్పుడైనా శోధించవచ్చు.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center space-x-2"
            >
              <span>Start Searching / శోధన ప్రారంభించండి</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
