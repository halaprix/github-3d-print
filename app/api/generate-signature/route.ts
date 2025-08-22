import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface GenerateSignatureRequest {
    walletAddress: string;
    username: string;
}

export async function POST(req: NextRequest) {
    try {
        const { walletAddress, username  }: GenerateSignatureRequest = await req.json();
        const cookieStore = cookies();
        const githubToken = cookieStore.get('gh_token')?.value;

        if (!walletAddress || !githubToken) {
            return NextResponse.json(
                { error: 'Missing walletAddress or githubToken' },
                { status: 400 }
            );
        }

        // Verify the GitHub token by calling GitHub API
        const githubUser = await verifyGitHubToken(githubToken);
        if (!githubUser) {
            return NextResponse.json(
                { error: 'Invalid GitHub token' },
                { status: 401 }
            );
        }
        console.log('walletAddress', walletAddress);
        console.log('githubUser', githubUser);
        console.log('username', username);
        if (githubUser.login !== username) {
            return NextResponse.json(
                { error: 'Invalid GitHub username' },
                { status: 401 }
            );
        }

        // Get the signer private key from environment
        const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
        if (!signerPrivateKey) {
            console.error('SIGNER_PRIVATE_KEY not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Create wallet instance
        const wallet = new ethers.Wallet(signerPrivateKey);

        // Generate unique nonce (timestamp)
        const nonce = Date.now();

        // Create message hash exactly as the contract does
        const messageHash = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [walletAddress, nonce])
        );

        // Sign the message
        const signature = await wallet.signMessage(ethers.getBytes(messageHash));

        return NextResponse.json({
            signature,
            nonce,
            githubUser: githubUser.login,
            signerAddress: wallet.address
        });

    } catch (error: any) {
        console.error('Error generating signature:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function verifyGitHubToken(token: string): Promise<any | null> {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'gridgit-app'
            }
        });

        if (!response.ok) {
            console.error('GitHub API error:', response.status, response.statusText);
            return null;
        }

        const user = await response.json();
        return user;
    } catch (error: any) {
        console.error('Error verifying GitHub token:', error);
        return null;
    }
}
