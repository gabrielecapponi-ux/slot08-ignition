import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Exact URL mappings invalidate the entire ES-module graph after a release.
// A version on the entry point alone would leave cached dependency files stale.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {version} = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const imports = {three: './vendor/three.module.js', 'three/addons/': './vendor/addons/'};
async function walk(dir) {
  for (const entry of await fs.readdir(path.join(root, dir), {withFileTypes:true})) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) await walk(relative);
    else if (relative.endsWith('.js')) imports['./'+relative] = './'+relative+'?v='+version;
  }
}
await walk('src');
const file = path.join(root, 'index.html');
let html = await fs.readFile(file, 'utf8');
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, `<script type="importmap">${JSON.stringify({imports})}</script>`)
  .replace(/href="style\.css(?:\?v=[^"]*)?"/, `href="style.css?v=${version}"`)
  .replace(/src="src\/main\.js(?:\?v=[^"]*)?"/, `src="src/main.js?v=${version}"`);
await fs.writeFile(file, html);
