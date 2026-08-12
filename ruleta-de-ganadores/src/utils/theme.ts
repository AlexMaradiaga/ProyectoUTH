export const THEMES = {
  vibrant: [
    '#006837', '#FFC60B', '#005028', '#F3AC10', '#0B8043',
    '#D97706', '#10B981', '#EAB308', '#047857', '#F59E0B'
  ],
  gold: [
    '#FFC60B', '#D97706', '#B45309', '#F59E0B', '#006837',
    '#047857', '#065F46', '#78350F', '#10B981', '#059669'
  ],
  pastel: [
    '#86EFAC', '#FDE047', '#A7F3D0', '#FEF08A', '#6EE7B7',
    '#F2DA6F', '#34D399', '#FACC15', '#A3E635', '#FBBF24'
  ],
  neon: [
    '#00FF66', '#FFCC00', '#00FFCC', '#FFD700', '#39FF14',
    '#FFC60B', '#00E676', '#FFEA00', '#10B981', '#00FFAA'
  ]
};

export function getSegmentColor(index: number, total: number, themeKey: keyof typeof THEMES = 'vibrant'): string {
  const palette = THEMES[themeKey] || THEMES.vibrant;
  return palette[index % palette.length];
}