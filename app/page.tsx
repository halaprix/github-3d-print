"use client";

import { useState } from 'react';
import { Viewer } from '@/components/Viewer';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [data, setData] = useState<number[][] | null>(null);
  const [profile, setProfile] = useState<{ name: string; login: string; avatarUrl: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/github?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`);
      }
      const json = await res.json();
      setData(json.grid as number[][]);
      setProfile(json.profile ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ display: 'grid', gap: 20, flex: 1 }}>
      <section className="card">
        <div className="card-header">
          <div>
            <div className="title">GitHub Contributions 3D Printer</div>
            <div className="subtitle">Turn your GitHub heatmap into a 3D-printable skyline</div>
          </div>
          <span className="pill">STL Export</span>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div className="toolbar">
            <input
              className="input"
              placeholder="github username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button className={`button ${loading ? 'loading' : ''}`} onClick={handleFetch} disabled={!username || loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Fetching' : 'Fetch'}
            </button>
            {error && <span style={{ color: 'crimson' }}>{error}</span>}
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
            <Viewer grid={data} label={profile ? `${profile.name} (@${profile.login})` : undefined} />
          ) : (
            <div className="muted">Enter a username and click Fetch to render the model.</div>
          )}
        </div>
      </section>
    </main>
  );
}
