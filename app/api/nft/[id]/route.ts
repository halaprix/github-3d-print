import { NextRequest, NextResponse } from 'next/server';
import { PRESET_PALETTES } from '@/lib/palettes';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const idStr = params.id;
  if (!/^\d+$/.test(idStr)) {
    return NextResponse.json({ error: 'Invalid token id' }, { status: 400 });
  }
  const tokenId = BigInt(idStr);
  const decoded = decodeTokenId(tokenId);
  if (!decoded) return NextResponse.json({ error: 'Malformed token id' }, { status: 400 });
  const { grid, shapeIndex, presetIndex } = decoded;
  const palette = PRESET_PALETTES[presetIndex]?.colors ?? PRESET_PALETTES[0].colors;
  const svg = buildGridSvg(grid, palette, shapeIndex);
  const imageB64 = Buffer.from(svg, 'utf8').toString('base64');
  const image = `data:image/svg+xml;base64,${imageB64}`;
  const name = `GitHub 3D Print #${idStr}`;
  const metadata = {
    name,
    description: 'Deterministic SVG NFT for GitHub 3D Print. Token ID encodes grid, shape, and palette.',
    image,
    image_data: svg,
    attributes: [
      { trait_type: 'MimeType', value: 'image/svg+xml' },
      { trait_type: 'Encoding', value: 'base64' },
      { trait_type: 'Embedded', value: 'true' },
      { trait_type: 'Shape', value: ['rounded','pixel','circle','diamond','hex','triangle'][shapeIndex] ?? 'rounded' },
      { trait_type: 'Palette', value: PRESET_PALETTES[presetIndex]?.name ?? 'Unknown' }
    ]
  } as const;

  return new NextResponse(JSON.stringify(metadata), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60' }
  });
}

function decodeTokenId(id: bigint): { grid: number[][]; shapeIndex: number; presetIndex: number } | null {
  const version = Number((id >> 234n) & 0xffn);
  if (version !== 1) return null;
  const shapeIndex = Number((id >> 196n) & 0x7n);
  const presetIndex = Number((id >> 199n) & 0x7n);
  const flat: number[] = [];
  for (let i = 0; i < 49; i++) {
    const nibble = Number((id >> BigInt(i * 4)) & 0xfn);
    flat.push(nibble);
  }
  const grid: number[][] = [];
  for (let y = 0; y < 7; y++) grid.push(flat.slice(y * 7, y * 7 + 7));
  return { grid, shapeIndex, presetIndex };
}

function buildGridSvg(grid: number[][], palette: string[], shapeIndex: number): string {
  const rows = 7, cols = 7;
  const cell = 40, gap = 6;
  const width = cols * cell + (cols - 1) * gap;
  const height = rows * cell + (rows - 1) * gap;
  const bg = palette[0] || '#0a0f1a';
  const shapes: string[] = [];
  const inset = Math.max(1, Math.floor(cell * 0.12));
  const draw = (vx: number, vy: number, fill: string) => {
    const cx = vx + cell / 2;
    const cy = vy + cell / 2;
    switch (shapeIndex) {
      case 1: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" fill="${fill}"/>`;
      case 0: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" rx="${Math.floor(cell * 0.22)}" ry="${Math.floor(cell * 0.22)}" fill="${fill}"/>`;
      case 2: {
        const r = Math.max(1, cell / 2 - inset);
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
      }
      case 3: {
        const p = [ `${cx},${vy + inset}`, `${vx + cell - inset},${cy}`, `${cx},${vy + cell - inset}`, `${vx + inset},${cy}` ].join(' ');
        return `<polygon points="${p}" fill="${fill}"/>`;
      }
      case 4: {
        const r = Math.max(1, cell / 2 - inset);
        const a = 0.866025403784;
        const p = [ `${cx - a * r},${cy - r / 2}`, `${cx},${cy - r}`, `${cx + a * r},${cy - r / 2}`, `${cx + a * r},${cy + r / 2}`, `${cx},${cy + r}`, `${cx - a * r},${cy + r / 2}` ].join(' ');
        return `<polygon points="${p}" fill="${fill}"/>`;
      }
      case 5: {
        const p = [ `${cx},${vy + inset}`, `${vx + cell - inset},${vy + cell - inset}`, `${vx + inset},${vy + cell - inset}` ].join(' ');
        return `<polygon points="${p}" fill="${fill}"/>`;
      }
      default: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" fill="${fill}"/>`;
    }
  };
  const maxNibble = 15;
  const stops = palette.slice(1);
  const colorFor = (nibble: number) => {
    if (nibble <= 0) return palette[0] || '#0a0f1a';
    const t = nibble / maxNibble;
    const idx = Math.min(stops.length - 1, Math.floor(t * stops.length));
    return stops[idx] || '#1f6feb';
  };
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const vx = x * (cell + gap);
      const vy = y * (cell + gap);
      const nibble = grid[y][x] || 0;
      const fill = colorFor(nibble);
      shapes.push(draw(vx, vy, fill));
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision" preserveAspectRatio="xMidYMid meet">\n<rect x="0" y="0" width="${width}" height="${height}" fill="${bg}"/>\n${shapes.join('\\n')}\n</svg>`;
}


