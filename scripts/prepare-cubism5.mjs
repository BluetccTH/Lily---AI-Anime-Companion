import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(process.cwd());
const cacheRoot = resolve(root, '.cache');
const frameworkDir = resolve(cacheRoot, 'CubismWebFramework');

mkdirSync(cacheRoot, { recursive: true });

// Cubism Web Framework 5-r.4 keeps the WebGL shaders in its TypeScript
// renderer sources; there is no Shaders/WebGL directory to copy.
if (existsSync(frameworkDir)) {
  execFileSync('git', ['-C', frameworkDir, 'fetch', '--depth', '1', 'origin', '5-r.4'], { stdio: 'inherit' });
  execFileSync('git', ['-C', frameworkDir, 'reset', '--hard', 'origin/5-r.4'], { stdio: 'inherit' });
} else {
  execFileSync('git', [
    'clone', '--depth', '1', '--branch', '5-r.4',
    'https://github.com/Live2D/CubismWebFramework.git', frameworkDir,
  ], { stdio: 'inherit' });
}

const head = execFileSync('git', ['-C', frameworkDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const requiredFiles = [
  resolve(frameworkDir, 'src/rendering/cubismrenderer_webgl.ts'),
  resolve(frameworkDir, 'src/rendering/cubismshader_webgl.ts'),
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`[Cubism 5] Unexpected framework layout at ${head}: missing ${file}`);
  }
}

console.log(`[Cubism 5] Framework prepared: ${frameworkDir}`);
console.log(`[Cubism 5] Framework commit: ${head}`);
console.log('[Cubism 5] WebGL shaders are compiled from the official framework sources.');
