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
 * Convert CSS background to SVG-compatible format
 */
function convertBackgroundToSvg(background: BackgroundTheme, width: number, height: number): { bgFill: string; bgDefs: string } {
	const value = background.value;
	
	if (background.type === 'solid') {
		// Solid colors work directly
		return { bgFill: value, bgDefs: '' };
	}
	
	if (background.type === 'gradient' || background.type === 'pattern') {
		// Parse CSS gradient and convert to SVG
		const gradientId = `bg-${background.id}`;
		
		if (value.includes('linear-gradient')) {
			// Parse linear gradient: linear-gradient(135deg, #0a0a0f 0%, #4a0e4a 100%)
			const match = value.match(/linear-gradient\(([^)]+)\)/);
			if (match) {
				const parts = match[1].split(',').map(p => p.trim());
				const angle = parts[0].includes('deg') ? parseFloat(parts[0]) : 135;
				const stops = parts.slice(1);
				
				// Convert angle to SVG coordinates
				const rad = (angle - 90) * Math.PI / 180;
				const x1 = 50 + 50 * Math.cos(rad);
				const y1 = 50 + 50 * Math.sin(rad);
				const x2 = 50 - 50 * Math.cos(rad);
				const y2 = 50 - 50 * Math.sin(rad);
				
				const stopElements = stops.map(stop => {
					const stopMatch = stop.match(/(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\s+(\d+)%/);
					if (stopMatch) {
						return `<stop offset="${stopMatch[2]}%" stop-color="${stopMatch[1]}"/>`;
					}
					return '';
				}).join('');
				
				const bgDefs = `<defs><linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stopElements}</linearGradient></defs>`;
				return { bgFill: `url(#${gradientId})`, bgDefs };
			}
		}
		
		if (value.includes('radial-gradient')) {
			// Parse radial gradient: radial-gradient(circle at 25% 25%, #0a0f1a 0%, #00E5FF 100%)
			const match = value.match(/radial-gradient\(([^)]+)\)/);
			if (match) {
				const parts = match[1].split(',').map(p => p.trim());
				let cx = '50%', cy = '50%';
				
				// Extract center position if specified
				const positionPart = parts.find(p => p.includes('at'));
				if (positionPart) {
					const posMatch = positionPart.match(/at\s+(\d+%)\s+(\d+%)/);
					if (posMatch) {
						cx = posMatch[1];
						cy = posMatch[2];
					}
				}
				
				// Extract color stops
				const colorParts = parts.filter(p => p.includes('#') || p.match(/\d+%/));
				const stopElements = colorParts.map(stop => {
					const stopMatch = stop.match(/(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\s+(\d+)%/);
					if (stopMatch) {
						return `<stop offset="${stopMatch[2]}%" stop-color="${stopMatch[1]}"/>`;
					}
					return '';
				}).join('');
				
				const bgDefs = `<defs><radialGradient id="${gradientId}" cx="${cx}" cy="${cy}" r="70%">${stopElements}</radialGradient></defs>`;
				return { bgFill: `url(#${gradientId})`, bgDefs };
			}
		}
	}
	
	// Fallback to solid color
	return { bgFill: '#0a0f1a', bgDefs: '' };
}

