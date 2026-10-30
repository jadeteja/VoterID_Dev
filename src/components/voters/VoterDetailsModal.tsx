import React from 'react';
import type { VoterRecord } from '@/types';
import { X, User, MapPin, FileText, AlertTriangle, Shield } from 'lucide-react';

interface VoterDetailsModalProps {
  voter: VoterRecord | null;
  onClose: () => void;
}

export const VoterDetailsModal: React.FC<VoterDetailsModalProps> = ({ voter, onClose }) => {
  if (!voter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#123D73] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/60 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight font-telugu">{voter.voter_name || 'Voter Record'}</h3>
              <p className="text-xs text-blue-200 font-mono mt-0.5">EPIC: {voter.epic_number} | S.No: #{voter.serial_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* OCR Review Warning Banner if present */}
          {voter.ocr_review && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-800">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">OCR Audit Review Flag</p>
                <p className="text-sm font-medium mt-0.5">{voter.ocr_review}</p>
                <p className="text-xs text-amber-700 mt-1">
                  Please verify this voter's printed details against electoral roll PDF Page {voter.pdf_page || 'N/A'}.
                </p>
              </div>
            </div>
          )}

          {/* Core Personal Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Personal Identification / వ్యక్తిగత సమాచారం</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-xs text-slate-500 block">Original Telugu Name:</span>
                <span className="text-base font-bold text-slate-900 font-telugu">{voter.voter_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Romanized / Phonetic English:</span>
                <span className="text-sm font-semibold text-slate-700 capitalize">{voter.voter_name_romanized || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Relative Name ({voter.relation}):</span>
                <span className="text-base font-medium text-slate-900 font-telugu">{voter.relative_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Age & Gender:</span>
                <span className="text-sm font-semibold text-slate-800">
                  {voter.age ? `${voter.age} Years` : 'Age Unread (Check PDF)'} • {voter.gender}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Electoral Station Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Electoral Location & Booth / పోలింగ్ స్టేషన్ వివరాలు</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-xs text-slate-500 block">Door Number (చిరునామా):</span>
                <span className="text-sm font-mono font-bold text-slate-900">{voter.door_number}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Polling Station Number:</span>
                <span className="text-sm font-mono font-bold text-blue-700">{voter.polling_station}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500 block">Polling Station Building / Room:</span>
                <p className="text-sm font-medium text-slate-800 font-telugu mt-0.5">
                  {voter.polling_station_description || 'చలసాని సూర్య ప్రకాశరావు ఎలిమెంటరీ స్కూల్ భవనం'}
                </p>
              </div>
            </div>
          </div>

          {/* Traceability & Source Roll Metadata */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Traceability & PDF Roll Info / మూల పత్ర వివరాలు</span>
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 block">AC-Part-Sl No:</span>
                <span className="font-mono font-semibold text-slate-800">{voter.ac_part_sl_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PDF Page:</span>
                <span className="font-mono font-semibold text-slate-800">Page {voter.pdf_page || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Source Sheet:</span>
                <span className="font-mono text-slate-800 truncate block">{voter.source_sheet} (R{voter.source_row})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">Ward 81 Vijayawada Municipal Corporation</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
          >
            Close / మూసివేయండి
          </button>
        </div>
      </div>
    </div>
  );
};
