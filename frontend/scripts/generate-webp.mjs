import { statSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const assetsDir = join(repoRoot, 'assets', 'img');

const targets = [
  'Robot Head with TEW Logo.png',
  'TEW 3D Logo with Robot and Flags.png',
  'english teacher 03.png',
];

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function needsRegen(pngPath, webpPath) {
  try {
    return statSync(pngPath).mtimeMs > statSync(webpPath).mtimeMs;
  } catch {
    return true;
  }
}

for (const target of targets) {
  const pngPath = join(assetsDir, target);
  const webpPath = pngPath.replace(/\.png$/i, '.webp');
  const name = basename(target);

  if (!needsRegen(pngPath, webpPath)) {
    console.log(`SKIP ${name} (webp is up to date)`);
    continue;
  }

  const originalSize = statSync(pngPath).size;
  await sharp(pngPath).webp({ quality: 80, effort: 6 }).toFile(webpPath);
  const newSize = statSync(webpPath).size;

  console.log(
    `OK   ${name}: ${formatBytes(originalSize)} -> ${formatBytes(newSize)}`,
  );
}
