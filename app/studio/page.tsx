"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { nftConfig } from '@/lib/nftConfig';

type Profile = { login: string; name: string; avatarUrl: string };

export default function StudioPage() {
	return (
		<Suspense fallback={null}>
			<StudioInner />
		</Suspense>
	);
}

function StudioInner() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [grid, setGrid] = useState<number[][] | null>(null);
	const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [account, setAccount] = useState<string | null>(null);
	const [minting, setMinting] = useState(false);
	const [txHash, setTxHash] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			const r = await fetch('/api/auth/me', { cache: 'no-store' });
			if (!r.ok) return;
			const m = await r.json();
			if (m?.login) {
				setProfile({ login: m.login, name: m.name || m.login, avatarUrl: m.avatarUrl || '' });
				await fetchUserData(m.login);
			}
		})();
	}, []);

	async function signInWithGitHub() {
		window.location.href = '/api/auth/github/login';
	}

	async function fetchUserData(login: string) {
		setFetchError(null);
		const res = await fetch(`/api/github/${encodeURIComponent(login)}`);
		if (!res.ok) {
			setFetchError('Failed to load contributions');
			return;
		}
		const json = await res.json();
		const full = json.grid as number[][];
		const cols = full[0]?.length ?? 0;
		if (Array.isArray(full) && cols >= 7) {
			const startIndex = 0; // newest at 0 after server reverse
			const endIndex = startIndex + 6;
			const seven = full.map((row) => row.slice(startIndex, endIndex + 1)).slice(0, 7);
			setGrid(seven);
			const startDate = json.weekStartDates?.[endIndex] || null;
			const endDate = json.weekEndDates?.[startIndex] || null;
			if (startDate && endDate) setPeriod({ start: startDate, end: endDate });
		}
	}

	const svg = useMemo(() => {
		if (!grid) return '';
		const rows = 7, cols = 7;
		const cell = 40; const gap = 6; const bg = '#0a0f1a';
		const width = cols * cell + (cols - 1) * gap;
		const height = rows * cell + (rows - 1) * gap;
		const max = Math.max(...grid.flat());
		const palette = ['#0a0f1a', '#00E5FF', '#00FFA3', '#F5D300', '#FF2079'];
		const colorFor = (v: number) => {
			if (max <= 0) return palette[1];
			const t = v / max;
			const stops = palette.slice(1);
			const idx = Math.min(stops.length - 1, Math.floor(t * stops.length));
			return stops[idx];
		};
		const inset = Math.max(1, Math.floor(cell * 0.12));
		const shapes: string[] = [];
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const vx = x * (cell + gap);
				const vy = y * (cell + gap);
				const val = grid[y][x] || 0;
				const cx = vx + cell / 2;
				const cy = vy + cell / 2;
				const r = Math.max(1, cell / 2 - inset);
				const fill = val === 0 ? palette[0] : colorFor(val);
				shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`);
			}
		}
		return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\">\n<rect x=\"0\" y=\"0\" width=\"${width}\" height=\"${height}\" fill=\"${bg}\"/>\n${shapes.join('\n')}\n</svg>`;
	}, [grid]);

	function downloadSvg() {
		if (!svg) return;
		const blob = new Blob([svg], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `gridgit-${profile?.login || 'user'}.svg`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function connectWallet() {
		const eth = (window as any).ethereum;
		if (!eth) return alert('Install MetaMask');
		const [addr] = await eth.request({ method: 'eth_requestAccounts' });
		setAccount(addr);
	}

	async function mint() {
		if (!account) return;
		setMinting(true);
		setTxHash(null);
		try {
			const res = await fetch('/api/mint/github', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ to: account })
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || 'Mint failed');
			setTxHash(json.txHash || null);
		} catch (e: any) {
			alert(e?.message || String(e));
		} finally {
			setMinting(false);
		}
	}

	return (
		<main className="container" style={{ display: 'grid', gap: 16 }}>
			<section className="card">
				<div className="card-header">
					<div className="title">Studio</div>
					<span className="pill">SVG + Mint</span>
				</div>
				<div className="card-body" style={{ display: 'grid', gap: 12 }}>
					{!profile ? (
						<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
							<button className="button" onClick={signInWithGitHub}>Sign in with GitHub</button>
							<span className="muted">We’ll use your last 7 weeks</span>
						</div>
					) : (
						<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
							{profile.avatarUrl ? (<img src={profile.avatarUrl} alt={profile.login} width={40} height={40} style={{ borderRadius: '50%' }} />) : null}
							<div className="muted">@{profile.login}</div>
						</div>
					)}
					{fetchError && <span style={{ color: 'crimson' }}>{fetchError}</span>}
					<div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' as const }}>
						<button className="button" onClick={connectWallet} disabled={!!account}>{account ? `Connected: ${account.slice(0,6)}…${account.slice(-4)}` : 'Connect Wallet'}</button>
						<button className="button" onClick={mint} disabled={!account || minting || !grid || !profile}>{minting ? 'Minting…' : 'Mint NFT'}</button>
						{txHash && (
							<a className="button ghost" href={`${nftConfig.chain.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">View Tx</a>
						)}
						<button className="button" onClick={downloadSvg} disabled={!svg}>Download SVG</button>
						{period && (<div className="muted">Period: {period.start} → {period.end}</div>)}
					</div>
				</div>
			</section>
			<section className="card">
				<div className="card-body" style={{ overflow: 'auto' }}>
					{svg ? (
						<div dangerouslySetInnerHTML={{ __html: svg }} />
					) : (
						<div className="muted">Sign in with GitHub to preview</div>
					)}
				</div>
			</section>
		</main>
	);
}


