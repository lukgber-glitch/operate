# PWA Icons

## Required Icons

The PWA manifest references the following icon files:

### Standard Icons
- `/icon-192.png` - 192x192 PNG icon
- `/icon-512.png` - 512x512 PNG icon

### Maskable Icons (for Android adaptive icons)
- `/icon-maskable-192.png` - 192x192 PNG icon with safe zone padding
- `/icon-maskable-512.png` - 512x512 PNG icon with safe zone padding

## Generating Icons

You can use tools like:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Manual export from design tool (Figma, Sketch, etc.)

### Using PWA Asset Generator

```bash
npx pwa-asset-generator icon.svg ./public --icon-only --path-override /
```

This will generate all required icon sizes from the source SVG.

### Maskable Icons

Maskable icons need a safe zone (20% padding on all sides) to ensure the icon isn't clipped by different device shapes.

The current `icon.svg` can be used as the base, but for maskable versions:
1. Add 20% padding on all sides
2. Ensure important content is in the center 80% of the icon
3. Background should extend to edges

## Current Status

- `/icon.svg` - Main vector icon (exists)
- PNG icons - **PENDING GENERATION**

**Note**: The app will work with just the SVG icon, but PNG icons provide better compatibility across all devices and platforms.
