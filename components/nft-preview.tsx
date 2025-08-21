"use client";

import { useMemo } from 'react';
import { deriveParams, quantizeToNibbles, buildGridSvg } from '@/lib/nftRender';
import { PRESET_PALETTES } from '@/lib/palettes';

interface NFTPreviewProps {
  user: string;
  period: { start: string; end: string } | null;
  grid: number[][];
  className?: string;
}

export function NFTPreview({ user, period, grid, className = "" }: NFTPreviewProps) {
  const svg = useMemo(() => {
    if (!period || !grid || grid.length === 0) return '';

    const derivedParams = deriveParams(user, period);
    const palette = PRESET_PALETTES[derivedParams.presetIndex]?.colors ?? PRESET_PALETTES[0].colors;
    const nibbles = quantizeToNibbles(grid);

    return buildGridSvg(nibbles, palette, derivedParams.shapeIndex, derivedParams.backgroundIndex, BigInt(derivedParams.contextHash));
  }, [user, period, grid]);

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
