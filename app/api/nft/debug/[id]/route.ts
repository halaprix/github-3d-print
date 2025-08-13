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
  const { version, grid, shapeIndex, presetIndex, contextHash } = decoded;
  const shapeName = ['rounded','pixel','circle','diamond','hex','triangle'][shapeIndex] ?? 'rounded';
  const preset = PRESET_PALETTES[presetIndex];
  return NextResponse.json({
    tokenId: idStr,
    version,
    shapeIndex,
    shapeName,
    presetIndex,
    presetName: preset?.name ?? 'Unknown',
    grid,
    contextHash: `0x${contextHash.toString(16)}`
  });
}

function decodeTokenId(id: bigint): { version: number; grid: number[][]; shapeIndex: number; presetIndex: number; contextHash: number } | null {
  const version = Number((id >> 234n) & 0xffn);
  if (version !== 1) return null;
  const shapeIndex = Number((id >> 196n) & 0x7n);
  const presetIndex = Number((id >> 199n) & 0x7n);
  const contextHash = Number((id >> 202n) & 0xffffffffn);
  const flat: number[] = [];
  for (let i = 0; i < 49; i++) {
    const nibble = Number((id >> BigInt(i * 4)) & 0xfn);
    flat.push(nibble);
  }
  const grid: number[][] = [];
  for (let y = 0; y < 7; y++) grid.push(flat.slice(y * 7, y * 7 + 7));
  return { version, grid, shapeIndex, presetIndex, contextHash };
}


