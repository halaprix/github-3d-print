"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
import { deriveParams, quantizeToNibbles, encodeTokenIdFromComponents, buildGridSvg } from '@/lib/nftRender';
import { useSearchParams } from 'next/navigation';
import { HorizontalNav } from '@/components/horizontal-nav';

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

  // Derive parameters once to ensure consistency between preview and token ID
  const derivedParams = useMemo(() => {
    if (!grid || !user) return null;
    return deriveParams(user, period);
  }, [grid, user, period]);

  const svg = useMemo(() => {
    if (!derivedParams) return '';
    const palette = LIB_PRESETS[derivedParams.presetIndex]?.colors ?? LIB_PRESETS[0].colors;
    const nibbles = quantizeToNibbles(grid!);
    return buildGridSvg(nibbles, palette, derivedParams.shapeIndex, derivedParams.backgroundIndex);
  }, [derivedParams, grid]);

  const tokenId = useMemo(() => {
    if (!derivedParams || !grid) return null as null | bigint;
    const nibbles = quantizeToNibbles(grid);
    return encodeTokenIdFromComponents(nibbles, derivedParams.shapeIndex, derivedParams.presetIndex, derivedParams.backgroundIndex, derivedParams.contextHash);
  }, [derivedParams, grid]);
  const tokenHex = tokenId != null ? `0x${tokenId.toString(16)}` : '';
  const tokenDec = tokenId != null ? tokenId.toString(10) : '';

  return (
    <div className="tt-view">
      <HorizontalNav />
      <main style={{ paddingTop: '80px' }}>
        {/* Hero Section */}
        <header className="tt-hero gradient-top-right">
          <div className="tt-hero-intro z-1">
            <div className="tt-heading-content center gap-4">
              <h1 className="heading-xxlarge z-1">Test Your <em className="bold-italic-framed">GitHub</em> NFT <em className="slim-italic">Preview</em> 🧪</h1>
              <div className="intro-text">
                <p>Experiment with different usernames and time periods to see how your NFT will look before minting</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container">
          {/* Input Section */}
          <section className="card">
            <div className="card-header">
              <div>
                <div className="title">🔍 Test Parameters</div>
                <div className="subtitle">Enter a GitHub username and select time period</div>
              </div>
            </div>
            <div className="card-body">
              <div className="toolbar">
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Enter GitHub username..."
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    padding: '16px 24px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '280px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>Current Period</div>
                    <div style={{ fontSize: '0.9rem', color: '#9fb3c8' }}>
                      {period ? `${period.start} → ${period.end}` : 'Loading dates...'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button 
                      className="button" 
                      onClick={() => shiftPeriod(-1)}
                      disabled={!user}
                      style={{ padding: '12px 20px' }}
                    >
                      ← Previous Week
                    </button>
                    
                    <button 
                      className="button" 
                      onClick={() => shiftPeriod(1)}
                      disabled={!user}
                      style={{ padding: '12px 20px' }}
                    >
                      Next Week →
                    </button>
                  </div>
                </div>
                <button 
                  className="button" 
                  onClick={() => fetchUserData(user)}
                  disabled={!user || !!fetchError}
                >
                  {fetchError ? <span style={{ color: 'crimson' }}>{fetchError}</span> : 'Generate Preview'}
                </button>
              </div>
              
              {derivedParams && (
                <div className="muted" style={{ marginTop: '12px', fontSize: '0.9rem' }}>
                  🔧 Preview Settings: Shape {derivedParams.shapeIndex}, Palette {derivedParams.presetIndex}, Background {derivedParams.backgroundIndex}
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <div className="muted" style={{ fontSize: '0.9rem' }}>
                  Each period shows 7 weeks of contribution data. Use arrows to navigate through time.
                </div>
              </div>
              
              {fetchError && <div className="muted" style={{ marginTop: '12px', color: 'crimson' }}>{fetchError}</div>}
            </div>
          </section>

          {/* NFT Preview */}
          {grid && grid.length > 0 && (
            <section className="card">
              <div className="card-header">
                <div>
                  <div className="title">🎨 NFT Preview</div>
                  <div className="subtitle">This is exactly how the NFT will look when minted</div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ textAlign: 'center' }}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: svg }} 
                    style={{ 
                      maxWidth: '400px', 
                      margin: '0 auto',
                      filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))'
                    }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* NFT ID Information */}
          {grid && grid.length > 0 && (
            <section className="card">
              <div className="card-header">
                <div>
                  <div className="title">🆔 NFT Identifier</div>
                  <div className="subtitle">Deterministic token ID for this configuration</div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>Hexadecimal:</div>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      {tokenHex || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>Decimal:</div>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      {tokenDec || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}


