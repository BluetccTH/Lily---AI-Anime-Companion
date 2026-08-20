import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const cacheRoot = resolve(root, '.cache');
const frameworkDir = resolve(cacheRoot, 'CubismWebFramework');
const shaderSource = resolve(frameworkDir, 'Shaders', 'WebGL');
const publicShaderDir = resolve(root, 'public', 'cubism5-shaders');
const mocSource = resolve(frameworkDir, 'src', 'model', 'cubismmoc.ts');
const modelSource = resolve(frameworkDir, 'src', 'model', 'cubismmodel.ts');

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

// The bundled Core in this project exposes Cubism 5.1.0. The R5 framework
// also knows about the newer Cubism 5.3+ offscreen API, but older Core builds
// do not expose model.offscreens. Keep the R5 framework while making models
// without offscreen objects load safely on that Core.
if (existsSync(modelSource)) {
  let source = readFileSync(modelSource, 'utf8');
  const marker = '// LILY_CUBISM5_OFFSCREEN_COMPAT';
  const needle = 'const model: Live2DCubismCore.Model = Live2DCubismCore.Model.fromMoc(\n      this._moc\n    );';
  const replacement = `const model: Live2DCubismCore.Model = Live2DCubismCore.Model.fromMoc(\n      this._moc\n    );\n\n    ${marker}\n    // Cubism Core 5.1 does not expose the R5 offscreen model block.\n    // Models that do not use offscreen rendering can safely expose an empty\n    // compatibility block so the R5 framework can initialize normally.\n    if (model && !(model as any).offscreens) {\n      (model as any).offscreens = {\n        count: 0,\n        opacities: new Float32Array(0),\n        multiplyColors: new Float32Array(0),\n        screenColors: new Float32Array(0),\n        blendModes: new Uint16Array(0),\n        ownerIndices: new Int32Array(0),\n        masks: [],\n        maskCounts: new Int32Array(0),\n        constantFlags: new Uint8Array(0),\n      };\n    }\n    if (model && (model as any).parts && !(model as any).parts.offscreenIndices) {\n      (model as any).parts.offscreenIndices = new Int32Array((model as any).parts.count || 0).fill(-1);\n    }`;

  if (!source.includes(marker)) {
    if (!source.includes(needle)) {
      throw new Error('CubismModel.createModel() source changed; refusing to apply the offscreen compatibility patch.');
    }
    source = source.replace(needle, replacement);
    writeFileSync(modelSource, source, 'utf8');
    console.log('[Cubism 5] Added Core 5.1 offscreen compatibility shim.');
  }
}

// CubismMoc.create() in R5 calls csmGetMocVersion(ArrayBuffer). The bundled
// Core binding in this project does not expose that helper with the same
// signature, so keep the framework bookkeeping without calling it.
if (existsSync(mocSource)) {
  const source = readFileSync(mocSource, 'utf8');
  const needle = 'cubismMoc._mocVersion =\n        Live2DCubismCore.Version.csmGetMocVersion(mocBytes);';
  const replacement = 'cubismMoc._mocVersion =\n        new Uint8Array(mocBytes)[4] ?? 0;';

  if (source.includes(needle)) {
    writeFileSync(mocSource, source.replace(needle, replacement), 'utf8');
    console.log('[Cubism 5] Patched CubismMoc.create() version bookkeeping.');
  } else if (!source.includes(replacement)) {
    throw new Error('CubismMoc.create() source changed; refusing to build with an unverified patch target.');
  }
}

mkdirSync(publicShaderDir, { recursive: true });
cpSync(shaderSource, publicShaderDir, { recursive: true });

console.log(`[Cubism 5] Framework prepared: ${frameworkDir}`);
console.log(`[Cubism 5] WebGL shaders copied to: ${publicShaderDir}`);
