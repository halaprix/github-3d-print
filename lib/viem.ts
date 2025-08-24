import { createPublicClient, http, parseAbi } from 'viem';
import { nftConfig } from './nftConfig';

// Create public client for reading from the blockchain
export const publicClient = createPublicClient({
  chain: {
    id: nftConfig.chain.id,
    name: nftConfig.chain.name,
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: [nftConfig.chain.rpcUrl] },
    },
    blockExplorers: {
      default: { name: 'Explorer', url: nftConfig.chain.explorer },
    },
  },
  transport: http(nftConfig.chain.rpcUrl),
});

// Helper function to get NFT owner
export async function getNFTOwner(tokenId: bigint): Promise<string | null> {
  try {
    const abi = parseAbi([
      'function ownerOf(uint256 tokenId) view returns (address)'
    ]);

    const owner = await publicClient.readContract({
      address: nftConfig.contractAddress as `0x${string}`,
      abi,
      functionName: 'ownerOf',
      args: [tokenId]
    });

    return owner as string;
  } catch (error) {
    console.error('Error getting NFT owner:', error);
    return null;
  }
}
