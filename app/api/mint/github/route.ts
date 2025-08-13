import { NextRequest, NextResponse } from 'next/server';
import { Address, Hex, createWalletClient, createPublicClient, http, parseAbi, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const dynamic = 'force-dynamic';

const DEFAULT_CHAIN_RPC = process.env.CHAIN_RPC_URL ?? process.env.NEXT_PUBLIC_CHAIN_RPC ?? 'https://rpc.ankr.com/eth';
const CHAIN_ID = Number(process.env.CHAIN_ID ?? process.env.NEXT_PUBLIC_CHAIN_ID ?? '1');
const NFT_CONTRACT_ADDRESS = (process.env.NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_NFT_CONTRACT || '').toLowerCase();
const MINT_PK = process.env.MINT_PRIVATE_KEY;

const ABI = parseAbi([
	'function publicMintDeterministic(uint256 tokenId) public returns (uint256)',
	'function ownerOf(uint256 tokenId) public view returns (address)',
	'function safeTransferFrom(address from,address to,uint256 tokenId) public',
]);

export async function POST(req: NextRequest) {
	if (!MINT_PK || !NFT_CONTRACT_ADDRESS) {
		return NextResponse.json({ error: 'Server missing web3 env (MINT_PRIVATE_KEY, NFT_CONTRACT_ADDRESS)' }, { status: 500 });
	}
	// Require GitHub session
	const gh = req.cookies.get('gh_profile')?.value;
	if (!gh) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	const body = await safeJson(req);
	if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
	const to = (body.to as string | undefined)?.toLowerCase();
	if (!to || !/^0x[0-9a-f]{40}$/.test(to)) return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });

	// Derive deterministic tokenId from last 7 weeks of authenticated user
	let login: string = '';
	try {
		const prof = JSON.parse(Buffer.from(gh, 'base64').toString('utf8')) as { login: string };
		login = prof.login;
	} catch {}
	if (!login) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
	const grid = await fetchGrid(login);
	if (!grid) return NextResponse.json({ error: 'Failed to derive grid' }, { status: 400 });
	const tokenId = deriveDeterministicTokenId(grid, login);

	const account = privateKeyToAccount(normalizePk(MINT_PK));
	const walletClient = createWalletClient({ account, chain: { id: CHAIN_ID, name: 'custom', nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' }, rpcUrls: { default: { http: [DEFAULT_CHAIN_RPC] } } } as any, transport: http(DEFAULT_CHAIN_RPC) });
	const publicClient = createPublicClient({ chain: walletClient.chain!, transport: http(DEFAULT_CHAIN_RPC) });
	const contract = getContract({ address: NFT_CONTRACT_ADDRESS as Address, abi: ABI, client: walletClient });

	try {
		// Check if already minted
		let alreadyOwner: Address | null = null;
		try {
			const owner = await publicClient.readContract({ address: NFT_CONTRACT_ADDRESS as Address, abi: ABI, functionName: 'ownerOf', args: [tokenId] });
			alreadyOwner = owner as Address;
		} catch {}
		let hash: Hex | undefined;
		if (!alreadyOwner || alreadyOwner === '0x0000000000000000000000000000000000000000') {
			// Mint deterministic to server wallet
			hash = await contract.write.publicMintDeterministic([tokenId], { account: account.address, chain: walletClient.chain });
			await publicClient.waitForTransactionReceipt({ hash });
		}
		// Transfer to user if server owns it
		const serverAddr = account.address.toLowerCase();
		let currentOwner: string | undefined;
		try {
			currentOwner = (await publicClient.readContract({ address: NFT_CONTRACT_ADDRESS as Address, abi: ABI, functionName: 'ownerOf', args: [tokenId] })) as string;
		} catch {}
		if (currentOwner && currentOwner.toLowerCase() === serverAddr) {
			const tx = await walletClient.writeContract({ address: NFT_CONTRACT_ADDRESS as Address, abi: ABI, functionName: 'safeTransferFrom', args: [serverAddr as Address, to as Address, tokenId], chain: walletClient.chain });
			await publicClient.waitForTransactionReceipt({ hash: tx });
			hash = tx;
		}
		return NextResponse.json({ tokenId: tokenId.toString(), txHash: hash }, { status: 200 });
	} catch (err: unknown) {
		const message = (err as Error)?.message ?? String(err);
		return NextResponse.json({ error: 'Mint failed', message }, { status: 500 });
	}
}

async function fetchGrid(login: string): Promise<number[][] | null> {
	const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || ''}/api/github/${encodeURIComponent(login)}`);
	if (!r.ok) return null;
	const j = await r.json();
	const full = j.grid as number[][];
	const cols = full?.[0]?.length ?? 0;
	if (!Array.isArray(full) || cols < 7) return null;
	const startIndex = 0;
	const endIndex = startIndex + 6;
	const seven = full.map((row) => row.slice(startIndex, endIndex + 1)).slice(0, 7);
	return seven;
}

function deriveDeterministicTokenId(grid: number[][], user: string): bigint {
	function fnv1a32(str: string): number {
		let h = 0x811c9dc5;
		for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
		return h >>> 0;
	}
	const max = Math.max(1, ...grid.flat());
	const flat: number[] = [];
	for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) { const t = Math.max(0, Math.min(1, (grid[y][x] || 0) / max)); flat.push(Math.round(t * 15)); }
	let id = 0n;
	for (let i = 0; i < flat.length; i++) { id |= BigInt(flat[i] & 0xf) << BigInt(i * 4); }
	const hash = fnv1a32(`${user}`);
	const shapeIndex = hash & 0x7;
	const presetIndex = (hash >>> 3) & 0x7;
	id |= BigInt(shapeIndex) << 196n;
	id |= BigInt(presetIndex) << 199n;
	id |= BigInt(hash >>> 0) << 202n;
	id |= 1n << 234n;
	return id;
}

async function safeJson(req: NextRequest): Promise<Record<string, unknown> | null> {
	try {
		const body = await req.json();
		if (body && typeof body === 'object') return body as Record<string, unknown>;
		return null;
	} catch { return null; }
}

function normalizePk(pk: string): Hex {
	const trimmed = pk.trim();
	return (trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`) as Hex;
}


