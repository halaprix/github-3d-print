"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { getContract, parseAbi, encodeFunctionData } from 'viem';
import { nftConfig } from '@/lib/nftConfig';
import { PRESET_PALETTES as LIB_PRESETS } from '@/lib/palettes';
import { deriveParams, quantizeToNibbles, encodeTokenIdFromComponents, buildGridSvg } from '@/lib/nftRender';
import { NFTPreview } from '@/components/nft-preview';
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
			const tokenId = encodeTokenIdFromComponents(nibbles, derivedParams.shapeIndex, derivedParams.presetIndex, derivedParams.backgroundIndex, derivedParams.contextHash);

			setMinting(true);
			setTxHash(null);

			// Request signature from backend
			const signatureResponse = await fetch('/api/generate-signature', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					walletAddress: accountAddress,
					username: activeUser
				})
			});

			if (!signatureResponse.ok) {
				const errorData = await signatureResponse.json();
				return alert(`Signature verification failed: ${errorData.error || 'Unknown error'}`);
			}

			const signatureData = await signatureResponse.json();
			const { signature, nonce } = signatureData;

			const abi = parseAbi([
				'function publicMintDeterministic(uint256 tokenId, uint256 nonce, bytes signature) public payable returns (uint256)',
				'function mintPrice() public view returns (uint256)'
			]);

			// Read mint price from contract first
			const mintPrice = await publicClient!.readContract({
				address: nftConfig.contractAddress as `0x${string}`,
				abi,
				functionName: 'mintPrice'
			});

			if (isInMiniApp) {
				// Mint using Farcaster wallet with signature
				const data = encodeFunctionData({
					abi,
					functionName: 'publicMintDeterministic',
					args: [tokenId, nonce, signature]
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
				// Mint using Rainbow Kit wallet with signature
				const contract = getContract({
					address: nftConfig.contractAddress as `0x${string}`,
					abi,
					client: walletClient
				});

				const hash = await contract.write.publicMintDeterministic([tokenId, nonce, signature], {
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
				<header className="tt-hero">
					<div className="tt-hero-intro z-1">
						<div className="tt-heading-content center gap-4">
							<h1 className="tt-heading-xxlarge z-1 text-center">Create Your <em className="bold-italic-framed">GitHub</em> Contribution <em className="slim-italic">NFT</em> 🚀</h1>
							<p className="intro-text text-center max-w-2xl mx-auto">
								Transform your coding activity into a unique, deterministic NFT that perfectly represents your GitHub journey
							</p>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<div className="container">
					{/* Authentication Section */}
					<section className="card">
						<div className="card-header">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-accent-interactive-default rounded-lg flex items-center justify-center text-sm">
									🔐
								</div>
								<div>
									<div className="title">GitHub Authentication</div>
									<div className="subtitle">Connect your GitHub account to start creating</div>
								</div>
							</div>
						</div>
						<div className="card-body">
							{!profile && !activeUser ? (
								<div className="text-center space-y-6">
									{isInMiniApp ? (
										<div className="space-y-4">
											<p className="text-sm text-text-secondary">
												Enter GitHub username to preview NFT (Mini App mode)
											</p>
											<input
												type="text"
												value={usernameInput}
												onChange={(e) => setUsernameInput(e.target.value)}
												placeholder="GitHub username"
												className="input text-center"
												onKeyPress={(e) => e.key === 'Enter' && fetchByUsername()}
											/>
											<button
												className={`button ${isLoadingUsername ? 'loading' : ''}`}
												onClick={fetchByUsername}
												disabled={!usernameInput.trim() || isLoadingUsername}
											>
												{isLoadingUsername ? 'Loading...' : 'Preview NFT'}
											</button>
										</div>
									) : (
										<div className="space-y-4">
											<button className="button" onClick={signInWithGitHub}>
												Sign in with GitHub
											</button>
											<p className="text-sm text-text-secondary">
												We&apos;ll use your last 7 weeks of contributions
											</p>
										</div>
									)}
								</div>
							) : (
								<div className="text-center space-y-6">
									<div className="flex items-center justify-center gap-4">
										{profile?.avatarUrl ? (
											<img
												src={profile.avatarUrl}
												alt={profile.login || activeUser || 'User'}
												width={48}
												height={48}
												className="rounded-full border-2 border-border-default"
											/>
										) : null}
										<div className="text-left">
											<div className="font-semibold text-text-primary">
												@{profile?.login || activeUser}
											</div>
											<div className="text-sm text-text-secondary">{profile?.name || 'Username input'}</div>
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
										>
											Try Different Username
										</button>
									)}
								</div>
							)}
							{fetchError && (
								<div className="mt-4 p-3 bg-system-error/10 border border-system-error/20 rounded-lg">
									<p className="text-sm text-system-error">{fetchError}</p>
								</div>
							)}
							{usernameSuccess && isInMiniApp && (
								<div className="mt-4 p-3 bg-system-success/10 border border-system-success/20 rounded-lg">
									<p className="text-sm text-system-success">
										✅ Successfully loaded contributions for @{activeUser}
									</p>
								</div>
							)}
							{/* {derivedParams && (
								<div className="mt-4 p-3 bg-background-elevated rounded-lg">
									<p className="text-xs text-text-secondary font-mono">
										🔧 Preview Settings: Shape {derivedParams.shapeIndex}, Palette {derivedParams.presetIndex}, Background {derivedParams.backgroundIndex}
									</p>
								</div>
							)} */}
						</div>
					</section>

					{/* Period Selection */}
					{grid && grid.length > 0 && (
						<section className="card">
							<div className="card-header">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-accent-interactive-default rounded-lg flex items-center justify-center text-sm">
										📅
									</div>
									<div>
										<div className="title">Contribution Period</div>
										<div className="subtitle">Navigate through different 7-week periods</div>
									</div>
								</div>
							</div>
							<div className="card-body">
								<div className="text-center space-y-6">
									<div className="p-4 bg-background-elevated rounded-xl border border-border-default">
										<div className="font-semibold text-text-primary mb-2">Current Period</div>
										<div className="text-sm text-text-secondary">
											{period ? `${period.start} → ${period.end}` : 'Loading dates...'}
										</div>
									</div>

									<div className="flex gap-4 justify-center">
										<button
											className="button"
											onClick={() => shiftPeriod(-1)}
											disabled={!activeUser}
										>
											← Previous Week
										</button>

										<button
											className="button"
											onClick={() => shiftPeriod(1)}
											disabled={!activeUser}
										>
											Next Week →
										</button>
									</div>

									<p className="text-sm text-text-secondary">
										Each period shows 7 weeks of contribution data. Use arrows to navigate through time.
									</p>
								</div>
							</div>
						</section>
					)}

					{/* NFT Preview */}
					{grid && grid.length > 0 && (
						<section className="card">
							<div className="card-header">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-accent-critical-default rounded-lg flex items-center justify-center text-sm">
										🎨
									</div>
									<div>
										<div className="title">NFT Preview</div>
										<div className="subtitle">This is exactly how your NFT will look when minted</div>
									</div>
								</div>
							</div>
							<div className="card-body">
								<div className="w-full max-w-4xl mx-auto">
									<NFTPreview
										user={activeUser || profile?.login || 'user'}
										period={period}
										grid={grid}
										         className="w-full h-max"
									/>
								</div>
							</div>
						</section>
					)}

					{/* Central Mint Section */}
					{grid && grid.length > 0 && (
						<section className="card relative overflow-hidden">
							{/* Background gradient overlay */}
							<div className="absolute inset-0 bg-gradient-to-br from-accent-critical-default/10 to-accent-interactive-default/10"></div>

							<div className="relative z-10 p-8 text-center">
								<div className="mb-8">
									<h2 className="text-3xl font-display font-bold text-text-primary mb-4">
										🚀 Ready to Mint?
									</h2>
									<p className="text-lg text-text-secondary">
										Your NFT is ready! Connect your wallet and mint this unique representation of your GitHub activity.
									</p>
								</div>

								<div className="flex gap-4 justify-center flex-wrap mb-6">
									<button
										className="button"
										onClick={mint}
										disabled={!isConnected || minting}
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
										<div className="px-6 py-4 text-text-secondary bg-background-elevated rounded-xl border border-border-default">
											Connect wallet to mint
										</div>
									)}
								</div>

								{txHash && (
									<div className="p-4 bg-system-success/10 border border-system-success/20 rounded-xl">
										<div className="text-system-success font-semibold mb-2">
											✅ NFT Minted Successfully!
										</div>
										<div className="text-sm text-text-secondary font-mono">
											Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
										</div>
									</div>
								)}
							</div>
						</section>
					)}
				</div>
			</main>
		</div>
	);
}


