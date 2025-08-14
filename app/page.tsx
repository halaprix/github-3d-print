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
    <main className="tt-view">
      {/* Hero Section */}
      <header className="tt-hero gradient-top-right">
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
              Build <em className="bold-italic-framed">GridGit</em> nfts&nbsp;
              <em className="slim-italic">daily</em> 🚀 
            </h1>
            <div className="intro-text mt-0">
              GridGit encodes your last 7 weeks of GitHub contributions into a 7×7 grid. 
              Shape and palette are derived deterministically from your username and period. 
              The SVG is rendered fully on-chain; token ID encodes the grid, shape and palette.
            </div>
            <div className="tt-button-group mt-0">
              <a href="/studio" className="tt-button btn-primary btn-arrow">
                <div className="btn-content">Mint your GridGit</div>
                <div className="btn-primary-arrow">
                  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7.38197L15.4495 7.10674L15.4484 7.10617L15.4455 7.10464L15.4188 7.09062C15.393 7.07688 15.3516 7.05438 15.2965 7.02295C15.1862 6.96006 15.0213 6.86173 14.8166 6.72686C14.4066 6.45661 13.8417 6.0427 13.2383 5.47699C12.029 4.34323 10.6931 2.62752 10.1006 0.257465L8.16032 0.742531C8.87215 3.58987 10.4711 5.62416 11.8704 6.93606C11.8933 6.95756 11.9162 6.97887 11.9391 7H0V9H11.9391C11.9162 9.02112 11.8933 9.04244 11.8704 9.06394C10.4711 10.3758 8.87215 12.4101 8.16032 15.2575L10.1006 15.7425C10.6931 13.3725 12.029 11.6568 13.2383 10.523C13.8417 9.9573 14.4066 9.54339 14.8166 9.27313C15.0213 9.13826 15.1862 9.03994 15.2965 8.97705C15.3516 8.94562 15.393 8.92311 15.4188 8.90937L15.4455 8.89535L15.4484 8.89383L15.4495 8.89326L16 8.61803V7.38197Z" fill="currentColor"></path>
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Animated Marquee Section */}
      <section className="tt-marquee-section">
        <div className="tt-marquee-group">
          <div className="tt-marquee-slider marquee-right-speed-2">
            <div className="marquee-text">Everyday something new</div>
            <div className="marquee-text is-outline-dark">Everyday something new</div>
            <div className="marquee-text">Everyday something new</div>
            <div className="marquee-text is-outline-dark">Everyday something new</div>
            <div className="marquee-text">Everyday something new</div>
            <div className="marquee-text is-outline-dark">Everyday something new</div>
            <div className="marquee-text">Everyday something new</div>
            <div className="marquee-text is-outline-dark">Everyday something new</div>
            <div className="marquee-text">Everyday something new</div>
            <div className="marquee-text is-outline-dark">Everyday something new</div>
          </div>
        </div>
        <div className="tt-marquee-group">
          <div className="tt-marquee-slider marquee-left-speed-1">
            <div className="marquee-text">GridGit</div>
            <div className="marquee-text is-outline-dark">GitGrid</div>
            <div className="marquee-text">GridGit</div>
            <div className="marquee-text is-outline-dark">GitGrid</div>
            <div className="marquee-text is-outline-dark">GitGrid</div>
            <div className="marquee-text">GridGit</div>
            <div className="marquee-text is-outline-dark">GitGrid</div>
            <div className="marquee-text">GridGit</div>
          </div>
        </div>
        <div className="tt-marquee-group">
          <div className="tt-marquee-slider marquee-right-speed-1">
            <div className="marquee-text">Colors are nice</div>
            <div className="marquee-text is-outline-dark">Colors are nice</div>
            <div className="marquee-text">Colors are nice</div>
            <div className="marquee-text is-outline-dark">Colors are nice</div>
            <div className="marquee-text">Colors are nice</div>
            <div className="marquee-text is-outline-dark">Colors are nice</div>
            <div className="marquee-text">Colors are nice</div>
          </div>
        </div>
        <div className="tt-marquee-group">
          <div className="tt-marquee-slider marquee-left-speed-1">
            <div className="marquee-text">Shapes are nice to have</div>
            <div className="marquee-text is-outline-dark">Shapes are nice to have</div>
            <div className="marquee-text">Shapes are nice to have</div>
            <div className="marquee-text is-outline-dark">Shapes are nice to have</div>
            <div className="marquee-text">Shapes are nice to have</div>
            <div className="marquee-text is-outline-dark">Shapes are nice to have</div>
          </div>
        </div>
        <div className="tt-marquee-group">
          <div className="tt-marquee-slider marquee-right-speed-2">
            <div className="marquee-text">Cloud or On premises</div>
            <div className="marquee-text is-outline-dark">Cloud or On premises</div>
            <div className="marquee-text">Cloud or On premises</div>
            <div className="marquee-text is-outline-dark">Cloud or On premises</div>
            <div className="marquee-text">Cloud or On premises</div>
            <div className="marquee-text is-outline-dark">Cloud or On premises</div>
            <div className="marquee-text">Cloud or On premises</div>
            <div className="marquee-text is-outline-dark">Cloud or On premises</div>
            <div className="marquee-text">Cloud or On premises</div>
            <div className="marquee-text is-outline-dark">Cloud or On premises</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="tt-section pb-12 pt-0">
        <div className="tt-heading-content center">
          <div className="tt-heading-group centered">
            <p className="intro-text mt-0">GridGit Suite</p>
            <h2 className="heading-xlarge">Create your NFT<strong className="headline-decoration">with the features you want</strong></h2>
          </div>
          <div className="intro-text">
            <p>GridGit is the headless and open source NFT framework. Integrate GitHub data, deterministic generation, and on-chain rendering to create the UX you want.</p>
          </div>
        </div>
      </section>

      {/* Explore Grid Section */}
      <section className="container">
        <div className="card">
          <div className="card-header">
            <div style={{ display:'grid', gap:6 }}>
              <div className="title">Explore GridGit NFTs</div>
              <div className="subtitle">On-chain squares from GitHub activity</div>
            </div>
          </div>
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
