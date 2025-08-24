"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HorizontalNav } from '@/components/horizontal-nav';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  image_data: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

interface NFTData {
  metadata: NFTMetadata;
  tokenId: string;
}

export default function NFTGalleryPage() {
  const params = useParams();
  const tokenId = params.id as string;

  const [nftData, setNftData] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenId) return;

    const fetchNFT = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/nft/${tokenId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch NFT: ${response.status}`);
        }

        const metadata = await response.json();
        setNftData({ metadata, tokenId });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load NFT');
      } finally {
        setLoading(false);
      }
    };

    fetchNFT();
  }, [tokenId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary">
        <HorizontalNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading NFT...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary">
        <HorizontalNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Error Loading NFT</h1>
              <p className="text-text-secondary mb-4">{error}</p>
              <button
                onClick={() => window.history.back()}
                className="button"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nftData) {
    return (
      <div className="min-h-screen bg-background-primary">
        <HorizontalNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">NFT Not Found</h1>
              <p className="text-text-secondary mb-4">No NFT found with ID: {tokenId}</p>
              <button
                onClick={() => window.history.back()}
                className="button"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { metadata } = nftData;

  return (
    <div className="min-h-screen bg-background-primary">
      <HorizontalNav />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => window.history.back()}
              className="button-sm"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{metadata.name}</h1>
              <p className="text-text-secondary">Token ID: {tokenId}</p>
            </div>
          </div>
          <p className="text-text-secondary max-w-2xl">{metadata.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Image */}
          <div className="card">
            <div className="card-header">
              <h2 className="title">NFT Preview</h2>
            </div>
            <div className="card-body">
              <div className="aspect-square bg-background-secondary rounded-xl overflow-hidden border border-border-default">
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: metadata.image_data }}
                />
              </div>
            </div>
          </div>

          {/* NFT Metadata */}
          <div className="space-y-6">
            {/* Attributes */}
            <div className="card">
              <div className="card-header">
                <h2 className="title">Attributes</h2>
                <p className="subtitle">NFT traits and properties</p>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {metadata.attributes.map((attr, index) => (
                    <div key={index} className="p-4 bg-background-elevated rounded-lg border border-border-default">
                      <div className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
                        {attr.trait_type}
                      </div>
                      <div className={`text-text-primary font-medium ${
                        attr.display_type === 'number' ? 'text-lg font-bold text-accent-primary' : ''
                      }`}>
                        {attr.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Raw Metadata */}
            <div className="card">
              <div className="card-header">
                <h2 className="title">Raw Metadata</h2>
                <p className="subtitle">Complete NFT metadata (for debugging)</p>
              </div>
              <div className="card-body">
                <pre className="text-xs text-text-secondary bg-background-elevated p-4 rounded-lg border border-border-default overflow-auto max-h-96">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="title">Actions</h2>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/api/nft/${tokenId}`;
                      navigator.clipboard.writeText(url);
                      // Simple feedback
                      const btn = document.activeElement as HTMLButtonElement;
                      const originalText = btn.textContent;
                      btn.textContent = 'Copied!';
                      setTimeout(() => btn.textContent = originalText, 1000);
                    }}
                    className="button w-full"
                  >
                    Copy API URL
                  </button>

                  <button
                    onClick={() => {
                      const svgData = metadata.image_data;
                      const blob = new Blob([svgData], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${metadata.name.replace(/\s+/g, '_')}.svg`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="button w-full"
                  >
                    Download SVG
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="button w-full"
                  >
                    Refresh NFT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

