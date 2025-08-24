import { NextRequest, NextResponse } from 'next/server';

// Type definitions for the Talent Protocol API response
interface TalentScore {
  calculating_score: boolean;
  calculating_score_enqueued_at: string | null;
  last_calculated_at: string;
  points: number;
  slug: string;
}

interface TalentApiResponse {
  scores: TalentScore[];
}

// Type definition for our API response
interface BuilderScoreResponse {
  builderScore: number;
  creatorScore?: number;
  walletAddress: string;
  lastUpdated: string | null;
  scores: {
    builder: {
      points: number;
      lastCalculatedAt: string;
      calculating: boolean;
    } | null;
    creator: {
      points: number;
      lastCalculatedAt: string;
      calculating: boolean;
    } | null;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('address');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  const TALENT_API_KEY = process.env.TALENT_PROTOCOL_API_KEY;

  if (!TALENT_API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`https://api.talentprotocol.com/scores?id=${walletAddress}`, {
      headers: {
        'X-API-KEY': TALENT_API_KEY,
        "cache-control": "max-age=0, private, must-revalidate",
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Passport not found for this address' },
          { status: 404 }
        );
      }
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: TalentApiResponse = await response.json();

    // Find specific score types
    const builderScore = data.scores.find(score => score.slug === 'builder_score');
    const creatorScore = data.scores.find(score => score.slug === 'creator_score');

    const responseData: BuilderScoreResponse = {
      builderScore: builderScore?.points || 0,
      creatorScore: creatorScore?.points,
      walletAddress: walletAddress,
      lastUpdated: builderScore?.last_calculated_at || null,
      scores: {
        builder: builderScore ? {
          points: builderScore.points,
          lastCalculatedAt: builderScore.last_calculated_at,
          calculating: builderScore.calculating_score,
        } : null,
        creator: creatorScore ? {
          points: creatorScore.points,
          lastCalculatedAt: creatorScore.last_calculated_at,
          calculating: creatorScore.calculating_score,
        } : null,
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching builder score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builder score' },
      { status: 500 }
    );
  }
}
