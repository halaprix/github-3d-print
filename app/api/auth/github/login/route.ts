import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
	const clientId = process.env.GITHUB_CLIENT_ID || '';
	// Prefer explicit base url, else infer from request headers
	const base = (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, ''))
		|| inferBaseUrl(req);
	if (!clientId) {
		return NextResponse.json({ error: 'Missing GITHUB_CLIENT_ID' }, { status: 500 });
	}
	if (!base) {
		return NextResponse.json({ error: 'Unable to determine base URL. Set NEXT_PUBLIC_BASE_URL.' }, { status: 500 });
	}
	const redirectUri = `${base}/api/auth/github/callback`;
	const state = Math.random().toString(36).slice(2);
	const url = new URL('https://github.com/login/oauth/authorize');
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('scope', 'read:user');
	url.searchParams.set('state', state);
	const res = NextResponse.redirect(url.toString());
	res.cookies.set('gh_oauth_state', state, { httpOnly: true, path: '/', maxAge: 600 });
	return res;
}

function inferBaseUrl(req: NextRequest): string {
	const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
	const proto = req.headers.get('x-forwarded-proto') || 'http';
	if (!host) return '';
	return `${proto}://${host}`;
}


