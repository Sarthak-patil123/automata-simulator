import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.dirname(__dirname);
const distDir = path.join(frontendDir, 'dist');

// Copy dist/assets to frontend/assets
const distAssets = path.join(distDir, 'assets');
const targetAssets = path.join(frontendDir, 'assets');

if (fs.existsSync(distAssets)) {
  fs.mkdirSync(targetAssets, { recursive: true });
  const files = fs.readdirSync(distAssets);
  for (const file of files) {
    fs.copyFileSync(path.join(distAssets, file), path.join(targetAssets, file));
  }
  console.log(`Copied ${files.length} assets to ${targetAssets}`);
}

// Copy dist/index.html to frontend/index.html
const distIndex = path.join(distDir, 'index.html');
const targetIndex = path.join(frontendDir, 'index.html');

if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, targetIndex);
  console.log(`Copied dist/index.html to ${targetIndex}`);
}
