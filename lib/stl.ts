export function exportGridToSTL(grid: number[][], label?: string): Blob {
  // Binary STL writer
  const triangles = buildTriangles(grid, label);
  const header = new Uint8Array(80);
  const triangleCount = triangles.length;
  const buffer = new ArrayBuffer(80 + 4 + triangleCount * 50);
  const view = new DataView(buffer);

  // copy header
  new Uint8Array(buffer, 0, 80).set(header);
  view.setUint32(80, triangleCount, true);

  let offset = 84;
  for (const t of triangles) {
    // normal
    view.setFloat32(offset + 0, t.nx, true);
    view.setFloat32(offset + 4, t.ny, true);
    view.setFloat32(offset + 8, t.nz, true);
    // vertices
    view.setFloat32(offset + 12, t.ax, true);
    view.setFloat32(offset + 16, t.ay, true);
    view.setFloat32(offset + 20, t.az, true);

    view.setFloat32(offset + 24, t.bx, true);
    view.setFloat32(offset + 28, t.by, true);
    view.setFloat32(offset + 32, t.bz, true);

    view.setFloat32(offset + 36, t.cx, true);
    view.setFloat32(offset + 40, t.cy, true);
    view.setFloat32(offset + 44, t.cz, true);

    view.setUint16(offset + 48, 0, true); // attribute byte count
    offset += 50;
  }

  return new Blob([buffer], { type: 'application/vnd.ms-pki.stl' });
}

function buildTriangles(grid: number[][], label?: string) {
  const cellsX = grid.length > 0 ? grid[0].length : 0;
  const cellsY = grid.length;
  const cellSize = 1;
  const gap = 0.1;
  const baseHeight = 0.4;
  const heightScale = 1.2; // scaled x2 to match viewer
  const plateThickness = 0.8;
  const plateMargin = 0.2;
  const titleStripDepth = 3.0;

  type Tri = {
    nx: number; ny: number; nz: number;
    ax: number; ay: number; az: number;
    bx: number; by: number; bz: number;
    cx: number; cy: number; cz: number;
  };

  const triangles: Tri[] = [];

  const addFace = (a: number[], b: number[], c: number[], d: number[]) => {
    const n = normal(a, b, c);
    triangles.push({ nx: n[0], ny: n[1], nz: n[2], ax: a[0], ay: a[1], az: a[2], bx: b[0], by: b[1], bz: b[2], cx: c[0], cy: c[1], cz: c[2] });
    triangles.push({ nx: n[0], ny: n[1], nz: n[2], ax: a[0], ay: a[1], az: a[2], bx: c[0], by: c[1], bz: c[2], cx: d[0], cy: d[1], cz: d[2] });
  };

  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      const h = baseHeight + grid[y][x] * heightScale;
      const X = x * (cellSize + gap);
      const Z = y * (cellSize + gap);

      const p000 = [X, 0, Z];
      const p100 = [X + cellSize, 0, Z];
      const p110 = [X + cellSize, 0, Z + cellSize];
      const p010 = [X, 0, Z + cellSize];

      const p001 = [X, h, Z];
      const p101 = [X + cellSize, h, Z];
      const p111 = [X + cellSize, h, Z + cellSize];
      const p011 = [X, h, Z + cellSize];

      // faces: bottom, top, sides
      addFace(p000, p100, p110, p010); // bottom
      addFace(p001, p011, p111, p101); // top
      addFace(p010, p110, p111, p011); // front
      addFace(p100, p000, p001, p101); // back
      addFace(p000, p010, p011, p001); // left
      addFace(p110, p100, p101, p111); // right
    }
  }

  // Add base plate
  if (cellsX > 0 && cellsY > 0) {
    const totalWidth = cellsX * cellSize + (cellsX - 1) * gap;
    const totalDepth = cellsY * cellSize + (cellsY - 1) * gap;
    const X = -plateMargin;
    const Z = -(plateMargin + titleStripDepth);
    const W = totalWidth + 2 * plateMargin;
    const D = totalDepth + 2 * plateMargin + titleStripDepth;
    const p000 = [X, -plateThickness, Z];
    const p100 = [X + W, -plateThickness, Z];
    const p110 = [X + W, -plateThickness, Z + D];
    const p010 = [X, -plateThickness, Z + D];
    const p001 = [X, 0, Z];
    const p101 = [X + W, 0, Z];
    const p111 = [X + W, 0, Z + D];
    const p011 = [X, 0, Z + D];
    addFace(p000, p100, p110, p010); // bottom
    addFace(p001, p011, p111, p101); // top
    addFace(p010, p110, p111, p011); // front
    addFace(p100, p000, p001, p101); // back
    addFace(p000, p010, p011, p001); // left
    addFace(p110, p100, p101, p111); // right
    // Optional: add simple engraved label as shallow box relief (placeholder, not fancy font in STL)
    if (label) {
      // For STL without fonts, we keep geometry simple. Engraving text properly requires triangulating fonts.
      // Here we skip true text and rely on viewer text only. Future: triangulate font paths to meshes.
    }
  }

  // center around origin including base
  // compute bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const t of triangles) {
    const vs = [
      [t.ax, t.ay, t.az],
      [t.bx, t.by, t.bz],
      [t.cx, t.cy, t.cz]
    ];
    for (const v of vs) {
      minX = Math.min(minX, v[0]);
      minY = Math.min(minY, v[1]);
      minZ = Math.min(minZ, v[2]);
      maxX = Math.max(maxX, v[0]);
      maxY = Math.max(maxY, v[1]);
      maxZ = Math.max(maxZ, v[2]);
    }
  }
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  for (const t of triangles) {
    t.ax -= centerX; t.ay -= centerY; t.az -= centerZ;
    t.bx -= centerX; t.by -= centerY; t.bz -= centerZ;
    t.cx -= centerX; t.cy -= centerY; t.cz -= centerZ;
  }

  return triangles;
}

function normal(a: number[], b: number[], c: number[]) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const nx = u[1] * v[2] - u[2] * v[1];
  const ny = u[2] * v[0] - u[0] * v[2];
  const nz = u[0] * v[1] - u[1] * v[0];
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length];
}
