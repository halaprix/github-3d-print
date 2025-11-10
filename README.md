# GridGit - GitHub Contribution NFTs

Transform your GitHub contribution history into unique, deterministic NFTs on the blockchain.

**Live Demo:** [gridgit.halaprix.com](https://gridgit.halaprix.com)

## Overview

GridGit is a Next.js application that generates unique NFTs from your GitHub contribution heatmap data. Each NFT is deterministically generated, ensuring the preview exactly matches what gets minted on-chain. The platform supports both regular web wallets and Farcaster mini-apps.

## Features

- 🎨 **Deterministic Generation** - Same input always produces the same NFT with guaranteed consistency
- 🔗 **GitHub Integration** - Direct connection to your contribution data with real-time updates
- 🚀 **Instant Minting** - Preview and mint in one seamless flow
- 💎 **Unique Patterns** - Every contribution creates a distinct visual with mathematical precision
- 📱 **Farcaster Support** - Native integration with Farcaster mini-apps
- 🔐 **Wallet Connect** - Powered by Reown AppKit (formerly WalletConnect)

## Tech Stack

- **Framework:** Next.js 14 with TypeScript
- **Blockchain:** Base (Ethereum L2)
- **Wallet:** Reown AppKit with Wagmi & Viem
- **3D Rendering:** Three.js
- **Smart Contracts:** Solidity (Foundry)
- **Package Manager:** pnpm

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- GitHub OAuth App credentials
- Reown project ID ([dashboard.reown.com](https://dashboard.reown.com))
- Base chain RPC endpoint
- Deployed NFT contract address

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd github-3d-print
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file with the following:

   ```env
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret

   # App Configuration
   NEXT_PUBLIC_BASE_URL=https://your-domain.com

   # Blockchain Configuration
   NEXT_PUBLIC_CHAIN_ID=8453
   NEXT_PUBLIC_CHAIN_NAME=base
   NEXT_PUBLIC_CHAIN_RPC=https://mainnet.base.org
   NEXT_PUBLIC_CHAIN_EXPLORER=https://basescan.org
   NEXT_PUBLIC_NFT_CONTRACT=0x...
   NEXT_PUBLIC_DEPLOY_BLOCK=0

   # Reown AppKit (WalletConnect)
   NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
   ```

4. **Set Reown Project ID**

   Add `NEXT_PUBLIC_REOWN_PROJECT_ID` to your `.env.local` file (see environment variables above).

5. **Run the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contracts

The project includes Foundry-based smart contracts in the `contracts/` directory.

### Build Contracts

```bash
cd contracts
forge build
```

### Deploy

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url <rpc_url> --private-key <private_key> --broadcast
```

See `contracts/README.md` for more Foundry commands.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes (GitHub auth, NFT data, signatures)
│   ├── gallery/           # NFT gallery pages
│   ├── studio/            # NFT creation studio
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── appkit-provider.tsx # Reown AppKit wallet provider
│   ├── horizontal-nav.tsx # Navigation component
│   └── nft-preview.tsx    # NFT preview component
├── contracts/             # Solidity smart contracts (Foundry)
├── lib/                   # Utility libraries
│   ├── nftConfig.ts      # NFT configuration
│   ├── nftRender.ts      # NFT rendering logic
│   └── palettes.ts       # Color palettes
└── public/                # Static assets
```

## Usage

1. **Connect Wallet** - Use the connect button in the navigation to link your wallet
2. **Authenticate with GitHub** - Sign in with GitHub to access your contribution data
3. **Preview NFT** - View your contribution data rendered as a unique NFT
4. **Mint** - Mint your NFT to the Base blockchain

## Development

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Lint

```bash
pnpm lint
```

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