export function buildGridSvg(nibbleGrid: number[][], palette: string[], shapeIndex: number, backgroundIndex: number = 0): string {
	const rows = 7, cols = 7;
	const cell = 40, gap = 6;
	const width = cols * cell + (cols - 1) * gap;
	const height = rows * cell + (rows - 1) * gap;
	
	const background = BACKGROUND_THEMES[backgroundIndex] || BACKGROUND_THEMES[0];
	// console.log('🎨 Selected background:', background); // Debug
	
	// Convert CSS gradients to SVG format
	const { bgFill, bgDefs } = convertBackgroundToSvg(background, width, height);
	const shapes: string[] = [];
	const inset = Math.max(1, Math.floor(cell * 0.12));
	const draw = (vx: number, vy: number, fill: string) => {
		const cx = vx + cell / 2;
		const cy = vy + cell / 2;
		switch (shapeIndex) {
			case 0: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" rx="${Math.floor(cell * 0.22)}" ry="${Math.floor(cell * 0.22)}" fill="${fill}"/>`;
			case 1: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" fill="${fill}"/>`;
			case 2: {
				const r = Math.max(1, cell / 2 - inset);
				return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
			}
			case 3: {
				const p = [ `${cx},${vy + inset}`, `${vx + cell - inset},${cy}`, `${cx},${vy + cell - inset}`, `${vx + inset},${cy}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 4: {
				const r = Math.max(1, cell / 2 - inset);
				const a = 0.866025403784;
				const p = [ `${cx - a * r},${cy - r / 2}`, `${cx},${cy - r}`, `${cx + a * r},${cy - r / 2}`, `${cx + a * r},${cy + r / 2}`, `${cx},${cy + r}`, `${cx - a * r},${cy + r / 2}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 5: {
				const p = [ `${cx},${vy + inset}`, `${vx + cell - inset},${vy + cell - inset}`, `${vx + inset},${vy + cell - inset}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 6: {
				const r = Math.max(1, cell / 2 - inset);
				return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.3}" ry="${r * 0.8}" fill="${fill}"/>`;
			}
			case 7: {
				const r = Math.max(1, cell / 2 - inset);
				const a = 0.7071067811865476;
				const p = [ `${cx - a * r},${cy - a * r}`, `${cx + a * r},${cy - a * r}`, `${cx + a * r},${cy + a * r}`, `${cx - a * r},${cy + a * r}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 8: {
				const r = Math.max(1, cell / 2 - inset);
				const p = [ `${cx},${vy + inset}`, `${vx + cell - inset},${cy}`, `${cx},${vy + cell - inset}`, `${vx + inset},${cy}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 9: {
				const r = Math.max(1, cell / 2 - inset);
				const a = 0.866025403784;
				const p = [ `${cx},${vy + inset}`, `${cx - a * r},${cy + r / 2}`, `${cx + a * r},${cy + r / 2}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 10: {
				const r = Math.max(1, cell / 2 - inset);
				return `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z" fill="${fill}"/>`;
			}
			case 11: {
				const r = Math.max(1, cell / 2 - inset);
				const a = 0.7071067811865476;
				const p = [ `${cx},${vy + inset}`, `${cx + a * r},${cy - a * r}`, `${cx},${vy + cell - inset}`, `${cx - a * r},${cy - a * r}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 12: {
				const r = Math.max(1, cell / 2 - inset);
				const a = 0.866025403784;
				const p = [ `${cx},${vy + inset}`, `${cx - a * r},${cy - r / 2}`, `${cx + a * r},${cy - r / 2}`, `${cx + a * r},${cy + r / 2}`, `${cx - a * r},${cy + r / 2}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 13: {
				const r = Math.max(1, cell / 2 - inset);
				return `<path d="M ${cx - r} ${cy} Q ${cx} ${vy + inset} ${cx + r} ${cy} Q ${cx} ${vy + cell - inset} ${cx - r} ${cy} Z" fill="${fill}"/>`;
			}
			case 14: {
				const r = Math.max(1, cell / 2 - inset);
				const a = 0.7071067811865476;
				const p = [ `${cx - a * r},${cy - a * r}`, `${cx + a * r},${cy - a * r}`, `${cx + a * r},${cy + a * r}`, `${cx - a * r},${cy + a * r}` ].join(' ');
				return `<polygon points="${p}" fill="${fill}"/>`;
			}
			case 15: {
				const r = Math.max(1, cell / 2 - inset);
				return `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z" fill="${fill}"/>`;
			}
			default: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" rx="${Math.floor(cell * 0.22)}" ry="${Math.floor(cell * 0.22)}" fill="${fill}"/>`;
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
			const vx = x * (cell + gap);
			const vy = y * (cell + gap);
			const nibble = nibbleGrid[y][x] || 0;
			const fill = colorFor(nibble);
			shapes.push(draw(vx, vy, fill));
		}
	}
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision" preserveAspectRatio="xMidYMid meet">\n${bgDefs}\n<rect x="0" y="0" width="${width}" height="${height}" fill="${bgFill}"/>\n${shapes.join('\n')}\n</svg>`;
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

