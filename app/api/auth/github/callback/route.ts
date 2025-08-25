import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type GhTokenResp = { access_token?: string; token_type?: string; scope?: string; error?: string };

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const cookieState = req.cookies.get('gh_oauth_state')?.value;
	const origin = url.origin;
	const redirect = (path: string) => NextResponse.redirect(new URL(path, origin).toString());
	if (!code || !state || !cookieState || cookieState !== state) {
		return redirect('/studio');
	}
	const clientId = process.env.GITHUB_CLIENT_ID || '';
	const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    let accessToken: string | undefined;
    try {
        const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
        });
        const tokenJson = await tokenResp.json() as GhTokenResp;
        accessToken = tokenJson.access_token;
        if (!accessToken) {
            const res = redirect('/studio');
            res.cookies.set('gh_oauth_error', Buffer.from(JSON.stringify(tokenJson)).toString('base64'), { httpOnly: true, path: '/', maxAge: 300 });
            return res;
        }
    } catch (e: any) {
        const res = redirect('/studio');
        res.cookies.set('gh_oauth_error', Buffer.from(String(e?.message || e || 'token_error')).toString('base64'), { httpOnly: true, path: '/', maxAge: 300 });
        return res;
    }
    let userJson: any = {};
    try {
        const userResp = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'gridgit-app' }
        });
        userJson = await userResp.json();
    } catch (e: any) {
        const res = redirect('/studio');
        res.cookies.set('gh_oauth_error', Buffer.from(String(e?.message || e || 'profile_error')).toString('base64'), { httpOnly: true, path: '/', maxAge: 300 });
        return res;
    }
	const profile = { login: userJson.login, name: userJson.name, avatarUrl: userJson.avatar_url };
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>GitHub Auth</title>
    </head>
    <body>
        <script>
            const profile = ${JSON.stringify(profile)};
            const accessToken = '${accessToken}';

            // Let the opener know login finished with full profile data and token
            if (window.opener) {
                console.log('Sending GitHub auth message to opener:', { profile, hasToken: !!accessToken });
                window.opener.postMessage({
                    success: true,
                    profile: profile,
                    accessToken: accessToken,
                    type: 'github-auth'
                }, "*");

                // Small delay to ensure message is sent before closing
                setTimeout(() => {
                    window.close();
                }, 100);
            } else {
                // fallback if opened in full tab
                window.location.href = "/studio";
            }
        </script>
    </body>
    </html>
  `;
  
  const res = new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
  console.log('res', res);
  // set your cookies as before
  res.cookies.set('gh_profile', Buffer.from(JSON.stringify(profile)).toString('base64'), { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 });
  res.cookies.set('gh_token', accessToken, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 });
  
  return res;
}


