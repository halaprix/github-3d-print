"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
import { deriveParams, quantizeToNibbles, encodeTokenIdFromComponents, buildGridSvg } from '@/lib/nftRender';
import { useSearchParams } from 'next/navigation';
import { GlassmorphicNav } from '@/components/glassmorphic-nav';

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
    <div className="min-h-screen relative">
      {/* Glassmorphic Navigation in Top Left - Floating Overlay */}
      <div className="fixed top-6 left-6 z-50">
        <GlassmorphicNav />
      </div>

      <main className="tt-view">
        {/* Hero Section */}
        <header className="tt-hero gradient-top-right" style={{ padding: '80px 0 60px' }}>
          <div className="tt-hero-intro">
            <div className="tt-gradient-container">
              <div className="tt-gradient-panel-unsticky">
                <div className="tt-gradient-position">
                  {/* Animated gradient background */}
                </div>
              </div>
            </div>
            <div className="tt-heading-content center gap-4">
              <h1 className="heading-xxlarge z-1">
                <em className="bold-italic-framed">Test Studio</em>&nbsp;
                <em className="slim-italic">Preview Mode</em> 🧪
              </h1>
              <div className="intro-text mt-0">
                Test different GitHub users and date ranges to preview how NFTs will look before minting.
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container" style={{ display: 'grid', gap: 24 }}>
          {/* Controls Section */}
          <section className="card">
            <div className="card-header">
              <div className="title">Test Controls</div>
              <span className="pill">Preview Only</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input 
                    className="input" 
                    placeholder="Enter GitHub username" 
                    value={user} 
                    onChange={(e) => setUser(e.target.value)}
                    style={{ minWidth: '250px' }}
                  />
                  <button 
                    className="tt-button btn-primary" 
                    onClick={() => fetchUserData(user)} 
                    disabled={!user}
                  >
                    <div className="btn-content">Fetch Data</div>
                  </button>
                </div>
                {fetchError && (
                  <span style={{ color: 'crimson', textAlign: 'center', padding: '8px 16px', background: 'rgba(220,20,60,0.1)', borderRadius: '8px' }}>
                    {fetchError}
                  </span>
                )}
              </div>

              {/* Period Navigation */}
              <div style={{ display: 'grid', gap: 12, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Date Range Navigation</h3>
                  <p className="muted" style={{ margin: 0 }}>Use the arrows to shift through different time periods</p>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="tt-button btn-secondary" 
                    onClick={() => shiftPeriod(-1)}
                    style={{ padding: '12px 20px' }}
                  >
                    ← Previous Period
                  </button>
                  <div className="muted" style={{ 
                    padding: '12px 20px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '8px',
                    minWidth: '200px',
                    textAlign: 'center'
                  }}>
                    {period ? `${period.start} → ${period.end}` : 'No period selected'}
                  </div>
                  <button 
                    className="tt-button btn-secondary" 
                    onClick={() => shiftPeriod(1)}
                    style={{ padding: '12px 20px' }}
                  >
                    Next Period →
                  </button>
                </div>
              </div>

              {/* NFT ID Display */}
              <div style={{ 
                display: 'grid', 
                gap: 12, 
                padding: '20px', 
                background: 'rgba(0,229,255,0.05)', 
                borderRadius: '12px',
                border: '1px solid rgba(0,229,255,0.2)',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#00E5FF' }}>NFT Token ID</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="muted">
                    <strong>Hexadecimal:</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>{tokenHex || '—'}</code>
                  </div>
                  <div className="muted">
                    <strong>Decimal:</strong> <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>{tokenDec || '—'}</code>
                  </div>
                </div>
                <div className="muted" style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                  Minting is disabled here. Use the Studio page to mint your NFT.
                </div>
              </div>
            </div>
          </section>

          {/* NFT Preview Section */}
          <section className="card">
            <div className="card-header">
              <div className="title">NFT Preview</div>
              <span className="pill">Live Preview</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: 16 }}>
              {svg ? (
                <div style={{ display: 'grid', gap: 20, alignItems: 'center' }}>
                  <div dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'flex', justifyContent: 'center' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p className="muted" style={{ margin: '0 0 16px 0' }}>
                      This is exactly how your NFT will look when minted on the blockchain.
                    </p>
                    <a href="/studio" className="tt-button btn-primary">
                      <div className="btn-content">Go to Studio to Mint</div>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="muted" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '12px' }}>No Preview Available</div>
                  <div>Enter a GitHub username and fetch data to see the NFT preview</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


