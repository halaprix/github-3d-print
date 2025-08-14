"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { createWalletClient, custom, getContract, parseAbi } from 'viem';
import { nftConfig } from '@/lib/nftConfig';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
import { deriveParams, quantizeToNibbles, encodeTokenIdFromComponents, buildGridSvg } from '@/lib/nftRender';
import { GlassmorphicNav } from '@/components/glassmorphic-nav';

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
		<div className="min-h-screen relative">
			{/* Glassmorphic Navigation in Top Left - Floating Overlay */}
			<div className="fixed top-6 left-6 z-50">
				<GlassmorphicNav />
			</div>

			<main className="tt-view">
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
								Create your <em className="bold-italic-framed">GridGit NFT</em>&nbsp;
								<em className="slim-italic">instantly</em> 🎨
							</h1>
							<div className="intro-text mt-0">
								Connect your GitHub account, preview your contribution grid, and mint your unique NFT to the blockchain.
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<div className="container" style={{ display: 'grid', gap: 24 }}>
					{/* Authentication Section */}
					<section className="card">
						<div className="card-header">
							<div className="title">Authentication</div>
							<span className="pill">GitHub + Wallet</span>
						</div>
						<div className="card-body" style={{ display: 'grid', gap: 16 }}>
							{!profile ? (
								<div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
									<button className="tt-button btn-primary" onClick={signInWithGitHub}>
										<div className="btn-content">Sign in with GitHub</div>
									</button>
									<span className="muted">We'll use your last 7 weeks of contributions</span>
								</div>
							) : (
								<div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
									{profile.avatarUrl ? (<img src={profile.avatarUrl} alt={profile.login} width={48} height={48} style={{ borderRadius: '50%' }} />) : null}
									<div>
										<div style={{ fontWeight: 600, fontSize: '1.1rem' }}>@{profile.login}</div>
										<div className="muted">{profile.name}</div>
									</div>
								</div>
							)}
							{fetchError && <span style={{ color: 'crimson', textAlign: 'center' }}>{fetchError}</span>}
						</div>
					</section>

					{/* Wallet Connection Section */}
					<section className="card">
						<div className="card-header">
							<div className="title">Wallet Connection</div>
							<span className="pill">Required for Minting</span>
						</div>
						<div className="card-body" style={{ display: 'grid', gap: 16, alignItems: 'center', textAlign: 'center' }}>
							<div>
								<h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Connect Your Wallet</h3>
								<p className="muted" style={{ margin: '8px 0 0 0' }}>You need a connected wallet to mint your NFT to the blockchain.</p>
							</div>
							<div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
								<button 
									className="tt-button btn-primary" 
									onClick={connectWallet} 
									disabled={!!account}
									style={{ fontSize: '1.1rem', padding: '16px 32px' }}
								>
									{account ? `Connected: ${account.slice(0,6)}…${account.slice(-4)}` : 'Connect Wallet'}
								</button>
								{period && (
									<div className="muted" style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
										Period: {period.start} → {period.end}
									</div>
								)}
							</div>
						</div>
					</section>

					{/* Central Mint Section */}
					{profile && grid && (
						<section className="card" style={{ background: 'linear-gradient(135deg, rgba(255,45,179,0.1), rgba(138,43,226,0.1))', border: '1px solid rgba(255,45,179,0.2)' }}>
							<div className="card-body" style={{ display: 'grid', gap: 24, alignItems: 'center', textAlign: 'center' }}>
								<div>
									<h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, background: 'linear-gradient(135deg, #ff2db3, #8a2be2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
										Ready to Mint? 🚀
									</h2>
									<p className="muted" style={{ margin: '16px 0 0 0', fontSize: '1.1rem' }}>
										Your NFT preview is ready. Connect your wallet and mint to the blockchain.
									</p>
								</div>
								<div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
									{!account ? (
										<button 
											className="tt-button btn-primary" 
											onClick={connectWallet} 
											style={{ fontSize: '1.2rem', padding: '20px 40px' }}
										>
											Connect Wallet to Mint
										</button>
									) : (
										<button 
											className="tt-button btn-primary" 
											onClick={mint} 
											disabled={minting || !grid || !profile}
											style={{ 
												fontSize: '1.3rem', 
												padding: '20px 40px',
												background: 'linear-gradient(135deg, #ff2db3, #8a2be2)',
												boxShadow: '0 12px 40px rgba(255,45,179,0.4)'
											}}
										>
											{minting ? 'Minting...' : '🚀 Mint NFT'}
										</button>
									)}
									{txHash && (
										<a className="tt-button btn-secondary" href={`${nftConfig.chain.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">
											View Transaction
										</a>
									)}
								</div>
							</div>
						</section>
					)}

					{/* NFT Preview Section */}
					<section className="card">
						<div className="card-header">
							<div className="title">NFT Preview</div>
							<span className="pill">Live Preview</span>
						</div>
						<div className="card-body" style={{ display: 'grid', gap: 16 }}>
							{svg ? (
								<div style={{ display: 'grid', gap: 20, alignItems: 'center' }}>
									<div dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'flex', justifyContent: 'center' }} />
									<div style={{ display: 'flex', justifyContent: 'center' }}>
										<button className="tt-button btn-secondary" onClick={downloadSvg}>
											<div className="btn-content">Download SVG</div>
										</button>
									</div>
								</div>
							) : (
								<div className="muted" style={{ textAlign: 'center', padding: '40px 20px' }}>
									Sign in with GitHub to preview your NFT
								</div>
							)}
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}


