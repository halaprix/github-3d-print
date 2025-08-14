import { NextRequest, NextResponse } from 'next/server';
import { PRESET_PALETTES } from '@/lib/palettes';
import { BACKGROUND_THEMES } from '@/lib/backgrounds';
import { buildGridSvg } from '@/lib/nftRender';

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
  const svg = buildGridSvg(grid, palette, shapeIndex, backgroundIndex);
  const imageB64 = Buffer.from(svg, 'utf8').toString('base64');
  const image = `data:image/svg+xml;base64,${imageB64}`;
  const name = `GridGit #${idStr}`;
  
  const shapeNames = [
    'Rounded Square', 'Square', 'Circle', 'Diamond', 'Hexagon', 'Triangle',
    'Oval', 'Rhombus', 'Cross', 'Upside Triangle', 'Semicircle', 'Arrow',
    'Star', 'Wave', 'Diamond', 'Circle'
  ];
  
  const metadata = {
    name,
    description: 'Deterministic on-chain SVG from your GitHub heatmap. Token ID encodes grid, shape, palette, and background.',
    image,
    image_data: svg,
    attributes: [
      { trait_type: 'Shape', value: shapeNames[shapeIndex] ?? 'Rounded Square' },
      { trait_type: 'Color Palette', value: PRESET_PALETTES[presetIndex]?.name ?? 'Unknown' },
      { trait_type: 'Background', value: BACKGROUND_THEMES[backgroundIndex]?.name ?? 'Unknown' },
      { display_type: 'number', trait_type: 'ContextHash', value: Number(contextHash) }
    ]
  } as const;

  return new NextResponse(JSON.stringify(metadata), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60' }
  });
}

function decodeTokenId(id: bigint): { grid: number[][]; shapeIndex: number; presetIndex: number; backgroundIndex: number; contextHash: bigint } | null {
  const version = Number((id >> 234n) & 0xffn);
  if (version !== 1) return null;
  const shapeIndex = Number((id >> 196n) & 0xfn);
  const presetIndex = Number((id >> 200n) & 0x7n);
  const backgroundIndex = Number((id >> 203n) & 0xfn);
  const contextHash = (id >> 207n) & 0xffffffffn;
  const flat: number[] = [];
  for (let i = 0; i < 49; i++) {
    const nibble = Number((id >> BigInt(i * 4)) & 0xfn);
    flat.push(nibble);
  }
  const grid: number[][] = [];
  for (let y = 0; y < 7; y++) grid.push(flat.slice(y * 7, y * 7 + 7));
  return { grid, shapeIndex, presetIndex, backgroundIndex, contextHash };
}

// buildGridSvg moved to shared lib


