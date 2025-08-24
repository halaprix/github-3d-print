import { PRESET_PALETTES } from '@/lib/palettes';
import { BACKGROUND_THEMES, BackgroundTheme } from '@/lib/backgrounds';

// Token ID bit layout constants for easier maintenance
// UPDATED: Background now uses 4 bits to support 16 backgrounds (0-15)
// - Preset: 4 bits (0-15) for 16 palettes
// - Background: 4 bits (0-15) for 16 backgrounds (was 3 bits, now 4 bits)
export const TOKEN_ID_LAYOUT = {
	GRID_START: 0,
	GRID_END: 195,        // 49 * 4 - 1
	SHAPE_START: 196,
	SHAPE_END: 199,       // 4 bits
	PRESET_START: 200,
	PRESET_END: 203,      // 4 bits for 16 palettes
	BACKGROUND_START: 204,
	BACKGROUND_END: 207,  // 4 bits for 16 backgrounds (UPDATED: was 3 bits)
	CONTEXT_START: 208,
	CONTEXT_END: 239,     // 32 bits (shifted by 1 bit)
	VERSION_START: 240,
	VERSION_END: 243,     // 4 bits (shifted by 1 bit)
	TOTAL_BITS: 243
} as const;

export type Period = { start: string; end: string } | null;

export function fnv1a32(str: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

export function deriveParams(user: string, period: Period): { shapeIndex: number; presetIndex: number; backgroundIndex: number; contextHash: number } {
	const key = `${user || ''}|${period?.start || ''}|${period?.end || ''}`;
	const hash = fnv1a32(key);
	const shapeIndex = hash & 0xf; // 0..15 (4 bits)
	const presetIndex = (hash >>> 4) % Math.max(1, PRESET_PALETTES.length);
	const backgroundIndex = (hash >>> 8) % Math.max(1, BACKGROUND_THEMES.length);

	// Debug: sprawdź wygenerowane wartości (uncomment for debugging)
	// console.log('🔧 deriveParams debug:', { user, period, key, hash: hash.toString(16), shapeIndex, presetIndex, backgroundIndex });

	return { shapeIndex, presetIndex, backgroundIndex, contextHash: hash };
}

// Quantize a 7x7 grid of contribution counts to 0..15 nibbles exactly like token packing
export function quantizeToNibbles(grid: number[][]): number[][] {
	const rows = 7, cols = 7;
	const max = Math.max(1, ...grid.flat());
	const out: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const v = grid[y][x] || 0;
			const t = Math.max(0, Math.min(1, v / max));
			out[y][x] = Math.max(0, Math.min(15, Math.round(t * 15)));
		}
	}
	return out;
}

/**
 * Encode NFT components into a deterministic token ID
 * 
 * FIXED: Previous version had overlapping bit fields causing version corruption
 * - Context hash (32 bits) was overlapping with version (8 bits)
 * - This caused "malformed id" errors and incorrect version numbers
 * 
 * New layout ensures no overlap and correct allocation:
 * - Grid: bits 0-195 (49 * 4 bits)
 * - Shape: bits 196-199 (4 bits)
 * - Preset: bits 200-203 (4 bits) - supports 16 palettes
 * - Background: bits 204-207 (4 bits) - UPDATED: now supports 16 backgrounds
 * - Context Hash: bits 208-239 (32 bits) - shifted by 1 bit
 * - Version: bits 240-243 (4 bits) - shifted by 1 bit
 */
