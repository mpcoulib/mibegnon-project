/**
 * One-off: crop grandfather portrait → public/chao-avatar.png (256) + chao-icon.png (64, circle).
 * Run: npx tsx scripts/generate-chao-avatar.ts
 */
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(
  ROOT,
  "Assets/grandfather-with-sport-clothing/60541.jpg"
);
const OUT_AVATAR = path.join(ROOT, "public/chao-avatar.png");
const OUT_ICON = path.join(ROOT, "public/chao-icon.png");

async function main() {
  const base = sharp(SOURCE)
    .rotate()
    .extract({ left: 280, top: 40, width: 520, height: 520 })
    .resize(512, 512, { fit: "cover", position: "top" });

  await base
    .clone()
    .resize(256, 256)
    .png({ quality: 90 })
    .toFile(OUT_AVATAR);

  const iconSize = 64;
  const rounded = Buffer.from(
    `<svg width="${iconSize}" height="${iconSize}">
      <circle cx="${iconSize / 2}" cy="${iconSize / 2}" r="${iconSize / 2}" fill="white"/>
    </svg>`
  );

  await base
    .clone()
    .resize(iconSize, iconSize)
    .composite([{ input: rounded, blend: "dest-in" }])
    .png()
    .toFile(OUT_ICON);

  console.log("Wrote", OUT_AVATAR, OUT_ICON);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
