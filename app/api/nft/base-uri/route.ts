import { NextRequest, NextResponse } from 'next/server';
import { Address, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const dynamic = 'force-dynamic';

const DEFAULT_CHAIN_RPC = process.env.CHAIN_RPC_URL ?? 'https://rpc.ankr.com/eth';
const CHAIN_ID = Number(process.env.CHAIN_ID ?? '1');
const NFT_CONTRACT_ADDRESS = (process.env.NFT_CONTRACT_ADDRESS ?? '').toLowerCase();
const MINT_PK = process.env.MINT_PRIVATE_KEY;

const ABI = parseAbi([
  'function setBaseURI(string memory newBaseURI) public'
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
  const { baseURI } = await req.json().catch(() => ({ baseURI: undefined })) as { baseURI?: string };
  if (!baseURI || typeof baseURI !== 'string') {
    return NextResponse.json({ error: 'baseURI required' }, { status: 400 });
  }

  const account = privateKeyToAccount(normalizePk(MINT_PK));
  const walletClient = createWalletClient({ account, chain: { id: CHAIN_ID, name: 'custom', nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' }, rpcUrls: { default: { http: [DEFAULT_CHAIN_RPC] } } } as any, transport: http(DEFAULT_CHAIN_RPC) });

  try {
    const hash = await walletClient.writeContract({
      address: NFT_CONTRACT_ADDRESS as Address,
      abi: ABI,
      functionName: 'setBaseURI',
      args: [baseURI],
      chain: walletClient.chain
    });
    return NextResponse.json({ txHash: hash }, { status: 200 });
  } catch (err: unknown) {
    const message = (err as Error)?.message ?? String(err);
    return NextResponse.json({ error: 'setBaseURI failed', message }, { status: 500 });
  }
}

function normalizePk(pk: string): `0x${string}` {
  const trimmed = pk.trim();
  if (trimmed.startsWith('0x')) return trimmed as `0x${string}`;
  return (`0x${trimmed}`) as `0x${string}`;
}


