export const nftConfig = {
  chain: {
    id: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111),
    name: process.env.NEXT_PUBLIC_CHAIN_NAME || 'sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_CHAIN_RPC || 'https://rpc.ankr.com/eth_sepolia',
    explorer: process.env.NEXT_PUBLIC_CHAIN_EXPLORER || 'https://sepolia.etherscan.io',
  },
  contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT || '0x0000000000000000000000000000000000000000',
  deployBlock: Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || '34529601')
} as const;


