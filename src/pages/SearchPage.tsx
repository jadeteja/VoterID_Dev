import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { VoterResults } from '@/components/voters/VoterResults';
import { VoterDetailsModal } from '@/components/voters/VoterDetailsModal';
import { searchVoters } from '@/services/searchService';
import type { VoterRecord, SearchFilters, SearchResultSummary } from '@/types';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const SearchPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<SearchResultSummary>({
    totalRecords: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    records: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<VoterRecord | null>(null);

  const fetchResults = async (searchFilters: SearchFilters, page: number) => {
    setIsLoading(true);
    try {
      const data = await searchVoters(searchFilters, page, 20);
      setResults(data);
    } catch (e) {
      console.error('Failed to search voters', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(filters, currentPage);
  }, [filters, currentPage]);

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleExportFiltered = () => {
    if (!isAdmin) {
      alert('Exporting voter records requires administrator privileges.');
      return;
    }
    // Export simple CSV for authorized administrator
    const headers = ['S.No,Voter Name,Relation,Relative Name,Age,Gender,Door No,EPIC,Polling Station'];
    const rows = results.records.map((r) =>
      `"${r.serial_number}","${r.voter_name || ''}","${r.relation || ''}","${r.relative_name || ''}","${r.age || ''}","${r.gender}","${r.door_number}","${r.epic_number}","${r.polling_station}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ward81_voters_page_${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="site-content-wrapper py-4 md:py-6 lg:py-8 max-w-7xl mx-auto w-full">
      {/* Title Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Search Voter Data / ఓటర్ల వివరాలు వెతకండి
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-telugu mt-0.5">
            విజయవాడ మున్సిపల్ కార్పొరేషన్ – వార్డు 81 ఓటర్ల జాబితా
          </p>
        </div>

        {isAdmin && results.totalRecords > 0 && (
          <button
            onClick={handleExportFiltered}
            className="self-start md:self-auto flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export View (CSV)</span>
          </button>
        )}
      </div>

      {/* Bilingual Search Box */}
      <SearchBar
        onSearch={handleSearch}
        isLoading={isLoading}
        totalResults={results.totalRecords}
      />

      {/* Results View */}
      <VoterResults
        records={results.records}
        isLoading={isLoading}
        onSelectRecord={(voter) => setSelectedVoter(voter)}
      />

      {/* Pagination Controls */}
      {results.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600">
          <div className="font-medium">
            Showing Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900">{results.totalPages}</span> ({results.totalRecords.toLocaleString()} voters)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(results.totalPages, p + 1))}
              disabled={currentPage >= results.totalPages || isLoading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Full Record Details Modal */}
      <VoterDetailsModal
        voter={selectedVoter}
        onClose={() => setSelectedVoter(null)}
      />
    </div>
  );
};
