import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Proof of Work Squares',
  description: 'Degen on-chain art from your GitHub heatmap. Mint deterministic SVGs and generate 3D-printable skylines.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="navbar">
          <div className="nav-inner">
            <a href="/" className="brand">GitHub 3D Print</a>
            <div className="nav-search">
              <input className="search" placeholder="Search items, users, collections" />
            </div>
            <nav className="nav-links">
              <a href="/" className="nav-link">Explore</a>
              <a href="/secret" className="nav-link">Studio</a>
              <a href="https://opensea.io/collection/" target="_blank" rel="noreferrer" className="nav-link">OpenSea</a>
            </nav>
          </div>
        </header>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
