# DoorReveal Component

A stunning 3D door opening effect component for Next.js with GSAP ScrollTrigger animation.

## Features

- ✅ **Scroll-triggered animation** - Doors open as user scrolls
- ✅ **3D perspective** - Realistic door rotation with 2000px perspective
- ✅ **Fully customizable** - Props for image, text, rotation, timing
- ✅ **TypeScript support** - Full type safety
- ✅ **Responsive design** - Works on all screen sizes
- ✅ **SSR compatible** - Client-side rendering for Next.js
- ✅ **Performance optimized** - GPU-accelerated animations
- ✅ **Accessible** - Semantic HTML structure

## Installation

The required dependencies are already installed:

```bash
✅ gsap@3.13.0
✅ @gsap/react (just installed)
✅ next@15.0.3
✅ react@18.3.1
```

## Quick Start

```tsx
import DoorReveal from '@/components/DoorReveal';

export default function Home() {
  return (
    <main>
      {/* Content before */}
      <section className="h-screen">
        <h1>Welcome</h1>
      </section>

      {/* Door reveal effect */}
      <DoorReveal />

      {/* Content after */}
      <section className="h-screen">
        <h2>Casino Games</h2>
      </section>
    </main>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bgImage` | `string` | Freepik casino image | Background image URL to reveal |
| `overlayText` | `string` | `'Enter the Palace Casino'` | Text displayed during opening |
| `rotationAngle` | `number` | `116` | Door rotation angle in degrees |
| `scrubDuration` | `number` | `1` | Animation speed (higher = slower) |
| `doorHeight` | `string` | `'100vh'` | Height of the door section |
| `showMarkers` | `boolean` | `false` | Show ScrollTrigger debug markers |

## Examples

### Basic Usage

```tsx
<DoorReveal />
```

### Custom Background & Text

```tsx
<DoorReveal
  bgImage="/images/casino-palace.jpg"
  overlayText="Welcome to BetMonkey"
/>
```

### Dramatic Opening Effect

```tsx
<DoorReveal
  rotationAngle={130}
  scrubDuration={2}
/>
```

### Multiple Door Reveals

```tsx
<DoorReveal
  bgImage="/images/entrance.jpg"
  overlayText="Enter the Lobby"
/>

{/* Some content */}

<DoorReveal
  bgImage="/images/vip-lounge.jpg"
  overlayText="VIP Lounge"
/>
```

## How It Works

1. **Scroll Detection**: GSAP ScrollTrigger pins the section when it enters viewport
2. **3D Rotation**: Left door rotates -116° (origin: left), right door +116° (origin: right)
3. **Text Animation**: Overlay text fades in midway through door opening
4. **Background Reveal**: Casino palace background becomes visible as doors open
5. **Smooth Easing**: Power2.inOut easing for natural motion

## Styling

The component uses CSS Modules (`DoorReveal.module.css`) for scoped styling:

- White doors with gradient (white → light gray)
- Realistic shadows for depth
- Subtle gray door handles
- Responsive breakpoints for mobile/tablet
- Golden text with glow effect

## Performance

- GPU-accelerated transforms (rotateY, opacity)
- `will-change` properties for smooth animations
- Automatic ScrollTrigger cleanup on unmount
- Optimized for 60fps scrolling

## Responsive Design

- **Desktop**: Full-size doors (800px × 600px max)
- **Tablet** (≤768px): Reduced perspective, smaller handles
- **Mobile** (≤480px): Compact view, adjusted text size

## Troubleshooting

### Animation not triggering
- Ensure there's scrollable content before and after the component
- Check that the page height is sufficient for scroll

### Doors look flat
- Verify `perspective: 2000px` is applied
- Check browser compatibility (works on all modern browsers)

### Text not appearing
- Make sure `overlayText` prop is set
- Check z-index conflicts with other elements

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS 14+, Android Chrome)

## Files

```
src/components/
├── DoorReveal.tsx           # Main component
├── DoorReveal.module.css    # Styles
├── DoorReveal.example.tsx   # Usage examples
└── DoorReveal.README.md     # This file
```

## Next Steps

1. **Add to Landing Page**: Import component in `app/page.tsx`
2. **Customize Images**: Replace placeholder with your casino images
3. **Adjust Animation**: Tweak `rotationAngle` and `scrubDuration`
4. **Test Scroll**: Ensure smooth performance on all devices

## Credits

- Built with [GSAP](https://gsap.com/) & ScrollTrigger
- Uses [@gsap/react](https://www.npmjs.com/package/@gsap/react) hooks
- Designed for Next.js 15 App Router

---

**Need help?** Check `DoorReveal.example.tsx` for more usage patterns.
