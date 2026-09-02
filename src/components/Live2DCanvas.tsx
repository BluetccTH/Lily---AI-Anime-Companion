import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import { soundManager } from '../utils/audioSynth';
import { ExpressionType } from '../types';

// Expose PIXI globally for pixi-live2d-display
(window as any).PIXI = PIXI;

const getAssetUrl = (relativePath: string) => {
  const base = ((import.meta as any).env?.BASE_URL as string) || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
};

const loadScriptOnce = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false; // execute in order
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn(`Failed to load script: ${src}`);
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

const ensureLive2DCoreLoaded = async (): Promise<void> => {
  // Check Cubism 2
  if (!(window as any).Live2D) {
    await loadScriptOnce(getAssetUrl('live2d.min.js'));
  }
  if (!(window as any).Live2D) {
    await loadScriptOnce('https://cdn.jsdelivr.net/gh/duskload/live2d-viewer/dist/live2d.min.js');
  }

  // Check Cubism 4
  if (!(window as any).Live2DCubismCore) {
    await loadScriptOnce(getAssetUrl('live2dcubismcore.min.js'));
  }
  if (!(window as any).Live2DCubismCore) {
    await loadScriptOnce('https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js');
  }
};

export interface CharacterModelInfo {
  id: string;
  name: string;
  description: string;
  url: string;
  type: 'cubism4' | 'cubism2';
}

export const CHARACTER_MODELS: CharacterModelInfo[] = [
  {
    id: 'haru',
    name: 'น้องลิลลี่ (Lily - Haru)',
    description: 'อนิเมะสาวน้อยน่ารัก ภาพคมชัดระดับ 2048px แสดงอารมณ์และท่าทางลื่นไหล',
    url: '/live2d/haru/haru_greeter_t03.model3.json',
    type: 'cubism4',
  },
  {
    id: 'shizuku',
    name: 'ชิซึคุ (Shizuku)',
    description: 'สาวน้อยผมสั้นน่ารัก มีโมชั่นและการขยับตัวที่หลากหลาย',
    url: '/live2d/shizuku/shizuku.model.json',
    type: 'cubism2',
  },
  {
    id: 'koharu',
    name: 'โคฮารุ (Koharu)',
    description: 'จิบิสาวน้อยสุดคิวท์ ขี้อ้อน สดใสร่าเริง',
    url: '/live2d/koharu/koharu.model.json',
    type: 'cubism2',
  },
  {
    id: 'miku',
    name: 'ฮัตสึเนะ มิกุ (Miku)',
    description: 'ไอดอลสาวทวินเทลสีเขียวมินต์ ขวัญใจทุกคน',
    url: '/live2d/miku/miku.model.json',
    type: 'cubism2',
  },
  {
    id: 'chitose',
    name: 'จิโตเสะ (Chitose)',
    description: 'สาวน้อยชุดกิโมโน อ่อนหวาน เรียบร้อย',
    url: '/live2d/chitose/chitose.model.json',
    type: 'cubism2',
  },
  {
    id: 'unitychan',
    name: 'ยูนิตี้จัง (Unity-chan)',
    description: 'สาวน้อยผมบลอนด์พลังบวก สดใส มีชีวิตชีวา',
    url: '/live2d/unitychan/unitychan.model.json',
    type: 'cubism2',
  },
];

interface Live2DCanvasProps {
  modelId?: string;
  currentExpression: ExpressionType;
  isSpeaking?: boolean;
  onCharacterClick?: (zone: 'head' | 'halo' | 'body', x: number, y: number) => void;
  framing?: 'upper' | 'full';
  scaleOffset?: number;
  yOffset?: number;
}

