import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(typeAndData), 8 + len);
  return buf;
}

function generatePng(width, height, isMaskable = false) {
  // Generate RGBA buffer
  // Design: Rich dark background (#0f172a / #18181b), with emerald & rose geometric duo/finance icon in center
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;
  const innerRadius = width * 0.28;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: #0d0f12 (rgb 13, 15, 18)
      let r = 13, g = 15, b = 18, a = 255;

      // Rounded rect or circle background badge
      const cornerRadius = isMaskable ? 0 : width * 0.22;
      const insideRounded = isMaskable || (
        Math.abs(dx) <= cx - 4 && Math.abs(dy) <= cy - 4
      );

      // Gradient accent circle in center
      if (dist <= radius) {
        // Subtle glow background circle
        const t = dist / radius;
        r = Math.round(18 + (30 - 18) * (1 - t));
        g = Math.round(22 + (36 - 22) * (1 - t));
        b = Math.round(28 + (45 - 28) * (1 - t));
      }

      // Icon: Two overlapping circles / interlocking duo rings with emerald (left) and rose (right)
      const duoOffset = width * 0.12;
      const dist1 = Math.sqrt((dx + duoOffset) * (dx + duoOffset) + dy * dy);
      const dist2 = Math.sqrt((dx - duoOffset) * (dx - duoOffset) + dy * dy);
      const ringRadius = width * 0.18;
      const ringThickness = width * 0.055;

      const inRing1 = Math.abs(dist1 - ringRadius) <= ringThickness;
      const inRing2 = Math.abs(dist2 - ringRadius) <= ringThickness;

      if (inRing1 && inRing2) {
        // Intersection: blend emerald and rose / luminous gold
        r = 245; g = 158; b = 11; a = 255;
      } else if (inRing1) {
        // Emerald 500: #10b981 (16, 185, 129)
        r = 16; g = 185; b = 129; a = 255;
      } else if (inRing2) {
        // Rose 500: #f43f5e (244, 63, 94)
        r = 244; g = 63; b = 94; a = 255;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PNG assets
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180));

// Generate SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb7185" />
      <stop offset="100%" stop-color="#e11d48" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  <!-- Duo rings for couple finance -->
  <g transform="translate(256, 256)">
    <!-- Ring 1 (Left - Partner 1: Emerald) -->
    <circle cx="-56" cy="0" r="88" fill="none" stroke="url(#emeraldGrad)" stroke-width="28" opacity="0.9" />
    <!-- Ring 2 (Right - Partner 2: Rose) -->
    <circle cx="56" cy="0" r="88" fill="none" stroke="url(#roseGrad)" stroke-width="28" opacity="0.9" />
    <!-- Center Heart Icon -->
    <path d="M 0 -18 C -14 -40, -42 -30, -32 -6 C -24 14, 0 32, 0 32 C 0 32, 24 14, 32 -6 C 42 -30, 14 -40, 0 -18 Z" fill="#ffffff" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
console.log('PWA icons created successfully in public/');
