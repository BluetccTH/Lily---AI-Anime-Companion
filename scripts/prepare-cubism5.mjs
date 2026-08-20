import { existsSync, mkdirSync, resolve } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = resolve(process.cwd());
const cacheRoot = resolve(root, '.cache');
const frameworkDir = resolve(cacheRoot, 'CubismWebFramework');

mkdirSync(cacheRoot, { recursive: true });

// Keep the SDK preparation deterministic. The application currently bundles
// Cubism Core 5.1.0, so use the matching Cubism Web Framework R4 tag.
// R4 does not expose a Shaders/WebGL directory: WebGL shader sources are
// compiled from the framework source tree.
if (existsSync(frameworkDir)) {
  execFileSync('git', ['-C', frameworkDir, 'fetch', '--depth', '1', 'origin', '5-r.4'], { stdio: 'inherit' });
  execFileSync('git', ['-C', frameworkDir, 'reset', '--hard', 'origin/5-r.4'], { stdio: 'inherit' });
} else {
  execFileSync('git', [
    'clone',
    '--depth', '1',
    '--branch', '5-r.4',
    'https://github.com/Live2D/CubismWebFramework.git',
    frameworkDir,
  ], { stdio: 'inherit' });
}

// Verify the checkout is actually the expected framework instead of silently
// accepting a different branch/tag layout.
const head = execFileSync('git', ['-C', frameworkDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const requiredRenderer = resolve(frameworkDir, 'src/rendering/cubismrenderer_webgl.ts');
const requiredShaderManager = resolve(frameworkDir, 'src/rendering/cubismshadermanager_webgl.ts');
if (!existsSync(requiredRenderer) || !existsSync(requiredShaderManager)) {
  throw new Error(`[Cubism 5] Unexpected framework layout at ${head}: required WebGL renderer sources are missing.`);
}

console.log(`[Cubism 5] Framework prepared: ${frameworkDir}`);
console.log(`[Cubism 5] Framework commit: ${head}`);
console.log('[Cubism 5] Framework: 5-r.4; WebGL shaders are compiled from source, not copied from Shaders/WebGL.');
