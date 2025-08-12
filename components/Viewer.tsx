"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { exportGridToSTL } from '@/lib/stl';

export function Viewer({ grid, label, mode }: { grid: number[][]; label?: string; mode?: 'full' | 'compact' }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<THREE.Mesh | null>(null);
  const [downloading, setDownloading] = useState(false);

  const compact = mode === 'compact';
  const { geometry, meshCount, layout } = useMemo(() => buildGeometryFromGrid(grid, compact), [grid, compact]);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(40, 40, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const controls = new OrbitControls(camera, renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(50, 100, 50);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    const material = new THREE.MeshStandardMaterial({ color: 0x3399ff, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);

    const modelGroup = new THREE.Group();
    modelGroup.add(mesh);
    // Default larger scale for printing
    modelGroup.scale.setScalar(3);
    // Rotate view by 180 degrees around vertical axis
    modelGroup.rotation.y = Math.PI;
    // Place the model so its base sits on grid Y=0
    {
      const box = new THREE.Box3().setFromObject(modelGroup);
      const minY = box.min.y;
      modelGroup.position.y -= minY;
    }
    scene.add(modelGroup);

    // Grid sized relative to model
    const bbox = new THREE.Box3().setFromObject(modelGroup);
    const sizeX = bbox.max.x - bbox.min.x;
    const sizeZ = bbox.max.z - bbox.min.z;
    const gridSize = Math.max(sizeX, sizeZ) * 1.6;
    const divisions = Math.max(20, Math.min(200, Math.ceil(gridSize / 5)));
    const gridHelper = new THREE.GridHelper(gridSize, divisions);
    scene.add(gridHelper);

    // Optional 3D text label attached on the front strip of the base
    let textMesh: THREE.Mesh | null = null;
    if (label && !compact) {
      const { FontLoader } = require('three/examples/jsm/loaders/FontLoader');
      const { TextGeometry } = require('three/examples/jsm/geometries/TextGeometry');
      const loader = new FontLoader();
      loader.load(
        'https://unpkg.com/three@0.160.0/examples/fonts/optimer_bold.typeface.json',
        (font: any) => {
          const size = Math.max(1.0, layout.titleStripDepth * 0.7);
          const textHeight = 0.6;
          const textGeo = new TextGeometry(label, {
            font,
            size,
            height: textHeight,
            curveSegments: 6,
            bevelEnabled: false
          });
          textGeo.computeBoundingBox();
          const bbox = textGeo.boundingBox!;
          const textWidth = bbox.max.x - bbox.min.x;
          const availableWidth = layout.totalWidth + 2 * layout.plateMargin - 0.4; // margin
          const scaleFactor = textWidth > 0 ? Math.min(1, availableWidth / textWidth) : 1;
          if (scaleFactor !== 1) {
            textGeo.scale(scaleFactor, scaleFactor, 1);
            textGeo.computeBoundingBox();
          }
          textGeo.center(); // center around (0,0,0)

          const textMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
          textMesh = new THREE.Mesh(textGeo, textMat);
          textMesh.rotation.x = Math.PI / 2; // lay flat onto base (XZ plane)
          // mirror left-to-right only (do not also rotate 180° or it cancels the mirror)
          textMesh.scale.x = -Math.abs(textMesh.scale.x);

          // Position text on front strip of the base, resting on top of base
          const bb = geometry.boundingBox!;
          const minY = bb.min.y;
          const minZ = bb.min.z;
          const textZ = minZ + layout.titleStripDepth / 2 + 0.05;
          // sink slightly into base to union in slicers
          const textY = minY + layout.plateThickness - 0.05;
          textMesh.position.set(0, textY, textZ);
          modelGroup.add(textMesh);
          textRef.current = textMesh;
        }
      );
    }

    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ob = new ResizeObserver(onResize);
    ob.observe(mount);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ob.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [geometry]);

  function handleDownload() {
    try {
      setDownloading(true);
      // Prefer exporting full geometry including text using STLExporter
      const group = new THREE.Group();
      const solid = new THREE.Mesh(geometry);
      group.add(solid);
      if (textRef.current) {
        group.add(textRef.current.clone());
      }
      // 3x size
      group.scale.setScalar(3);
      // Make XY the bed plane (Z up): rotate +90deg around X so Z'=Y
      group.rotation.x = Math.PI / 2;
      // Move so bottom sits on Z=0
      const box = new THREE.Box3().setFromObject(group);
      const minZ = box.min.z;
      group.position.z -= minZ;
      const { STLExporter } = require('three/examples/jsm/exporters/STLExporter');
      const exporter = new STLExporter();
      const arrayBuffer = exporter.parse(group, { binary: true });
      const blob = new Blob([arrayBuffer], { type: 'model/stl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'github-contributions.stl';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        {label && (
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', fontWeight: 600 }}>
            {label}
          </div>
        )}
        <div ref={mountRef} style={{ width: '100%', height: '480px', background: '#0b0f14', borderRadius: 8 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>{meshCount} columns</span>
        <button className={`button ${downloading ? 'loading' : ''}`} onClick={handleDownload} disabled={downloading}>
          {downloading ? <span className="spinner" /> : null}
          {downloading ? 'Preparing STL' : 'Download STL'}
        </button>
        {error && <span style={{ color: 'crimson' }}>{error}</span>}
      </div>
    </section>
  );
}

function buildGeometryFromGrid(grid: number[][], compact: boolean) {
  const geom = new THREE.BufferGeometry();
  const cellsX = grid.length > 0 ? grid[0].length : 0;
  const cellsY = grid.length;
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const cellSize = 1;
  const gap = 0.1;
  const baseHeight = 0.0;
  const heightScale = 1.2; // scaled x2
  const plateThickness = 0.8; // printable base
  const plateMargin = 0.2;
  const titleStripDepth = compact ? 0.0 : 3.0; // no label strip in compact mode
  const compactBottomScale = compact ? 0.4 : 1.0; // thinner bottom below grid
  const extraMargin = compact ? 0.6 : 0.2; // larger side/top margins for even look

  let indexOffset = 0;
  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      const h = baseHeight + grid[y][x] * heightScale;
      const cx = x * (cellSize + gap);
      const cy = y * (cellSize + gap);
      // Create a simple extruded box per cell
      const { v, n, i } = boxGeometry(cx, 0, cy, cellSize, h, cellSize, indexOffset);
      vertices.push(...v);
      normals.push(...n);
      indices.push(...i);
      indexOffset += 36; // 6 faces * 2 triangles * 3 verts
    }
  }

  // Add common base plate under all cells for printing, extended in front for label
  if (cellsX > 0 && cellsY > 0) {
    const totalWidth = cellsX * cellSize + (cellsX - 1) * gap;
    const totalDepth = cellsY * cellSize + (cellsY - 1) * gap;
    const margin = compact ? extraMargin : plateMargin;
    const bx = -margin;
    const bz = -(margin + titleStripDepth);
    const bw = totalWidth + 2 * margin;
    const bd = totalDepth + 2 * margin + titleStripDepth;
    const bottomThickness = plateThickness * (compact ? compactBottomScale : 1.0);
    const { v: bv, n: bn, i: bi } = boxGeometry(bx, -bottomThickness, bz, bw, bottomThickness, bd, indexOffset);
    vertices.push(...bv);
    normals.push(...bn);
    indices.push(...bi);
    indexOffset += 36;

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setIndex(indices);
    geom.computeBoundingBox();
    geom.center();

    const bb = geom.boundingBox!;
    return {
      geometry: geom,
      meshCount: cellsX * cellsY,
      layout: {
        totalWidth,
        totalDepth,
        plateThickness,
        plateMargin,
        titleStripDepth,
        minY: bb.min.y,
        minZ: bb.min.z
      }
    } as const;
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setIndex(indices);
  geom.computeBoundingBox();
  geom.center();
  const bb = geom.boundingBox!;
  return {
    geometry: geom,
    meshCount: cellsX * cellsY,
    layout: {
      totalWidth: cellsX * cellSize + (cellsX - 1) * gap,
      totalDepth: cellsY * cellSize + (cellsY - 1) * gap,
      plateThickness,
      plateMargin,
      titleStripDepth,
      minY: bb.min.y,
      minZ: bb.min.z
    }
  } as const;
}

function boxGeometry(x: number, y: number, z: number, w: number, h: number, d: number, indexStart: number) {
  // 8 corners of the box
  const p = [
    [x, y, z],
    [x + w, y, z],
    [x + w, y, z + d],
    [x, y, z + d],
    [x, y + h, z],
    [x + w, y + h, z],
    [x + w, y + h, z + d],
    [x, y + h, z + d]
  ];

  const faces = [
    // bottom (outside is -Y). Winding chosen for visibility; double-sided material used too
    [0, 1, 2, 3, 0, -1, 0],
    // top (outside is +Y) — corrected CCW winding
    [4, 7, 6, 5, 0, 1, 0],
    // front
    [3, 2, 6, 7, 0, 0, 1],
    // back
    [1, 0, 4, 5, 0, 0, -1],
    // left
    [0, 3, 7, 4, -1, 0, 0],
    // right
    [2, 1, 5, 6, 1, 0, 0]
  ];

  const v: number[] = [];
  const n: number[] = [];
  const i: number[] = [];
  let idx = indexStart;

  for (const f of faces) {
    const [a, b, c, d2, nx, ny, nz] = f as any;
    const quad = [p[a], p[b], p[c], p[d2]] as number[][];

    // two triangles per face
    v.push(...quad[0], ...quad[1], ...quad[2], ...quad[0], ...quad[2], ...quad[3]);
    for (let k = 0; k < 6; k++) n.push(nx, ny, nz);
    i.push(idx, idx + 1, idx + 2, idx + 3, idx + 4, idx + 5);
    idx += 6;
  }

  return { v, n, i };
}
