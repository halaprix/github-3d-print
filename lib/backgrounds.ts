export type BackgroundTheme = {
  id: number;
  name: string;
  type: 'solid' | 'gradient' | 'pattern' | 'svg';
  value: string;
  svgDefs?: string;
  svgFill?: string;
  svgFilter?: string;
  baseColor?: string;
};

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 0, name: 'Deep Space', type: 'solid', value: '#0a0f1a' },
  {
    id: 1,
    name: 'Earth Tones',
    type: 'svg',
    value: 'linear-gradient',
    svgDefs: `<linearGradient id="bgGrad1" x1="0%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#3d2c22"/><stop offset="70%" stop-color="#0a0f1a"/></linearGradient>`,
    svgFill: `fill="url(#bgGrad1)"`
  },
  {
    id: 2,
    name: 'Organic Earth',
    type: 'svg',
    value: 'radial-gradient',
    svgDefs: `<radialGradient id="bgGrad2" cx="50%" cy="100%" r="100%" fx="50%" fy="100%"><stop offset="0%" stop-color="#4a2e2a"/><stop offset="100%" stop-color="#0a1a0a"/></radialGradient>`,
    svgFill: `fill="url(#bgGrad2)"`
  },
  {
    id: 3,
    name: 'Icy Glitch',
    type: 'svg',
    value: 'pattern',
    svgDefs: `<pattern id="bgPat3" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)"><line x1="0" y1="10" x2="20" y2="10" stroke="#a2d2ff" stroke-width="10"/></pattern>`,
    svgFill: `fill="url(#bgPat3)"`,
    baseColor: '#0a0f1a'
  },
  {
    id: 4,
    name: 'Glassmorphic',
    type: 'svg',
    value: 'overlay',
    svgDefs: `<linearGradient id="bgGrad4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(176, 196, 222, 0.1)"/><stop offset="100%" stop-color="rgba(176, 196, 222, 0.0)"/></linearGradient>`,
    svgFill: `fill="#0a0f1a"`,
    baseColor: '#0a0f1a'
  },
  {
    id: 5,
    name: 'Biome Grid',
    type: 'svg',
    value: 'pattern',
    svgDefs: `<pattern id="bgPat5" patternUnits="userSpaceOnUse" width="800" height="800"><circle cx="70" cy="70" r="35" fill="#0a2a1a"/><circle cx="630" cy="630" r="35" fill="#0a2a1a"/></pattern>`,
    svgFill: `fill="url(#bgPat5)"`,
    baseColor: '#0a1a0a'
  },
  {
    id: 6,
    name: 'Oceanic Depths',
    type: 'svg',
    value: 'linear-gradient',
    svgDefs: `<linearGradient id="bgGrad7" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#1b4b5a"/><stop offset="100%" stop-color="#0a2a1a"/></linearGradient>`,
    svgFill: `fill="url(#bgGrad7)"`
  },
  {
    id: 7,
    name: 'Periwinkle Dream',
    type: 'svg',
    value: 'linear-gradient',
    svgDefs: `<linearGradient id="bgGrad11" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6667ab"/><stop offset="75%" stop-color="#0a1a2a"/></linearGradient>`,
    svgFill: `fill="url(#bgGrad11)"`
  },
  {
    id: 8,
    name: 'Golden Mesh',
    type: 'svg',
    value: 'pattern',
    svgDefs: `<pattern id="bgPat12" patternUnits="userSpaceOnUse" width="800" height="800">${Array.from({length: 100}, (_, i) => `<line x1="400" y1="400" x2="800" y2="400" stroke="#ffd800" stroke-width="1" transform="rotate(${i*5}, 400, 400)"/>`).join('')}</pattern>`,
    svgFill: `fill="url(#bgPat12)"`,
    baseColor: '#1a0f00'
  },
  {
    id: 9,
    name: 'Frog Green Strata',
    type: 'svg',
    value: 'overlay',
    svgDefs: `<linearGradient id="bgGrad13" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(60, 120, 60, 0.4)"/><stop offset="100%" stop-color="transparent"/></linearGradient>`,
    svgFill: `fill="#0a1a0a"`,
    baseColor: '#0a1a0a'
  },
  {
    id: 10,
    name: 'Crimson Vortex',
    type: 'svg',
    value: 'radial-gradient',
    svgDefs: `<radialGradient id="bgGrad6" cx="50%" cy="50%" r="75%"><stop offset="0%" stop-color="#7a0019"/><stop offset="50%" stop-color="#0a0f1a"/><stop offset="100%" stop-color="#7a0019"/></radialGradient>`,
    svgFill: `fill="url(#bgGrad6)"`
  },

  {
    id: 11,
    name: 'Cyber Stripes',
    type: 'svg',                                                                                                        
    value: 'pattern',
    svgDefs: `<pattern id="bgPat8" patternUnits="userSpaceOnUse" width="22" height="22"><rect width="20" height="22" fill="#0d0221"/><rect x="20" width="2" height="22" fill="#ff00e6"/></pattern>`,
    svgFill: `fill="url(#bgPat8)"`
  },
  {
    id: 12,
    name: 'Quantum Noise',
    type: 'svg',
    value: 'filter',
    svgDefs: `<filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter>`,
    svgFill: `fill="#0a0f1a"`,
    svgFilter: `<rect x="0" y="0" width="800" height="800" fill="#0a0f1a" filter="url(#noise)" style="opacity:0.1"/>`
  },
  {
        id: 13,
    name: 'Rose Dawn',
    type: 'svg',
    value: 'radial-gradient',
    svgDefs: `<radialGradient id="bgGrad10" cx="50%" cy="0%" r="80%"><stop offset="0%" stop-color="#d47b8b"/><stop offset="100%" stop-color="#1a0f1a"/></radialGradient>`,
    svgFill: `fill="url(#bgGrad10)"`
  },

  {
    id: 14,
    name: 'Marigold Horizon',
    type: 'svg',
    value: 'radial-gradient',
    svgDefs: `<radialGradient id="bgGrad14" cx="90%" cy="10%" r="60%"><stop offset="0%" stop-color="#ffc40c"/><stop offset="100%" stop-color="#2a1a0a"/></radialGradient>`,
    svgFill: `fill="url(#bgGrad14)"`
  },
  {
    id: 15,
    name: 'Light Rays',
    type: 'svg',
    value: 'pattern',
    svgDefs: `<pattern id="bgPat15" patternUnits="userSpaceOnUse" width="800" height="800"><rect x="693" y="0" width="7" height="800" fill="rgba(255,255,255,0.1)"/></pattern>`,
    svgFill: `fill="url(#bgPat15)"`
  },
];

export function getBackgroundById(id: number): BackgroundTheme | undefined {
  return BACKGROUND_THEMES.find((b) => b.id === id);
}
