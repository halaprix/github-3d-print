"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Viewer } from '@/components/Viewer';
import { nftConfig } from '@/lib/nftConfig';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [data, setData] = useState<number[][] | null>(null);
  const [shortData, setShortData] = useState<number[][] | null>(null);
  const [activeTab, setActiveTab] = useState<'full' | '7day'>('full');
  const [profile, setProfile] = useState<{ name: string; login: string; avatarUrl: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<Array<{ id: bigint }>>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  async function fetchFor(name: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/github/${encodeURIComponent(name)}`);
      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`);
      }
      const json = await res.json();
      const full = json.grid as number[][];
      setData(full);
      // Build 7x7 from last 7 columns and 7 rows only (Mon..Sun as provided order)
      const cols = full[0]?.length ?? 0;
      if (cols >= 7) {
        const slice = full.map((row) => row.slice(cols - 7, cols)).slice(0, 7);
        setShortData(slice);
      } else {
        setShortData(null);
      }
      setProfile(json.profile ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetch() {
    if (!username) return;
    await fetchFor(username);
  }

  useEffect(() => {
    const prefill = searchParams.get('user');
    if (prefill && !data && !loading) {
      setUsername(prefill);
      fetchFor(prefill);
    }
  }, [searchParams]);

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
            <div className="title">Explore</div>
            <div className="subtitle">On-chain squares from GitHub activity</div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <a href="/secret" className="button">Open Studio →</a>
            <a href="https://opensea.io/" target="_blank" rel="noreferrer" className="pill" style={{ textDecoration:'none' }}>View Collection</a>
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div className="toolbar" style={{ justifyContent:'space-between', flexWrap:'wrap' as const }}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input className="input" placeholder="preview a github username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <button className={`button ${loading ? 'loading' : ''}`} onClick={handleFetch} disabled={!username || loading}>
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Fetching' : 'Preview'}
              </button>
              {error && <span style={{ color: 'crimson' }}>{error}</span>}
            </div>
            <a href="/secret" className="button" style={{ background:'linear-gradient(180deg,#ff2db3,#8a2be2)', borderColor:'#6e14bf' }}>Mint →</a>
          </div>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={profile.avatarUrl} alt={profile.login} width={40} height={40} style={{ borderRadius: '50%' }} />
              <a href={profile.url} target="_blank" rel="noreferrer" style={{ color: '#e3eefc' }}>
                {profile.name} (@{profile.login})
              </a>
            </div>
          )}
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
                    <img alt={`Token ${item.id.toString()}`} src={previews[item.id.toString()]} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  ) : (
                    <MiniSvg seed={i} />
                  )}
                </div>
                <div className="nft-body">
                  <div className="nft-title">GitHub 3D Print #{item.id.toString()}</div>
                  <div className="nft-sub">On-chain SVG</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Live preview */}
      <section className="card">
        <div className="card-body">
          {data ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="tabs">
                <button className={`tab ${activeTab === 'full' ? 'active' : ''}`} onClick={() => setActiveTab('full')}>Full view</button>
                <button className={`tab ${activeTab === '7day' ? 'active' : ''}`} onClick={() => setActiveTab('7day')}>Last 7 weeks</button>
              </div>
              {activeTab === 'full' && (
                <Viewer grid={data} label={profile ? `${profile.name} (@${profile.login})` : undefined} mode="full" />
              )}
              {activeTab === '7day' && shortData && (
                <Viewer grid={shortData} label={profile ? `${profile.name} (@${profile.login})` : undefined} mode="compact" />
              )}
            </div>
          ) : (
            <div className="muted">Enter a username and click Preview to render the model. Or jump straight to the Studio.</div>
          )}
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
