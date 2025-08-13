"use client";

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getOpenSeaAssetUrl } from '@/lib/opensea';

export default function WalletGalleryPage() {
	return (
		<Suspense fallback={null}>
			<WalletGalleryInner />
		</Suspense>
	);
}

function WalletGalleryInner() {
	const params = useParams();
	const address = String(params?.address || '').toLowerCase();
	const [items, setItems] = useState<Array<{ id: string; image: string }>>([]);

	useEffect(() => {
		if (!/^0x[0-9a-f]{40}$/.test(address)) return;
		(async () => {
			const r = await fetch(`/api/nft/owned?owner=${address}`);
			if (!r.ok) return;
			const j = await r.json();
			const ids: string[] = j.tokens || [];
			const metas = await Promise.all(ids.map(async (s) => {
				const m = await fetch(`/api/nft/${s}`);
				if (!m.ok) return { id: s, image: '' };
				const jj = await m.json();
				return { id: s, image: jj.image || '' };
			}));
			setItems(metas);
		})();
	}, [address]);

	return (
		<main className="container" style={{ display: 'grid', gap: 16 }}>
			<section className="card">
				<div className="card-header">
					<div className="title">Wallet Gallery</div>
					<span className="pill">{address.slice(0,6)}…{address.slice(-4)}</span>
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


