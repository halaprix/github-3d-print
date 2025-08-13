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
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [bg, setBg] = useState(sp.get('bg') || '#0a0f1a');
  const [cell, setCell] = useState(Number(sp.get('cell') || 40));
  const [gap, setGap] = useState(Number(sp.get('gap') || 6));
  const [palette, setPalette] = useState<string[]>(defaultColors());
  const [preset, setPreset] = useState<string>('neon-city');
  const [shape, setShape] = useState<'rounded' | 'pixel' | 'circle' | 'diamond' | 'hex' | 'triangle'>('rounded');
  const [derived, setDerived] = useState<{ shapeIndex: number; presetIndex: number; contextHash: number } | null>(null);
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const pre = sp.get('user');
      if (!pre || grid) return;
      await fetchUserData(pre);
    })();
  }, [sp, grid]);

  async function fetchUserData(u: string) {
    if (!u) return;
    setFetchError(null);
    let res: Response;
    try {
      res = await fetch(`/api/github/${encodeURIComponent(u)}`);
    } catch {
      setFetchStateInvalid('Network error');
      return;
    }
    if (!res.ok) {
      setFetchStateInvalid('User not found');
      return;
    }
    const json = await res.json();
    const full = json.grid as number[][];
    const cols = full[0]?.length ?? 0;
    const weekStart: string[] = json.weekStartDates || [];
    const weekEnd: string[] = json.weekEndDates || [];
    if (Array.isArray(full) && cols >= 7) {
      const startIndex = 0; // newest at 0
      const endIndex = startIndex + 6;
      const seven = full.map((row) => row.slice(startIndex, endIndex + 1)).slice(0, 7);
      setGrid(seven);
      const startDate = weekStart[endIndex] || null;
      const endDate = weekEnd[startIndex] || null;
      if (startDate && endDate) setPeriod({ start: startDate, end: endDate });
      setActiveUser(u);
      setFetchError(null);
    }
    else {
      setFetchStateInvalid('No contributions to build 7 weeks');
    }
  }

  function setFetchStateInvalid(message: string) {
    setFetchError(message);
    setGrid(null);
    setPeriod(null);
    setDerived(null);
    setActiveUser(null);
  }

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

  function shiftPeriod(direction: -1 | 1) {
    // shift by 7 columns if we have the backing full grid in URL cache; for now, ask server each time
    (async () => {
      const u = user;
      if (!u) return;
      const res = await fetch(`/api/github/${encodeURIComponent(u)}`);
      if (!res.ok) return;
      const json = await res.json();
      const full = json.grid as number[][];
      const weekStart: string[] = json.weekStartDates || [];
      const weekEnd: string[] = json.weekEndDates || [];
      const cols = full[0]?.length ?? 0;
      if (cols < 7) return;
      // find current window index
      // current window is [i..i+6] with start date = weekStart[i+6], end date = weekEnd[i]
      const currentStartIndex = weekStart.findIndex((d: string) => d === period?.start);
      // default to latest window if unknown
      let i = currentStartIndex >= 0 ? currentStartIndex - 6 : 0; // derive i from start date index
      // direction: -1 → older, +1 → newer given arrays reversed (newest at 0)
      i = i + (direction === -1 ? 1 : -1);
      i = Math.max(0, Math.min(cols - 7, i));
      const endIndex = i + 6;
      const seven = full.map((row) => row.slice(i, endIndex + 1)).slice(0, 7);
      setGrid(seven);
      const startDate = weekStart[endIndex] || null;
      const endDate = weekEnd[i] || null;
      if (startDate && endDate) setPeriod({ start: startDate, end: endDate });
    })();
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
    if (!grid || !activeUser) return '';
    // Lock shape and preset from user+period
    const d = deriveParams(activeUser, period);
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
  }, [grid, activeUser, period]);

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
            <button className="button" onClick={()=>fetchUserData(user)} disabled={!user}>Fetch</button>
            {fetchError && <span style={{ color: 'crimson' }}>{fetchError}</span>}
            <div className="muted" style={{ display:'flex', gap:8, alignItems:'center' }}>
              Period:
              <button className="button" onClick={()=>shiftPeriod(-1)}>&lt;</button>
              <span>{period ? `${period.start} → ${period.end}` : '—'}</span>
              <button className="button" onClick={()=>shiftPeriod(1)}>&gt;</button>
            </div>
            <button className="button" onClick={downloadSvg}>Download SVG</button>
          </div>
          <div className="muted">NFT ID (palette + shape + user + period): {nftId}</div>
          {activeUser && (
            <div className="muted">Locked to user: @{activeUser}</div>
          )}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' as const }}>
            <button className="button" onClick={connectWallet} disabled={!!account}>{account ? `Connected: ${account.slice(0,6)}…${account.slice(-4)}` : 'Connect Wallet'}</button>
            <button className="button" onClick={mint} disabled={!account || minting || !grid || !activeUser || user !== activeUser}>{minting ? 'Minting…' : (user !== activeUser ? 'Fetch to Mint' : 'Mint NFT')}</button>
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
