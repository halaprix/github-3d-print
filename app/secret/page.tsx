"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { createWalletClient, custom, getContract, http, parseAbi } from 'viem';
import { nftConfig } from '@/lib/nftConfig';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
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

function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function deriveParams(user: string, period: { start: string; end: string } | null): { shapeIndex: number; presetIndex: number; contextHash: number } {
  const key = `${user || ''}|${period?.start || ''}|${period?.end || ''}`;
  const hash = fnv1a32(key);
  const shapeIndex = hash & 0x7; // 0..7
  const presetIndex = (hash >>> 3) % Math.max(1, LIB_PRESETS.length);
  return { shapeIndex, presetIndex, contextHash: hash };
}

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
  const [preset, setPreset] = useState<string>('neon-city');
  const [shape, setShape] = useState<'rounded' | 'pixel' | 'circle' | 'diamond' | 'hex' | 'triangle'>('rounded');
  const [derived, setDerived] = useState<{ shapeIndex: number; presetIndex: number; contextHash: number } | null>(null);
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
  function onPresetChange(_id: string) { /* locked by user-period */ }

  const nftId = useMemo(() => {
    if (!grid) return '';
    // Lock shape and preset from user+period
    const d = deriveParams(user, period);
    setDerived(d);
    const lockedPreset = LIB_PRESETS[d.presetIndex]?.colors || LIB_PRESETS[0].colors;
    if (palette.join(',') !== lockedPreset.join(',')) setPalette(lockedPreset);
    const shapeNames: Array<typeof shape> = ['rounded','pixel','circle','diamond','hex','triangle'];
    const lockedShape = shapeNames[d.shapeIndex] ?? 'rounded';
    if (shape !== lockedShape) setShape(lockedShape);
    // Encode 7x7 intensities (normalize to 0..15) -> 49 nibbles => bits 0..195
    let id = 0n;
    const rows = 7, cols = 7;
    const flat: number[] = [];
    const max = Math.max(1, ...grid.flat());
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = Math.max(0, Math.min(1, (grid[y][x] || 0) / max));
        const level = Math.max(0, Math.min(15, Math.round(t * 15)));
        flat.push(level);
      }
    }
    // pack little-endian nibbles
    for (let i = 0; i < flat.length; i++) {
      id |= BigInt(flat[i] & 0xf) << BigInt(i * 4);
    }
    // shape bits 196..198
    id |= BigInt(d.shapeIndex & 0x7) << 196n;
    // preset id 199..201
    id |= BigInt(d.presetIndex & 0x7) << 199n;
    // context hash 202..233
    id |= BigInt(d.contextHash >>> 0) << 202n;
    // version 1 in bits 234..241
    id |= 1n << 234n;
    return `0x${id.toString(16)}`;
  }, [grid, user, period]);

  const [account, setAccount] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);

  async function connectWallet() {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert('No wallet found. Install MetaMask.');
      return;
    }
    const [addr] = await eth.request({ method: 'eth_requestAccounts' });
    setAccount(addr);
  }

  async function mint() {
    try {
      const eth = (window as any).ethereum;
      if (!eth) return alert('No wallet');
      setMinting(true);
      setTxHash(null);
      const client = createWalletClient({
        chain: {
          id: nftConfig.chain.id,
          name: nftConfig.chain.name,
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: [nftConfig.chain.rpcUrl] } }
        } as any,
        transport: custom(eth)
      });
      const [from] = await client.requestAddresses();
      // Optional: enforce chain id to prevent accidental wrong-network mints
      // const current = await client.getChainId(); if (current !== nftConfig.chain.id) throw new Error('Wrong network');
      const abi = parseAbi([
        'function publicMintDeterministic(uint256 tokenId) public returns (uint256)'
      ]);
      const contract = getContract({ address: nftConfig.contractAddress as `0x${string}` , abi, client });
      const hash = await contract.write.publicMintDeterministic([BigInt(nftId)], { account: from, chain: client.chain });
      setTxHash(hash);
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setMinting(false);
    }
  }

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
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' as const }}>
            <button className="button" onClick={connectWallet} disabled={!!account}>{account ? `Connected: ${account.slice(0,6)}…${account.slice(-4)}` : 'Connect Wallet'}</button>
            <button className="button" onClick={mint} disabled={!account || minting || !grid}>{minting ? 'Minting…' : 'Mint NFT'}</button>
            {txHash && (
              <a className="button ghost" href={`${nftConfig.chain.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">View Tx</a>
            )}
          </div>
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
