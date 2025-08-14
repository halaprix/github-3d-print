"use client";

import { Suspense, useEffect, useState } from 'react';
import { getOpenSeaAssetUrl } from '@/lib/opensea';
import { GlassmorphicNav } from '@/components/glassmorphic-nav';

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
		<div className="min-h-screen relative">
			{/* Glassmorphic Navigation in Top Left - Floating Overlay */}
			<div className="fixed top-6 left-6 z-50">
				<GlassmorphicNav />
			</div>

			<main className="tt-view" style={{ paddingLeft: '24rem' }}>
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
								<em className="bold-italic-framed">NFT Gallery</em>&nbsp;
								<em className="slim-italic">Explore</em> 🖼️
							</h1>
							<div className="intro-text mt-0">
								Browse through all minted GridGit NFTs and discover unique contribution patterns from developers around the world.
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<div className="container" style={{ display: 'grid', gap: 24 }}>
					<section className="card">
						<div className="card-header">
							<div className="title">GridGit NFT Collection</div>
							{profile ? (
								<span className="pill">@{profile.login}</span>
							) : (
								<span className="pill">Sign in via Studio</span>
							)}
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


