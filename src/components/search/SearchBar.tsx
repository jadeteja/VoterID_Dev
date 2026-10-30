import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, Languages } from 'lucide-react';
import type { SearchFilters } from '@/types';
import { isTeluguText } from '@/lib/transliteration';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
  totalResults?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  totalResults,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    pollingStation: '',
    gender: '',
    relation: '',
    ocrReviewOnly: false,
    doorNumber: '',
  });

  const isCurrentInputTelugu = isTeluguText(searchTerm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      ...filters,
      query: searchTerm.trim(),
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    const resetFilters: SearchFilters = {
      pollingStation: '',
      gender: '',
      relation: '',
      ocrReviewOnly: false,
      doorNumber: '',
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 md:p-5 mb-5">
      <form onSubmit={handleSubmit}>
        {/* Top Search Input Row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, EPIC, door number, polling station (రమేష్, Ramesh, TMO3560539...)"
              className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 text-sm md:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
            {/* Language Indicator Badge */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center space-x-1 px-2 py-1 bg-slate-200/70 rounded text-[11px] font-medium text-slate-600">
                <Languages className="w-3.5 h-3.5 text-blue-600" />
                <span>{isCurrentInputTelugu ? 'తెలుగు' : 'English'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 md:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition flex items-center justify-center space-x-2 disabled:opacity-50 text-sm md:text-base"
            >
              <Search className="w-4 h-4" />
              <span>శోధించండి / Search</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-3.5 py-3 border rounded-lg flex items-center justify-center space-x-1.5 transition text-sm ${
                showAdvanced || Object.values(filters).some(Boolean)
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-3 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Telugu Helper Prompt */}
        <div className="mt-2 text-xs text-slate-500 font-telugu flex items-center justify-between">
          <span>పేరు, ఓటరు ఐడి, ఇంటి నంబర్ లేదా ఇతర వివరాలతో వెతకండి (ఆంగ్లం లేదా తెలుగు)</span>
          {totalResults !== undefined && (
            <span className="font-sans font-medium text-slate-700">
              {totalResults.toLocaleString()} records found
            </span>
          )}
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Polling Station (PS)</label>
              <select
                value={filters.pollingStation}
                onChange={(e) => setFilters({ ...filters, pollingStation: e.target.value })}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All 11 Stations</option>
                {Array.from({ length: 11 }, (_, i) => `81/${i + 1}`).map((ps) => (
                  <option key={ps} value={ps}>Polling Station {ps}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Genders</option>
                <option value="Male">Male (పురుషులు)</option>
                <option value="Female">Female (స్త్రీలు)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Relation</label>
              <select
                value={filters.relation}
                onChange={(e) => setFilters({ ...filters, relation: e.target.value })}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Relations</option>
                <option value="Father">Father</option>
                <option value="Husband">Husband</option>
                <option value="Mother">Mother</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Door Number</label>
              <input
                type="text"
                placeholder="e.g. 77-37/1"
                value={filters.doorNumber}
                onChange={(e) => setFilters({ ...filters, doorNumber: e.target.value })}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="col-span-full flex items-center justify-between pt-2">
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.ocrReviewOnly}
                  onChange={(e) => setFilters({ ...filters, ocrReviewOnly: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Show only records needing OCR Review (సమీక్ష అవసరమైనవి)</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  onSearch({ ...filters, query: searchTerm.trim() });
                }}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
