import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Participant, Winner, SheetConfig, WheelSettings } from './types';
import { JORNADAS } from './constants/jornadas';
import { soundEffects } from './utils/sound';
import { RouletteWheel } from './components/RouletteWheel';
import { WinnerModal } from './components/WinnerModal';
import { ParticipantsSidebar } from './components/ParticipantsSidebar';
import { WinnersHistory } from './components/WinnersHistory';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import {
  Trophy,
  Sparkles,
  Users,
  RefreshCw,
  Settings,
  Layers,
  Menu,
  X,
  Radio,
  FileSpreadsheet
} from 'lucide-react';

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1RFexMwM6S2iff-c5pX3rp5C9q28foFWSbqfZ6AwHZCA/edit?gid=1376844313#gid=1376844313';

// Sample fallback participants if Google Sheet is completely empty or during offline testing
const FALLBACK_SAMPLE_NAMES = [
  'Carlos Mendoza',
  'Ana Sofía Reyes',
  'María Fernanda López',
  'David Alejandro Gómez',
  'Valeria Torres',
  'Gabriel Morales',
  'Isabella Ruiz',
  'Mateo Hernández',
];

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [currentWinner, setCurrentWinner] = useState<Participant | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Excluded IDs (e.g. winners who were removed from the wheel)
  const [removedParticipantIds, setRemovedParticipantIds] = useState<Set<string>>(new Set());

  const [sheetConfig, setSheetConfig] = useState<SheetConfig>({
    url: DEFAULT_SHEET_URL,
    spreadsheetId: '1RFexMwM6S2iff-c5pX3rp5C9q28foFWSbqfZ6AwHZCA',
    gid: '1376844313',
    selectedColumn: '',
    availableColumns: [],
    autoSync: true,
    syncIntervalSeconds: 10,
    status: 'idle',
  });

  const [wheelSettings, setWheelSettings] = useState<WheelSettings>({
    spinDurationSeconds: 6,
    allowDuplicates: false,
    soundEnabled: true,
    confettiEnabled: true,
    removeWinnerOnWin: false,
    theme: 'vibrant',
  });

  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;

  // Fetch sheet data from API
  const fetchSheetData = useCallback(
    async (overrideUrl?: string, overrideColumn?: string, overrideJornadaId?: string) => {
      const targetUrl = overrideUrl || sheetConfig.url;
      const targetCol = overrideColumn !== undefined ? overrideColumn : sheetConfig.selectedColumn;

      setSheetConfig((prev) => ({ ...prev, status: 'loading', error: null }));

      try {
        const queryParams = new URLSearchParams({
          url: targetUrl,
        });
        if (targetCol) {
          queryParams.append('column', targetCol);
        }

        const res = await fetch(`/api/fetch-sheet?${queryParams.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'No se pudo obtener la información de Google Sheets.');
        }

        const rawParticipants: string[] = data.participants || [];
        const rows: Record<string, string>[] = data.rows || [];

        // Map parsed strings to Participant objects
        const newParticipants: Participant[] = rawParticipants.map((nameStr, idx) => {
          const rowObj = rows[idx] || {};
          const email =
            rowObj['Correo electrónico'] ||
            rowObj['Dirección de correo electrónico font-medium'] ||
            rowObj['Email'] ||
            rowObj['Email Address'] ||
            '';
          const phone =
            rowObj['Número de WhatsApp / Teléfono'] ||
            rowObj['Teléfono'] ||
            rowObj['WhatsApp'] ||
            rowObj['Phone'] ||
            '';

          return {
            id: `sheet-${idx}-${nameStr.toLowerCase().replace(/\s+/g, '-')}`,
            name: nameStr,
            email,
            phone,
            extraInfo: rowObj,
            sourceRow: idx + 2, // 1-indexed row with header
          };
        });

        // Filter out explicitly removed IDs
        setParticipants(newParticipants.filter((p) => !removedParticipantIds.has(p.id)));

        const matchedJornada = JORNADAS.find((j) => j.url === targetUrl);

        setSheetConfig((prev) => ({
          ...prev,
          url: targetUrl,
          spreadsheetId: data.spreadsheetId,
          gid: data.gid,
          availableColumns: data.headers || [],
          selectedColumn: data.selectedColumn || '',
          activeJornadaId: overrideJornadaId !== undefined ? overrideJornadaId : (matchedJornada ? matchedJornada.id : prev.activeJornadaId),
          status: 'success',
          lastSyncedAt: new Date().toISOString(),
          error: null,
        }));
      } catch (err: any) {
        console.error('Fetch Sheet Error:', err);
        setSheetConfig((prev) => ({
          ...prev,
          status: 'error',
          error: err.message,
        }));

        // If sheet is empty or fetch fails, and participants is empty, load sample fallback
        setParticipants((current) => {
          if (current.length === 0) {
            return FALLBACK_SAMPLE_NAMES.map((name, idx) => ({
              id: `fallback-${idx}`,
              name,
            }));
          }
          return current;
        });
      }
    },
    [sheetConfig.url, sheetConfig.selectedColumn, removedParticipantIds]
  );

  // Initial load
  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  // Real-time polling timer
  useEffect(() => {
    if (!sheetConfig.autoSync || sheetConfig.syncIntervalSeconds <= 0) return;

    const timer = setInterval(() => {
      // Don't refresh in the middle of spinning to prevent layout shifts
      if (!isSpinningRef.current) {
        fetchSheetData();
      }
    }, sheetConfig.syncIntervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [sheetConfig.autoSync, sheetConfig.syncIntervalSeconds, fetchSheetData]);

  // Sound toggle
  const handleToggleSound = () => {
    const nextState = !wheelSettings.soundEnabled;
    setWheelSettings((prev) => ({ ...prev, soundEnabled: nextState }));
    soundEffects.setMuted(!nextState);
  };

  // Spin lifecycle
  const handleSpinStart = () => {
    setIsSpinning(true);
    setCurrentWinner(null);
  };

  const handleSpinEnd = (winner: Participant) => {
    setIsSpinning(false);
    setCurrentWinner(winner);

    // Record winner in history
    const newWinnerEntry: Winner = {
      id: `win-${Date.now()}`,
      participant: winner,
      wonAt: new Date().toISOString(),
      removedFromWheel: false,
    };

    setWinners((prev) => [newWinnerEntry, ...prev]);
  };

  // Remove winner from wheel
  const handleRemoveWinner = (winner: Participant) => {
    setRemovedParticipantIds((prev) => {
      const next = new Set(prev);
      next.add(winner.id);
      return next;
    });

    setParticipants((prev) => prev.filter((p) => p.id !== winner.id));

    // Mark in winners history as removed
    setWinners((prev) =>
      prev.map((w) => (w.participant.id === winner.id ? { ...w, removedFromWheel: true } : w))
    );
  };

  // Restore winner back to active wheel
  const handleRestoreWinnerToWheel = (winnerEntry: Winner) => {
    const winnerId = winnerEntry.participant.id;

    setRemovedParticipantIds((prev) => {
      const next = new Set(prev);
      next.delete(winnerId);
      return next;
    });

    // Add back if not already in list
    setParticipants((prev) => {
      if (!prev.some((p) => p.id === winnerId)) {
        return [winnerEntry.participant, ...prev];
      }
      return prev;
    });

    setWinners((prev) =>
      prev.map((w) => (w.id === winnerEntry.id ? { ...w, removedFromWheel: false } : w))
    );
  };

  // Manual participant handlers
  const handleAddParticipant = (name: string) => {
    const newP: Participant = {
      id: `manual-${Date.now()}`,
      name,
    };
    setParticipants((prev) => [...prev, newP]);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setRemovedParticipantIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleShuffleParticipants = () => {
    setParticipants((prev) => {
      const array = [...prev];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    });
  };

  const handleClearAllParticipants = () => {
    setParticipants([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Top Navbar Header con Logo UTH */}
      <header className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer lg:hidden"
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            {/* Logo Oficial UTH */}
            <img 
              src="/ImagenUTH.png" 
              alt="UTH Logo" 
              className="h-10 w-auto object-contain bg-white/10 p-1 rounded-lg border border-emerald-500/30"
            />
            <div className="hidden sm:block h-7 w-[1px] bg-slate-800" />
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-tight leading-tight flex items-center gap-2">
                <span>Ruleta UTH</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold bg-[#006837]/30 text-emerald-400 px-2 py-0.5 rounded-full border border-[#006837]">
                  TIEMPO REAL
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Universidad Tecnológica de Honduras
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Sync Status Pulse */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs">
            <div className="relative flex h-2.5 w-2.5">
              {sheetConfig.autoSync && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  sheetConfig.status === 'success'
                    ? 'bg-emerald-500'
                    : sheetConfig.status === 'loading'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
            </div>
            <span className="text-slate-300 font-medium text-[11px]">
              {sheetConfig.status === 'loading'
                ? 'Sincronizando...'
                : sheetConfig.autoSync
                ? `En vivo (${sheetConfig.syncIntervalSeconds}s)`
                : 'Sincronización manual'}
            </span>
          </div>

          <button
            onClick={() => fetchSheetData()}
            disabled={sheetConfig.status === 'loading'}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm"
            title="Sincronizar ahora"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                sheetConfig.status === 'loading' ? 'animate-spin text-emerald-400' : ''
              }`}
            />
            <span className="hidden md:inline">Sincronizar</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#006837] hover:bg-[#005028] text-white text-xs font-bold py-2 px-3 rounded-xl shadow-lg transition-all cursor-pointer border border-emerald-500/30"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FFC60B]" />
            <span className="hidden sm:inline">Google Sheets</span>
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar - Participants Management */}
        <div
          className={`fixed lg:relative z-30 inset-y-0 left-0 w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <ParticipantsSidebar
            participants={participants}
            sheetConfig={sheetConfig}
            onRefreshSheet={() => fetchSheetData()}
            onSelectColumn={(col) => fetchSheetData(undefined, col)}
            onSelectJornada={(url, id) => fetchSheetData(url, undefined, id)}
            onOpenSheetSettings={() => setIsSettingsModalOpen(true)}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onShuffleParticipants={handleShuffleParticipants}
            onClearAllParticipants={handleClearAllParticipants}
          />
        </div>

        {/* Mobile backdrop for sidebar */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-xs"
          />
        )}

        {/* Central Wheel Stage & Right Winner History */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-between p-4 sm:p-6 overflow-y-auto gap-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          
          {/* Interactive Wheel Stage */}
          <div className="flex-1 w-full flex flex-col items-center justify-center my-auto">
            <RouletteWheel
              participants={participants}
              settings={wheelSettings}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
              isSpinning={isSpinning}
              onToggleSound={handleToggleSound}
            />
          </div>

          {/* Right Column: Winners History Panel */}
          <div className="w-full lg:w-96 shrink-0 space-y-4">
            <WinnersHistory
              winners={winners}
              onClearHistory={() => setWinners([])}
              onRestoreWinnerToWheel={handleRestoreWinnerToWheel}
            />
          </div>

        </main>
      </div>

      {/* Winner Celebration Modal */}
      <WinnerModal
        winner={currentWinner}
        onClose={() => setCurrentWinner(null)}
        onRemoveWinner={handleRemoveWinner}
        onKeepWinner={() => setCurrentWinner(null)}
        onSpinAgain={() => {
          setCurrentWinner(null);
          // spin wheel again
          const spinBtn = document.querySelector('button:has(svg.lucide-play)') as HTMLButtonElement;
          if (spinBtn) spinBtn.click();
        }}
      />

      {/* Google Sheets Settings & Custom URL Modal */}
      <SheetSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        sheetConfig={sheetConfig}
        wheelSettings={wheelSettings}
        onSaveSheetUrl={(newUrl, jornadaId) => fetchSheetData(newUrl, undefined, jornadaId)}
        onUpdateWheelSettings={(newSettings) =>
          setWheelSettings((prev) => ({ ...prev, ...newSettings }))
        }
        onUpdateSyncInterval={(seconds, autoSync) =>
          setSheetConfig((prev) => ({
            ...prev,
            syncIntervalSeconds: seconds,
            autoSync,
          }))
        }
      />

    </div>
  );
}