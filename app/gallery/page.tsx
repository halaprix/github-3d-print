"use client";

import { Suspense, useEffect, useState } from 'react';
import { getOpenSeaAssetUrl } from '@/lib/opensea';

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
		<main className="container" style={{ display: 'grid', gap: 16 }}>
			<section className="card">
				<div className="card-header">
					<div className="title">My Gallery</div>
					{profile ? (<span className="pill">@{profile.login}</span>) : (<span className="pill">Sign in via Studio</span>)}
				</div>
				<div className="card-body">
					<div className="explore">
						{items.map((it, i) => (
							<article className="nft-card" key={i}>
								<div className="nft-media">
									{it.image ? (
										<a href={getOpenSeaAssetUrl(it.id)} target="_blank" rel="noreferrer">
											<img alt={`Token ${it.id}`} src={it.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
										</a>
									) : (
										<div className="animate-pulse" style={{ width:'100%', height:'100%' }} />
									)}
								</div>
								<div className="nft-body">
									<div className="nft-title">GridGit #{it.id}</div>
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


