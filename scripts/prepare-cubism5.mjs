import { existsSync, mkdirSync, resolve } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = resolve(process.cwd());
const cacheRoot = resolve(root, '.cache');
const frameworkDir = resolve(cacheRoot, 'CubismWebFramework');

mkdirSync(cacheRoot, { recursive: true });

// The bundled Core in public/live2dcubismcore.min.js is Cubism Core 5.1.0.
// Use the matching Cubism 5 R4 framework. R4 embeds its WebGL shader programs
// in src/rendering/cubismshader_webgl.ts, so there is intentionally no
// Shaders/WebGL directory to copy into public/.
if (!existsSync(frameworkDir)) {
  execFileSync('git', [
    'clone',
    '--depth', '1',
    '--branch', '5-r.4',
    'https://github.com/Live2D/CubismWebFramework.git',
    frameworkDir,
  ], { stdio: 'inherit' });
} else {
  execFileSync('git', ['-C', frameworkDir, 'fetch', '--depth', '1', 'origin', '5-r.4'], { stdio: 'inherit' });
  execFileSync('git', ['-C', frameworkDir, 'reset', '--hard', 'origin/5-r.4'], { stdio: 'inherit' });
}

console.log(`[Cubism 5] Framework prepared: ${frameworkDir}`);
console.log('[Cubism 5] Framework version: R4 (compatible with bundled Core 5.1.0)');
console.log('[Cubism 5] R4 embeds WebGL shaders in cubismshader_webgl.ts; no external shader directory is required.');
