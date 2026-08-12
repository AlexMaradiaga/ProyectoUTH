import React, { useState } from 'react';
import { Participant, SheetConfig } from '../types';
import { JORNADAS } from '../constants/jornadas';
import {
  Users,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Shuffle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronDown,
  Calendar,
  Layers
} from 'lucide-react';

interface ParticipantsSidebarProps {
  participants: Participant[];
  sheetConfig: SheetConfig;
  onRefreshSheet: () => void;
  onSelectColumn: (column: string) => void;
  onSelectJornada: (url: string, jornadaId: string) => void;
  onOpenSheetSettings: () => void;
  onAddParticipant: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
  onShuffleParticipants: () => void;
  onClearAllParticipants: () => void;
}

export const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({
  participants,
  sheetConfig,
  onRefreshSheet,
  onSelectColumn,
  onSelectJornada,
  onOpenSheetSettings,
  onAddParticipant,
  onRemoveParticipant,
  onShuffleParticipants,
  onClearAllParticipants,
}) => {
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddParticipant(newName.trim());
      setNewName('');
    }
  };

  const activeJornadaName = JORNADAS.find(j => j.id === sheetConfig.activeJornadaId || j.url === sheetConfig.url)?.name || 'Personalizado';

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200">
      
      {/* Header & Google Sheet Sync Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-white">Participantes</h2>
            <span className="bg-amber-500/20 text-amber-300 font-mono text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
              {participants.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefreshSheet}
              disabled={sheetConfig.status === 'loading'}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Sincronizar con Google Sheets"
            >
              <RefreshCw
                className={`w-4 h-4 ${sheetConfig.status === 'loading' ? 'animate-spin text-amber-400' : ''}`}
              />
            </button>
            <button
              onClick={onOpenSheetSettings}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Configurar Google Sheet"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Connection Status Indicator */}
        <div className="flex items-center justify-between text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <div className="flex items-center gap-1.5 font-medium text-slate-200 truncate">
                {sheetConfig.status === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                {sheetConfig.status === 'error' && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="truncate font-semibold text-amber-300">{activeJornadaName}</span>
              </div>
              {sheetConfig.lastSyncedAt && (
                <div className="text-[10px] text-slate-400">
                  Actualizado: {new Date(sheetConfig.lastSyncedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onOpenSheetSettings}
            className="text-[11px] text-amber-400 hover:underline shrink-0 font-medium"
          >
            Editar enlace
          </button>
        </div>

        {/* Quick Jornada Selector Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>Jornada Activa:</span>
          </label>
          <div className="relative">
            <select
              value={sheetConfig.activeJornadaId || ''}
              onChange={(e) => {
                const j = JORNADAS.find(item => item.id === e.target.value);
                if (j) {
                  onSelectJornada(j.url, j.id);
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 appearance-none pr-8 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
            >
              {JORNADAS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name} ({j.day} - {j.session})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Column Mapper Dropdown */}
        {sheetConfig.availableColumns.length > 0 && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Columna de Nombres:
            </label>
            <div className="relative">
              <select
                value={sheetConfig.selectedColumn}
                onChange={(e) => onSelectColumn(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 appearance-none pr-8 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {sheetConfig.availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Controls: Search & Actions */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/50 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar participante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            onClick={onShuffleParticipants}
            disabled={participants.length === 0}
            className="flex items-center gap-1 text-slate-300 hover:text-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Mezclar orden</span>
          </button>

          <button
            onClick={onClearAllParticipants}
            disabled={participants.length === 0}
            className="text-slate-400 hover:text-rose-400 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Vaciar lista
          </button>
        </div>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 text-xs">
            {search ? (
              <p>No se encontraron coincidencias para "{search}"</p>
            ) : (
              <div>
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
                <p className="font-medium text-slate-400">Lista vacía</p>
                <p className="mt-1">
                  Sincroniza con Google Sheets o añade un nombre manualmente a continuación.
                </p>
              </div>
            )}
          </div>
        ) : (
          filteredParticipants.map((p, idx) => (
            <div
              key={p.id || idx}
              className="flex items-center justify-between group bg-slate-800/40 hover:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-800/60 transition-all text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-5 text-center font-mono text-[10px] text-slate-500 shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium text-slate-200 truncate">{p.name}</span>
              </div>

              <button
                onClick={() => onRemoveParticipant(p.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity cursor-pointer shrink-0"
                title="Eliminar de la lista"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Manual Participant Adder */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <form onSubmit={handleAddSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Añadir nombre manualmente..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 font-bold" />
          </button>
        </form>
      </div>

    </div>
  );
};
