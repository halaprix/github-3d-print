import { NextRequest, NextResponse } from 'next/server';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing GITHUB_TOKEN on server' }, { status: 500 });
  }

  const query = `query($login:String!){
    user(login:$login){
      name
      login
      avatarUrl
      url
      contributionsCollection{
        contributionCalendar{
          totalContributions
          weeks{ contributionDays{ contributionCount color date } }
        }
      }
    }
  }`;

  const resp = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'github-3d-print-app'
    },
    body: JSON.stringify({ query, variables: { login: username } })
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: 'GitHub API error', details: text }, { status: 502 });
  }

  const data = await resp.json();
  const user = data?.data?.user;
  const weeks = user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  // weeks is array of 7-day blocks; we want a grid rows=7 (days), columns=weeks
  const rows = 7;
  const cols = weeks.length;
  const grid: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  for (let x = 0; x < cols; x++) {
    const days = weeks[x]?.contributionDays ?? [];
    for (let y = 0; y < Math.min(7, days.length); y++) {
      const color: string | undefined = days[y]?.color;
      grid[y][x] = color ? colorToHeight(color) : 0;
    }
  }

  const profile = user
    ? { name: user.name ?? user.login, login: user.login, avatarUrl: user.avatarUrl as string, url: user.url as string }
    : null;

  return NextResponse.json({ grid, profile });
}

function colorToHeight(hex: string): number {
  // Expect formats like #RRGGBB
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return 0;
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  // sRGB to linear
  const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B; // 0..1
  const intensity = 1 - luminance; // darker = taller
  // clamp to [0,1]
  return Math.max(0, Math.min(1, intensity));
}
