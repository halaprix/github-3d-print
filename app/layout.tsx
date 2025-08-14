import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next"
import { getOpenSeaCollectionUrl } from '@/lib/opensea';
import dynamic from 'next/dynamic';
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GridGit - GitHub Activity NFTs',
  description: 'Transform your GitHub contribution history into unique, on-chain NFTs. Mint deterministic SVGs and generate 3D-printable skylines from your coding activity.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mozilla+Headline:wght@200..700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
