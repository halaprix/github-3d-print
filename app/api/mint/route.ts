import { NextRequest, NextResponse } from 'next/server';
import { Address, Hex, createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const dynamic = 'force-dynamic';

const DEFAULT_CHAIN_RPC = process.env.CHAIN_RPC_URL ?? 'https://rpc.ankr.com/eth';
const CHAIN_ID = Number(process.env.CHAIN_ID ?? '1');
const NFT_CONTRACT_ADDRESS = (process.env.NFT_CONTRACT_ADDRESS ?? '').toLowerCase();
const MINT_PK = process.env.MINT_PRIVATE_KEY;

const ABI = parseAbi([
  'function safeMint(address to) public returns (uint256)',
  'function setBaseURI(string memory newBaseURI) public',
  'function nextTokenId() public view returns (uint256)'
]);

export async function POST(req: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: 'Server misconfigured: ADMIN_API_KEY missing' }, { status: 500 });
  }
  const headerKey = req.headers.get('x-admin-key');
  if (headerKey !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!MINT_PK || !NFT_CONTRACT_ADDRESS) {
    return NextResponse.json({ error: 'Server missing web3 env (MINT_PRIVATE_KEY, NFT_CONTRACT_ADDRESS)' }, { status: 500 });
  }

  const body = await safeJson(req);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const to = (body.to as string | undefined)?.toLowerCase();
  const tokenId = body.tokenId as string | number | undefined;
  const title = body.title as string | undefined;

  if (!to || !/^0x[0-9a-f]{40}$/.test(to)) {
    return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 });
  }

  const publicBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || '';

  const account = privateKeyToAccount(normalizePk(MINT_PK));
  const walletClient = createWalletClient({ account, chain: { id: CHAIN_ID, name: 'custom', nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' }, rpcUrls: { default: { http: [DEFAULT_CHAIN_RPC] } } } as any, transport: http(DEFAULT_CHAIN_RPC) });
  const publicClient = createPublicClient({ chain: walletClient.chain!, transport: http(DEFAULT_CHAIN_RPC) });

  try {
    const hash = await walletClient.writeContract({
      address: NFT_CONTRACT_ADDRESS as Address,
      abi: ABI,
      functionName: 'safeMint',
      args: [to as Address],
      chain: walletClient.chain
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    // Derive the token id post-mint if needed
    const nextId = await publicClient.readContract({ address: NFT_CONTRACT_ADDRESS as Address, abi: ABI, functionName: 'nextTokenId' });
    const mintedTokenId = Number(nextId) - 1;
    const metadataUrl = buildTokenUri(mintedTokenId, title);
    return NextResponse.json({ txHash: hash, status: receipt.status, blockNumber: receipt.blockNumber, tokenId: mintedTokenId, tokenURI: metadataUrl }, { status: 200 });
  } catch (err: unknown) {
    const message = (err as Error)?.message ?? String(err);
    return NextResponse.json({ error: 'Mint failed', message }, { status: 500 });
  }
}

function buildTokenUri(tokenId: string | number, title?: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || '';
  const id = String(tokenId);
  const url = `${base}/api/nft/${encodeURIComponent(id)}${title ? `?title=${encodeURIComponent(title)}` : ''}`;
  return url;
}

async function safeJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    if (body && typeof body === 'object') return body as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function normalizePk(pk: string): Hex {
  const trimmed = pk.trim();
  if (trimmed.startsWith('0x')) return trimmed as Hex;
  return (`0x${trimmed}`) as Hex;
}


