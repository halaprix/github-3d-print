"use client";

import { Suspense, useEffect, useState } from 'react';
import { getOpenSeaAssetUrl } from '@/lib/opensea';
import { HorizontalNav } from '@/components/horizontal-nav';

export default function GalleryPage() {
  return (
    <Suspense fallback={null}>
      <GalleryInner />
    </Suspense>
  );
}

function GalleryInner() {
  const [profile, setProfile] = useState<{ login: string } | null>(null);
  const [items, setItems] = useState<Array<{ id: string; image: string }>>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!r.ok) return;
      const m = await r.json();
      if (m?.login) setProfile({ login: m.login });
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/nft/recent');
      if (!res.ok) return;
      const json = await res.json();
      const ids: string[] = json.tokenIds || [];
      const minted = ids.slice(0, 50);
      const metas = await Promise.all(minted.map(async (s) => {
        const r = await fetch(`/api/nft/${s}`);
        if (!r.ok) return { id: s, image: '' };
        const j = await r.json();
        return { id: s, image: j.image || '' };
      }));
      setItems(metas);
    })();
  }, []);

  return (
    <div className="tt-view">
      <HorizontalNav />
      <main style={{ paddingTop: '80px' }}>
        {/* Hero Section */}
        <header className="tt-hero gradient-top-right">
          <div className="tt-hero-intro z-1">
            <div className="tt-heading-content center gap-4">
              <h1 className="heading-xxlarge z-1">Explore <em className="bold-italic-framed">GridGit</em> NFT <em className="slim-italic">Collection</em> 🖼️</h1>
              <div className="intro-text">
                <p>Browse through all minted GridGit NFTs and discover unique contribution patterns from developers around the world.</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container">
          {/* Gallery Grid */}
          <section className="card">
            <div className="card-header">
              <div>
                <div className="title">🎨 GridGit NFT Collection</div>
                <div className="subtitle">
                  {profile ? `@${profile.login}` : 'Sign in via Studio'}
                </div>
              </div>
            </div>
            <div className="card-body">
              {items.length > 0 ? (
                <div className="explore">
                  {items.map((it, i) => (
                    <article className="nft-card" key={i}>
                      <div className="nft-media">
                        {it.image ? (
                          <a href={getOpenSeaAssetUrl(it.id)} target="_blank" rel="noreferrer">
                            <img alt={`Token ${it.id}`} src={it.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          </a>
                        ) : (
                          <div className="animate-pulse" style={{ width:'100%', height:'100%', background: '#0b0f14' }} />
                        )}
                      </div>
                      <div className="nft-body">
                        <div className="nft-title">GridGit #{it.id}</div>
                        <div className="nft-sub">On-chain SVG</div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div className="muted" style={{ fontSize: '1.2rem', marginBottom: '12px' }}>No NFTs Found</div>
                  <div className="muted">Be the first to mint a GridGit NFT!</div>
                  <div style={{ marginTop: '20px' }}>
                    <a href="/studio" className="tt-button btn-primary">
                      <div className="btn-content">Go to Studio</div>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


