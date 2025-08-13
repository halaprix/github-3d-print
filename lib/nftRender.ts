import { PRESET_PALETTES } from '@/lib/palettes';

export type Period = { start: string; end: string } | null;

export function fnv1a32(str: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

export function deriveParams(user: string, period: Period): { shapeIndex: number; presetIndex: number; contextHash: number } {
	const key = `${user || ''}|${period?.start || ''}|${period?.end || ''}`;
	const hash = fnv1a32(key);
	const shapeIndex = hash & 0x7; // 0..7
	const presetIndex = (hash >>> 3) % Math.max(1, PRESET_PALETTES.length);
	return { shapeIndex, presetIndex, contextHash: hash };
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

export function encodeTokenIdFromComponents(nibbleGrid: number[][], shapeIndex: number, presetIndex: number, contextHash: number): bigint {
	let id = 0n;
	// pack 49 nibbles little-endian
	let i = 0;
	for (let y = 0; y < 7; y++) {
		for (let x = 0; x < 7; x++) {
			const nib = nibbleGrid[y][x] & 0xf;
			id |= BigInt(nib) << BigInt(i * 4);
			i++;
		}
	}
	id |= BigInt(shapeIndex & 0x7) << 196n;
	id |= BigInt(presetIndex & 0x7) << 199n;
	id |= BigInt(contextHash >>> 0) << 202n;
	id |= 1n << 234n; // version 1
	return id;
}

export function buildGridSvg(nibbleGrid: number[][], palette: string[], shapeIndex: number): string {
	const rows = 7, cols = 7;
	const cell = 40, gap = 6;
	const width = cols * cell + (cols - 1) * gap;
	const height = rows * cell + (rows - 1) * gap;
	const bg = palette[0] || '#0a0f1a';
	const shapes: string[] = [];
	const inset = Math.max(1, Math.floor(cell * 0.12));
	const draw = (vx: number, vy: number, fill: string) => {
		const cx = vx + cell / 2;
		const cy = vy + cell / 2;
		switch (shapeIndex) {
			case 1: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" fill="${fill}"/>`;
			case 0: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" rx="${Math.floor(cell * 0.22)}" ry="${Math.floor(cell * 0.22)}" fill="${fill}"/>`;
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
			default: return `<rect x="${vx}" y="${vy}" width="${cell}" height="${cell}" fill="${fill}"/>`;
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
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision" preserveAspectRatio="xMidYMid meet">\n<rect x="0" y="0" width="${width}" height="${height}" fill="${bg}"/>\n${shapes.join('\n')}\n</svg>`;
}


