"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
import { deriveParams, quantizeToNibbles, encodeTokenIdFromComponents, buildGridSvg } from '@/lib/nftRender';
import { useSearchParams } from 'next/navigation';

type Palette = { id: number; name: string; colors: string[] };

export default function TestStudioPage() {
  return (
    <Suspense fallback={null}>
      <TestStudioInner />
    </Suspense>
  );
}

function TestStudioInner() {
  const sp = useSearchParams();
  const [user, setUser] = useState(sp.get('user') || '');
  const [grid, setGrid] = useState<number[][] | null>(null);
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
    const res = await fetch(`/api/github/${encodeURIComponent(u)}`);
    if (!res.ok) {
      setFetchError('User not found');
      return;
    }
    const json = await res.json();
    const full = json.grid as number[][];
    const cols = full[0]?.length ?? 0;
    const weekStart: string[] = json.weekStartDates || [];
    const weekEnd: string[] = json.weekEndDates || [];
    if (Array.isArray(full) && cols >= 7) {
      const startIndex = 0;
      const endIndex = startIndex + 6;
      const seven = full.map((row) => row.slice(startIndex, endIndex + 1)).slice(0, 7);
      setGrid(seven);
      const startDate = weekStart[endIndex] || null;
      const endDate = weekEnd[startIndex] || null;
      if (startDate && endDate) setPeriod({ start: startDate, end: endDate });
    }
  }

  function shiftPeriod(direction: -1 | 1) {
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
      const currentStartIndex = weekStart.findIndex((d: string) => d === period?.start);
      let i = currentStartIndex >= 0 ? currentStartIndex - 6 : 0;
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

  const svg = useMemo(() => {
    if (!grid) return '';
    const d = deriveParams(user, period);
    const palette = LIB_PRESETS[d.presetIndex]?.colors ?? LIB_PRESETS[0].colors;
    const nibbles = quantizeToNibbles(grid);
    return buildGridSvg(nibbles, palette, d.shapeIndex);
  }, [grid, user, period]);

  const tokenId = useMemo(() => {
    if (!grid || !user) return null as null | bigint;
    const d = deriveParams(user, period);
    const nibbles = quantizeToNibbles(grid);
    return encodeTokenIdFromComponents(nibbles, d.shapeIndex, d.presetIndex, d.contextHash);
  }, [grid, user, period]);
  const tokenHex = tokenId != null ? `0x${tokenId.toString(16)}` : '';
  const tokenDec = tokenId != null ? tokenId.toString(10) : '';

  return (
    <main className="container" style={{ display: 'grid', gap: 16 }}>
      <section className="card">
        <div className="card-header">
          <div className="title">Test Studio</div>
          <span className="pill">Preview only</span>
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
          </div>
          <div className="muted">NFT ID: {tokenHex || '—'} {tokenId != null ? `(${tokenDec})` : ''}</div>
          <div className="muted">Minting is disabled here. Use Studio to mint.</div>
          {period && (<div className="muted">Period: {period.start} → {period.end}</div>)}
        </div>
      </section>
      <section className="card">
        <div className="card-body" style={{ overflow: 'auto' }}>
          {svg ? (
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="muted">Enter a user and fetch to preview</div>
          )}
        </div>
      </section>
    </main>
  );
}


