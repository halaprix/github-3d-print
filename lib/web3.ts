import { Address, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export type ChainConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

export function getChain(): ChainConfig {
  const id = Number(process.env.CHAIN_ID ?? '1');
  const rpcUrl = process.env.CHAIN_RPC_URL ?? 'https://rpc.ankr.com/eth';
  return { id, name: 'custom', rpcUrl, nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 } };
}

export function getWallet() {
  const pk = process.env.MINT_PRIVATE_KEY;
  if (!pk) throw new Error('Missing MINT_PRIVATE_KEY');
  const account = privateKeyToAccount(pk.startsWith('0x') ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`));
  const chain = getChain();
  const walletClient = createWalletClient({ account, chain: chain as any, transport: http(chain.rpcUrl) });
  const publicClient = createPublicClient({ chain: chain as any, transport: http(chain.rpcUrl) });
  return { account, walletClient, publicClient };
}

export function getContractAddress(): Address {
  const addr = process.env.NFT_CONTRACT_ADDRESS;
  if (!addr) throw new Error('Missing NFT_CONTRACT_ADDRESS');
  return addr as Address;
}


