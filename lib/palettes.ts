export type PresetPalette = { id: number; name: string; colors: string[] };

export const PRESET_PALETTES: PresetPalette[] = [
  { id: 0, name: 'Neon City', colors: ['#0a0f1a', '#00E5FF', '#00FFA3', '#F5D300', '#FF2079'] },
  { id: 1, name: 'Aurora Borealis', colors: ['#06121e', '#2bd1ff', '#29f19c', '#a2ff49', '#f0ff89'] },
  { id: 2, name: 'Solarized Night', colors: ['#002b36', '#268bd2', '#2aa198', '#b58900', '#cb4b16'] },
  { id: 3, name: 'Cyberpunk Sunset', colors: ['#0d0221', '#00f0ff', '#ff00e6', '#ffa600', '#ff2e00'] },
  { id: 4, name: 'Minty Fresh', colors: ['#0b1724', '#8ef6e4', '#5bd1b3', '#39a0a3', '#45969b'] },
  { id: 5, name: 'Magma', colors: ['#0a0a0a', '#3b0a0a', '#7a1e03', '#d94f04', '#ff9e00'] },
  { id: 6, name: 'Oceanic', colors: ['#061826', '#1b4b5a', '#237a57', '#2fa08a', '#9ad1d4'] },
];

export function getPresetById(id: number): PresetPalette | undefined {
  return PRESET_PALETTES.find((p) => p.id === id);
}