export function encodeTokenIdFromComponents(nibbleGrid: number[][], shapeIndex: number, presetIndex: number, backgroundIndex: number, contextHash: number): bigint {
	let id = 0n;
	// pack 49 nibbles little-endian (bits 0-195)
	let i = 0;
	for (let y = 0; y < 7; y++) {
		for (let x = 0; x < 7; x++) {
			const nib = nibbleGrid[y][x] & 0xf;
			id |= BigInt(nib) << BigInt(i * 4);
			i++;
		}
	}
	
	// Pack metadata using layout constants for consistency
	id |= BigInt(shapeIndex & 0xf) << BigInt(TOKEN_ID_LAYOUT.SHAPE_START);
	id |= BigInt(presetIndex & 0xf) << BigInt(TOKEN_ID_LAYOUT.PRESET_START);      // FIXED: 4 bits for 16 palettes
	id |= BigInt(backgroundIndex & 0xf) << BigInt(TOKEN_ID_LAYOUT.BACKGROUND_START); // UPDATED: 4 bits for 16 backgrounds
	id |= BigInt(contextHash >>> 0) << BigInt(TOKEN_ID_LAYOUT.CONTEXT_START);
	id |= 1n << BigInt(TOKEN_ID_LAYOUT.VERSION_START); // version 1
	
	return id;
}

/**
 * Convert background theme to SVG-compatible format using pre-defined SVG definitions
 */
