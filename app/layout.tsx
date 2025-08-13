import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next"
import { getOpenSeaCollectionUrl } from '@/lib/opensea';
import dynamic from 'next/dynamic';
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GridGit',
  description: 'On-chain art from your GitHub heatmap. Mint deterministic SVGs and generate 3D-printable skylines.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="navbar">
          <div className="nav-inner">
            <a href="/" className="brand">GridGit</a>
            <div className="nav-search">
              <input className="search" placeholder="Search items, users, collections" />
            </div>
            <nav className="nav-links">
              <a href="/" className="nav-link">Explore</a>
              <a href="/studio" className="nav-link">Studio</a>
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
