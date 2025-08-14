import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next"
import { getOpenSeaCollectionUrl } from '@/lib/opensea';
import dynamic from 'next/dynamic';
import { RainbowProvider } from '@/components/rainbow-provider'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GridGit - GitHub Contribution NFTs',
  description: 'Mint unique NFTs from your GitHub contribution history',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mozilla+Headline:wght@200..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <RainbowProvider>
          {children}
        </RainbowProvider>
        <Analytics />
      </body>
    </html>
  )
}
