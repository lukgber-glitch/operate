/**
 * PWA Icon Generator
 * Generates all required PWA icons with dark blue background and white logo
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Brand colors
const DARK_BLUE = '#0D47A1';
const WHITE = '#ffffff';

// Icon sizes for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const APPLE_TOUCH_SIZE = 180;

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../apps/web/public/icons');

// Source logo (white version for dark background)
const LOGO_WHITE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100">
  <defs>
    <style>
      .cls-1 { fill: #ffffff; }
      .cls-2 { fill: rgba(255,255,255,0.85); }
      .cls-3 { fill: #0D47A1; }
    </style>
  </defs>
  <g>
    <g id="Layer_1">
      <g>
        <path class="cls-1" d="M89.2,81.2c-.1-4.4-3.4-8-7.5-9.4-7.2-2.5,3.3-24.8-14.8-31.8-3.9-1.3-3.1-3.3-3.1-6.8-.4-3.7,1.8-3.9,2.6-6.8.2-1.7-1-3.1-1.7-4.6-1.3-3-.2-6.4-2.7-9.6-7.3-9.9-25.6-5.8-25.6,7.6,0,.9-.2,1.7-.6,2.5-1.4,2-2.4,3.8-.9,6.1.9,1.2,1.8,2.3,1.8,3.9,0,1.5.1,3.7,0,5.1,0,1.5-.6,1.7-2.4,2.5-13.3,5.8-11.7,16.2-13.2,28.7-.3,4-3.6,2.4-7,5.7-5.9,5.7-2.5,16.2,5.2,18.6,18.9,1.6,38.2.2,57.3.6,6.4-.1,13-5.5,12.5-12.2ZM37.7,24.4c1.2-.9,2-.8,1.6-2.7-2.9-15.3,24.1-16.2,22.2-.8-.5,2.5,1.2,2.6,2,4.4.3,1.4-1.3,2.1-1.9,3.1-1.1,5.5,0,11.4-.5,17-.5,6.6-4.6,12.4-8.6,17.4-1.8,2.5-2.9.9-4.3-.9-9-9.7-9.4-19.1-8.7-31.6,0-1-.2-1.9-1-2.6-1.1-.8-2-2.3-.7-3.3ZM50.3,84.4c-1.2.8-3.1.8-4.5,1.2-2.3.7-4.7,1.4-7,2.2-4,1.8-5.9,2-10.3,1.8-3.7,0-7.8.9-11.1-1.1-4.7-3.2-4.4-11.1,1-13.4,9.4-4.1,17.6,6.9,27.1,7.5.7.4,5.8.7,4.9,1.8ZM75.3,71.8c-6,3.2-12,6.3-17.9,9.8-1.7,1-3.3.6-5,.1-3.1-.8-6.3-1.3-9.3-2.2-1-.4-.2-1.1.4-1.6,4.7-4.3,8.7-9.2,12.4-14.3,2.3-2.9,3.7-6.2,5.5-9.3,1.9-3.8,3.1-5.9,2.8-10.3-.2-3.5,3.6-.6,5,.3,8.6,5.4,6.7,16.4,7.2,25.1,0,.9-.2,1.9-1,2.4Z"/>
        <path class="cls-3" d="M60.9,46.7c.4,2.6-8.7,20.8-11.5,16.8-11.5-12.7-9.9-19-10.2-34.6-.3-1.1-1.6-1.6-2-2.6-.8-2.1,2.7-2.5,2.1-4.6-2.2-15.6,24.1-16.4,22.2-.5-.5,2.7,3,3.1,1.7,5.4-.8,1-2.1,1.7-2,3.1-.1,5.7.3,11.4-.3,17ZM50.5,31.1c-6.8-.4-8.8,8.1-4.8,6,1.6-2.4,4.6-4,7.5-2.3,1,.5,1.6,1.6,2.4,2.4,3.5,1.8,2.2-6.3-5.1-6Z"/>
        <path class="cls-1" d="M50.5,31.1c7.3-.2,8.6,7.9,5.1,6-.8-.7-1.4-1.8-2.4-2.4-2.9-1.6-5.9,0-7.5,2.3-4,2.1-2-6.4,4.8-6Z"/>
      </g>
      <path class="cls-2" d="M50.3,84.4c-1.2.8-3.1.8-4.5,1.2-2.3.7-4.7,1.4-7,2.2-4,1.8-5.9,2-10.3,1.8-3.7,0-7.8.9-11.1-1.1-4.7-3.2-4.4-11.1,1-13.4,9.4-4.1,17.6,6.9,27.1,7.5.7.4,5.8.7,4.9,1.8ZM75.3,71.8c-6,3.2-12,6.3-17.9,9.8-1.7,1-3.3.6-5,.1-3.1-.8-6.3-1.3-9.3-2.2-1-.4-.2-1.1.4-1.6,4.7-4.3,8.7-9.2,12.4-14.3,2.3-2.9,3.7-6.2,5.5-9.3,1.9-3.8,3.1-5.9,2.8-10.3-.2-3.5,3.6-.6,5,.3,8.6,5.4,6.7,16.4,7.2,25.1,0,.9-.2,1.9-1,2.4Z"/>
    </g>
  </g>
</svg>`;

async function generateIcon(size, outputPath, padding = 0) {
  const logoSize = Math.floor(size * (1 - padding * 2));
  const offset = Math.floor(size * padding);

  // Create background
  const background = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 13, g: 71, b: 161, alpha: 1 } // #0D47A1
    }
  });

  // Render logo SVG
  const logoBuffer = await sharp(Buffer.from(LOGO_WHITE_SVG))
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  // Composite logo on background
  await background
    .composite([{
      input: logoBuffer,
      top: offset,
      left: offset
    }])
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath} (${size}x${size})`);
}

async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating PWA icons...\n');
  console.log(`Brand colors: Background ${DARK_BLUE}, Logo ${WHITE}\n`);

  // Generate standard icons
  for (const size of ICON_SIZES) {
    const filename = `icon-${size}x${size}.png`;
    await generateIcon(size, path.join(OUTPUT_DIR, filename), 0.1);
  }

  // Generate maskable icons (with 20% padding for safe area)
  for (const size of ICON_SIZES) {
    const filename = `icon-maskable-${size}x${size}.png`;
    await generateIcon(size, path.join(OUTPUT_DIR, filename), 0.2);
  }

  // Generate Apple touch icon
  await generateIcon(APPLE_TOUCH_SIZE, path.join(OUTPUT_DIR, 'apple-touch-icon.png'), 0.1);

  // Generate favicon sizes
  await generateIcon(32, path.join(OUTPUT_DIR, 'favicon-32x32.png'), 0.1);
  await generateIcon(16, path.join(OUTPUT_DIR, 'favicon-16x16.png'), 0.1);

  // Copy main icons to public root
  const publicDir = path.join(__dirname, '../apps/web/public');

  fs.copyFileSync(
    path.join(OUTPUT_DIR, 'icon-192x192.png'),
    path.join(publicDir, 'icon-192.png')
  );
  fs.copyFileSync(
    path.join(OUTPUT_DIR, 'icon-512x512.png'),
    path.join(publicDir, 'icon-512.png')
  );
  fs.copyFileSync(
    path.join(OUTPUT_DIR, 'icon-maskable-192x192.png'),
    path.join(publicDir, 'icon-maskable-192.png')
  );
  fs.copyFileSync(
    path.join(OUTPUT_DIR, 'icon-maskable-512x512.png'),
    path.join(publicDir, 'icon-maskable-512.png')
  );
  fs.copyFileSync(
    path.join(OUTPUT_DIR, 'apple-touch-icon.png'),
    path.join(publicDir, 'apple-touch-icon.png')
  );

  console.log('\n✅ PWA icons generated successfully!');
  console.log(`\nIcons saved to: ${OUTPUT_DIR}`);
  console.log('Main icons copied to: apps/web/public/');
}

main().catch(console.error);
