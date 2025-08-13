import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
	const cookie = req.cookies.get('gh_profile')?.value;
	if (!cookie) return NextResponse.json({}, { status: 200 });
	try {
		const json = JSON.parse(Buffer.from(cookie, 'base64').toString('utf8'));
		return NextResponse.json(json, { status: 200 });
	} catch {
		return NextResponse.json({}, { status: 200 });
	}
}


