import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';
import { soundManager } from '../utils/audioSynth';
import { ExpressionType } from '../types';

// Expose PIXI globally for pixi-live2d-display
(window as any).PIXI = PIXI;

interface Live2DCanvasProps {
  currentExpression: ExpressionType;
  isSpeaking?: boolean;
  onCharacterClick?: (zone: 'head' | 'halo' | 'body', x: number, y: number) => void;
  framing?: 'upper' | 'full';
  scaleOffset?: number;
  yOffset?: number;
}

export const Live2DCanvas: React.FC<Live2DCanvasProps> = ({
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

  useEffect(() => {
    soundManager.setMouthCallback((val) => {
      mouthOpenRef.current = val;
    });
    return () => {
      soundManager.clearMouthCallback();
    };
  }, []);

  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const currentExpressionRef = useRef<ExpressionType>(currentExpression);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    currentExpressionRef.current = currentExpression;
  }, [currentExpression]);

  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;

    try {
      if (currentExpression === 'normal') {
        if (model.internalModel?.coreModel) {
          const core = model.internalModel.coreModel as any;
          for (let i = 1; i <= 8; i++) {
            try {
              core.setParameterValueById(`ParamBiaoQ${i}`, 0);
            } catch {}
          }
        }
      } else {
        const expressionMap: Record<ExpressionType, number> = {
          blush: 0,
          happy: 1,
          wink: 2,
          surprised: 3,
          thinking: 4,
          pout: 5,
          shy: 6,
          love: 7,
          normal: 0,
        };
        const expIdx = expressionMap[currentExpression];
        if (typeof expIdx === 'number') {
          if (typeof model.expression === 'function') {
            model.expression(expIdx);
          }
          if (model.internalModel?.coreModel) {
            const core = model.internalModel.coreModel as any;
            for (let i = 1; i <= 8; i++) {
              try {
                core.setParameterValueById(`ParamBiaoQ${i}`, i === expIdx + 1 ? 1.0 : 0);
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      console.warn("Expression change error:", err);
    }
  }, [currentExpression, isLoaded]);

  const updateModelTransform = useCallback(() => {
    const model = modelRef.current;
    const app = pixiAppRef.current;
    if (!model || !app) return;

    const appW = app.screen.width;
    const appH = app.screen.height;

    const origH =
      model.internalModel?.originalHeight ||
      (model.scale.y > 0 ? model.height / model.scale.y : 2400) ||
      2400;

    if (framing === 'upper') {
      const targetHeight = appH * 1.55 * scaleOffset;
      const computedScale = targetHeight / origH;
      model.scale.set(computedScale);
      model.anchor.set(0.5, 0.04);
      model.x = appW / 2;
      model.y = appH * 0.05 + yOffset;
    } else {
      const targetHeight = appH * 0.88 * scaleOffset;
      const computedScale = targetHeight / origH;
      model.scale.set(computedScale);
      model.anchor.set(0.5, 0.02);
      model.x = appW / 2;
      model.y = appH * 0.06 + yOffset;
    }
  }, [framing, scaleOffset, yOffset]);

  fitModelRef.current = updateModelTransform;

  useEffect(() => {
    if (isLoaded) {
      updateModelTransform();
    }
  }, [framing, scaleOffset, yOffset, isLoaded, updateModelTransform]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let app: PIXI.Application | null = null;
    let isCancelled = false;

    async function initPixi() {
      try {
        setLoadError(null);
        setIsLoaded(false);

        const width = container?.clientWidth || window.innerWidth;
        const height = container?.clientHeight || window.innerHeight;

        app = new PIXI.Application({
          width,
          height,
          backgroundAlpha: 0,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          antialias: true,
        });

        pixiAppRef.current = app;
        if (container && app.view) {
          container.innerHTML = '';
          container.appendChild(app.view as HTMLCanvasElement);
        }

        Live2DModel.registerTicker(PIXI.Ticker);

        // Resolve the public asset against Vite's runtime base path.
        // This is required for GitHub Pages deployments under /Lily---AI-Anime-Companion/.
        const modelUrl = new URL(
          `${import.meta.env.BASE_URL}live2d/MassageSeacubus_rei.model3.json`,
          window.location.href,
        ).href;

        const model = await Live2DModel.from(modelUrl, {
          autoInteract: false,
        });

        if (isCancelled) {
          model.destroy();
          return;
        }

        modelRef.current = model;
        app.stage.addChild(model);
        setIsLoaded(true);
        fitModelRef.current();

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

        let nextBlinkTime = performance.now() + 2000 + Math.random() * 3000;
        let blinkPhase = 0;

        app.ticker.add(() => {
          if (!model || !model.internalModel || !model.internalModel.coreModel) return;
          const core = model.internalModel.coreModel as any;
          const now = performance.now();
          tickCount += 0.035;

          if (now > nextAutonomousShiftTime) {
            const exp = currentExpressionRef.current;
            const moodShift = Math.random();

            if (exp === 'love') {
              targetAutoAngleX = (Math.random() - 0.5) * 6;
              targetAutoAngleY = 2 + Math.random() * 6;
              targetAutoAngleZ = (Math.random() - 0.5) * 8;
              targetAutoEyeX = (Math.random() - 0.5) * 0.2;
              targetAutoEyeY = 0.1 + Math.random() * 0.2;
            } else if (exp === 'blush' || exp === 'shy') {
              targetAutoAngleX = (Math.random() - 0.5) * 8;
              targetAutoAngleY = -5 - Math.random() * 4;
              targetAutoAngleZ = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 5);
              targetAutoEyeX = (Math.random() - 0.5) * 0.3;
              targetAutoEyeY = -0.3 - Math.random() * 0.2;
            } else if (exp === 'pout') {
              const side = Math.random() > 0.5 ? 1 : -1;
              targetAutoAngleX = side * (8 + Math.random() * 6);
              targetAutoAngleY = -2 + Math.random() * 4;
              targetAutoAngleZ = -side * 4;
              targetAutoEyeX = side * 0.4;
              targetAutoEyeY = 0;
            } else if (exp === 'thinking') {
              targetAutoAngleX = 6 + Math.random() * 6;
              targetAutoAngleY = 4 + Math.random() * 5;
              targetAutoAngleZ = 4;
              targetAutoEyeX = 0.5;
              targetAutoEyeY = 0.3;
            } else if (moodShift < 0.4) {
              targetAutoAngleX = (Math.random() - 0.5) * 8;
              targetAutoAngleY = -1 + Math.random() * 6;
              targetAutoAngleZ = (Math.random() - 0.5) * 6;
              targetAutoEyeX = (Math.random() - 0.5) * 0.3;
              targetAutoEyeY = (Math.random() - 0.5) * 0.2;
            } else if (moodShift < 0.75) {
              const side = Math.random() > 0.5 ? 1 : -1;
              targetAutoAngleX = side * (7 + Math.random() * 8);
              targetAutoAngleY = (Math.random() - 0.5) * 6;
              targetAutoAngleZ = -side * (3 + Math.random() * 5);
              targetAutoEyeX = side * (0.3 + Math.random() * 0.4);
              targetAutoEyeY = (Math.random() - 0.5) * 0.3;
            } else {
              targetAutoAngleX = (Math.random() - 0.5) * 6;
              targetAutoAngleY = 3 + Math.random() * 5;
              targetAutoAngleZ = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4);
              targetAutoEyeX = (Math.random() - 0.5) * 0.3;
              targetAutoEyeY = 0.1 + Math.random() * 0.25;
            }

            nextAutonomousShiftTime = now + 2500 + Math.random() * 3000;
          }

          const microSwayX = Math.sin(tickCount * 0.7) * 2.2 + Math.cos(tickCount * 0.33) * 1.3;
          const microSwayY = Math.cos(tickCount * 0.85) * 1.8;
          const microSwayZ = Math.sin(tickCount * 0.45) * 1.8;

          const finalTargetHeadX = targetAutoAngleX + microSwayX;
          const finalTargetHeadY = targetAutoAngleY + microSwayY;
          const finalTargetHeadZ = targetAutoAngleZ + microSwayZ;
          const finalTargetEyeX = targetAutoEyeX + Math.sin(tickCount * 0.6) * 0.06;
          const finalTargetEyeY = targetAutoEyeY + Math.cos(tickCount * 0.5) * 0.06;

          headAngleX += (finalTargetHeadX - headAngleX) * 0.045;
          headAngleY += (finalTargetHeadY - headAngleY) * 0.045;
          headAngleZ += (finalTargetHeadZ - headAngleZ) * 0.045;
          bodyAngleX += (headAngleX * 0.35 - bodyAngleX) * 0.035;
          bodyAngleZ += (-headAngleZ * 0.5 - bodyAngleZ) * 0.035;

          eyeBallX += (finalTargetEyeX - eyeBallX) * 0.08;
          eyeBallY += (finalTargetEyeY - eyeBallY) * 0.08;

          if (now > nextBlinkTime && blinkPhase === 0) {
            blinkPhase = 1;
          }

          if (blinkPhase === 1) {
            eyeOpenL -= 0.32;
            eyeOpenR -= 0.32;
            if (eyeOpenL <= 0) {
              eyeOpenL = 0;
              eyeOpenR = 0;
              blinkPhase = 2;
            }
          } else if (blinkPhase === 2) {
            eyeOpenL += 0.24;
            eyeOpenR += 0.24;
            if (eyeOpenL >= 1.0) {
              eyeOpenL = 1.0;
              eyeOpenR = 1.0;
              blinkPhase = 0;
              const isDoubleBlink = Math.random() < 0.22;
              nextBlinkTime = now + (isDoubleBlink ? 180 + Math.random() * 180 : 2600 + Math.random() * 4200);
            }
          }

          let targetMouth = 0;
          if (isSpeakingRef.current || mouthOpenRef.current > 0.01) {
            const speechPulse1 = Math.sin(tickCount * 14) * 0.4 + 0.4;
            const speechPulse2 = Math.sin(tickCount * 8.5) * 0.3;
            const conversationalMouth = Math.max(0.1, Math.min(0.9, speechPulse1 + speechPulse2));
            if (mouthOpenRef.current > 0.05) {
              targetMouth = Math.max(mouthOpenRef.current, conversationalMouth * 0.7);
            } else {
              targetMouth = conversationalMouth;
            }
          }

          currentMouthY += (targetMouth - currentMouthY) * 0.35;
          if (currentMouthY < 0.01) currentMouthY = 0;

          try {
            core.setParameterValueById('ParamAngleX', headAngleX);
            core.setParameterValueById('ParamAngleY', headAngleY);
            core.setParameterValueById('ParamAngleZ', headAngleZ);
            core.setParameterValueById('ParamBodyAngleX', bodyAngleX);
            core.setParameterValueById('ParamBodyAngleZ', bodyAngleZ);
            core.setParameterValueById('ParamEyeBallX', eyeBallX);
            core.setParameterValueById('ParamEyeBallY', eyeBallY);
            core.setParameterValueById('ParamEyeLOpen', eyeOpenL);
            core.setParameterValueById('ParamEyeROpen', eyeOpenR);
            core.setParameterValueById('ParamMouthOpenY', currentMouthY);
          } catch {}
        });

        const resizeObserver = new ResizeObserver(() => {
          if (!app || isCancelled) return;
          const newWidth = container.clientWidth || window.innerWidth;
          const newHeight = container.clientHeight || window.innerHeight;
          app.renderer.resize(newWidth, newHeight);
          fitModelRef.current();
        });
        resizeObserver.observe(container);

        const handleResize = () => {
          if (!app || isCancelled) return;
          app.renderer.resize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
          fitModelRef.current();
        };
        window.addEventListener('resize', handleResize);

        return () => {
          resizeObserver.disconnect();
          window.removeEventListener('resize', handleResize);
        };
      } catch (err) {
        console.error('Live2D initialization failed:', err);
        if (!isCancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load Live2D model.');
          setIsLoaded(false);
        }
      }
    }

    void initPixi();

    return () => {
      isCancelled = true;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
      }
      pixiAppRef.current = null;
      modelRef.current = null;
      setIsLoaded(false);
    };
  }, []);

  // The remainder of this component intentionally stays unchanged.