export const Live2DCanvas: React.FC<Live2DCanvasProps> = ({
  modelId = 'haru',
  currentExpression,
  isSpeaking = false,
  onCharacterClick,
  framing = 'upper',
  scaleOffset = 1.0,
  yOffset = 0,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<any>(null);
  const mouthOpenRef = useRef<number>(0);
  const fitModelRef = useRef<() => void>(() => {});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [interactiveFeedback, setInteractiveFeedback] = useState<{
    id: number;
    x: number;
    y: number;
    emoji: string;
    text?: string;
  }[]>([]);

  // Setup sound manager mouth callback
  useEffect(() => {
    soundManager.setMouthCallback((val) => {
      mouthOpenRef.current = val;
    });
    return () => {
      soundManager.clearMouthCallback();
    };
  }, []);

  // Keep refs for immediate real-time ticker access
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const currentExpressionRef = useRef<ExpressionType>(currentExpression);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    currentExpressionRef.current = currentExpression;
  }, [currentExpression]);

  // Update Live2D expression
  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;

    try {
      if (typeof model.expression === 'function') {
        const expressionIndexMap: Record<ExpressionType, number> = {
          normal: 0,
          blush: 1,
          happy: 2,
          wink: 3,
          surprised: 4,
          thinking: 5,
          pout: 6,
          shy: 7,
          love: 2,
        };
        const idx = expressionIndexMap[currentExpression] ?? 0;
        model.expression(idx);
      }
    } catch (err) {
      console.warn("Expression change error:", err);
    }
  }, [currentExpression, isLoaded]);

  // Function to calculate and fit model based on framing mode
  const updateModelTransform = useCallback(() => {
    const model = modelRef.current;
    const app = pixiAppRef.current;
    if (!model || !app) return;

    const appW = app.screen.width;
    const appH = app.screen.height;

    // Determine model's original unscaled height
    const origH =
      model.internalModel?.originalHeight ||
      (model.scale.y > 0 ? model.height / model.scale.y : 2048) ||
      2048;

    if (framing === 'upper') {
      // Upper half of body view:
      const targetHeight = appH * 1.55 * scaleOffset;
      const computedScale = targetHeight / origH;
      model.scale.set(computedScale);
      model.anchor.set(0.5, 0.08);
      model.x = appW / 2;
      model.y = appH * 0.04 + yOffset;
    } else {
      // Full body view:
      const targetHeight = appH * 0.88 * scaleOffset;
      const computedScale = targetHeight / origH;
      model.scale.set(computedScale);
      model.anchor.set(0.5, 0.04);
      model.x = appW / 2;
      model.y = appH * 0.06 + yOffset;
    }
  }, [framing, scaleOffset, yOffset]);

  fitModelRef.current = updateModelTransform;

  // React to framing / scale / offset changes smoothly without rebuilding WebGL
  useEffect(() => {
    if (isLoaded) {
      updateModelTransform();
    }
  }, [framing, scaleOffset, yOffset, isLoaded, updateModelTransform]);

  // Initialize Pixi.js and load Live2D model
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let app: PIXI.Application | null = null;
    let isCancelled = false;

    async function initPixi() {
      try {
        const width = container?.clientWidth || window.innerWidth;
        const height = container?.clientHeight || window.innerHeight;

        app = new PIXI.Application({
          width,
          height,
          backgroundAlpha: 0,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
          antialias: true,
        });

        pixiAppRef.current = app;
        if (container && app.view) {
          container.innerHTML = '';
          container.appendChild(app.view as HTMLCanvasElement);
        }

        // Ensure Cubism core SDKs are loaded in window first
        await ensureLive2DCoreLoaded();

        if (isCancelled) return;

        // Register Live2D Ticker
        Live2DModel.registerTicker(PIXI.Ticker);

        // Find configured model
        const targetModel = CHARACTER_MODELS.find((m) => m.id === modelId) || CHARACTER_MODELS[0];
        const modelUrl = getAssetUrl(targetModel.url);
        let model: any = null;

        try {
          model = await Live2DModel.from(modelUrl, {
            autoInteract: false,
          });
        } catch (loadErr: any) {
          console.warn(`Error loading model ${modelUrl}, falling back to Haru:`, loadErr);
          try {
            model = await Live2DModel.from(getAssetUrl('/live2d/haru/haru_greeter_t03.model3.json'), {
              autoInteract: false,
            });
          } catch (haruErr: any) {
            console.warn('Haru fallback error, attempting Shizuku:', haruErr);
            model = await Live2DModel.from(getAssetUrl('/live2d/shizuku/shizuku.model.json'), {
              autoInteract: false,
            });
          }
        }

        if (isCancelled) {
          if (model) model.destroy();
          return;
        }

        if (model) {
          modelRef.current = model;
          app.stage.addChild(model);

          setIsLoaded(true);
          setLoadError(null);
          setTimeout(() => {
            fitModelRef.current();
          }, 60);
        }

        // Frame update loop for autonomous organic AI motion & life simulation
        let headAngleX = 0;
        let headAngleY = 0;
        let headAngleZ = 0;
        let bodyAngleX = 0;
        let bodyAngleZ = 0;
        let eyeBallX = 0;
        let eyeBallY = 0;
        let eyeOpenL = 1.0;
        let eyeOpenR = 1.0;
        let currentMouthY = 0;

        let tickCount = 0;
        let nextAutonomousShiftTime = 0;
        let targetAutoAngleX = 0;
        let targetAutoAngleY = 0;
        let targetAutoAngleZ = 0;
        let targetAutoEyeX = 0;
        let targetAutoEyeY = 0;

        // Autonomous natural blinking controller
        let nextBlinkTime = performance.now() + 2000 + Math.random() * 3000;
        let blinkPhase = 0; // 0 = open, 1 = closing, 2 = opening

        app.ticker.add(() => {
          if (!model || !model.internalModel) return;
          const now = performance.now();
          tickCount += 0.035;

          // 1. Autonomous organic AI shifts
          if (now > nextAutonomousShiftTime) {
            const exp = currentExpressionRef.current;

            if (exp === 'love') {
              targetAutoAngleX = (Math.random() - 0.5) * 6;
              targetAutoAngleY = 2 + Math.random() * 6;
              targetAutoAngleZ = (Math.random() - 0.5) * 8;
              targetAutoEyeX = (Math.random() - 0.5) * 0.2;
              targetAutoEyeY = 0.1 + Math.random() * 0.2;
            } else if (exp === 'shy' || exp === 'blush') {
              targetAutoAngleX = (Math.random() - 0.5) * 8;
              targetAutoAngleY = -4 - Math.random() * 4;
              targetAutoAngleZ = (Math.random() - 0.5) * 6;
              targetAutoEyeX = (Math.random() - 0.5) * 0.3;
              targetAutoEyeY = -0.2;
            } else if (exp === 'happy' || exp === 'wink') {
              targetAutoAngleX = (Math.random() - 0.5) * 10;
              targetAutoAngleY = Math.random() * 4;
              targetAutoAngleZ = (Math.random() - 0.5) * 10;
              targetAutoEyeX = (Math.random() - 0.5) * 0.25;
              targetAutoEyeY = (Math.random() - 0.5) * 0.15;
            } else if (exp === 'thinking') {
              targetAutoAngleX = 6 + Math.random() * 4;
              targetAutoAngleY = 4 + Math.random() * 4;
              targetAutoAngleZ = 4 + Math.random() * 4;
              targetAutoEyeX = 0.35;
              targetAutoEyeY = 0.35;
            } else {
              targetAutoAngleX = (Math.random() - 0.5) * 12;
              targetAutoAngleY = (Math.random() - 0.5) * 8;
              targetAutoAngleZ = (Math.random() - 0.5) * 6;
              targetAutoEyeX = (Math.random() - 0.5) * 0.4;
              targetAutoEyeY = (Math.random() - 0.5) * 0.3;
            }

            nextAutonomousShiftTime = now + 2000 + Math.random() * 3500;
          }

          // Smooth interpolation
          headAngleX += (targetAutoAngleX - headAngleX) * 0.05;
          headAngleY += (targetAutoAngleY - headAngleY) * 0.05;
          headAngleZ += (targetAutoAngleZ - headAngleZ) * 0.05;

          bodyAngleX += (headAngleX * 0.35 - bodyAngleX) * 0.04;
          bodyAngleZ += (headAngleZ * 0.35 - bodyAngleZ) * 0.04;

          eyeBallX += (targetAutoEyeX - eyeBallX) * 0.08;
          eyeBallY += (targetAutoEyeY - eyeBallY) * 0.08;

          // Natural blinking simulation
          if (now > nextBlinkTime && blinkPhase === 0) {
            blinkPhase = 1;
          }

          if (blinkPhase === 1) {
            eyeOpenL -= 0.22;
            eyeOpenR -= 0.22;
            if (eyeOpenL <= 0) {
              eyeOpenL = 0;
              eyeOpenR = 0;
              blinkPhase = 2;
            }
          } else if (blinkPhase === 2) {
            eyeOpenL += 0.2;
            eyeOpenR += 0.2;
            if (eyeOpenL >= 1.0) {
              eyeOpenL = 1.0;
              eyeOpenR = 1.0;
              blinkPhase = 0;
              nextBlinkTime = now + 2500 + Math.random() * 4000;
            }
          }

          // Lip sync mouth calculation
          let targetMouth = mouthOpenRef.current;
          if (isSpeakingRef.current && targetMouth === 0) {
            targetMouth = 0.35 + Math.sin(now * 0.015) * 0.3 + Math.sin(now * 0.027) * 0.2;
            targetMouth = Math.max(0, Math.min(1.0, targetMouth));
          }
          currentMouthY += (targetMouth - currentMouthY) * 0.35;

          // Apply parameters across Cubism 4 and Cubism 2
          try {
            const core = model.internalModel.coreModel as any;
            if (core) {
              if (typeof core.setParameterValueById === 'function') {
                // Cubism 4
                core.setParameterValueById('ParamAngleX', headAngleX);
                core.setParameterValueById('ParamAngleY', headAngleY);
                core.setParameterValueById('ParamAngleZ', headAngleZ);
                core.setParameterValueById('ParamBodyAngleX', bodyAngleX);
                core.setParameterValueById('ParamBodyAngleZ', bodyAngleZ);
                core.setParameterValueById('ParamEyeBallX', eyeBallX);
                core.setParameterValueById('ParamEyeBallY', eyeBallY);

                if (blinkPhase !== 0 || eyeOpenL < 0.99) {
                  core.setParameterValueById('ParamEyeLOpen', eyeOpenL);
                  core.setParameterValueById('ParamEyeROpen', eyeOpenR);
                }

                const breathVal = (Math.sin(tickCount * 1.5) + 1) * 0.5;
                core.setParameterValueById('ParamBreath', breathVal);
                core.setParameterValueById('ParamHairBack', Math.sin(tickCount * 1.2) * 0.4);
                core.setParameterValueById('ParamHairFront', Math.cos(tickCount * 1.1) * 0.3);
                core.setParameterValueById('ParamMouthOpenY', currentMouthY);
                if (currentMouthY > 0.05) {
                  core.setParameterValueById('ParamMouthForm', 0.6);
                }
              } else if (typeof core.setParamFloat === 'function') {
                // Cubism 2
                core.setParamFloat('PARAM_ANGLE_X', headAngleX);
                core.setParamFloat('PARAM_ANGLE_Y', headAngleY);
                core.setParamFloat('PARAM_ANGLE_Z', headAngleZ);
                core.setParamFloat('PARAM_BODY_ANGLE_X', bodyAngleX);
                core.setParamFloat('PARAM_BODY_ANGLE_Z', bodyAngleZ);
                core.setParamFloat('PARAM_EYE_BALL_X', eyeBallX);
                core.setParamFloat('PARAM_EYE_BALL_Y', eyeBallY);

                if (blinkPhase !== 0 || eyeOpenL < 0.99) {
                  core.setParamFloat('PARAM_EYE_L_OPEN', eyeOpenL);
                  core.setParamFloat('PARAM_EYE_R_OPEN', eyeOpenR);
                }

                const breathVal = (Math.sin(tickCount * 1.5) + 1) * 0.5;
                core.setParamFloat('PARAM_BREATH', breathVal);
                core.setParamFloat('PARAM_HAIR_BACK', Math.sin(tickCount * 1.2) * 0.4);
                core.setParamFloat('PARAM_HAIR_FRONT', Math.cos(tickCount * 1.1) * 0.3);
                core.setParamFloat('PARAM_MOUTH_OPEN_Y', currentMouthY);
                if (currentMouthY > 0.05) {
                  core.setParamFloat('PARAM_MOUTH_FORM', 0.6);
                }
              }
            }
          } catch {}
        });

        const handleResize = () => {
          if (!app || !container) return;
          app.renderer.resize(window.innerWidth, window.innerHeight);
          fitModelRef.current();
        };

        window.addEventListener('resize', handleResize);
        setIsLoaded(true);
      } catch (err: any) {
        console.error("Live2D initialization error:", err);
        setLoadError(err?.message || "Live2D Model failed to initialize");
      }
    }

    initPixi();

    return () => {
      isCancelled = true;
      if (app) {
        try {
          app.destroy(true, { children: true, texture: true, baseTexture: true });
        } catch {}
      }
    };
  }, [modelId]);

  // Spawn visual floating reaction emojis/particles on touch
  const triggerVisualReaction = useCallback((x: number, y: number, emoji: string, text?: string) => {
    const id = Date.now() + Math.random();
    setInteractiveFeedback((prev) => [...prev, { id, x, y, emoji, text }]);
    setTimeout(() => {
      setInteractiveFeedback((prev) => prev.filter((item) => item.id !== id));
    }, 1800);
  }, []);

  // Handle interactive clicks on avatar
  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const relY = clickY / rect.height;

    // Detect zone (halo, head, chest/body) calibrated for upper half framing
    if (relY < 0.25) {
      // Halo / Horns zone
      soundManager.playHaloSound();
      triggerVisualReaction(clickX, clickY, '✨', 'ประกายระยิบระยับ!');
      onCharacterClick?.('halo', clickX, clickY);
    } else if (relY < 0.48) {
      // Head pat / Face zone
      soundManager.playStarSparkle();
      triggerVisualReaction(clickX, clickY, '💖', '*ลูบหัวเบาๆ*');
      onCharacterClick?.('head', clickX, clickY);
    } else {
      // Chest / Upper body zone
      soundManager.playPop();
      triggerVisualReaction(clickX, clickY, '🌟', 'สัมผัสอันอบอุ่น');
      onCharacterClick?.('body', clickX, clickY);
    }
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={handlePointerDown}
    >
      {/* Live2D Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center"
      />

      {/* Floating touch particle reactions */}
      {interactiveFeedback.map((fb) => (
        <div
          key={fb.id}
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-float z-30 flex flex-col items-center"
          style={{ left: `${fb.x}px`, top: `${fb.y}px` }}
        >
          <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
            {fb.emoji}
          </span>
          {fb.text && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 text-pink-200 border border-pink-500/30 backdrop-blur-md whitespace-nowrap mt-1 shadow-lg">
              {fb.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
