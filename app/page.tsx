"use client";

import { Suspense, useEffect, useState } from 'react';
import { nftConfig } from '@/lib/nftConfig';
import { getOpenSeaAssetUrl, getOpenSeaCollectionUrl } from '@/lib/opensea';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [latest, setLatest] = useState<Array<{ id: bigint }>>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/nft/recent');
        if (!res.ok) return;
        const json = await res.json();
        const ids: string[] = json.tokenIds || [];
        const minted = ids.slice(0, 24).map((s) => ({ id: BigInt(s) }));
        setLatest(minted);
        const metas = await Promise.all(minted.map(async (m) => {
          const r = await fetch(`/api/nft/${m.id.toString()}`);
          if (!r.ok) return [m.id.toString(), ''] as const;
          const j = await r.json();
          return [m.id.toString(), j.image || ''] as const;
        }));
        const map: Record<string, string> = {};
        for (const [k, v] of metas) if (v) map[k] = v;
        setPreviews(map);
      } catch {/* ignore */}
    })();
  }, []);

  return (
    <main className="container" style={{ display: 'grid', gap: 28, flex: 1 }}>
      {/* Hero */}
      <section className="card">
        <div className="card-header">
          <div style={{ display:'grid', gap:6 }}>
            <div className="title">GridGit</div>
            <div className="subtitle">On-chain squares from your GitHub activity</div>
          </div>
          <div />
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          <div className="muted" style={{ lineHeight: 1.5 }}>
            GridGit encodes your last 7 weeks of GitHub contributions into a 7×7 grid. Shape and palette are derived deterministically from your username and period. The SVG is rendered fully on-chain; token ID encodes the grid, shape and palette. Connect your wallet above and mint in the Studio.
          </div>
          <div>
            <a href="/studio" className="button" style={{ background:'linear-gradient(180deg,#ff2db3,#8a2be2)', borderColor:'#6e14bf' }}>Mint your GridGit →</a>
          </div>
        </div>
      </section>

      {/* Explore grid */}
      <section className="card">
        <div className="card-body" style={{ display:'grid', gap:16 }}>
          <div className="explore">
            {(latest.length ? latest : Array.from({ length: 12 }, (_, i) => ({ id: BigInt(i+1) }))).map((item, i) => (
              <article className="nft-card" key={i}>
                <div className="nft-media">
                  {latest.length && previews[item.id.toString()] ? (
                    <a href={getOpenSeaAssetUrl(item.id.toString())} target="_blank" rel="noreferrer">
                      <img alt={`Token ${item.id.toString()}`} src={previews[item.id.toString()]} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </a>
                  ) : (
                    <div className="animate-pulse" style={{ width:'100%', height:'100%', display:'grid', placeItems:'center' }}>
                      <MiniSvg seed={i} />
                    </div>
                  )}
                </div>
                <div className="nft-body">
                  <div className="nft-title">GridGit #{item.id.toString()}</div>
                  <div className="nft-sub">On-chain SVG</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniSvg({ seed }: { seed: number }) {
  const size = 200; const cell = 20; const gap = 3; const rows = 7; const cols = 7;
  const width = cols * cell + (cols - 1) * gap;
  const height = rows * cell + (rows - 1) * gap;
  const bg = '#0a0f1a';
  const palette = ['#0a0f1a', '#00E5FF', '#00FFA3', '#F5D300', '#FF2079'];
  const rng = mulberry32(seed + 1);
  const arr: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.floor(rng() * 16)));
  const stops = palette.slice(1);
  const colorFor = (n: number) => {
    if (n <= 0) return palette[0];
    const t = n / 15; const idx = Math.min(stops.length - 1, Math.floor(t * stops.length));
    return stops[idx];
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width={width} height={height} fill={bg} />
      {arr.map((row, y) => row.map((v, x) => {
        const vx = x * (cell + gap); const vy = y * (cell + gap);
        const r = Math.max(1, cell/2 - Math.floor(cell*0.12));
        return <circle key={`${x}-${y}`} cx={vx + cell/2} cy={vy + cell/2} r={r} fill={colorFor(v)} />;
      }))}
    </svg>
  );
}

function mulberry32(a: number) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
