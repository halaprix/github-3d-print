import { nftConfig } from './nftConfig';

function getNetworkPath(): string {
	const name = (nftConfig.chain.name || '').toLowerCase();
	if (name === 'mainnet' || name === 'ethereum' || nftConfig.chain.id === 1) return 'ethereum';
	return name; // e.g., 'sepolia', 'base', etc.
}

export function getOpenSeaAssetUrl(tokenId: string | number): string {
	const chain = getNetworkPath();
	const contract = nftConfig.contractAddress;
	return `https://opensea.io/assets/${chain}/${contract}/${tokenId}`;
}

export function getOpenSeaCollectionUrl(): string {
	const chain = getNetworkPath();
	const contract = nftConfig.contractAddress;
	return `https://opensea.io/assets/${chain}/${contract}`;
}


