export type PresetPalette = { id: number; name: string; colors: string[] };

export const PRESET_PALETTES: PresetPalette[] = [
  { id: 0, name: 'Glitchwave', colors: ['#0d0221', '#00f0ff', '#ff00e6', '#ffa600', '#f5d300'] },
  { id: 1, name: 'Earthenware', colors: ['#4a2e2a', '#8b5a00', '#cb4b16', '#e6ddcd', '#ffd700'] },
  { id: 2, name: 'Moonlit Glass', colors: ['#0a0f1a', '#268bd2', '#839496', '#b0c4de', '#ffffff'] },
  { id: 3, name: 'Solarized Night', colors: ['#002b36', '#268bd2', '#2aa198', '#b58900', '#cb4b16'] },
  { id: 4, name: 'Biome', colors: ['#0a1a0a', '#237a57', '#2fa08a', '#9ad1d4', '#8ef6e4'] },
  { id: 5, name: 'Magma Core', colors: ['#0a0a0a', '#3b0a0a', '#7a1e03', '#d94f04', '#ff9e00'] },
  { id: 6, name: 'Aurora', colors: ['#06121e', '#2bd1ff', '#29f19c', '#a2ff49', '#f0ff89'] },
  { id: 7, name: 'Cherry Blossom', colors: ['#1a0f1a', '#8b4a5a', '#d47b8b', '#ffb3c7', '#ffffff'] },
  { id: 8, name: 'Gold Standard', colors: ['#1a0f00', '#4a3000', '#8b5a00', '#d4af37', '#ffd700'] },
  { id: 9, name: 'Periwinkle Haze', colors: ['#0a0f1a', '#6667ab', '#9394c2', '#c0c0d9', '#e1bee7'] },
  { id: 10, name: 'Red Alert', colors: ['#0a0a0a', '#7a0019', '#b20025', '#ff1040', '#ff8a9f'] },
  { id: 11, name: 'Mint Condition', colors: ['#0b1724', '#39a0a3', '#5bd1b3', '#8ef6e4', '#ffffff'] },
  { id: 12, name: 'Frog Pond', colors: ['#0a1a0a', '#2f4d2f', '#4a7a4a', '#66a166', '#90c290'] },
  { id: 13, name: 'Marigold Punch', colors: ['#2a1a0a', '#ac3a00', '#dd4a00', '#ff9e00', '#ffc40c'] },
  { id: 14, name: 'Icy Veins', colors: ['#0d1421', '#a2d2ff', '#bde0fe', '#e0f2fe', '#ffffff'] },
  { id: 15, name: 'Cosmic Dust', colors: ['#1a0a1a', '#4a1a4a', '#9c27b0', '#e1bee7', '#ffb3c7'] },
];

export function getPresetById(id: number): PresetPalette | undefined {
  return PRESET_PALETTES.find((p) => p.id === id);
}