function convertBackgroundToSvg(background: BackgroundTheme, width: number, height: number): { bgFill: string; bgDefs: string; bgFilter: string; bgOverlay: string } {
	if (background.type === 'solid') {
		return {
			bgFill: background.value,
			bgDefs: '',
			bgFilter: '',
			bgOverlay: ''
		};
	}

	if (background.type === 'svg') {
		let bgDefs = background.svgDefs || '';
		let bgOverlay = '';

		// Handle special overlay cases
		if (background.id === 4) { // Glassmorphic
			bgOverlay = `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad4)"/>`;
		} else if (background.id === 13) { // Frog Green Strata
			bgOverlay = `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGrad13)"/>`;
		} else if (background.id === 5) { // Biome Grid base
			bgOverlay = `<rect x="0" y="0" width="${width}" height="${height}" fill="${background.baseColor}"/>`;
		} else if (background.id === 12) { // Golden Mesh base
			bgOverlay = `<rect x="0" y="0" width="${width}" height="${height}" fill="${background.baseColor}"/>`;
		} else if (background.id === 3) { // Icy Glitch base
			bgOverlay = `<rect x="0" y="0" width="${width}" height="${height}" fill="${background.baseColor}"/>`;
		}

		// Handle gradient fills properly - extract url reference without quotes
		let bgFill = background.value;
		if (background.svgFill) {
			if (background.svgFill.includes('url(')) {
				// For gradients and patterns, extract just the url reference
				const urlMatch = background.svgFill.match(/url\(#([^)]+)\)/);
				bgFill = urlMatch ? `url(#${urlMatch[1]})` : background.value;
			} else {
				// For solid colors, extract just the color value
				const colorMatch = background.svgFill.match(/fill="([^"]*)"/);
				bgFill = colorMatch ? colorMatch[1] : background.value;
			}
		}

		return {
			bgFill: bgFill,
			bgDefs: bgDefs,
			bgFilter: background.svgFilter || '',
			bgOverlay: bgOverlay
		};
	}

	// Fallback for old gradient/pattern types
	return {
		bgFill: '#0a0f1a',
		bgDefs: '',
		bgFilter: '',
		bgOverlay: ''
	};
}

export function buildGridSvg(nibbleGrid: number[][], palette: string[], shapeIndex: number, backgroundIndex: number = 0, contextHash: bigint = 0n, talentScore?: number): string {
	const rows = 7, cols = 7;
	const SVG_SIZE = 800; // Base size for calculations (will scale down to 80%)
	const padding = SVG_SIZE * 0.1; // 10% padding like in the demo
	const contentWidth = SVG_SIZE - padding * 2;
	const cellSize = contentWidth / 7;
	const gap = cellSize * 0.15; // 15% gap like in the demo
	const cell = cellSize - gap;
	const width = SVG_SIZE;
	const height = SVG_SIZE;

	const availableBackgrounds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	const mappedBackgroundIndex = availableBackgrounds[backgroundIndex % availableBackgrounds.length];
	const background = BACKGROUND_THEMES[mappedBackgroundIndex] || BACKGROUND_THEMES[0];
	// console.log('🎨 Selected background:', background); // Debug

	// Convert background to SVG format using new system
	const { bgFill, bgDefs, bgFilter, bgOverlay } = convertBackgroundToSvg(background, width, height);
	const shapes: string[] = [];
	const inset = Math.max(1, Math.floor(cell * 0.12));
	const draw = (vx: number, vy: number, fill: string, opacity: number = 1, contextHash: number = 0) => {
		const cx = vx + cell / 2;
		const cy = vy + cell / 2;

		// Helper function to create deterministic random for shape 5
		const deterministicRandom = (seed: number, max: number) => {
			const x = Math.sin(seed) * 10000;
			return Math.floor((x - Math.floor(x)) * max);
		};

		// Available shapes mapping: [0, 1, 2, 4, 14] + special case 5
		const availableShapes = [0, 1, 2, 3, 4, 5];
		const mappedShapeIndex = availableShapes[shapeIndex % availableShapes.length];

		switch (mappedShapeIndex) {
			case 0: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" rx="${Math.floor(cell * 0.22)}" ry="${Math.floor(cell * 0.22)}" fill="${fill}" fill-opacity="${opacity}"/>`;
			case 1: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" fill="${fill}" fill-opacity="${opacity}"/>`;
			case 2: {
				const r = Math.max(1, cell / 2 - inset);
				return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${opacity}"/>`;
			}
			case 3: {
				const r = Math.max(1, cell / 2 - inset);
				const a = 0.866025403784;
				const p = [ `${cx - a * r},${cy - r / 2}`, `${cx},${cy - r}`, `${cx + a * r},${cy - r / 2}`, `${cx + a * r},${cy + r / 2}`, `${cx},${cy + r}`, `${cx - a * r},${cy + r / 2}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}" fill-opacity="${opacity}"/>`;
			}
			case 4: {
				const r = Math.max(1, cell / 2 - inset);
				const a = 0.7071067811865476;
				const p = [ `${cx - a * r},${cy - a * r}`, `${cx + a * r},${cy - a * r}`, `${cx + a * r},${cy + a * r}`, `${cx - a * r},${cy + a * r}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}" fill-opacity="${opacity}"/>`;
			}
			case 5: {
				// Special case: randomly choose between shape 0 or 2 (same size, single shape)
				// Use contextHash to make it deterministic
				const elementSeed = contextHash + shapeIndex;
				const shapeType = deterministicRandom(elementSeed, 2); // 0 or 1

				if (shapeType === 0) {
					// Full-size rounded rectangle (shape 0)
					return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" rx="${Math.floor(cell * 0.22)}" ry="${Math.floor(cell * 0.22)}" fill="${fill}" fill-opacity="${opacity}"/>`;
				} else {
					// Full-size circle (shape 2)
					const r = Math.max(1, cell / 2 - inset);
					return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${opacity}"/>`;
				}
			}
			default: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" rx="${Math.floor(cell * 0.22)}" ry="${Math.floor(cell * 0.22)}" fill="${fill}" fill-opacity="${opacity}"/>`;
		}
	};
	const maxNibble = 15;
	const stops = palette.slice(1);
	const colorFor = (nibble: number) => {
		if (nibble <= 0) return palette[0] || '#0a0f1a';
		const t = nibble / maxNibble;
		const idx = Math.min(stops.length - 1, Math.floor(t * stops.length));
		return stops[idx] || '#1f6feb';
	};
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const vx = padding + x * cellSize + gap / 2;
			const vy = padding + y * cellSize + gap / 2;
			const nibble = nibbleGrid[y][x] || 0;
			const fill = colorFor(nibble);
			const opacity = 0.5 + (nibble / 15) * 0.5; // Like in the demo: 0.5 to 1.0
			// Pass contextHash for deterministic random shapes
			const cellContextHash = Number(contextHash) + y * 7 + x;
			shapes.push(draw(vx, vy, fill, opacity, cellContextHash));
		}
	}

	// Add talent score display if available
	let talentScoreElements = '';
	if (talentScore !== undefined && talentScore > 0) {
		// Position the talent score in the most bottom-right corner
		const scoreX = width - padding - 5;
		const scoreY = height - padding ;

		// Create background circles with 80% opacity
		talentScoreElements = `
<g>
	<!-- Background circles for the score -->
	<circle cx="${scoreX + 35}" cy="${scoreY + 15}" r="45" fill="${palette[1] || '#1f6feb'}" fill-opacity="0.8"/>
	<circle cx="${scoreX + 35}" cy="${scoreY + 15}" r="40" fill="${palette[1] || '#1f6feb'}" fill-opacity="0.7"/>

	<!-- Talent Protocol logo/icon -->
	<text x="${scoreX + 15}" y="${scoreY + 2}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${palette[0] || '#0a0f1a'}">★</text>

	<!-- Score value -->
	<text x="${scoreX + 35}" y="${scoreY + 22}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="${palette[0] || '#0a0f1a'}">${talentScore}</text>

	<!-- "TALENT" label -->
	<text x="${scoreX + 35}" y="${scoreY + 35}" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="${palette[0] || '#0a0f1a'}" opacity="0.8">TALENT</text>
</g>`;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="80%" height="auto" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision" preserveAspectRatio="xMidYMid meet">\n<defs>\n${bgDefs}\n</defs>\n${bgOverlay}\n<rect x="0" y="0" width="${width}" height="${height}" fill="${bgFill}"/>\n${bgFilter}\n<g>\n${shapes.join('\n')}\n</g>\n${talentScoreElements}\n</svg>`;
}

/**
 * Decode a token ID back into its components
 * This function mirrors the encoding logic in encodeTokenIdFromComponents
 */
export function decodeTokenId(id: bigint): { grid: number[][]; shapeIndex: number; presetIndex: number; backgroundIndex: number; contextHash: bigint } | null {
	try {
		// Extract version from bits 240-243 (4 bits) - UPDATED: shifted by 1 bit
		const version = Number((id >> BigInt(TOKEN_ID_LAYOUT.VERSION_START)) & 0xfn);
		
		// Validate version
		if (version !== 1) {
			console.log(`Token ID version mismatch: expected 1, got ${version}`);
			return null;
		}
		
		// Extract metadata components using layout constants
		const shapeIndex = Number((id >> BigInt(TOKEN_ID_LAYOUT.SHAPE_START)) & 0xfn);
		const presetIndex = Number((id >> BigInt(TOKEN_ID_LAYOUT.PRESET_START)) & 0xfn);      // FIXED: 4 bits for 16 palettes
		const backgroundIndex = Number((id >> BigInt(TOKEN_ID_LAYOUT.BACKGROUND_START)) & 0xfn); // UPDATED: 4 bits for 16 backgrounds
		const contextHash = (id >> BigInt(TOKEN_ID_LAYOUT.CONTEXT_START)) & 0xffffffffn;
		
		// Validate indices are within bounds
		if (shapeIndex >= 16 || presetIndex >= 16 || backgroundIndex >= 16) { // UPDATED: background now 16
			console.log(`Token ID indices out of bounds: shape=${shapeIndex}, preset=${presetIndex}, background=${backgroundIndex}`);
			return null;
		}
		
		// Extract grid data from bits 0-195 (49 * 4 bits)
		const flat: number[] = [];
		for (let i = 0; i < 49; i++) {
			const nibble = Number((id >> BigInt(i * 4)) & 0xfn);
			if (nibble > 15) {
				console.log(`Invalid nibble at position ${i}: ${nibble}`);
				return null;
			}
			flat.push(nibble);
		}
		
		// Convert flat array to 7x7 grid
		const grid: number[][] = [];
		for (let y = 0; y < 7; y++) {
			grid.push(flat.slice(y * 7, y * 7 + 7));
		}
		
		return { grid, shapeIndex, presetIndex, backgroundIndex, contextHash };
	} catch (error) {
		console.log(`Error decoding token ID: ${error}`);
		return null;
	}
}

/**
 * Debug utility to analyze a token ID and show its components
 * Useful for troubleshooting encoding/decoding issues
 */
export function debugTokenId(tokenId: bigint): void {
	console.log(`=== Token ID Debug: ${tokenId.toString()} ===`);
	console.log(`Binary: ${tokenId.toString(2).padStart(TOKEN_ID_LAYOUT.TOTAL_BITS, '0')}`);
	
	try {
		const decoded = decodeTokenId(tokenId);
		if (decoded) {
			console.log('✅ Decoded successfully:');
			console.log(`  Shape Index: ${decoded.shapeIndex}`);
			console.log(`  Preset Index: ${decoded.presetIndex}`);
			console.log(`  Background Index: ${decoded.backgroundIndex}`);
			console.log(`  Context Hash: ${decoded.contextHash}`);
			console.log(`  Grid: ${decoded.grid.flat().join(',')}`);
		} else {
			console.log('❌ Failed to decode token ID');
		}
	} catch (error) {
		console.log(`❌ Error during debug: ${error}`);
	}
	
	// Show raw bit extraction for manual verification
	const version = Number((tokenId >> BigInt(TOKEN_ID_LAYOUT.VERSION_START)) & 0xfn);
	const shape = Number((tokenId >> BigInt(TOKEN_ID_LAYOUT.SHAPE_START)) & 0xfn);
	const preset = Number((tokenId >> BigInt(TOKEN_ID_LAYOUT.PRESET_START)) & 0xfn);      // FIXED: 4 bits
	const background = Number((tokenId >> BigInt(TOKEN_ID_LAYOUT.BACKGROUND_START)) & 0xfn); // UPDATED: 4 bits for 16 backgrounds
	const context = Number((tokenId >> BigInt(TOKEN_ID_LAYOUT.CONTEXT_START)) & 0xffffffffn);
	
	console.log('Raw bit extraction:');
	console.log(`  Version (bits ${TOKEN_ID_LAYOUT.VERSION_START}-${TOKEN_ID_LAYOUT.VERSION_END}): ${version}`);
	console.log(`  Shape (bits ${TOKEN_ID_LAYOUT.SHAPE_START}-${TOKEN_ID_LAYOUT.SHAPE_END}): ${shape}`);
	console.log(`  Preset (bits ${TOKEN_ID_LAYOUT.PRESET_START}-${TOKEN_ID_LAYOUT.PRESET_END}): ${preset}`);
	console.log(`  Background (bits ${TOKEN_ID_LAYOUT.BACKGROUND_START}-${TOKEN_ID_LAYOUT.BACKGROUND_END}): ${background}`);
	console.log(`  Context (bits ${TOKEN_ID_LAYOUT.CONTEXT_START}-${TOKEN_ID_LAYOUT.CONTEXT_END}): ${context}`);
	console.log('=====================================');
}

/**
 * Map a background index to an available background index
 * This ensures we always get a valid background even if the original index points to an unavailable one
 */
export function mapBackgroundIndex(backgroundIndex: number): number {
  const availableBackgrounds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return availableBackgrounds[backgroundIndex % availableBackgrounds.length];
}

/**
 * Map a shape index to an available shape index
 * This ensures we always get a valid shape even if the original index points to an unavailable one
 */
export function mapShapeIndex(shapeIndex: number): number {
  const availableShapes = [0, 1, 2, 3, 4, 5];
  return availableShapes[shapeIndex % availableShapes.length];
}

/**
 * Get the actual background that will be rendered for a given background index
 * This accounts for the mapping from unavailable to available backgrounds
 */
export function getActualBackground(backgroundIndex: number): BackgroundTheme {
  const mappedIndex = mapBackgroundIndex(backgroundIndex);
  return BACKGROUND_THEMES[mappedIndex] || BACKGROUND_THEMES[0];
}

/**
 * Get the actual shape name that will be rendered for a given shape index
 * This accounts for the mapping from unavailable to available shapes
 */
export function getActualShapeName(shapeIndex: number): string {
  const shapeNames = [
    'Rounded Square', 'Square', 'Circle', 'Diamond', 'Hexagon', 'Triangle',
    'Oval', 'Rhombus', 'Cross', 'Upside Triangle', 'Semicircle', 'Arrow',
    'Star', 'Wave', 'Diamond', 'Circle'
  ];

  const mappedIndex = mapShapeIndex(shapeIndex);
  return shapeNames[mappedIndex] || 'Rounded Square';
}
