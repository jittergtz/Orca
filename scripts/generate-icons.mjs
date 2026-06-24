#!/usr/bin/env node
/**
 * Generates favicon / app icon assets for web and desktop from the source orca icon.
 * Run: node scripts/generate-icons.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "apps/web/public/orca-Icon-v2.png");

const WEB_PUBLIC = path.join(ROOT, "apps/web/public");
const DESKTOP_BUILD = path.join(ROOT, "apps/desktop/build");
const DESKTOP_PUBLIC = path.join(ROOT, "apps/desktop/public");

const WEB_SIZES = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

function devBadgeSvg(size) {
  const badgeWidth = Math.round(size * 0.34);
  const badgeHeight = Math.round(size * 0.14);
  const x = size - badgeWidth - Math.round(size * 0.04);
  const y = size - badgeHeight - Math.round(size * 0.04);
  const fontSize = Math.round(badgeHeight * 0.52);
  const radius = Math.round(badgeHeight * 0.22);

  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" width="${badgeWidth}" height="${badgeHeight}" rx="${radius}" fill="#F97316"/>
      <text x="${x + badgeWidth / 2}" y="${y + badgeHeight * 0.68}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF" text-anchor="middle">DEV</text>
    </svg>`
  );
}

async function squareIcon(source, size, withDevBadge = false) {
  let pipeline = sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png();

  if (withDevBadge) {
    const badge = await sharp(devBadgeSvg(size)).png().toBuffer();
    pipeline = sharp(await pipeline.toBuffer()).composite([{ input: badge, top: 0, left: 0 }]);
  }

  return pipeline.png().toBuffer();
}

async function writeWebIconSet(targetDir, withDevBadge) {
  await fs.mkdir(targetDir, { recursive: true });

  for (const { name, size } of WEB_SIZES) {
    const outputName = withDevBadge ? name.replace(".png", "-dev.png") : name;
    const buffer = await squareIcon(SOURCE, size, withDevBadge);
    await fs.writeFile(path.join(targetDir, outputName), buffer);
  }

  const icoSizes = [16, 32, 48];
  const icoBuffers = await Promise.all(
    icoSizes.map((size) => squareIcon(SOURCE, size, withDevBadge))
  );

  const icoName = withDevBadge ? "favicon-dev.ico" : "favicon.ico";
  const { default: toIco } = await import("to-ico");
  const ico = await toIco(icoBuffers);
  await fs.writeFile(path.join(targetDir, icoName), ico);
}

async function writeDesktopIcons(withDevBadge) {
  const desktopName = withDevBadge ? "icon-dev.png" : "icon.png";
  const desktopBuffer = await squareIcon(SOURCE, 1024, withDevBadge);
  await fs.writeFile(path.join(DESKTOP_BUILD, desktopName), desktopBuffer);
  await fs.writeFile(path.join(DESKTOP_PUBLIC, desktopName), desktopBuffer);
}

async function copyWebFaviconsToDesktopPublic() {
  await fs.mkdir(DESKTOP_PUBLIC, { recursive: true });
  const faviconFiles = [
    "favicon.ico",
    "favicon-dev.ico",
    "favicon-16x16.png",
    "favicon-16x16-dev.png",
    "favicon-32x32.png",
    "favicon-32x32-dev.png",
    "apple-touch-icon.png",
    "apple-touch-icon-dev.png",
  ];

  await Promise.all(
    faviconFiles.map(async (file) => {
      await fs.copyFile(path.join(WEB_PUBLIC, file), path.join(DESKTOP_PUBLIC, file));
    })
  );
}

async function main() {
  await fs.access(SOURCE);
  await fs.mkdir(DESKTOP_BUILD, { recursive: true });

  await writeWebIconSet(WEB_PUBLIC, false);
  await writeWebIconSet(WEB_PUBLIC, true);
  await writeDesktopIcons(false);
  await writeDesktopIcons(true);
  await copyWebFaviconsToDesktopPublic();

  console.log("Generated web favicons in apps/web/public/");
  console.log("Generated desktop icons in apps/desktop/build/");
  console.log("Copied renderer favicons to apps/desktop/public/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
