export type PresetPalette = { id: number; name: string; colors: string[] };

export const PRESET_PALETTES: PresetPalette[] = [
  { id: 0, name: 'Neon City', colors: ['#0a0f1a', '#00E5FF', '#00FFA3', '#F5D300', '#FF2079'] },
  { id: 1, name: 'Aurora Borealis', colors: ['#06121e', '#2bd1ff', '#29f19c', '#a2ff49', '#f0ff89'] },
  { id: 2, name: 'Solarized Night', colors: ['#002b36', '#268bd2', '#2aa198', '#b58900', '#cb4b16'] },
  { id: 3, name: 'Cyberpunk Sunset', colors: ['#0d0221', '#00f0ff', '#ff00e6', '#ffa600', '#ff2e00'] },
  { id: 4, name: 'Minty Fresh', colors: ['#0b1724', '#8ef6e4', '#5bd1b3', '#39a0a3', '#45969b'] },
  { id: 5, name: 'Magma', colors: ['#0a0a0a', '#3b0a0a', '#7a1e03', '#d94f04', '#ff9e00'] },
  { id: 6, name: 'Oceanic', colors: ['#061826', '#1b4b5a', '#237a57', '#2fa08a', '#9ad1d4'] },
  { id: 7, name: 'Midnight Purple', colors: ['#0a0a0f', '#4a0e4a', '#7b1fa2', '#9c27b0', '#e1bee7'] },
  { id: 8, name: 'Golden Hour', colors: ['#1a0f00', '#4a3000', '#8b5a00', '#d4af37', '#ffd700'] },
  { id: 9, name: 'Cherry Blossom', colors: ['#1a0f1a', '#4a1a2a', '#8b4a5a', '#d47b8b', '#ffb3c7'] },
  { id: 10, name: 'Electric Blue', colors: ['#000a1a', '#001a4a', '#002a7b', '#003aac', '#004add'] },
  { id: 11, name: 'Forest Green', colors: ['#0a1a0a', '#1a4a1a', '#2a7b2a', '#3aac3a', '#4add4a'] },
  { id: 12, name: 'Sunset Orange', colors: ['#1a0a00', '#4a1a00', '#7b2a00', '#ac3a00', '#dd4a00'] },
  { id: 13, name: 'Cosmic Pink', colors: ['#1a0a1a', '#4a1a4a', '#7b2a7b', '#ac3aac', '#dd4add'] },
];

export function getPresetById(id: number): PresetPalette | undefined {
  return PRESET_PALETTES.find((p) => p.id === id);
}


