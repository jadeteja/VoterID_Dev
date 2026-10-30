import React from 'react';
import type { VoterRecord } from '@/types';
import { Eye, AlertCircle } from 'lucide-react';

interface VoterResultsProps {
  records: VoterRecord[];
  onSelectRecord: (record: VoterRecord) => void;
  isLoading?: boolean;
}

export const VoterResults: React.FC<VoterResultsProps> = ({
  records,
  onSelectRecord,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-slate-600 font-medium">Searching voter database...</p>
        <p className="text-xs text-slate-400 font-telugu mt-1">ఓటర్ల జాబితాను శోధిస్తున్నాము...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No matching voters found</h3>
        <p className="text-sm text-slate-500 font-telugu mt-1">
          ఎలాంటి ఫలితాలు లభించలేదు. దయచేసి పేరు, ఓటరు ఐడి లేదా ఇంటి నంబర్ సరిచూసుకోండి.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Tip: You can search in either English (e.g. Ramesh, Lakshmi) or Telugu (రమేష్, లక్ష్మి).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop & Tablet Table (Hidden on small mobile screens) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[12px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-14">S.No</th>
                <th className="py-3 px-4">Voter Name / పేరు</th>
                <th className="py-3 px-4">Relative / బంధువు</th>
                <th className="py-3 px-4 w-16">Age</th>
                <th className="py-3 px-4 w-20">Gender</th>
                <th className="py-3 px-4">Door No</th>
                <th className="py-3 px-4">EPIC (Voter ID)</th>
                <th className="py-3 px-4 w-24">PS No</th>
                <th className="py-3 px-4 text-right w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {records.map((voter) => (
                <tr
                  key={voter.id || voter.serial_number}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {voter.serial_number}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 font-telugu text-[15px]">
                      {voter.voter_name || <span className="text-slate-400 italic font-sans text-xs">Name unread</span>}
                    </div>
                    {voter.voter_name_romanized && (
                      <div className="text-xs text-slate-500 capitalize tracking-wide font-sans">
                        {voter.voter_name_romanized}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-telugu text-[14px]">
                      {voter.relative_name || '—'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans">
                      {voter.relation}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-xs">
                    {voter.age ?? <span className="text-amber-600 font-bold text-[11px]">Check</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        voter.gender === 'Female'
                          ? 'bg-pink-50 text-pink-700 border border-pink-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {voter.gender}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700 font-medium">
                    {voter.door_number}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs font-semibold text-blue-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {voter.epic_number}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-mono font-medium">
                      {voter.polling_station}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectRecord(voter)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 rounded-md transition"
                      title="View Complete Voter Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Record Cards (Shown only on small mobile viewports) */}
      <div className="md:hidden space-y-3">
        {records.map((voter) => (
          <div
            key={voter.id || voter.serial_number}
            onClick={() => onSelectRecord(voter)}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:bg-blue-50/50 transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400">#{voter.serial_number}</span>
                <h4 className="text-base font-bold text-slate-900 font-telugu">
                  {voter.voter_name || 'Name unread'}
                </h4>
                {voter.voter_name_romanized && (
                  <p className="text-xs text-slate-500 capitalize">{voter.voter_name_romanized}</p>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {voter.epic_number}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Relative ({voter.relation}):</span>
                <span className="font-telugu font-medium text-slate-800">{voter.relative_name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Door Number:</span>
                <span className="font-mono font-medium text-slate-800">{voter.door_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Age / Gender:</span>
                <span className="font-medium text-slate-800">
                  {voter.age ? `${voter.age} yrs` : 'Check'}, {voter.gender}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Polling Station:</span>
                <span className="font-mono font-semibold text-blue-700">{voter.polling_station}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
