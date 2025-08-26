import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next"
import { getOpenSeaCollectionUrl } from '@/lib/opensea';
import dynamic from 'next/dynamic';
import { RainbowProvider } from '@/components/rainbow-provider'
import { ToastProvider } from '@/components/Toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'GridGit - GitHub Contribution NFTs',
  description: 'Mint unique NFTs from your GitHub contribution history',
  other: {
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://gridgit.halaprix.com/og-image.svg",
      button: {
        title: "🚀 Mint NFT",
        action: {
          type: "launch_miniapp",
          name: "GridGit",
          url: "https://gridgit.halaprix.com",
          splashImageUrl: "https://gridgit.halaprix.com/icon.svg",
          splashBackgroundColor: "#0a0f1a"
        }
      }
    }),
    'fc:frame': JSON.stringify({
      version: "1",
      imageUrl: "https://gridgit.halaprix.com/og-image.svg",
      button: {
        title: "🚀 Mint NFT",
        action: {
          type: "launch_frame",
          name: "GridGit",
          url: "https://gridgit.halaprix.com",
          splashImageUrl: "https://gridgit.halaprix.com/icon.svg",
          splashBackgroundColor: "#0a0f1a"
        }
      }
    })
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mozilla+Headline:wght@200..700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background-primary text-text-primary font-sans antialiased">
        <RainbowProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </RainbowProvider>
        <Analytics />
      </body>
    </html>
  )
}
