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
      <body className={inter.className}>
        <header className="navbar">
          <div className="nav-inner">
            <a href="/" className="brand" style={{ 
              fontSize: '1.5rem', 
              background: 'linear-gradient(135deg, #ff2db3, #8a2be2)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontWeight: 900
            }}>
              GridGit
            </a>
            <div className="nav-search">
              <input className="search" placeholder="Search NFTs, users, collections..." />
            </div>
            <nav className="nav-links">
              <a href="/" className="nav-link">Home</a>
              <a href="/studio" className="nav-link">Studio</a>
              <a href="/test_studio" className="nav-link">Test Studio</a>
              <a href="/gallery" className="nav-link">Gallery</a>
              <a href={getOpenSeaCollectionUrl()} target="_blank" rel="noreferrer" className="nav-link">OpenSea</a>
              <WalletConnect />
            </nav>
          </div>
        </header>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
