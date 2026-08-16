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
      if (currentExpression === 'normal') {
        // Reset expression parameters
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
          // Try model.expression method
          if (typeof model.expression === 'function') {
            model.expression(expIdx);
          }
          // Also set parameter directly for immediate response
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
      (model.scale.y > 0 ? model.height / model.scale.y : 2400) ||
      2400;

    if (framing === 'upper') {
      // Upper half of body view:
      const targetHeight = appH * 1.55 * scaleOffset;
      const computedScale = targetHeight / origH;
      model.scale.set(computedScale);
      model.anchor.set(0.5, 0.04);
      model.x = appW / 2;
      model.y = appH * 0.05 + yOffset;
    } else {
      // Full body view:
      const targetHeight = appH * 0.88 * scaleOffset;
      const computedScale = targetHeight / origH;
      model.scale.set(computedScale);
      model.anchor.set(0.5, 0.02);
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
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          antialias: true,
        });

        pixiAppRef.current = app;
        if (container && app.view) {
          container.innerHTML = '';
          container.appendChild(app.view as HTMLCanvasElement);
        }

        // Register Cubism 4 Live2D model
        Live2DModel.registerTicker(PIXI.Ticker);

        // GitHub Pages serves this app from /Lily---AI-Anime-Companion/.
        // Resolve the model relative to Vite's configured runtime base instead of /. 
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

        fitModelRef.current();

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
          if (!model || !model.internalModel || !model.internalModel.coreModel) return;
          const core = model.internalModel.coreModel as any;
          const now = performance.now();
          tickCount += 0.035;

          // 1. Autonomous Intelligent Life Engine (Lily moves on her own free will & lover's affection)
          if (now > nextAutonomousShiftTime) {
            const exp = currentExpressionRef.current;
            const moodShift = Math.random();

            if (exp === 'love') {
              // Leaning in affectionately, gentle upward gaze at lover
              targetAutoAngleX = (Math.random() - 0.5) * 6;
              targetAutoAngleY = 2 + Math.random() * 6; // looking up lovingly
              targetAutoAngleZ = (Math.random() - 0.5) * 8;
              targetAutoEyeX = (Math.random() - 0.5) * 0.2;
              targetAutoEyeY = 0.1 + Math.random() * 0.2;
            } else if (exp === 'blush' || exp === 'shy') {
              // Shy head tilt, looking down slightly with embarrassment
              targetAutoAngleX = (Math.random() - 0.5) * 8;
              targetAutoAngleY = -5 - Math.random() * 4;
              targetAutoAngleZ = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 5);
              targetAutoEyeX = (Math.random() - 0.5) * 0.3;
              targetAutoEyeY = -0.3 - Math.random() * 0.2;
            } else if (exp === 'pout') {
              // Cute pout, turning cheek away slightly
              const side = Math.random() > 0.5 ? 1 : -1;
              targetAutoAngleX = side * (8 + Math.random() * 6);
              targetAutoAngleY = -2 + Math.random() * 4;
              targetAutoAngleZ = -side * 4;
              targetAutoEyeX = side * 0.4;
              targetAutoEyeY = 0;
            } else if (exp === 'thinking') {
              // Thinking gaze upward to one side
              targetAutoAngleX = 6 + Math.random() * 6;
              targetAutoAngleY = 4 + Math.random() * 5;
              targetAutoAngleZ = 4;
              targetAutoEyeX = 0.5;
              targetAutoEyeY = 0.3;
            } else if (moodShift < 0.4) {
              // Gentle warm front gaze with soft micro-tilt
              targetAutoAngleX = (Math.random() - 0.5) * 8;
              targetAutoAngleY = -1 + Math.random() * 6;
              targetAutoAngleZ = (Math.random() - 0.5) * 6;
              targetAutoEyeX = (Math.random() - 0.5) * 0.3;
              targetAutoEyeY = (Math.random() - 0.5) * 0.2;
            } else if (moodShift < 0.75) {
              // Thoughtful dreamy side glance
              const side = Math.random() > 0.5 ? 1 : -1;
              targetAutoAngleX = side * (7 + Math.random() * 8);
              targetAutoAngleY = (Math.random() - 0.5) * 6;
              targetAutoAngleZ = -side * (3 + Math.random() * 5);
              targetAutoEyeX = side * (0.3 + Math.random() * 0.4);
              targetAutoEyeY = (Math.random() - 0.5) * 0.3;
            } else {
              // Sweet curious lean
              targetAutoAngleX = (Math.random() - 0.5) * 6;
              targetAutoAngleY = 3 + Math.random() * 5;
              targetAutoAngleZ = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4);
              targetAutoEyeX = (Math.random() - 0.5) * 0.3;
              targetAutoEyeY = 0.1 + Math.random() * 0.25;
            }

            // Next shift duration between 2.5 and 5.5 seconds
            nextAutonomousShiftTime = now + 2500 + Math.random() * 3000;
          }

          // Organic continuous micro-sway and natural living oscillation
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

          // 2. Natural Organic Blinking Mechanism
          if (now > nextBlinkTime && blinkPhase === 0) {
            blinkPhase = 1; // start closing eyes
          }

          if (blinkPhase === 1) {
            eyeOpenL -= 0.32;
            eyeOpenR -= 0.32;
            if (eyeOpenL <= 0) {
              eyeOpenL = 0;
              eyeOpenR = 0;
              blinkPhase = 2; // start opening
            }
          } else if (blinkPhase === 2) {
            eyeOpenL += 0.24;
            eyeOpenR += 0.24;
            if (eyeOpenL >= 1.0) {
              eyeOpenL = 1.0;
              eyeOpenR = 1.0;
              blinkPhase = 0;
              // Occasional cute double-blink
              const isDoubleBlink = Math.random() < 0.22;
              nextBlinkTime = now + (isDoubleBlink ? 180 + Math.random() * 180 : 2600 + Math.random() * 4200);
            }
          }

          // 3. Guaranteed High-Responsiveness Lip Sync & Mouth Animation
          let targetMouth = 0;
          if (isSpeakingRef.current || mouthOpenRef.current > 0.01) {
            // Conversational speech cadence wave (natural syllable pulses)
            const speechPulse1 = Math.sin(tickCount * 14) * 0.4 + 0.4;
            const speechPulse2 = Math.sin(tickCount * 8.5) * 0.3;
            const conversationalMouth = Math.max(0.1, Math.min(0.9, speechPulse1 + speechPulse2));
            
            // If audio volume callback provided data, combine it dynamically; otherwise use natural speech pulse
            if (mouthOpenRef.current > 0.05) {
              targetMouth = Math.max(mouthOpenRef.current, conversationalMouth * 0.7);
            } else {
              targetMouth = conversationalMouth;
            }
          }

          currentMouthY += (targetMouth - currentMouthY) * 0.35;
          if (currentMouthY < 0.01) currentMouthY = 0;

          try {
            // Head orientation & body rotation
            core.setParameterValueById('ParamAngleX', headAngleX);
            core.setParameterValueById('ParamAngleY', headAngleY);
            core.setParameterValueById('ParamAngleZ', headAngleZ);
            core.setParameterValueById('ParamBodyAngleX', bodyAngleX);
            core.setParameterValueById('ParamBodyAngleZ', bodyAngleZ);

            // Eyeball direction
            core.setParameterValueById('ParamEyeBallX', eyeBallX);
            core.setParameterValueById('ParamEyeBallY', eyeBallY);

            // Organic eye blinking
            if (blinkPhase !== 0 || eyeOpenL < 0.99) {
              core.setParameterValueById('ParamEyeLOpen', eyeOpenL);
              core.setParameterValueById('ParamEyeROpen', eyeOpenR);
            }

            // Natural breathing & twintail hair idle physics
            const breathVal = (Math.sin(tickCount * 1.5) + 1) * 0.5;
            core.setParameterValueById('ParamBreath', breathVal);
            core.setParameterValueById('ParamBreath2', breathVal);
            core.setParameterValueById('ParamHairBack', Math.sin(tickCount * 1.2) * 0.45);
            core.setParameterValueById('ParamHairFront', Math.cos(tickCount * 1.1) * 0.35);
            core.setParameterValueById('ParamHairSide', Math.sin(tickCount * 0.9) * 0.3);

            // Wing / Halo subtle floating physics
            try {
              core.setParameterValueById('ParamWingL', Math.sin(tickCount * 1.3) * 0.3);
              core.setParameterValueById('ParamWingR', Math.sin(tickCount * 1.3) * 0.3);
            } catch {}

            // Lip sync mouth opening and jaw motion
            core.setParameterValueById('ParamMouthOpenY', currentMouthY);
            core.setParameterValueById('ParamJawOpen', currentMouthY * 0.75);
            core.setParameterValueById('ParamMouthPressLipOpen', currentMouthY * 0.4);
            if (currentMouthY > 0.05) {
              core.setParameterValueById('ParamMouthForm', 0.6); // slight smile form while speaking
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
  }, []);

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
      triggerVisualReaction(clickX, clickY, '✨', 'วงแหวนดวงดาวส่องประกาย!');
      onCharacterClick?.('halo', clickX, clickY);
    } else if (relY < 0.48) {
      // Head pat / Face zone
      soundManager.playStarSparkle();
      triggerVisualReaction(clickX, clickY, '💖', '*ลูบหัวเบาๆ*');
      onCharacterClick?.('head', clickX, clickY);
    } else {
      // Chest / Upper body zone
      soundManager.playPop();
      triggerVisualReaction(clickX, clickY, '🌟', 'สัมผัสแห่งดวงดาว');
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

      {/* Fallback Static/Animated Avatar if WebGL is unavailable */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="relative animate-float">
            <img
              src="/assets/cover.png"
              alt="Perla"
              className="max-h-[80vh] object-contain drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]"
            />
            {/* Halo glow overlay */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl animate-pulse-glow" />
          </div>
        </div>
      )}

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
