import { NextRequest, NextResponse } from 'next/server';
import { PRESET_PALETTES } from '@/lib/palettes';
import { BACKGROUND_THEMES } from '@/lib/backgrounds';
import { buildGridSvg, decodeTokenId, getActualBackground, getActualShapeName } from '@/lib/nftRender';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const idStr = params.id;
  if (!/^\d+$/.test(idStr)) {
    return NextResponse.json({ error: 'Invalid token id' }, { status: 400 });
  }
  const tokenId = BigInt(idStr);
  const decoded = decodeTokenId(tokenId);
  if (!decoded) return NextResponse.json({ error: 'Malformed token id' }, { status: 400 });
  const { grid, shapeIndex, presetIndex, backgroundIndex, contextHash } = decoded;
  const palette = PRESET_PALETTES[presetIndex]?.colors ?? PRESET_PALETTES[0].colors;
  const svg = buildGridSvg(grid, palette, shapeIndex, backgroundIndex, contextHash);
  const imageB64 = Buffer.from(svg, 'utf8').toString('base64');
  const image = `data:image/svg+xml;base64,${imageB64}`;
  const name = `GridGit #${idStr}`;

  const metadata = {
    name,
    description: 'Deterministic on-chain SVG from your GitHub heatmap. Token ID encodes grid, shape, palette, and background.',
    image,
    image_data: svg,
    attributes: [
      { trait_type: 'Shape', value: getActualShapeName(shapeIndex) },
      { trait_type: 'Color Palette', value: PRESET_PALETTES[presetIndex]?.name ?? 'Unknown' },
      { trait_type: 'Background', value: getActualBackground(backgroundIndex).name },
      { display_type: 'number', trait_type: 'ContextHash', value: Number(contextHash) }
    ]
  } as const;

  return new NextResponse(JSON.stringify(metadata), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60' }
  });
}

// decodeTokenId function moved to shared library lib/nftRender.ts

// buildGridSvg moved to shared lib


