import { NextResponse } from 'next/server';
import { Address, createPublicClient, http, parseAbiItem } from 'viem';

export const dynamic = 'force-dynamic';

type CacheShape = {
  tokenIds: bigint[];
  lastUpdatedMs: number;
  lastScannedToBlock: bigint;
};

const ZERO: Address = '0x0000000000000000000000000000000000000000';

const CONFIG = (() => {
  const chainId = Number(process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || '1');
  const chainName = process.env.CHAIN_NAME || process.env.NEXT_PUBLIC_CHAIN_NAME || 'mainnet';
  const rpcUrl = process.env.CHAIN_RPC_URL || process.env.NEXT_PUBLIC_CHAIN_RPC || 'https://rpc.ankr.com/eth';
  const explorer = process.env.CHAIN_EXPLORER || process.env.NEXT_PUBLIC_CHAIN_EXPLORER || 'https://etherscan.io';
  const address = (process.env.NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_NFT_CONTRACT || '').toLowerCase();
  const deployBlock = Number(process.env.DEPLOY_BLOCK || process.env.NEXT_PUBLIC_DEPLOY_BLOCK || '34141503');
  return { chainId, chainName, rpcUrl, explorer, address, deployBlock } as const;
})();

const cache: CacheShape = {
  tokenIds: [],
  lastUpdatedMs: 0,
  lastScannedToBlock: BigInt(Math.max(0, CONFIG.deployBlock)),
};

export async function GET(request: Request) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(CONFIG.address)) {
    return NextResponse.json({ tokenIds: [], error: 'Contract address not configured' }, { status: 200 });
  }

  const now = Date.now();
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';
  const ttlMs = 15 * 60 * 1000; // 15 minutes

  if (!force && now - cache.lastUpdatedMs < ttlMs && cache.tokenIds.length > 0) {
    return NextResponse.json(buildResponseMeta(cache, 'cache-hit'));
  }

  const client = createPublicClient({
    chain: {
      id: CONFIG.chainId,
      name: CONFIG.chainName,
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [CONFIG.rpcUrl] } },
    } as any,
    transport: http(CONFIG.rpcUrl),
  });

  try {
    const current = await client.getBlockNumber();
    const fromStart = cache.lastScannedToBlock > 0n ? cache.lastScannedToBlock + 1n : (CONFIG.deployBlock > 0 ? BigInt(CONFIG.deployBlock) : 0n);
    const fromBlock = fromStart > current ? current : fromStart;
    const toBlock = current;

    if (fromBlock <= toBlock) {
      const event = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');
      const step = 20000n; // conservative chunk size
      const newIds: bigint[] = [];
      let start = fromBlock;
      while (start <= toBlock) {
        const end = start + step > toBlock ? toBlock : start + step;
        const logs = await client.getLogs({ address: CONFIG.address as Address, event, fromBlock: start, toBlock: end });
        for (const log of logs) {
          const args = (log as any).args as { from: Address; to: Address; tokenId: bigint };
          if (args && args.from === ZERO && typeof args.tokenId === 'bigint') newIds.push(args.tokenId);
        }
        start = end + 1n;
      }
      if (newIds.length > 0) {
        const seen = new Set(cache.tokenIds.map((x) => x.toString()));
        for (const id of newIds) {
          if (!seen.has(id.toString())) cache.tokenIds.push(id);
        }
      }
      cache.lastScannedToBlock = toBlock;
      cache.lastUpdatedMs = now;
    }
  } catch (err: unknown) {
    // Return what we have; add error details for visibility
    return NextResponse.json({ ...buildResponseMeta(cache, 'error'), error: (err as Error)?.message ?? String(err) }, { status: 200 });
  }

  return NextResponse.json(buildResponseMeta(cache, 'updated'));
}

function buildResponseMeta(c: CacheShape, source: 'cache-hit' | 'updated' | 'error') {
  const recent = c.tokenIds.slice(-100).reverse();
  return {
    tokenIds: recent.map((x) => x.toString()),
    meta: {
      source,
      lastUpdatedMs: c.lastUpdatedMs,
      lastScannedToBlock: c.lastScannedToBlock.toString(),
      contract: CONFIG.address,
    },
  } as const;
}


