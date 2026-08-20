import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(process.cwd());
const cacheRoot = resolve(root, '.cache');
const frameworkDir = resolve(cacheRoot, 'CubismWebFramework');
const shaderSource = resolve(frameworkDir, 'Shaders', 'WebGL');
const publicShaderDir = resolve(root, 'public', 'cubism5-shaders');

mkdirSync(cacheRoot, { recursive: true });

// The bundled Core in public/live2dcubismcore.min.js is Cubism Core 5.1.0.
// Cubism 5 R5 requires the newer Core/API pair (including the offscreen model
// API). Do NOT patch an R5 framework to impersonate that API. Use the Cubism 5
// R4 framework, which is the compatible framework generation for Core 5.1 and
// still supports Cubism 5 MOC3 version 5 models.
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

if (!existsSync(shaderSource)) {
  throw new Error(`Cubism 5 shader directory not found: ${shaderSource}`);
}

// Keep the official framework source untouched. In particular, do not add an
// artificial `model.offscreens` object and do not rewrite MOC version data.
// The Core and Framework must remain a matching Cubism 5 generation.
mkdirSync(publicShaderDir, { recursive: true });
cpSync(shaderSource, publicShaderDir, { recursive: true });

console.log(`[Cubism 5] Framework prepared: ${frameworkDir}`);
console.log('[Cubism 5] Framework version: R4 (compatible with bundled Core 5.1.0)');
console.log(`[Cubism 5] WebGL shaders copied to: ${publicShaderDir}`);
