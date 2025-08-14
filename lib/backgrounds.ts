export type BackgroundTheme = { id: number; name: string; type: 'solid' | 'gradient' | 'pattern'; value: string };

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 0, name: 'Deep Space', type: 'solid', value: '#0a0f1a' },
  { id: 1, name: 'Midnight Blue', type: 'solid', value: '#0d1421' },
  { id: 2, name: 'Dark Forest', type: 'solid', value: '#0a1a0a' },
  { id: 3, name: 'Royal Purple', type: 'solid', value: '#1a0a1a' },
  { id: 4, name: 'Crimson Night', type: 'solid', value: '#1a0a0a' },
  { id: 5, name: 'Ocean Deep', type: 'solid', value: '#0a1a2a' },
  { id: 6, name: 'Desert Dusk', type: 'solid', value: '#2a1a0a' },
  { id: 7, name: 'Emerald Night', type: 'solid', value: '#0a2a1a' },
  { id: 8, name: 'Sunset Horizon', type: 'gradient', value: 'linear-gradient(135deg, #0a0a0f 0%, #4a0e4a 100%)' },
  { id: 9, name: 'Ocean Surface', type: 'gradient', value: 'linear-gradient(135deg, #0a1a2a 0%, #1a4a5a 100%)' },
  { id: 10, name: 'Forest Canopy', type: 'gradient', value: 'linear-gradient(135deg, #0a1a0a 0%, #1a4a1a 100%)' },
  { id: 11, name: 'Cosmic Dust', type: 'gradient', value: 'linear-gradient(135deg, #1a0a1a 0%, #4a1a4a 100%)' },
  { id: 12, name: 'Aurora Sky', type: 'gradient', value: 'linear-gradient(135deg, #06121e 0%, #2bd1ff 100%)' },
  { id: 13, name: 'Volcanic Core', type: 'gradient', value: 'linear-gradient(135deg, #0a0a0a 0%, #7a1e03 100%)' },
  { id: 14, name: 'Neon Grid', type: 'pattern', value: 'radial-gradient(circle at 25% 25%, #0a0f1a 0%, #00E5FF 100%)' },
  { id: 15, name: 'Starry Night', type: 'pattern', value: 'radial-gradient(circle at 75% 75%, #0a0f1a 0%, #F5D300 100%)' },
];

export function getBackgroundById(id: number): BackgroundTheme | undefined {
  return BACKGROUND_THEMES.find((b) => b.id === id);
}
