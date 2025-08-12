import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function buildSvg(tokenId: string, title?: string): string {
  const safeTitle = title?.slice(0, 80) ?? `GitHub 3D Print #${tokenId}`;
  const hue = Math.abs(hashString(tokenId)) % 360;
  const bg = `hsl(${hue}, 70%, 12%)`;
  const fg = `hsl(${(hue + 180) % 360}, 80%, 60%)`;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">',
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${fg}"/><stop offset="100%" stop-color="${bg}"/></linearGradient></defs>`,
    `<rect width="100%" height="100%" fill="${bg}"/>`,
    '<g transform="translate(100,100)">',
    `<rect x="0" y="0" width="1000" height="430" rx="24" fill="url(#g)" opacity="0.25"/>`,
    `<text x="500" y="160" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="72" fill="white">${escapeXml(safeTitle)}</text>`,
    `<text x="500" y="260" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system" font-size="40" fill="${fg}">Token #${escapeXml(tokenId)}</text>`,
    `<circle cx="150" cy="340" r="10" fill="${fg}"/>`,
    `<circle cx="200" cy="340" r="10" fill="${fg}" opacity="0.8"/>`,
    `<circle cx="250" cy="340" r="10" fill="${fg}" opacity="0.6"/>`,
    `<circle cx="300" cy="340" r="10" fill="${fg}" opacity="0.4"/>`,
    `<circle cx="350" cy="340" r="10" fill="${fg}" opacity="0.2"/>`,
    '</g>',
    '</svg>'
  ].join('');
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tokenId = params.id;
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? undefined;

  if (!tokenId || !/^[0-9]+$/.test(tokenId)) {
    return NextResponse.json({ error: 'Invalid token id' }, { status: 400 });
  }

  const svg = buildSvg(tokenId, title ?? undefined);
  const image = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  // Some marketplaces prefer `image_data` for inline SVG
  const name = title ?? `GitHub 3D Print #${tokenId}`;

  const metadata = {
    name,
    description: 'Dynamic SVG NFT for GitHub 3D Print. Base URI can be updated on-chain to point elsewhere later.',
    image,
    image_data: svg,
    attributes: [
      { trait_type: 'Token ID', value: tokenId }
    ]
  } satisfies Record<string, unknown>;

  return new NextResponse(JSON.stringify(metadata), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60'
    }
  });
}


