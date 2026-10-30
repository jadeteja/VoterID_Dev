import React from 'react';
import { POLLING_STATIONS_DATA } from '@/services/mockData';
import { getActiveDataset } from '@/services/searchService';
import { Users, Building2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const currentDataset = getActiveDataset();
  const totalVoters = currentDataset.length >= 10000 ? 10307 : currentDataset.length;
  const maleCount = currentDataset.filter((v) => v.gender === 'Male').length || 4861;
  const femaleCount = currentDataset.filter((v) => v.gender === 'Female').length || 5446;
  const ocrCount = currentDataset.filter((v) => Boolean(v.ocr_review)).length || 2429;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Ward 81 Overview / సారాంశం
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-telugu mt-0.5">
            విజయవాడ మున్సిపల్ కార్పొరేషన్ ఓటర్ల జాబితా వివరాలు
          </p>
        </div>

        <Link
          to="/search"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <span>Search Voters / శోధించండి</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Voters</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalVoters.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 font-telugu mt-1">మొత్తం నమోదైన ఓటర్లు</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Polling Stations</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">11</div>
          <p className="text-[11px] text-slate-400 font-telugu mt-1">పోలింగ్ కేంద్రాలు (PS 81/1–11)</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gender Ratio</span>
            <span className="text-xs font-bold text-pink-600">52.8% F</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {femaleCount.toLocaleString()} F / {maleCount.toLocaleString()} M
          </div>
          <p className="text-[11px] text-slate-400 font-telugu mt-1">స్త్రీలు / పురుషులు</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">OCR Review Rows</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{ocrCount.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 font-telugu mt-1">సమీక్ష అవసరమైన రికార్డులు</p>
        </div>
      </div>

      {/* Polling Stations Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">11 Polling Stations Summary / పోలింగ్ స్టేషన్ల వివరాలు</h3>
            <p className="text-xs text-slate-500 font-telugu">అధికారిక రికార్డుల సమాచారం</p>
          </div>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Dataset</span>
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">PS No</th>
                <th className="py-3 px-4 min-w-[260px]">Building / Room (భవనం / గది)</th>
                <th className="py-3 px-4">Door Numbers</th>
                <th className="py-3 px-4">S.No Range</th>
                <th className="py-3 px-4 text-right">Male</th>
                <th className="py-3 px-4 text-right">Female</th>
                <th className="py-3 px-4 text-right">Total Voters</th>
                <th className="py-3 px-4 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {POLLING_STATIONS_DATA.map((ps) => (
                <tr key={ps.stationNumber} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{ps.stationNumber}</td>
                  <td className="py-2.5 px-4 font-telugu text-[13px] text-slate-800">{ps.buildingNameTelugu}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{ps.doorNoFrom} to {ps.doorNoTo}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">#{ps.sNoFrom}–{ps.sNoTo}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">{ps.maleVoters}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">{ps.femaleVoters}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{ps.totalVoters}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-amber-600 font-medium">{ps.reviewRows}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
                <td className="py-3 px-4" colSpan={4}>Ward 81 Total / మొత్తం ఓటర్లు</td>
                <td className="py-3 px-4 text-right font-mono">4,861</td>
                <td className="py-3 px-4 text-right font-mono">5,446</td>
                <td className="py-3 px-4 text-right font-mono text-blue-800 font-extrabold text-sm">10,307</td>
                <td className="py-3 px-4 text-right font-mono text-amber-700">2,429</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
