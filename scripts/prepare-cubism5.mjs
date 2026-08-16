import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const cacheRoot = resolve(root, '.cache');
const frameworkDir = resolve(cacheRoot, 'CubismWebFramework');
const shaderSource = resolve(frameworkDir, 'Shaders', 'WebGL');
const publicShaderDir = resolve(root, 'public', 'cubism5-shaders');
const mocSource = resolve(frameworkDir, 'src', 'model', 'cubismmoc.ts');

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
  execFileSync('git', ['-C', frameworkDir, 'reset', '--hard', 'origin/5-r.5'], { stdio: 'inherit' });
}

if (!existsSync(shaderSource)) {
  throw new Error(`Cubism 5 shader directory not found: ${shaderSource}`);
}

// Cubism Web Framework R5 calls Core.Version.csmGetMocVersion(ArrayBuffer)
// inside CubismMoc.create(). The Core 5.1.0 Web runtime currently shipped with
// this project exposes an incompatible binding for that helper, causing
// "Cannot read properties of undefined (reading 'byteLength')" even when
// hasMocConsistency() succeeds. The MOC3 version is encoded in byte 4 of a
// valid MOC3 buffer, so keep the framework's _mocVersion bookkeeping without
// calling the incompatible Core helper.
if (existsSync(mocSource)) {
  const source = readFileSync(mocSource, 'utf8');
  const needle = 'cubismMoc._mocVersion =\n        Live2DCubismCore.Version.csmGetMocVersion(mocBytes);';
  const replacement = 'cubismMoc._mocVersion =\n        new Uint8Array(mocBytes)[4] ?? 0;';

  if (source.includes(needle)) {
    writeFileSync(mocSource, source.replace(needle, replacement), 'utf8');
    console.log('[Cubism 5] Patched CubismMoc.create() to avoid incompatible csmGetMocVersion binding.');
  } else if (!source.includes(replacement)) {
    throw new Error('CubismMoc.create() source changed; refusing to build with an unverified patch target.');
  }
}

mkdirSync(publicShaderDir, { recursive: true });
cpSync(shaderSource, publicShaderDir, { recursive: true });

console.log(`[Cubism 5] Framework prepared: ${frameworkDir}`);
console.log(`[Cubism 5] WebGL shaders copied to: ${publicShaderDir}`);
