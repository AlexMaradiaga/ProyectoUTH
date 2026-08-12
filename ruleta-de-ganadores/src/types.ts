export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  extraInfo?: Record<string, string>;
  sourceRow?: number;
  weight?: number;
}

export interface Winner {
  id: string;
  participant: Participant;
  wonAt: string; // ISO date string
  removedFromWheel: boolean;
}

export interface SheetConfig {
  url: string;
  spreadsheetId: string;
  gid: string;
  selectedColumn: string;
  availableColumns: string[];
  activeJornadaId?: string;
  autoSync: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt?: string;
  error?: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export interface WheelSettings {
  spinDurationSeconds: number;
  allowDuplicates: boolean;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  removeWinnerOnWin: boolean;
  theme: 'vibrant' | 'pastel' | 'neon' | 'gold';
}
