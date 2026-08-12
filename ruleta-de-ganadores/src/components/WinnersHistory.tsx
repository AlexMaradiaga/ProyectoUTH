import React from 'react';
import { Winner } from '../types';
import { Trophy, Copy, Download, Trash2, Check, RotateCcw } from 'lucide-react';

interface WinnersHistoryProps {
  winners: Winner[];
  onClearHistory: () => void;
  onRestoreWinnerToWheel: (winner: Winner) => void;
}

export const WinnersHistory: React.FC<WinnersHistoryProps> = ({
  winners,
  onClearHistory,
  onRestoreWinnerToWheel,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (winners.length === 0) return;
    const text = winners
      .map(
        (w, i) =>
          `${i + 1}. ${w.participant.name} (${new Date(w.wonAt).toLocaleTimeString()})`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (winners.length === 0) return;
    const headers = ['#', 'Nombre', 'Hora de Selección'];
    const rows = winners.map((w, i) => [
      i + 1,
      `"${w.participant.name.replace(/"/g, '""')}"`,
      `"${new Date(w.wonAt).toLocaleString()}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ganadores_ruleta_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-base text-white">Historial de Ganadores</h3>
          <span className="bg-amber-500/20 text-amber-300 font-mono text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
            {winners.length}
          </span>
        </div>

        {winners.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onClearHistory}
              className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Borrar historial"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Winner List */}
      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {winners.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Aún no hay ganadores seleccionados. ¡Gira la ruleta para comenzar!
          </div>
        ) : (
          winners.map((w, idx) => (
            <div
              key={w.id || idx}
              className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800/80 text-xs transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono text-[11px] shrink-0">
                  #{idx + 1}
                </span>
                <div className="truncate">
                  <div className="font-bold text-white truncate">{w.participant.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(w.wonAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>

              {w.removedFromWheel && (
                <button
                  onClick={() => onRestoreWinnerToWheel(w)}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer shrink-0"
                  title="Devolver a la ruleta activa"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Devolver</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
