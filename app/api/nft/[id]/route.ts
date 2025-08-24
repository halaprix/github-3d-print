import { NextRequest, NextResponse } from 'next/server';
import { PRESET_PALETTES } from '@/lib/palettes';
import { BACKGROUND_THEMES } from '@/lib/backgrounds';
import { buildGridSvg, decodeTokenId, getActualBackground, getActualShapeName } from '@/lib/nftRender';
import { nftConfig } from '@/lib/nftConfig';
import { createPublicClient, http, parseAbi } from 'viem';

export const dynamic = 'force-dynamic';

// Create public client for reading from the blockchain
const publicClient = createPublicClient({
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
async function getNFTOwner(tokenId: bigint): Promise<string | null> {
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const idStr = params.id;
  if (!/^\d+$/.test(idStr)) {
    return NextResponse.json({ error: 'Invalid token id' }, { status: 400 });
  }

  const tokenId = BigInt(idStr);

  // Get talent score by looking up NFT owner from contract
  let talentScore: number | undefined;
  let nftOwner: string | null = null;

  try {
    nftOwner = await getNFTOwner(tokenId);
    if (nftOwner) {
      const talentUrl = `${new URL(req.url).origin}/api/talent-score?address=${encodeURIComponent(nftOwner)}`;
      const talentResponse = await fetch(talentUrl);
      if (talentResponse.ok) {
        const talentData = await talentResponse.json();
        talentScore = talentData.builderScore || 0;
      }
    }
  } catch (error) {
    console.error('Failed to fetch talent score from NFT owner:', error);
    // Continue without talent score if fetch fails
  }

  const decoded = decodeTokenId(tokenId);
  if (!decoded) return NextResponse.json({ error: 'Malformed token id' }, { status: 400 });
  const { grid, shapeIndex, presetIndex, backgroundIndex, contextHash } = decoded;

  const palette = PRESET_PALETTES[presetIndex]?.colors ?? PRESET_PALETTES[0].colors;
  const svg = buildGridSvg(grid, palette, shapeIndex, backgroundIndex, contextHash, talentScore);
  const imageB64 = Buffer.from(svg, 'utf8').toString('base64');
  const image = `data:image/svg+xml;base64,${imageB64}`;
  const name = `GridGit #${idStr}`;

  // Build attributes array
  const attributes = [
    { trait_type: 'Shape', value: getActualShapeName(shapeIndex) },
    { trait_type: 'Color Palette', value: PRESET_PALETTES[presetIndex]?.name ?? 'Unknown' },
    { trait_type: 'Background', value: getActualBackground(backgroundIndex).name },
    { display_type: 'number', trait_type: 'ContextHash', value: Number(contextHash) }
  ];

  // Add NFT owner attribute if available
  if (nftOwner) {
    attributes.push({
      trait_type: 'Owner',
      value: `${nftOwner.slice(0, 6)}...${nftOwner.slice(-4)}`
    });
  }

  // Add talent score attribute if available
  if (talentScore !== undefined && talentScore > 0) {
    attributes.push({
      display_type: 'number',
      trait_type: 'Talent Protocol Score',
      value: talentScore
    });
  }

  const metadata = {
    name,
    description: talentScore !== undefined && talentScore > 0
      ? `Deterministic on-chain SVG from GitHub heatmap with Talent Protocol score. NFT owned by ${nftOwner ? `${nftOwner.slice(0, 6)}...${nftOwner.slice(-4)}` : 'unknown'}.`
      : nftOwner
      ? `Deterministic on-chain SVG from GitHub heatmap. NFT owned by ${nftOwner.slice(0, 6)}...${nftOwner.slice(-4)}.`
      : 'Deterministic on-chain SVG from GitHub heatmap. Token ID encodes grid, shape, palette, and background.',
    image,
    image_data: svg,
    attributes
  } as const;

  return new NextResponse(JSON.stringify(metadata), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60' }
  });
}

// decodeTokenId function moved to shared library lib/nftRender.ts

// buildGridSvg moved to shared lib


