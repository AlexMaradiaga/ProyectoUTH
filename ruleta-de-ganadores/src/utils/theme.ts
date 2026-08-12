export const THEMES = {
  vibrant: [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'
  ],
  gold: [
    '#D97706', '#B45309', '#92400E', '#78350F', '#F59E0B',
    '#4C1D95', '#5B21B6', '#6D28D9', '#047857', '#065F46'
  ],
  pastel: [
    '#FCA5A5', '#FDBA74', '#FDE047', '#86EFAC', '#67E8F9',
    '#93C5FD', '#A5B4FC', '#C4B5FD', '#F472B6', '#F0ABFC'
  ],
  neon: [
    '#FF0055', '#00FFCC', '#FFCC00', '#9900FF', '#00FF66',
    '#FF6600', '#00CCFF', '#FF00CC', '#CCFF00', '#00FFAA'
  ]
};

export function getSegmentColor(index: number, total: number, themeKey: keyof typeof THEMES = 'vibrant'): string {
  const palette = THEMES[themeKey] || THEMES.vibrant;
  return palette[index % palette.length];
}
