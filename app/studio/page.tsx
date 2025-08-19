"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { getContract, parseAbi, encodeFunctionData } from 'viem';
import { nftConfig } from '@/lib/nftConfig';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
import { deriveParams, quantizeToNibbles, encodeTokenIdFromComponents, buildGridSvg } from '@/lib/nftRender';
import { HorizontalNav } from '@/components/horizontal-nav';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { useFarcasterMiniApp } from '@/lib/useFarcasterMiniApp';

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
	const [minting, setMinting] = useState(false);
	const [txHash, setTxHash] = useState<string | null>(null);
	const [usernameInput, setUsernameInput] = useState('');
	const [isLoadingUsername, setIsLoadingUsername] = useState(false);
	const [usernameSuccess, setUsernameSuccess] = useState(false);
	const { isInMiniApp, getEthereumProvider } = useFarcasterMiniApp();

	// Rainbow Kit hooks
	const { address: account, isConnected } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();

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
		if (isInMiniApp) {
			window.open('/api/auth/github/login', '_blank');
		} else {
			window.location.href = '/api/auth/github/login';
		}
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

	async function fetchByUsername() {
		if (!usernameInput.trim()) return;
		setIsLoadingUsername(true);
		setUsernameSuccess(false);
		const username = usernameInput.trim();
		setActiveUser(username);
		try {
			await fetchUserData(username);
			setUsernameInput(''); // Clear input after successful fetch
			setUsernameSuccess(true);
		} finally {
			setIsLoadingUsername(false);
		}
	}

	// Derive parameters once to ensure consistency between preview and minting
	const derivedParams = useMemo(() => {
		if (!grid || !activeUser) return null;
		return deriveParams(activeUser, period);
	}, [grid, activeUser, period]);

	const svg = useMemo(() => {
		if (!derivedParams) return '';
		const palette = LIB_PRESETS[derivedParams.presetIndex]?.colors ?? LIB_PRESETS[0].colors;
		const nibbles = quantizeToNibbles(grid!);
		return buildGridSvg(nibbles, palette, derivedParams.shapeIndex, derivedParams.backgroundIndex);
	}, [derivedParams, grid]);

	const tokenId = useMemo(() => {
		if (!derivedParams || !grid) return null as null | bigint;
		const nibbles = quantizeToNibbles(grid);
		return encodeTokenIdFromComponents(nibbles, derivedParams.shapeIndex, derivedParams.presetIndex, derivedParams.backgroundIndex, derivedParams.contextHash);
	}, [derivedParams, grid]);

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

	async function mint() {
		try {
			if (!activeUser || !grid || !derivedParams) return alert('No preview ready');
			
			let client: any;
			let accountAddress: string;
			let chain: any;
			
			if (isInMiniApp) {
				// Use Farcaster wallet in Mini App
				const farcasterProvider = getEthereumProvider();
				if (!farcasterProvider) return alert('Farcaster wallet not available');
				
				try {
					// getEthereumProvider returns a Promise, so we need to await it
					const provider = await farcasterProvider;
					if (!provider) return alert('Farcaster wallet provider not available');
					
					// Get accounts from Farcaster wallet
					const accounts = await provider.request({ method: 'eth_accounts' });
					if (!accounts || accounts.length === 0) return alert('No Farcaster wallet connected');
					
					accountAddress = accounts[0];
					client = provider;
					chain = { id: 8453 }; // Base chain
				} catch (error) {
					return alert('Failed to connect to Farcaster wallet: ' + (error as Error).message);
				}
			} else {
				// Use Rainbow Kit wallet for regular web
				if (!walletClient || !publicClient) return alert('Please connect your wallet');
				if (!account) return alert('No account connected');
				
				client = walletClient;
				accountAddress = account;
				chain = walletClient.chain;
			}
			
			// Early return if walletClient is undefined for contract creation
			if (!walletClient) return alert('Wallet client not available');
			
			const nibbles = quantizeToNibbles(grid);
			const id = encodeTokenIdFromComponents(nibbles, derivedParams.shapeIndex, derivedParams.presetIndex, derivedParams.backgroundIndex, derivedParams.contextHash);
			
			setMinting(true);
			setTxHash(null);
			
			const abi = parseAbi([
				'function publicMintDeterministic(uint256 tokenId) public payable returns (uint256)',
				'function mintPrice() public view returns (uint256)'
			]);
			
			// Read mint price from contract first
			const mintPrice = await publicClient!.readContract({
				address: nftConfig.contractAddress as `0x${string}`,
				abi,
				functionName: 'mintPrice'
			});
			
			if (isInMiniApp) {
				// Mint using Farcaster wallet
				const data = encodeFunctionData({
					abi,
					functionName: 'publicMintDeterministic',
					args: [id]
				});
				
				const hash = await client.request({
					method: 'eth_sendTransaction',
					params: [{
						to: nftConfig.contractAddress,
						data,
						value: `0x${mintPrice.toString(16)}`, // Convert wei to hex
						chainId: '0x2105', // Base chain ID in hex
						from: accountAddress
					}]
				});
				
				setTxHash(hash);
			} else {
				// Mint using Rainbow Kit wallet
				const contract = getContract({ 
					address: nftConfig.contractAddress as `0x${string}`, 
					abi, 
					client: walletClient 
				});
				
				const hash = await contract.write.publicMintDeterministic([id], { 
					account: accountAddress as `0x${string}`, 
					chain: walletClient.chain,
					value: mintPrice // Use dynamic mint price
				} as any);
				
				setTxHash(hash);
			}
		} catch (e: any) {
			alert(e?.message || String(e));
		} finally {
			setMinting(false);
		}
	}

	function shiftPeriod(direction: number) {
		(async () => {
			const u = activeUser;
			if (!u) return;
			const res = await fetch(`/api/github/${encodeURIComponent(u)}`);
			if (!res.ok) return;
			const json = await res.json();
			const full = json.grid as number[][];
			const weekStart: string[] = json.weekStartDates || [];
			const weekEnd: string[] = json.weekEndDates || [];
			const cols = full[0]?.length ?? 0;
			if (cols < 7) return;
			const currentStartIndex = weekStart.findIndex((d: string) => d === period?.start);
			let i = currentStartIndex >= 0 ? currentStartIndex - 6 : 0;
			i = i + (direction === -1 ? 1 : -1);
			i = Math.max(0, Math.min(cols - 7, i));
			const endIndex = i + 6;
			const seven = full.map((row) => row.slice(i, endIndex + 1)).slice(0, 7);
			setGrid(seven);
			const startDate = weekStart[endIndex] || null;
			const endDate = weekEnd[i] || null;
			if (startDate && endDate) setPeriod({ start: startDate, end: endDate });
		})();
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
							{!profile && !activeUser ? (
								<div style={{ textAlign: 'center' }}>
									{isInMiniApp ? (
										<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
											<div style={{ fontSize: '0.9rem', color: '#9fb3c8' }}>
												Enter GitHub username to preview NFT (Mini App mode)
											</div>
											<input
												type="text"
												value={usernameInput}
												onChange={(e) => setUsernameInput(e.target.value)}
												placeholder="GitHub username"
												style={{
													padding: '12px 16px',
													borderRadius: '8px',
													border: '1px solid rgba(255,255,255,0.2)',
													background: 'rgba(255,255,255,0.05)',
													color: 'white',
													fontSize: '16px',
													width: '280px',
													textAlign: 'center'
												}}
												onKeyPress={(e) => e.key === 'Enter' && fetchByUsername()}
											/>
											<button 
												className={`button ${isLoadingUsername ? 'loading' : ''}`}
												onClick={fetchByUsername}
												disabled={!usernameInput.trim() || isLoadingUsername}
												style={{ 
													padding: '12px 24px',
													opacity: usernameInput.trim() && !isLoadingUsername ? 1 : 0.5
												}}
											>
												{isLoadingUsername ? 'Loading...' : 'Preview NFT'}
											</button>
										</div>
									) : (
										<>
											<button className="button" onClick={signInWithGitHub}>
												Sign in with GitHub
											</button>
											<div className="muted" style={{ marginTop: '12px' }}>
												We&apos;ll use your last 7 weeks of contributions
											</div>
										</>
									)}
								</div>
							) : (
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
										{profile?.avatarUrl ? (<img src={profile.avatarUrl} alt={profile.login || activeUser || 'User'} width={48} height={48} style={{ borderRadius: '50%' }} />) : null}
										<div>
											<div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
												@{profile?.login || activeUser}
											</div>
											<div className="muted">{profile?.name || 'Username input'}</div>
										</div>
									</div>
									{isInMiniApp && !profile && (
										<button 
											className="button" 
											onClick={() => {
												setActiveUser(null);
												setGrid(null);
												setPeriod(null);
												setUsernameInput('');
												setUsernameSuccess(false);
											}}
											style={{ 
												padding: '8px 16px',
												fontSize: '0.9rem',
												background: 'rgba(255,255,255,0.1)',
												border: '1px solid rgba(255,255,255,0.2)'
											}}
										>
											Try Different Username
										</button>
									)}
								</div>
							)}
							{fetchError && <div className="muted" style={{ marginTop: '12px', color: 'crimson' }}>{fetchError}</div>}
							{usernameSuccess && isInMiniApp && (
								<div className="muted" style={{ marginTop: '12px', color: '#00ff88' }}>
									✅ Successfully loaded contributions for @{activeUser}
								</div>
							)}
							{derivedParams && (
								<div className="muted" style={{ marginTop: '12px', fontSize: '0.9rem' }}>
									🔧 Preview Settings: Shape {derivedParams.shapeIndex}, Palette {derivedParams.presetIndex}, Background {derivedParams.backgroundIndex}
								</div>
							)}
						</div>
					</section>

					{/* Period Selection */}
					{grid && grid.length > 0 && (
						<section className="card">
							<div className="card-header">
								<div>
									<div className="title">📅 Contribution Period</div>
									<div className="subtitle">Navigate through different 7-week periods</div>
								</div>
							</div>
							<div className="card-body">
								<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
									<div style={{ 
										padding: '16px 24px', 
										background: 'rgba(255,255,255,0.05)', 
										borderRadius: '12px',
										border: '1px solid rgba(255,255,255,0.1)',
										minWidth: '280px',
										textAlign: 'center'
									}}>
										<div style={{ fontWeight: 600, marginBottom: '8px' }}>Current Period</div>
										<div style={{ fontSize: '0.9rem', color: '#9fb3c8' }}>
											{period ? `${period.start} → ${period.end}` : 'Loading dates...'}
										</div>
									</div>
									
									<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
										<button 
											className="button" 
											onClick={() => shiftPeriod(-1)}
											disabled={!activeUser}
											style={{ padding: '12px 20px' }}
										>
											← Previous Week
										</button>
										
										<button 
											className="button" 
											onClick={() => shiftPeriod(1)}
											disabled={!activeUser}
											style={{ padding: '12px 20px' }}
										>
											Next Week →
										</button>
									</div>
								</div>
								
								<div style={{ textAlign: 'center', marginTop: '16px' }}>
									<div className="muted" style={{ fontSize: '0.9rem' }}>
										Each period shows 7 weeks of contribution data. Use arrows to navigate through time.
									</div>
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
									disabled={!isConnected || minting}
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
								
								{!isConnected && (
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


