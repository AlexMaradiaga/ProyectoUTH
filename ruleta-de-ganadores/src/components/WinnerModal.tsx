import React, { useEffect } from 'react';
import { Participant } from '../types';
import { launchConfetti } from '../utils/confetti';
import { soundEffects } from '../utils/sound';
import { Trophy, UserCheck, Trash2, RotateCcw, X, Mail, Phone, Info } from 'lucide-react';

interface WinnerModalProps {
  winner: Participant | null;
  onClose: () => void;
  onRemoveWinner: (winner: Participant) => void;
  onKeepWinner: () => void;
  onSpinAgain: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  onClose,
  onRemoveWinner,
  onKeepWinner,
  onSpinAgain,
}) => {
  useEffect(() => {
    if (winner) {
      launchConfetti();
      soundEffects.playWinFanfare();
    }
  }, [winner]);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Top Gold Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-amber-500 rounded-full blur-lg opacity-60 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-200">
              <Trophy className="w-10 h-10 text-slate-950" />
            </div>
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-full mb-2">
            ¡TENEMOS UN GANADOR!
          </span>

          {/* Winner Name */}
          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 my-2 tracking-tight drop-shadow">
            {winner.name}
          </h2>

          {/* Extra Info Badges */}
          <div className="flex flex-wrap justify-center gap-2 my-4 w-full text-xs">
            {winner.email && (
              <div className="flex items-center gap-1.5 bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{winner.email}</span>
              </div>
            )}
            {winner.phone && (
              <div className="flex items-center gap-1.5 bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{winner.phone}</span>
              </div>
            )}
          </div>

          {/* Additional Columns from Sheet */}
          {winner.extraInfo && Object.keys(winner.extraInfo).length > 0 && (
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-left my-2 text-xs text-slate-300 space-y-1 max-h-36 overflow-y-auto">
              <div className="flex items-center gap-1 text-slate-400 font-semibold mb-1">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Detalles de la hoja:</span>
              </div>
              {Object.entries(winner.extraInfo).map(([key, val]) => (
                val ? (
                  <div key={key} className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400 font-medium">{key}:</span>
                    <span className="text-slate-200 font-semibold text-right max-w-[200px] truncate">{val}</span>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onRemoveWinner(winner);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-rose-600/90 hover:bg-rose-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-colors cursor-pointer text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar de la ruleta</span>
          </button>

          <button
            onClick={() => {
              onKeepWinner();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-700 transition-colors cursor-pointer text-sm"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Mantener en la ruleta</span>
          </button>
        </div>

        <button
          onClick={() => {
            onKeepWinner();
            onClose();
            setTimeout(onSpinAgain, 300);
          }}
          className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>¡Girar de nuevo!</span>
        </button>

      </div>
    </div>
  );
};
