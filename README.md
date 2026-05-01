# Medelynas — Premium Tree Nursery

A production-ready Next.js website for a premium tree nursery and landscape-design studio. Apple-inspired UI, glassmorphism, smooth motion, and a fully interactive Garden Builder where users can upload a photo of their garden and compose a planting plan with drag-and-drop trees.

## Features

- **Hero** — animated particles (leaves & pollen on canvas), parallax tree silhouettes, staggered headline reveal
- **About** — service explainer + featured tree cards with hover lift
- **Catalog** — 12 hand-illustrated SVG trees, filters (category, size, price range), animated grid with layout transitions
- **Garden Builder** (the centerpiece):
  - Upload photo of your garden, or use the built-in sample scene
  - Drag trees from a floating glass palette onto the canvas
  - Each tree supports: drag to position, scale, rotate, flip, opacity, layer order (forward/back), duplicate, delete
  - **Perspective scaling** — trees lower on the canvas render larger (depth simulation)
  - **Smart shadows** — every tree gets a soft elliptical ground shadow
  - **Snap-to-ground** — trees are anchored at their base when placed
  - **Live total + tree list** in a glass summary panel
  - **Export plan** as JSON · **Request quote** via email
- **Apple-style design system**: SF Pro typography, glass surfaces, soft natural gradients, Apple-style sliders, smooth motion (Framer Motion)
- **Light & dark mode** — auto-detected, manually toggleable, persisted
- **Loading screen** with animated logo
- **Skeleton-style shimmer** utilities, elegant empty states
- Fully **responsive** — touch-friendly builder

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Framer Motion
- Lucide icons
- All tree assets are inline SVG — no external image dependencies, transparent backgrounds, fully tinted to support both themes

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:3000

# Production build
npm run build
npm start
```

## Project Structure

```
medelynas/
├── app/
│   ├── globals.css          # Design tokens, glass, gradients, dark mode
│   ├── layout.tsx           # Root layout with theme bootstrap
│   └── page.tsx             # Composes all sections
├── components/
│   ├── builder/
│   │   ├── Builder.tsx          # Section wrapper for the builder
│   │   ├── Canvas.tsx           # Main canvas — upload, drop, sample scene
│   │   ├── ControlsPanel.tsx    # Floating slider panel for selected tree
│   │   ├── GardenContext.tsx    # Global state for placed trees
│   │   ├── GardenSummary.tsx    # Trees list + total + export/quote
│   │   ├── PlacedTreeItem.tsx   # Individual draggable tree on canvas
│   │   └── TreePalette.tsx      # Floating draggable tree library
│   ├── sections/
│   │   ├── About.tsx
│   │   ├── Catalog.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   └── Nav.tsx
│   └── ui/
│       ├── LoadingScreen.tsx
│       ├── Particles.tsx        # Canvas-based floating leaves/pollen
│       ├── ThemeToggle.tsx
│       └── TreeIllustration.tsx
├── lib/
│   ├── trees.ts             # Tree catalog data + inline SVG art
│   └── utils.ts
├── types/
│   └── index.ts
├── package.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

## Notes

- **Why inline SVG trees rather than PNGs?** Vector art scales perfectly across the catalog cards and the builder, supports dark mode tinting, and keeps the deploy package tiny — no asset CDN required.
- **Builder canvas** is built on plain pointer events and CSS transforms (no Fabric.js dependency), so it's lightweight, GPU-accelerated, and behaves identically on touch and mouse devices.
- **Persistence**: garden composition lives in React context. To persist across sessions, swap `useState` in `GardenContext.tsx` for `localStorage`-backed state — one line.

---

## Swapping in Real Tree Images

### Where the files live

```
public/
└── trees/
    ├── apple.png       ← Apple Tree
    ├── maple.png       ← Japanese Maple
    ├── pine.png        ← Scots Pine
    ├── oak.png         ← English Oak
    ├── cherry.png      ← Cherry Blossom
    ├── birch.png       ← Silver Birch
    ├── olive.png       ← Olive Tree
    ├── willow.png      ← Weeping Willow
    ├── lavender.png    ← English Lavender
    ├── boxwood.png     ← Boxwood
    ├── spruce.png      ← Norway Spruce
    └── magnolia.png    ← Magnolia
```

### Photo requirements

| Property | Requirement |
|---|---|
| Format | PNG with **transparent background** |
| Size | Minimum 600 × 800 px (same ratio preferred) |
| Orientation | Tree centered, trunk at bottom center |
| Colour depth | 24-bit RGBA |
| File size | Under 1 MB recommended |

### Steps

1. Take your photo, remove the background (Photoshop, Remove.bg, or similar)
2. Name it exactly `{id}.png` — e.g. `apple.png` (see table above)
3. Drop it into `public/trees/` replacing the placeholder
4. Restart the dev server (`npm run dev`) — no code changes needed

The site will **automatically** use the PNG everywhere:
- Catalog grid cards
- About section featured cards
- Garden Builder palette panel
- Garden Builder canvas (draggable)
- Garden Summary list thumbnails

The inline SVG stays in the code as a zero-dependency fallback and is used
if the PNG fails to load.

### Adding a brand new tree

1. Add a new entry in `lib/trees.ts` (copy an existing one, give it a unique `id`)
2. Drop `public/trees/{newid}.png` into the folder
3. That's it — it appears in the catalog and builder automatically

