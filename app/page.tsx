"use client";

import { Suspense, useEffect, useState } from 'react';
import { nftConfig } from '@/lib/nftConfig';
import { getOpenSeaAssetUrl, getOpenSeaCollectionUrl } from '@/lib/opensea';
import { GlassmorphicNav } from '@/components/glassmorphic-nav';

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
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/bggg.jpg)",
        }}
      />

      {/* Glassmorphic Navigation in Top Left */}
      <div className="fixed top-6 left-6 z-50">
        <GlassmorphicNav />
      </div>

      {/* Recent NFTs Section */}
      {latest.length > 0 && (
        <div className="relative z-10 pt-32">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="glass-bg glass-border glass-shadow p-8 mb-8">
                <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Mozilla Headline, sans-serif' }}>
                  Recent <span style={{ 
                    background: 'linear-gradient(135deg, #ff2db3, #8a2be2)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    GridGit NFTs
                  </span>
                </h2>
                <p className="text-white/70 max-w-2xl mx-auto text-lg">
                  Explore the latest NFTs minted by developers from their GitHub activity
                </p>
              </div>
            </div>
            
            {/* NFT Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {latest.map((item, i) => (
                <div key={i} className="group">
                  <div className="glass-bg glass-border glass-shadow overflow-hidden hover:scale-105 transition-all duration-300">
                    <div className="aspect-square">
                      {previews[item.id.toString()] ? (
                        <a href={getOpenSeaAssetUrl(item.id.toString())} target="_blank" rel="noreferrer">
                          <img 
                            alt={`Token ${item.id.toString()}`} 
                            src={previews[item.id.toString()]} 
                            className="w-full h-full object-cover" 
                          />
                        </a>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/20">
                          <MiniSvg seed={i} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-white font-semibold text-sm mb-1">#{item.id.toString()}</div>
                      <div className="text-white/60 text-xs">GridGit NFT</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <div className="glass-bg glass-border glass-shadow p-8 inline-block">
                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Mozilla Headline, sans-serif' }}>
                  Ready to Create Your Own?
                </h3>
                <p className="text-white/70 mb-6 max-w-md mx-auto">
                  Transform your GitHub contributions into a unique, on-chain NFT
                </p>
                <a href="/studio" className="tt-button btn-primary">
                  <div className="btn-content">🚀 Start Creating</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="relative z-10 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-bg glass-border glass-shadow p-6 text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Mozilla Headline, sans-serif' }}>
                Deterministic Generation
              </h3>
              <p className="text-white/70">
                Your NFT is uniquely generated from your GitHub username and contribution period
              </p>
            </div>
            
            <div className="glass-bg glass-border glass-shadow p-6 text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Mozilla Headline, sans-serif' }}>
                Fully On-Chain
              </h3>
              <p className="text-white/70">
                SVG images are rendered directly on the blockchain for true decentralization
              </p>
            </div>
            
            <div className="glass-bg glass-border glass-shadow p-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Mozilla Headline, sans-serif' }}>
                Instant Preview
              </h3>
              <p className="text-white/70">
                See exactly how your NFT will look before minting to the blockchain
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniSvg({ seed }: { seed: number }) {
  const size = 120; const cell = 12; const gap = 2; const rows = 7; const cols = 7;
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
