"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { createWalletClient, custom, getContract, parseAbi } from 'viem';
import { nftConfig } from '@/lib/nftConfig';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
import { deriveParams, quantizeToNibbles, encodeTokenIdFromComponents, buildGridSvg } from '@/lib/nftRender';
import { HorizontalNav } from '@/components/horizontal-nav';

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
		<div className="tt-view">
			<HorizontalNav />
			<main style={{ paddingTop: '80px' }}>
				{/* Hero Section */}
				<header className="tt-hero gradient-top-right">
					<div className="tt-hero-intro z-1">
						<div className="tt-heading-content center gap-4">
							<h1 className="heading-xxlarge z-1">Create Your <em className="bold-italic-framed">GitHub</em> Contribution <em className="slim-italic">NFT</em> 🚀</h1>
							<div className="intro-text">
								<p>Transform your coding activity into a unique, deterministic NFT that perfectly represents your GitHub journey</p>
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<div className="container">
					{/* Authentication Section */}
					<section className="card">
						<div className="card-header">
							<div>
								<div className="title">🔐 GitHub Authentication</div>
								<div className="subtitle">Connect your GitHub account to start creating</div>
							</div>
						</div>
						<div className="card-body">
							{!profile ? (
								<div style={{ textAlign: 'center' }}>
									<button className="button" onClick={signInWithGitHub}>
										Sign in with GitHub
									</button>
									<div className="muted" style={{ marginTop: '12px' }}>
										We'll use your last 7 weeks of contributions
									</div>
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
							{fetchError && <div className="muted" style={{ marginTop: '12px', color: 'crimson' }}>{fetchError}</div>}
						</div>
					</section>

					{/* Period Selection */}
					{grid && grid.length > 0 && (
						<section className="card">
							<div className="card-header">
								<div>
									<div className="title">📅 Contribution Period</div>
									<div className="subtitle">Select the time range for your NFT</div>
								</div>
							</div>
							<div className="card-body">
								<div className="tabs">
									{['1W', '1M', '3M', '6M', '1Y'].map((p) => (
										<button
											key={p}
											className={`tab ${period?.start === p ? 'active' : ''}`}
											onClick={() => setPeriod({ start: p, end: p })}
										>
											{p}
										</button>
									))}
								</div>
							</div>
						</section>
					)}

					{/* NFT Preview */}
					{grid && grid.length > 0 && (
						<section className="card">
							<div className="card-header">
								<div>
									<div className="title">🎨 NFT Preview</div>
									<div className="subtitle">This is exactly how your NFT will look when minted</div>
								</div>
							</div>
							<div className="card-body">
								<div style={{ textAlign: 'center' }}>
									<div 
										dangerouslySetInnerHTML={{ __html: svg }} 
										style={{ 
											maxWidth: '400px', 
											margin: '0 auto',
											filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))'
										}}
									/>
								</div>
							</div>
						</section>
					)}

					{/* Central Mint Section */}
					{grid && grid.length > 0 && (
						<section className="card" style={{ 
							background: 'linear-gradient(135deg, rgba(255, 45, 179, 0.1), rgba(138, 43, 226, 0.1))',
							border: '2px solid rgba(255, 45, 179, 0.3)',
							textAlign: 'center',
							padding: '40px'
						}}>
							<div style={{ marginBottom: '24px' }}>
								<h2 style={{ 
									fontSize: '2rem', 
									fontWeight: 800, 
									margin: '0 0 16px 0',
									background: 'linear-gradient(135deg, #ff2db3, #8a2be2)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
									backgroundClip: 'text',
									fontFamily: 'Mozilla Headline, sans-serif'
								}}>
									🚀 Ready to Mint?
								</h2>
								<p style={{ color: '#9fb3c8', fontSize: '1.1rem', margin: 0 }}>
									Your NFT is ready! Connect your wallet and mint this unique representation of your GitHub activity.
								</p>
							</div>
							
							<div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
								<button 
									className="button" 
									onClick={mint}
									disabled={!account || minting}
									style={{ 
										fontSize: '1.1rem', 
										padding: '16px 32px',
										background: 'linear-gradient(135deg, rgba(255, 45, 179, 0.3), rgba(138, 43, 226, 0.3))',
										border: '2px solid rgba(255, 45, 179, 0.5)'
									}}
								>
									{minting ? (
										<>
											<span className="spinner"></span>
											Minting...
										</>
									) : (
										'🎨 Mint NFT'
									)}
								</button>
								
								{!account && (
									<div style={{ 
										padding: '16px 32px', 
										color: '#9fb3c8',
										background: 'rgba(255,255,255,0.05)',
										borderRadius: '12px',
										border: '1px solid rgba(255,255,255,0.1)'
									}}>
										Connect wallet to mint
									</div>
								)}
							</div>
							
							{txHash && (
								<div style={{ 
									marginTop: '24px', 
									padding: '16px', 
									background: 'rgba(0, 229, 255, 0.1)', 
									borderRadius: '12px',
									border: '1px solid rgba(0, 229, 255, 0.3)'
								}}>
									<div style={{ color: '#00E5FF', fontWeight: 600, marginBottom: '8px' }}>
										✅ NFT Minted Successfully!
									</div>
									<div style={{ fontSize: '0.9rem', color: '#9fb3c8' }}>
										Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
									</div>
								</div>
							)}
						</section>
					)}
				</div>
			</main>
		</div>
	);
}


