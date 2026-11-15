import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.dirname(__dirname);

const sourceIndex = path.join(frontendDir, 'index.source.html');
const targetIndex = path.join(frontendDir, 'index.html');

if (fs.existsSync(sourceIndex)) {
  fs.copyFileSync(sourceIndex, targetIndex);
  console.log('Restored index.html from index.source.html for Vite development.');
}
