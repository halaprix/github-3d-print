"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { createWalletClient, custom, getContract, parseAbi } from 'viem';
import { nftConfig } from '@/lib/nftConfig';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
import { deriveParams, quantizeToNibbles, encodeTokenIdFromComponents, buildGridSvg } from '@/lib/nftRender';

type Profile = { login: string; name: string; avatarUrl: string };

// deriveParams now imported from shared renderer

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
	const [activeUser, setActiveUser] = useState<string | null>(null);
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
				setActiveUser(m.login);
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
		if (!grid || !activeUser) return '';
		const d = deriveParams(activeUser, period);
		const palette = LIB_PRESETS[d.presetIndex]?.colors ?? LIB_PRESETS[0].colors;
		const nibbles = quantizeToNibbles(grid);
		return buildGridSvg(nibbles, palette, d.shapeIndex);
	}, [grid, activeUser, period]);

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
		try {
			const eth = (window as any).ethereum;
			if (!eth) return alert('No wallet');
			if (!activeUser || !grid) return alert('No preview ready');
			const d = deriveParams(activeUser, period);
			const nibbles = quantizeToNibbles(grid);
			const id = encodeTokenIdFromComponents(nibbles, d.shapeIndex, d.presetIndex, d.contextHash);
			setMinting(true);
			setTxHash(null);
			const client = createWalletClient({
				chain: {
					id: nftConfig.chain.id,
					name: nftConfig.chain.name,
					nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
					rpcUrls: { default: { http: [nftConfig.chain.rpcUrl] } }
				} as any,
				transport: custom(eth)
			});
			const [from] = await client.requestAddresses();
			const abi = parseAbi(['function publicMintDeterministic(uint256 tokenId) public returns (uint256)']);
			const contract = getContract({ address: nftConfig.contractAddress as `0x${string}`, abi, client });
			const hash = await contract.write.publicMintDeterministic([id], { account: from, chain: client.chain });
			setTxHash(hash);
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
					<span className="pill">Preview + Mint</span>
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
						<button className="button" onClick={downloadSvg} disabled={!svg}>Download SVG</button>
						{period && (<div className="muted">Period: {period.start} → {period.end}</div>)}
					</div>
				</div>
			</section>
			{/* Central Mint Section */}
			{profile && grid && (
				<section className="card">
					<div className="card-body" style={{ display: 'grid', gap: 16, alignItems: 'center', textAlign: 'center' as const }}>
						<div>
							<h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Ready to Mint?</h3>
							<p className="muted" style={{ margin: '8px 0 0 0' }}>Your NFT preview is ready. Connect your wallet and mint to the blockchain.</p>
						</div>
						<div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' as const }}>
							{!account ? (
								<button className="button" onClick={connectWallet} style={{ fontSize: '1.1rem', padding: '12px 24px' }}>
									Connect Wallet to Mint
								</button>
							) : (
								<button 
									className="button" 
									onClick={mint} 
									disabled={minting || !grid || !profile}
									style={{ 
										fontSize: '1.2rem', 
										padding: '16px 32px',
										background: 'linear-gradient(135deg, #ff2db3, #8a2be2)',
										borderColor: '#6e14bf',
										color: 'white',
										fontWeight: 600
									}}
								>
									{minting ? 'Minting...' : '🚀 Mint NFT'}
								</button>
							)}
							{txHash && (
								<a className="button ghost" href={`${nftConfig.chain.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">
									View Transaction
								</a>
							)}
						</div>
					</div>
				</section>
			)}
			<section className="card">
				<div className="card-body" style={{ overflow: 'auto' }}>
					{svg ? (
						<div dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'flex', justifyContent: 'center' }} />
					) : (
						<div className="muted">Sign in with GitHub to preview</div>
					)}
				</div>
			</section>
		</main>
	);
}


