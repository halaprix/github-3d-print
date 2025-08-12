import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600; // seconds
export const dynamic = 'force-static';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  const username = params.username;
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
    body: JSON.stringify({ query, variables: { login: username } }),
    next: { revalidate }
  } as RequestInit & { next: { revalidate: number } });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: 'GitHub API error', details: text }, { status: 502 });
  }

  const data = await resp.json();
  const user = data?.data?.user;
  const weeks = user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
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
  // Rotate histogram 180° around vertical axis (mirror columns)
  for (let y = 0; y < rows; y++) {
    grid[y].reverse();
  }

  // Compute last 7-week period start/end (using original order, before reverse)
  let last7WeeksStart: string | null = null;
  let last7WeeksEnd: string | null = null;
  if (cols >= 7) {
    const startWeek = weeks[cols - 7];
    const endWeek = weeks[cols - 1];
    const startDay = startWeek?.contributionDays?.[0]?.date;
    const endDay = endWeek?.contributionDays?.[endWeek?.contributionDays?.length - 1]?.date;
    if (startDay && endDay) {
      last7WeeksStart = startDay;
      last7WeeksEnd = endDay;
    }
  }

  const profile = user
    ? { name: user.name ?? user.login, login: user.login, avatarUrl: user.avatarUrl as string, url: user.url as string }
    : null;

  return new NextResponse(JSON.stringify({ grid, profile, last7WeeksStart, last7WeeksEnd }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache at CDN/edge and allow brief SWR window
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
    }
  });
}

function colorToHeight(hex: string): number {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return 0;
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const intensity = 1 - luminance;
  return Math.max(0, Math.min(1, intensity));
}
