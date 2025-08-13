"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Viewer } from '@/components/Viewer';

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

  return (
    <main className="container" style={{ display: 'grid', gap: 24, flex: 1 }}>
      <section className="card">
        <div className="card-header">
          <div style={{ display:'grid', gap:6 }}>
            <div className="title">Proof of Work Squares</div>
            <div className="subtitle">Mint deterministic on-chain SVGs from your GitHub heatmap</div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <a href="/secret" className="button">Open Studio →</a>
            <a href="https://opensea.io/" target="_blank" rel="noreferrer" className="pill" style={{ textDecoration:'none' }}>View Collection</a>
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div className="toolbar" style={{ justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input className="input" placeholder="github username" value={username} onChange={(e) => setUsername(e.target.value)} />
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
