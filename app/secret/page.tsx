"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Palette = { id: string; name: string; colors: string[] };
const PRESET_PALETTES: Palette[] = [
  { id: 'neon-city', name: 'Neon City', colors: ['#0a0f1a', '#00E5FF', '#00FFA3', '#F5D300', '#FF2079'] },
  { id: 'aurora', name: 'Aurora Borealis', colors: ['#06121e', '#2bd1ff', '#29f19c', '#a2ff49', '#f0ff89'] },
  { id: 'solarized-night', name: 'Solarized Night', colors: ['#002b36', '#268bd2', '#2aa198', '#b58900', '#cb4b16'] },
  { id: 'cyber-sunset', name: 'Cyberpunk Sunset', colors: ['#0d0221', '#00f0ff', '#ff00e6', '#ffa600', '#ff2e00'] },
  { id: 'minty-fresh', name: 'Minty Fresh', colors: ['#0b1724', '#8ef6e4', '#5bd1b3', '#39a0a3', '#45969b'] },
  { id: 'magma', name: 'Magma', colors: ['#0a0a0a', '#3b0a0a', '#7a1e03', '#d94f04', '#ff9e00'] },
  { id: 'oceanic', name: 'Oceanic', colors: ['#061826', '#1b4b5a', '#237a57', '#2fa08a', '#9ad1d4'] }
];
function defaultColors() { return PRESET_PALETTES[0].colors; }

export default function SecretStudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioInner />
    </Suspense>
  );
}

