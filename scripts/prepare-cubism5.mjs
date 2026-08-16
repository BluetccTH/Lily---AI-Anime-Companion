import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const cacheRoot = resolve(root, '.cache');
const frameworkDir = resolve(cacheRoot, 'CubismWebFramework');
const shaderSource = resolve(frameworkDir, 'src', 'rendering', 'shaders', 'WebGL');
const publicShaderDir = resolve(root, 'public', 'cubism5-shaders');

mkdirSync(cacheRoot, { recursive: true });

if (!existsSync(frameworkDir)) {
  execFileSync('git', [
    'clone',
    '--depth', '1',
    '--branch', '5-r.5',
    'https://github.com/Live2D/CubismWebFramework.git',
    frameworkDir,
  ], { stdio: 'inherit' });
} else {
  execFileSync('git', ['-C', frameworkDir, 'fetch', '--depth', '1', 'origin', '5-r.5'], { stdio: 'inherit' });
  execFileSync('git', ['-C', frameworkDir, 'checkout', '5-r.5'], { stdio: 'inherit' });
}

// Cubism 5 Web R5 keeps WebGL shader sources in the Framework tree.
// Copy them into public so the browser can fetch them at runtime.
if (!existsSync(shaderSource)) {
  throw new Error(`Cubism 5 shader directory not found: ${shaderSource}`);
}

mkdirSync(publicShaderDir, { recursive: true });
cpSync(shaderSource, publicShaderDir, { recursive: true });

console.log(`[Cubism 5] Framework prepared: ${frameworkDir}`);
console.log(`[Cubism 5] WebGL shaders copied to: ${publicShaderDir}`);
