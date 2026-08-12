import React, { useState, useEffect } from 'react';
import { SheetConfig, WheelSettings } from '../types';
import { THEMES } from '../utils/theme';
import { JORNADAS } from '../constants/jornadas';
import { X, Link2, Clock, Palette, HelpCircle, ExternalLink, Calendar, Check, Sun, Sunset } from 'lucide-react';

interface SheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetConfig: SheetConfig;
  wheelSettings: WheelSettings;
  onSaveSheetUrl: (url: string, jornadaId?: string) => void;
  onUpdateWheelSettings: (newSettings: Partial<WheelSettings>) => void;
  onUpdateSyncInterval: (seconds: number, autoSync: boolean) => void;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  isOpen,
  onClose,
  sheetConfig,
  wheelSettings,
  onSaveSheetUrl,
  onUpdateWheelSettings,
  onUpdateSyncInterval,
}) => {
  const [inputUrl, setInputUrl] = useState(sheetConfig.url);

  useEffect(() => {
    setInputUrl(sheetConfig.url);
  }, [sheetConfig.url, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onSaveSheetUrl(inputUrl.trim());
      onClose();
    }
  };

  const handleSelectJornada = (url: string, jornadaId: string) => {
    setInputUrl(url);
    onSaveSheetUrl(url, jornadaId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-200 custom-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Configuración de Google Sheets</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Quick Jornadas Selector */}
          <div>
            <label className="font-bold text-slate-200 flex items-center gap-1.5 mb-2 text-xs">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Selecciona una Jornada (Listados Preconfigurados):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {JORNADAS.map((j) => {
                const isSelected = sheetConfig.activeJornadaId === j.id || inputUrl.trim() === j.url;
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => handleSelectJornada(j.url, j.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {j.session === 'Mañana' ? (
                          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <Sunset className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        )}
                        <span>{j.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Día {j.day} - Turno {j.session}
                      </span>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Google Sheet URL */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">O edita el enlace manualmente:</label>
            </div>
            <div className="relative">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>El documento debe estar en modo "Cualquier persona con el enlace puede ver".</span>
            </p>
          </div>

          {/* Sync Frequency */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1.5">
              Sincronización Automática en Tiempo Real:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Manual', sec: 0, auto: false },
                { label: '5 seg', sec: 5, auto: true },
                { label: '10 seg', sec: 10, auto: true },
                { label: '30 seg', sec: 30, auto: true },
              ].map((opt) => {
                const isActive =
                  (!opt.auto && !sheetConfig.autoSync) ||
                  (opt.auto && sheetConfig.autoSync && sheetConfig.syncIntervalSeconds === opt.sec);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onUpdateSyncInterval(opt.sec, opt.auto)}
                    className={`py-2 px-2 rounded-xl border font-semibold text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spin Duration */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Duración del Giro de la Ruleta:</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 8, 10].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateWheelSettings({ spinDurationSeconds: sec })}
                  className={`py-2 px-2 rounded-xl border font-semibold text-center transition-all cursor-pointer ${
                    wheelSettings.spinDurationSeconds === sec
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Theme */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Paleta de Colores:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((tKey) => {
                const isActive = wheelSettings.theme === tKey;
                const colors = THEMES[tKey];
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => onUpdateWheelSettings({ theme: tKey })}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="capitalize font-semibold">{tKey}</span>
                    <div className="flex gap-0.5 overflow-hidden rounded-full">
                      {colors.slice(0, 5).map((c, i) => (
                        <div key={i} className="w-2.5 h-2.5" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer text-xs"
            >
              Guardar y Conectar
            </button>
          </div>
        </form>

        {/* Link to Open Google Sheet in new tab */}
        {sheetConfig.url && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <a
              href={sheetConfig.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              <span>Abrir hoja activa en Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

      </div>
    </div>
  );
};
