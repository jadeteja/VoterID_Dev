import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react';
import { getActiveDataset, saveActiveDataset } from '@/services/searchService';
import { INITIAL_MOCK_VOTERS } from '@/services/mockData';

export const DataManagementPage: React.FC = () => {
  const [dataset, setDataset] = useState(getActiveDataset());
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleResetToDefault = () => {
    saveActiveDataset(INITIAL_MOCK_VOTERS);
    setDataset(INITIAL_MOCK_VOTERS);
    setShowConfirmReset(false);
    setNotification('Active dataset reset to baseline records successfully.');
    setTimeout(() => setNotification(null), 4000);
  };

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
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            Active
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
            <span className="text-base font-bold text-slate-900 font-mono">11</span>
          </div>
          <div>
            <span className="text-slate-400 block">Storage State:</span>
            <span className="text-base font-bold text-slate-900">Persistent Staged</span>
          </div>
          <div>
            <span className="text-slate-400 block">Source Workbook:</span>
            <span className="text-xs font-semibold text-slate-700 truncate block">
              Ward81 Voter List New.xlsx
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Overwriting or replacing active data requires administrator authorization.</span>
          </div>

          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Dataset</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">Confirm Dataset Reset?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-telugu">
              మీరు ఖచ్చితంగా డేటాసెట్‌ను రీసెట్ చేయాలనుకుంటున్నారా? ప్రస్తుతం ఉన్న రికార్డులు మార్చబడతాయి.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
