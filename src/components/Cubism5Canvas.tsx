import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CubismFramework, Option } from '@framework/live2dcubismframework';
import { CubismUserModel } from '@framework/model/cubismusermodel';
import { CubismMoc } from '@framework/model/cubismmoc';
import { CubismRenderer_WebGL } from '@framework/rendering/cubismrenderer_webgl';
import { ExpressionType } from '../types';
import { soundManager } from '../utils/audioSynth';

interface Cubism5CanvasProps {
  currentExpression: ExpressionType;
  isSpeaking?: boolean;
  onCharacterClick?: (zone: 'head' | 'halo' | 'body', x: number, y: number) => void;
  framing?: 'upper' | 'full';
  scaleOffset?: number;
  yOffset?: number;
}

let cubismStarted = false;

function ensureCubism5Started() {
  if (cubismStarted) return;
  const option = new Option();
  (option as any).logFunction = (message: string) => console.log(`[Cubism] ${message}`);
  option.loggingLevel = 2 as any;
  CubismFramework.startUp(option);
  CubismFramework.initialize();
  cubismStarted = true;
}

export const Cubism5Canvas: React.FC<Cubism5CanvasProps> = ({
  currentExpression,
  isSpeaking = false,
  onCharacterClick,
  framing = 'upper',
  scaleOffset = 1,
  yOffset = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<CubismUserModel | null>(null);
  const rendererRef = useRef<CubismRenderer_WebGL | null>(null);
  const rafRef = useRef<number | null>(null);
  const mouthRef = useRef(0);
  const speakingRef = useRef(isSpeaking);
  const expressionRef = useRef(currentExpression);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { speakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { expressionRef.current = currentExpression; }, [currentExpression]);
  useEffect(() => {
    soundManager.setMouthCallback((value) => { mouthRef.current = value; });
    return () => soundManager.clearMouthCallback();
  }, []);

  const setParameter = useCallback((name: string, value: number) => {
    const model = modelRef.current;
    if (!model) return;
    try {
      const coreModel = model.getModel();
      const id = CubismFramework.getIdManager().getId(name);
      const index = coreModel.getParameterIndex(id);
      if (index >= 0) coreModel.setParameterValueByIndex(index, value);
    } catch {}
  }, []);

  const updateTransform = useCallback(() => {
    const model = modelRef.current;
    const renderer = rendererRef.current;
    if (!model || !renderer || !canvasRef.current) return;
    const matrix = model.getModelMatrix();
    const height = framing === 'full' ? 1.92 : 1.42;
    const scale = Math.max(0.5, Math.min(2.5, scaleOffset));
    matrix.setHeight(height * scale);
    matrix.setY(-0.02 + yOffset);
    renderer.setMvpMatrix(matrix.getArray());
  }, [framing, scaleOffset, yOffset]);

  useEffect(() => {
    if (ready) updateTransform();
  }, [ready, updateTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    const init = async () => {
      try {
        setLoadError(null);
        ensureCubism5Started();

        const gl = canvas.getContext('webgl2', {
          alpha: true,
          antialias: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
        }) as WebGLRenderingContext | null;
        if (!gl) throw new Error('WebGL2 is unavailable on this device.');

        const base = import.meta.env.BASE_URL;
        const modelUrl = `${base}live2d/MassageSeacubus_rei.model3.json`;
        const response = await fetch(modelUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`model3.json HTTP ${response.status}`);
        const setting = await response.json();

        const mocPath = setting?.FileReferences?.Moc;
        if (typeof mocPath !== 'string' || !mocPath) throw new Error('model3.json is missing FileReferences.Moc.');
        const mocUrl = `${base}live2d/${mocPath}`;
        const mocResponse = await fetch(mocUrl, { cache: 'no-store' });
        if (!mocResponse.ok) throw new Error(`MOC3 HTTP ${mocResponse.status}`);

        const mocBuffer = await mocResponse.arrayBuffer();
        const first16 = new Uint8Array(mocBuffer.slice(0, 16));
        const header = new TextDecoder('ascii').decode(first16.slice(0, 4));
        const mocVersionByte = first16[4] ?? 0;
        console.info('[Lily Cubism 5] MOC buffer', {
          url: mocUrl,
          bytes: mocBuffer.byteLength,
          header,
          mocVersionByte,
          first16: Array.from(first16),
        });

        if (mocBuffer.byteLength < 16) throw new Error(`MOC3 is too small (${mocBuffer.byteLength} bytes): ${mocUrl}`);
        if (header !== 'MOC3') throw new Error(`Invalid MOC3 header "${header}" (${mocBuffer.byteLength} bytes): ${mocUrl}`);
        if (mocVersionByte !== 5) throw new Error(`Unsupported MOC3 version ${mocVersionByte}. Expected Cubism 5 MOC version 5.`);

        const consistent = CubismMoc.hasMocConsistency(mocBuffer);
        console.info('[Lily Cubism 5] MOC consistency:', consistent);
        if (!consistent) throw new Error(`MOC3 integrity check failed (v${mocVersionByte}, ${mocBuffer.byteLength} bytes).`);

        const model = new CubismUserModel();
        // Use the official Cubism 5 R4 Core/Framework path without rewriting
        // the MOC version or injecting fake R5 offscreen fields.
        model.loadModel(mocBuffer, true);
        if (!model.getModel()) throw new Error(`Cubism 5 Core failed to create the model (${mocBuffer.byteLength} bytes).`);

        model.createRenderer(canvas.width, canvas.height, 2);
        const renderer = model.getRenderer();
        renderer.startUp(gl as any);
        renderer.setIsPremultipliedAlpha(true);

        const textures = Array.isArray(setting?.FileReferences?.Textures)
          ? setting.FileReferences.Textures
          : [];
        if (!textures.length) throw new Error('No texture is defined in model3.json.');

        for (let i = 0; i < textures.length; i++) {
          const textureUrl = `${base}live2d/${textures[i]}`;
          const image = new Image();
          image.decoding = 'async';
          image.src = textureUrl;
          await image.decode();

          const texture = gl.createTexture();
          if (!texture) throw new Error(`Unable to create WebGL texture ${i}.`);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          renderer.bindTexture(i, texture);
        }

        renderer.loadShaders(`${base}cubism5-shaders/WebGL/`);

        if (cancelled) {
          model.release();
          return;
        }

        modelRef.current = model;
        rendererRef.current = renderer;
        updateTransform();
        setReady(true);

        const loop = () => {
          if (cancelled) return;
          const t = performance.now() * 0.001;
          const expression = expressionRef.current;
          const mood = expression === 'love' ? 1 : expression === 'shy' || expression === 'blush' ? 0.7 : 0.35;

          setParameter('ParamAngleX', Math.sin(t * 0.75) * (3 + mood * 3));
          setParameter('ParamAngleY', Math.cos(t * 0.66) * (2 + mood * 2));
          setParameter('ParamAngleZ', Math.sin(t * 0.42) * (2 + mood * 4));
          setParameter('ParamBodyAngleX', Math.sin(t * 0.5) * 1.8);
          setParameter('ParamEyeBallX', Math.sin(t * 0.55) * 0.15);
          setParameter('ParamEyeBallY', Math.cos(t * 0.43) * 0.1);

          const blink = Math.sin(t * 0.35 + 1.2) > 0.94 ? 0.05 : 1;
          setParameter('ParamEyeLOpen', blink);
          setParameter('ParamEyeROpen', blink);

          const breath = 0.5 + Math.sin(t * 1.5) * 0.5;
          setParameter('ParamBreath', breath);
          setParameter('ParamBreath2', breath);

          const speaking = speakingRef.current || mouthRef.current > 0.01;
          const mouth = speaking
            ? Math.max(mouthRef.current, 0.22 + Math.sin(t * 13) * 0.2 + Math.sin(t * 6.7) * 0.12)
            : 0;
          setParameter('ParamMouthOpenY', Math.max(0, Math.min(1, mouth)));
          setParameter('ParamJawOpen', Math.max(0, Math.min(1, mouth * 0.75)));

          const expressionMap: Record<ExpressionType, number> = {
            blush: 1, happy: 2, wink: 3, surprised: 4, thinking: 5,
            pout: 6, shy: 7, love: 8, normal: 0,
          };
          const selected = expressionMap[expression];
          for (let i = 1; i <= 8; i++) setParameter(`ParamBiaoQ${i}`, selected === i ? 1 : 0);

          model.update();
          updateTransform();
          renderer.setRenderState(null, [0, 0, canvas.width, canvas.height]);
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          renderer.doDrawModel(`${base}cubism5-shaders/WebGL/`);
          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (error: any) {
        console.error('[Lily Cubism 5] initialization failed:', error);
        setLoadError(error?.message || String(error) || 'Cubism 5 initialization failed');
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (rendererRef.current) rendererRef.current.setRenderTargetSize(canvas.width, canvas.height);
      updateTransform();
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    void init();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try { modelRef.current?.release(); } catch {}
      modelRef.current = null;
      rendererRef.current = null;
      setReady(false);
    };
  }, [setParameter, updateTransform]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const relY = y / Math.max(1, rect.height);
    const zone = relY < 0.25 ? 'halo' : relY < 0.5 ? 'head' : 'body';
    onCharacterClick?.(zone, x, y);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" onClick={handleClick} />
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-20">
          <div className="rounded-xl border border-red-400/20 bg-slate-950/85 px-4 py-3 text-xs text-red-200 backdrop-blur-md text-center">
            Cubism 5 โหลดไม่สำเร็จ: {loadError}
          </div>
        </div>
      )}
    </div>
  );
};
