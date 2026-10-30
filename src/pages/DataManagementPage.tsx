import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, RotateCcw, ShieldAlert, Trash2, FileSpreadsheet, Layers } from 'lucide-react';
import { getActiveDataset, saveActiveDataset, clearActiveDataset, getDatasetMetadata, loadVoterDataset, fetchImportBatches } from '@/services/searchService';
import { INITIAL_MOCK_VOTERS } from '@/services/mockData';

export const DataManagementPage: React.FC = () => {
  const [dataset, setDataset] = useState(getActiveDataset());
  const [metadata, setMetadata] = useState(getDatasetMetadata());
  const [batches, setBatches] = useState<{ id: string; original_filename: string; imported_rows: number; started_at: string }[]>([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadVoterDataset().then((data) => {
      setDataset(data);
      setMetadata(getDatasetMetadata());
    });
    fetchImportBatches().then((b) => {
      setBatches(b);
    });
  }, []);

  const handleClearAll = () => {
    clearActiveDataset();
    setDataset([]);
    setMetadata(getDatasetMetadata());
    setShowConfirmReset(false);
    setNotification('Active dataset cleared to 0 records successfully. You can upload a new Excel file.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRestoreBaseline = () => {
    saveActiveDataset(INITIAL_MOCK_VOTERS, 'Sample Baseline Dataset');
    setDataset(INITIAL_MOCK_VOTERS);
    setMetadata(getDatasetMetadata());
    setShowConfirmRestore(false);
    setNotification('Restored 6 sample baseline records.');
    setTimeout(() => setNotification(null), 4000);
  };

  const pollingStationsCount = dataset.length > 0
    ? new Set(dataset.map((d) => d.polling_station)).size
    : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Data Management / డేటా నిర్వహణ
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-telugu mt-0.5">
          సక్రియ డేటాసెట్ మరియు దిగుమతి చరిత్ర నిర్వహణ
        </p>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Active Dataset Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Current Active Dataset</h3>
              <p className="text-xs text-slate-400">Ward 81 Master Electoral Records</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            dataset.length > 0
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {dataset.length > 0 ? 'Active' : 'Empty'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Total Records:</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {dataset.length.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Polling Stations:</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {dataset.length > 0 ? (pollingStationsCount || 11) : 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Storage State:</span>
            <span className="text-base font-bold text-slate-900">
              {dataset.length > 0 ? 'Persistent Staged' : 'Cleared'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Source Workbook:</span>
            <span className="text-xs font-semibold text-slate-700 truncate block">
              {dataset.length === 0 ? 'None (Empty)' : (metadata.sourceWorkbook || 'Ward81 Voter List New.xlsx')}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Overwriting or replacing active data requires administrator authorization.</span>
          </div>

          <div className="flex items-center space-x-2">
            {dataset.length === 0 && (
              <button
                onClick={() => setShowConfirmRestore(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Sample</span>
              </button>
            )}

            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 transition flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset & Clear Dataset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batches / Uploaded Workbooks History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Database Upload History / అప్‌లోడ్ చేసిన షీట్లు</h3>
            <p className="text-xs text-slate-400">Excel workbooks saved to PostgreSQL database</p>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs space-y-1">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-medium text-slate-500">Active Workbook: {metadata.sourceWorkbook || 'Ward81 Voter List New.xlsx'}</p>
            <p>Upload new Excel sheets from the "Upload Excel" page to persist multiple workbooks in database.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {batches.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 block">{b.original_filename}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(b.started_at).toLocaleDateString()} • {b.imported_rows.toLocaleString()} voters
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-200">
                  Stored in DB
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog: Clear All */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Clear Active Dataset?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-telugu">
              మీరు ఖచ్చితంగా డేటాసెట్‌ను పూర్తిగా ఖాళీ (0 రికార్డులు) చేయాలనుకుంటున్నారా? ప్రస్తుతం నిల్వ చేయబడిన అన్ని ఓటరు రికార్డులు తొలగించబడతాయి.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Clear (0 records)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Restore Baseline */}
      {showConfirmRestore && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-blue-600">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Restore Baseline Sample?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-telugu">
              నమూనా బేస్‌లైన్ రికార్డులను పునరుద్ధరించాలనుకుంటున్నారా?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmRestore(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreBaseline}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
