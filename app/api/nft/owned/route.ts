import { NextRequest, NextResponse } from 'next/server';
import { Address, createPublicClient, http, parseAbiItem } from 'viem';

export const dynamic = 'force-dynamic';

const CONFIG = (() => {
	const chainId = Number(process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || '1');
	const chainName = process.env.CHAIN_NAME || process.env.NEXT_PUBLIC_CHAIN_NAME || 'mainnet';
	const rpcUrl = process.env.CHAIN_RPC_URL || process.env.NEXT_PUBLIC_CHAIN_RPC || 'https://rpc.ankr.com/eth';
	const address = (process.env.NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_NFT_CONTRACT || '').toLowerCase();
	const deployBlock = Number(process.env.DEPLOY_BLOCK || process.env.NEXT_PUBLIC_DEPLOY_BLOCK || '34529601');
	return { chainId, chainName, rpcUrl, address, deployBlock } as const;
})();

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const owner = (url.searchParams.get('owner') || '').toLowerCase();
	if (!/^0x[0-9a-f]{40}$/.test(owner)) {
		return NextResponse.json({ error: 'Invalid owner' }, { status: 400 });
	}
	if (!/^0x[0-9a-f]{40}$/.test(CONFIG.address)) {
		return NextResponse.json({ tokens: [] }, { status: 200 });
	}
	console.log(CONFIG);
	const client = createPublicClient({
		chain: { id: CONFIG.chainId, name: CONFIG.chainName, nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [CONFIG.rpcUrl] } } } as any,
		transport: http(CONFIG.rpcUrl),
	});
	const event = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');
	const fromBlock = BigInt(Math.max(0, CONFIG.deployBlock));
	const toBlock = await client.getBlockNumber();
	const logs = await client.getLogs({ address: CONFIG.address as Address, event, fromBlock, toBlock });
	const owned = new Set<string>();
	console.log(logs);
	for (const log of logs) {
		console.log(log);
		const { from, to, tokenId } = (log as any).args as { from: Address; to: Address; tokenId: bigint };
		if (to.toLowerCase() === owner) owned.add(tokenId.toString());
		if (from.toLowerCase() === owner) owned.delete(tokenId.toString());
	}
	return NextResponse.json({ tokens: Array.from(owned) }, { status: 200 });
}


