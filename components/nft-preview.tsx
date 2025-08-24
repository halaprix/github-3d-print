"use client";

import { useMemo, useState, useEffect } from 'react';
import { deriveParams, quantizeToNibbles, buildGridSvg } from '@/lib/nftRender';
import { PRESET_PALETTES } from '@/lib/palettes';

interface NFTPreviewProps {
  user: string;
  period: { start: string; end: string } | null;
  grid: number[][];
  className?: string;
  walletAddress?: string; // Optional wallet address to fetch talent score
}

export function NFTPreview({ user, period, grid, className = "", walletAddress }: NFTPreviewProps) {
  const [talentScore, setTalentScore] = useState<number | undefined>(undefined);
  const [talentScoreLoading, setTalentScoreLoading] = useState(false);

  // Fetch talent score when wallet address is provided
  useEffect(() => {
    const fetchTalentScore = async () => {
      if (!walletAddress) return;

      setTalentScoreLoading(true);
      try {
        const response = await fetch(`/api/talent-score?address=${encodeURIComponent(walletAddress)}`);
        if (response.ok) {
          const data = await response.json();
          setTalentScore(data.builderScore || 0);
        }
      } catch (error) {
        console.error('Failed to fetch talent score:', error);
      } finally {
        setTalentScoreLoading(false);
      }
    };

    fetchTalentScore();
  }, [walletAddress]);


  const svg = useMemo(() => {
    if (!period || !grid || grid.length === 0) return '';

    const derivedParams = deriveParams(user, period);
    const palette = PRESET_PALETTES[derivedParams.presetIndex]?.colors ?? PRESET_PALETTES[0].colors;
    const nibbles = quantizeToNibbles(grid);

    return buildGridSvg(nibbles, palette, derivedParams.shapeIndex, derivedParams.backgroundIndex, BigInt(derivedParams.contextHash), talentScore);
  }, [user, period, grid, talentScore]);

  if (!svg) {
    return (
      <div className={`flex items-center justify-center bg-background-secondary rounded-xl border border-border-default ${className}`}>
        <p className="text-text-secondary">Loading NFT preview...</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-background-secondary rounded-xl border border-border-default overflow-hidden ${className}`}>
      <div
        className="w-full h-full flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
