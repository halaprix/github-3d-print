import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type GhTokenResp = { access_token?: string; token_type?: string; scope?: string; error?: string };

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const cookieState = req.cookies.get('gh_oauth_state')?.value;
	if (!code || !state || !cookieState || cookieState !== state) {
		return NextResponse.redirect('/studio');
	}
	const clientId = process.env.GITHUB_CLIENT_ID || '';
	const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
	const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
		body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
	});
	const tokenJson = await tokenResp.json() as GhTokenResp;
	const accessToken = tokenJson.access_token;
	if (!accessToken) {
		return NextResponse.redirect('/studio');
	}
	const userResp = await fetch('https://api.github.com/user', {
		headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'gridgit-app' }
	});
	const userJson = await userResp.json();
	const profile = { login: userJson.login, name: userJson.name, avatarUrl: userJson.avatar_url };
	const res = NextResponse.redirect('/studio');
	res.cookies.set('gh_profile', Buffer.from(JSON.stringify(profile)).toString('base64'), { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 });
	res.cookies.set('gh_token', accessToken, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 });
	return res;
}