function StudioInner() {
  const sp = useSearchParams();
  const [user, setUser] = useState(sp.get('user') || '');
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [bg, setBg] = useState(sp.get('bg') || '#0a0f1a');
  const [cell, setCell] = useState(Number(sp.get('cell') || 40));
  const [gap, setGap] = useState(Number(sp.get('gap') || 6));
  const [palette, setPalette] = useState<string[]>(defaultColors());
  const [preset, setPreset] = useState<string>(PRESET_PALETTES[0].id);
  const [shape, setShape] = useState<'rounded' | 'pixel' | 'circle' | 'diamond' | 'hex' | 'triangle'>('rounded');
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    (async () => {
      const u = sp.get('user') || user;
      if (!u) return;
      const res = await fetch(`/api/github/${encodeURIComponent(u)}`);
      if (!res.ok) return;
      const json = await res.json();
      const full = json.grid as number[][];
      const cols = full[0]?.length ?? 0;
      if (cols >= 7) {
        const seven = full.map((row) => row.slice(cols - 7, cols)).slice(0, 7);
        setGrid(seven);
      }
      if (json.last7WeeksStart && json.last7WeeksEnd) {
        setPeriod({ start: json.last7WeeksStart, end: json.last7WeeksEnd });
      }
    })();
  }, [sp, user]);

  const svg = useMemo(() => {
    if (!grid) return '';
    const rows = 7, cols = 7;
    const width = cols * cell + (cols - 1) * gap;
    const height = rows * cell + (rows - 1) * gap;
    const max = Math.max(...grid.flat());
    const colorFor = (v: number) => {
      if (max <= 0) return palette[1] || '#1f6feb';
      const t = v / max;
      const stops = palette.slice(1); // ignore 0 index if it's bg
      const idx = Math.min(stops.length - 1, Math.floor(t * stops.length));
      return stops[idx] || '#1f6feb';
    };
    const shapes: string[] = [];
    const inset = Math.max(1, Math.floor(cell * 0.12));
    const draw = (vx: number, vy: number, fill: string) => {
      const cx = vx + cell / 2;
      const cy = vy + cell / 2;
      switch (shape) {
        case 'pixel':
          return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" fill="${fill}"/>`;
        case 'rounded':
          return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" rx="${Math.floor(cell * 0.22)}" ry="${Math.floor(cell * 0.22)}" fill="${fill}"/>`;
        case 'circle': {
          const r = Math.max(1, cell / 2 - inset);
          return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
        }
        case 'diamond': {
          const offset = Math.max(1, cell / 2 - inset);
          const p = [
            `${cx},${vy + inset}`,
            `${vx + cell - inset},${cy}`,
            `${cx},${vy + cell - inset}`,
            `${vx + inset},${cy}`
          ].join(' ');
          return `<polygon points="${p}" fill="${fill}"/>`;
        }
        case 'hex': {
          const r = Math.max(1, cell / 2 - inset);
          const a = 0.866025403784; // cos 30
          const p = [
            `${cx - a * r},${cy - r / 2}`,
            `${cx},${cy - r}`,
            `${cx + a * r},${cy - r / 2}`,
            `${cx + a * r},${cy + r / 2}`,
            `${cx},${cy + r}`,
            `${cx - a * r},${cy + r / 2}`
          ].join(' ');
          return `<polygon points="${p}" fill="${fill}"/>`;
        }
        case 'triangle': {
          const p = [
            `${cx},${vy + inset}`,
            `${vx + cell - inset},${vy + cell - inset}`,
            `${vx + inset},${vy + cell - inset}`
          ].join(' ');
          return `<polygon points="${p}" fill="${fill}"/>`;
        }
      }
    };
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const vx = x * (cell + gap);
        const vy = y * (cell + gap);
        const val = grid[y][x] || 0;
        const fill = val === 0 ? palette[0] : colorFor(val);
        shapes.push(draw(vx, vy, fill));
      }
    }
    return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\">\n<rect x=\"0\" y=\"0\" width=\"${width}\" height=\"${height}\" fill=\"${bg}\"/>\n${shapes.join('\n')}\n</svg>`;
  }, [grid, cell, gap, bg, palette, shape]);

  function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-7x7-${user || 'user'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updatePalette(index: number, value: string) {
    setPalette((p) => {
      const next = [...p];
      next[index] = value;
      return next;
    });
  }
  function onPresetChange(id: string) {
    setPreset(id);
    const found = PRESET_PALETTES.find((p) => p.id === id);
    if (found) setPalette(found.colors);
  }

  const nftId = useMemo(() => {
    if (!grid || !user) return '';
    const periodStr = period ? `${period.start}:${period.end}` : 'unknown';
    const paletteStr = palette.join(',');
    const shapeStr = shape;
    const raw = `${user}|${periodStr}|${paletteStr}|${shapeStr}`;
    // simple deterministic hash (FNV-1a 32-bit)
    let h = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return `0x${h.toString(16).padStart(8, '0')}`;
  }, [grid, user, period, palette, shape]);

  return (
    <main className="container" style={{ display: 'grid', gap: 16 }}>
      <section className="card">
        <div className="card-header">
          <div className="title">Secret studio</div>
          <span className="pill">SVG Export</span>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 12 }}>
          <div className="toolbar" style={{ flexWrap: 'wrap' as const }}>
            <input className="input" placeholder="github user" value={user} onChange={(e)=>setUser(e.target.value)} />
            <label className="muted">Cell
              <input className="input" type="number" value={cell} onChange={(e)=>setCell(Number(e.target.value||0))} style={{ width:100, marginLeft:8 }} />
            </label>
            <label className="muted">Gap
              <input className="input" type="number" value={gap} onChange={(e)=>setGap(Number(e.target.value||0))} style={{ width:100, marginLeft:8 }} />
            </label>
            <label className="muted">BG
              <input type="color" value={bg} onChange={(e)=>setBg(e.target.value)} style={{ width:48, height:36, background:'transparent', border:'1px solid #1b2633', borderRadius:8, marginLeft:8 }} />
            </label>
            <div className="muted" style={{ display:'flex', gap:8, alignItems:'center' }}>Palette:
              {palette.map((c, i) => (
                <input key={i} type="color" value={c} onChange={(e)=>updatePalette(i, e.target.value)} style={{ width:36, height:36, background:'transparent', border:'1px solid #1b2633', borderRadius:8 }} />
              ))}
            </div>
            <label className="muted">Preset
              <select className="input" value={preset} onChange={(e)=>onPresetChange(e.target.value)} style={{ width:200, marginLeft:8 }}>
                {PRESET_PALETTES.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="muted">Shape
              <select className="input" value={shape} onChange={(e)=>setShape(e.target.value as any)} style={{ width:180, marginLeft:8 }}>
                <option value="rounded">Rounded squares</option>
                <option value="pixel">Pixels</option>
                <option value="circle">Circles</option>
                <option value="diamond">Diamonds</option>
                <option value="hex">Hexagons</option>
                <option value="triangle">Triangles</option>
              </select>
            </label>
            <button className="button" onClick={downloadSvg}>Download SVG</button>
          </div>
          <div className="muted">NFT ID (palette + shape + user + period): {nftId}</div>
          {period && (
            <div className="muted">Period: {period.start} → {period.end}</div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-body" style={{ overflow: 'auto' }}>
          {svg ? (
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="muted">Enter a user and wait for the preview.</div>
          )}
        </div>
      </section>
    </main>
  );
}
