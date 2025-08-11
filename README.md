# GitHub Contributions 3D Printer

Demo: [github-3d-print.vercel.app](https://github-3d-print.vercel.app/)

Generate a 3D-printable skyline from your GitHub contributions heatmap. Fetch contributions via GitHub GraphQL, render in 3D with Three.js, and export as STL.

## Setup

- `npm install`
- Create `.env.local` with `GITHUB_TOKEN=...`
- `npm run dev`

## Notes

- Model includes base plate and optional 3D text label.
- STL export uses XY as bed plane, Z up, scaled 3×, bottom aligned to Z=0.
