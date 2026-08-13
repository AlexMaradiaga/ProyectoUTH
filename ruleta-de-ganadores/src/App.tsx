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

// URL por defecto configurada para JUEVES TARDE
const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1RFexMwM6S2iff-c5pX3rp5C9q28foFWSbqfZ6AwHZCA/edit?gid=1376844313#gid=1376844313';

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

  const [removedParticipantIds, setRemovedParticipantIds] = useState<Set<string>>(new Set());

  // Estado inicial sincronizado exactamente con JUEVES TARDE
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>({
    url: DEFAULT_SHEET_URL,
    spreadsheetId: '1RFexMwM6S2iff-c5pX3rp5C9q28foFWSbqfZ6AwHZCA',
    gid: '1376844313',
    selectedColumn: '',
    availableColumns: [],
    autoSync: true,
    syncIntervalSeconds: 10,
    status: 'idle',
    activeJornadaId: 'jueves-tarde',
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

  // Función helper para comparar URLs de Google Sheets de manera flexible
  const matchJornadaByUrl = (targetUrl: string, currentActiveId?: string) => {
    // 1. Intento por coincidencia directa de URL
    let matched = JORNADAS.find((j) => j.url === targetUrl);
    if (matched) return matched.id;

    // 2. Extraer parámetros clave (spreadsheetId y gid) para comparar sin importar variaciones de texto
    const extractKeys = (urlStr: string) => {
      const idMatch = urlStr.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = urlStr.match(/gid=([0-9]+)/);
      return {
        id: idMatch ? idMatch[1] : null,
        gid: gidMatch ? gidMatch[1] : null,
      };
    };

    const targetKeys = extractKeys(targetUrl);
    if (targetKeys.id) {
      matched = JORNADAS.find((j) => {
        const jKeys = extractKeys(j.url);
        // Si la hoja comparte el mismo ID y el mismo GID (o no especifica GID)
        return jKeys.id === targetKeys.id && (!targetKeys.gid || jKeys.gid === targetKeys.gid);
      });
      if (matched) return matched.id;
    }

    // 3. Si no hay coincidencia directa, conserva el ID activo actual o usa 'jueves-tarde'
    return currentActiveId || 'jueves-tarde';
  };

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
            sourceRow: idx + 2,
          };
        });

        setParticipants(newParticipants.filter((p) => !removedParticipantIds.has(p.id)));

        // Determina el ID de la jornada de forma segura
        setSheetConfig((prev) => {
          const resolvedJornadaId = overrideJornadaId !== undefined
            ? overrideJornadaId
            : matchJornadaByUrl(targetUrl, prev.activeJornadaId);

          return {
            ...prev,
            url: targetUrl,
            spreadsheetId: data.spreadsheetId,
            gid: data.gid,
            availableColumns: data.headers || [],
            selectedColumn: data.selectedColumn || '',
            activeJornadaId: resolvedJornadaId,
            status: 'success',
            lastSyncedAt: new Date().toISOString(),
            error: null,
          };
        });
      } catch (err: any) {
        console.error('Fetch Sheet Error:', err);
        setSheetConfig((prev) => ({
          ...prev,
          status: 'error',
          error: err.message,
        }));

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

  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  useEffect(() => {
    if (!sheetConfig.autoSync || sheetConfig.syncIntervalSeconds <= 0) return;

    const timer = setInterval(() => {
      if (!isSpinningRef.current) {
        fetchSheetData();
      }
    }, sheetConfig.syncIntervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [sheetConfig.autoSync, sheetConfig.syncIntervalSeconds, fetchSheetData]);

  const handleToggleSound = () => {
    const nextState = !wheelSettings.soundEnabled;
    setWheelSettings((prev) => ({ ...prev, soundEnabled: nextState }));
    soundEffects.setMuted(!nextState);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
    setCurrentWinner(null);
  };

  const handleSpinEnd = (winner: Participant) => {
    setIsSpinning(false);
    setCurrentWinner(winner);

    const newWinnerEntry: Winner = {
      id: `win-${Date.now()}`,
      participant: winner,
      wonAt: new Date().toISOString(),
      removedFromWheel: false,
    };

    setWinners((prev) => [newWinnerEntry, ...prev]);
  };

  const handleRemoveWinner = (winner: Participant) => {
    setRemovedParticipantIds((prev) => {
      const next = new Set(prev);
      next.add(winner.id);
      return next;
    });

    setParticipants((prev) => prev.filter((p) => p.id !== winner.id));

    setWinners((prev) =>
      prev.map((w) => (w.participant.id === winner.id ? { ...w, removedFromWheel: true } : w))
    );
  };

  const handleRestoreWinnerToWheel = (winnerEntry: Winner) => {
    const winnerId = winnerEntry.participant.id;

    setRemovedParticipantIds((prev) => {
      const next = new Set(prev);
      next.delete(winnerId);
      return next;
    });

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

        <div className="flex items-center gap-2 sm:gap-3">
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
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-[#005028] text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm"
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

      <div className="flex-1 flex overflow-hidden relative">
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

        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-xs"
          />
        )}

        <main className="flex-1 flex flex-col lg:flex-row items-center justify-between p-4 sm:p-6 overflow-y-auto gap-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
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

          <div className="w-full lg:w-96 shrink-0 space-y-4">
            <WinnersHistory
              winners={winners}
              onClearHistory={() => setWinners([])}
              onRestoreWinnerToWheel={handleRestoreWinnerToWheel}
            />
          </div>
        </main>
      </div>

      <WinnerModal
        winner={currentWinner}
        onClose={() => setCurrentWinner(null)}
        onRemoveWinner={handleRemoveWinner}
        onKeepWinner={() => setCurrentWinner(null)}
        onSpinAgain={() => {
          setCurrentWinner(null);
          const spinBtn = document.querySelector('button:has(svg.lucide-play)') as HTMLButtonElement;
          if (spinBtn) spinBtn.click();
        }}
      />

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