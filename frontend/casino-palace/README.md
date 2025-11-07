# Casino Palace - 3D Interactive Landing Page

A stunning Next.js casino-themed landing page featuring a fully interactive 3D palace model with scroll-triggered animations powered by React Three Fiber and GSAP.

## Features

- **Interactive 3D Palace Model**: Built with React Three Fiber and Three.js
- **Scroll-Triggered Animations**: GSAP ScrollTrigger integration for smooth scroll-based interactions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Performance Optimized**: Device pixel ratio handling, adaptive quality, and efficient rendering
- **Post-Processing Effects**: Bloom effects for a luxurious casino atmosphere
- **Casino Atmosphere**: Floating particles, dynamic lighting, and glowing accents

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **@react-three/postprocessing** - Post-processing effects
- **GSAP** with ScrollTrigger - Scroll animations
- **Tailwind CSS** - Styling
- **Three.js** - 3D graphics

## Getting Started

### Installation

```bash
cd casino-palace
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### Build

```bash
npm run build
npm start
```

## Scroll Animation Timeline

The landing page features a carefully choreographed scroll experience:

### 0% - 20% Scroll Progress
- Camera gradually zooms into the palace entrance
- Welcome text "Enter the Palace Casino" fades in with parallax effects
- Background elements move at different speeds for depth

### 20% - 40% Scroll Progress
- Palace doors smoothly open (rotate 90 degrees on Y-axis)
- Interior glimpse reveals with casino elements
- Welcome text fades out

### 40% - 60% Scroll Progress
- Palace model rotates 45 degrees to showcase side view
- 3D canvas remains pinned to viewport
- Game category cards (Slots, Poker, Roulette) fade in below

### 60%+ Scroll Progress
- 3D scene unpins and fades away
- Sticky navigation bar appears with animated palace icon
- Regular content sections become scrollable

## Adding Your Own 3D Palace Model

### Step 1: Get a GLTF/GLB Model

Download a casino palace model from:
- [Sketchfab](https://sketchfab.com/search?q=palace&type=models) (Free & Paid)
- [Poly Pizza](https://poly.pizza/)
- [CGTrader](https://www.cgtrader.com/)

Look for models with:
- Casino/palace architecture
- Separate door meshes (for door opening animations)
- Golden/luxury materials
- Reasonable polygon count (< 100k polygons for web performance)

### Step 2: Prepare the Model

1. **Optimize**: Use [gltf.report](https://gltf.report/) to check model size
2. **Compress**: Use gltf-pipeline to compress
3. **Name Key Parts**: Name important parts like leftDoor, rightDoor, mainBody

### Step 3: Add to Project

1. Place your model in `public/models/palace.glb`
2. Update the PalaceModel component to load your GLTF
3. Uncomment the preload line at the bottom of Palace3D.tsx

## Project Structure

```
casino-palace/
├── app/
│   ├── page.tsx              # Main landing page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   ├── slots/page.tsx        # Slots game page
│   ├── poker/page.tsx        # Poker game page
│   └── roulette/page.tsx     # Roulette game page
├── components/
│   ├── Palace3D.tsx          # 3D palace scene
│   ├── ScrollSections.tsx    # Scroll content sections
│   └── StickyNavbar.tsx      # Navigation bar
└── public/
    └── models/               # 3D model files (add your palace.glb here)
```

## Performance Tips

1. **Optimize 3D Model**: Keep polygon count under 100k
2. **Compress Textures**: Use compressed texture formats
3. **Use CDN**: Host large assets on a CDN
4. **Lazy Load**: The 3D scene is already lazy loaded
5. **Reduce Post-Processing**: Lower bloom intensity on mobile

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL 2.0 support.

## License

MIT
