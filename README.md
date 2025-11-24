# LuxLab

LuxLab – Fast web photometry & room lighting sandbox.

## Project Overview
LuxLab is a browser-based lighting sandbox for optical engineers. Upload an IES file or pick from demo luminaires, define a simple room and grid layout, and see illuminance metrics plus a false-color heatmap update instantly. The MVP runs fully client-side with React, Vite, and TypeScript.

## Features
- IES upload and parsing (LM-63, TILT=NONE) with clear validation errors
- Demo luminaires bundled for instant results
- Room + layout forms with smart defaults and spacing suggestions
- Real-time point-by-point illuminance grid and uniformity metrics
- Heatmap visualization with hover readouts and layout schematic
- Theme system (Light, Dark, Blueprint, High Contrast) with persistence
- Auto-save recent room and layout settings to localStorage

Planned (roadmap): glare approximation (UGR), 3D view, shareable projects, reporting/export.

## Tech Stack
- React 18 + TypeScript, Vite bundler
- Tailwind CSS + CSS variables for themes
- Vitest + Testing Library for unit/component tests
- GitHub Actions for CI (build + test)

## Getting Started
1. Install deps: `npm install`
2. Run dev server: `npm run dev`
3. Build for production: `npm run build`
4. Preview build: `npm run preview`

## Using LuxLab
- **Getting Started**: Click *Run Demo Scenario* for a ready-made office example.
- **Luminaire**: Select a demo optic or upload an `.ies` file. Photometry stats show instantly.
- **Room**: Adjust length/width/height, mounting/workplane heights, and apply reflectance presets.
- **Layout**: Set rows/columns, spacing, and offsets; view the schematic to confirm placement.
- **Results**: Metrics and the heatmap recalc automatically after each change.

### Quick tutorial
Steps mirror the in-app guide: run the demo, choose luminaire, define room, configure layout, review results, iterate.

## Project Structure
```
├─ src
│  ├─ assets/demo          # Synthetic IES samples
│  ├─ components           # UI building blocks (Heatmap, LayoutSchematic, etc.)
│  ├─ hooks                # Shared hooks (localStorage)
│  ├─ lib                  # IES parser, photometry engine, demo loader
│  ├─ theme                # Theme provider + tokens
│  ├─ types                # Shared TypeScript interfaces
│  └─ App.tsx, main.tsx    # App entry
├─ tests                   # Vitest suites
├─ public                  # Static assets
```

## Theming & Customization
Themes are defined via CSS variables on `data-theme`. Update `src/index.css` tokens or extend `themes` in `src/theme/themeConfig.ts`. Tailwind reads the variables for colors, spacing, radius, and typography.

## Testing & Quality
- `npm run lint` to check ESLint rules
- `npm run test` to run Vitest suites (IES parser, photometry engine)
- `npm run format` for Prettier

## Deployment (Cloudflare Pages)
- Build command: `npm run build`
- Output directory: `dist`
- Connect the GitHub repo to Cloudflare Pages for automatic deploys and previews. Attach a custom domain and HTTPS in the Cloudflare dashboard.

## Roadmap
- UGR/glare approximation
- 3D room visualization (Three.js)
- Multiple layout types (corridor, runs)
- Project save/load + sharing
- Reporting/export (PDF/HTML)

## License
MIT (recommended for open source; add LICENSE file if applicable).
