import React, { useEffect, useRef } from 'react';

interface StarryBackgroundProps {
  theme?: string;
  mousePos?: { x: number; y: number };
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface Stardust {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export const StarryBackground: React.FC<StarryBackgroundProps> = ({
  theme = 'cosmos',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // Stars
    let stars: Star[] = [];
    const starColors = ['#ffffff', '#bae6fd', '#e0f2fe', '#fbcfe8', '#ddd6fe'];

    const initStars = () => {
      stars = [];
      const count = Math.floor((width * height) / 4500);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          baseAlpha: Math.random() * 0.7 + 0.3,
          alpha: 0.5,
          twinkleSpeed: Math.random() * 0.03 + 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        });
      }
    };

    initStars();

    // Shooting stars
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = Date.now() + 1500;

    const spawnShootingStar = () => {
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.2; // approx 45 degrees
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * (height * 0.4),
        length: Math.random() * 140 + 80,
        speed: Math.random() * 8 + 12,
        angle,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 40 + 30,
      });
    };

    // Stardust floating particles
    const dustParticles: Stardust[] = [];
    for (let i = 0; i < 40; i++) {
      dustParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        alpha: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? '#93c5fd' : '#f472b6',
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;

      // Draw Background Sky Gradient based on Theme
      let grad = ctx.createLinearGradient(0, 0, 0, height);
      if (theme === 'aurora') {
        grad.addColorStop(0, '#020e17');
        grad.addColorStop(0.5, '#062624');
        grad.addColorStop(0.8, '#0b393b');
        grad.addColorStop(1, '#061d28');
      } else if (theme === 'twilight') {
        grad.addColorStop(0, '#0f0c24');
        grad.addColorStop(0.4, '#1b143a');
        grad.addColorStop(0.7, '#232252');
        grad.addColorStop(1, '#0c305a');
      } else if (theme === 'nebula') {
        grad.addColorStop(0, '#090514');
        grad.addColorStop(0.4, '#1e0c2f');
        grad.addColorStop(0.7, '#151336');
        grad.addColorStop(1, '#0b1d3a');
      } else {
        // Deep Cosmos (Default - matches screenshot)
        grad.addColorStop(0, '#040d1a');
        grad.addColorStop(0.3, '#06172d');
        grad.addColorStop(0.7, '#0a2342');
        grad.addColorStop(0.85, '#0d3259');
        grad.addColorStop(1, '#092340');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Milky Way / Nebula subtle clouds
      const nebulaGrad = ctx.createRadialGradient(
        width * 0.65,
        height * 0.35,
        50,
        width * 0.65,
        height * 0.35,
        width * 0.6
      );
      nebulaGrad.addColorStop(0, 'rgba(96, 165, 250, 0.15)');
      nebulaGrad.addColorStop(0.4, 'rgba(167, 139, 250, 0.08)');
      nebulaGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.03)');
      nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // Glowing Horizon Light (matches screenshot blue glow behind mountains)
      const horizonGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
      horizonGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      horizonGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.12)');
      horizonGrad.addColorStop(0.8, 'rgba(14, 165, 233, 0.28)');
      horizonGrad.addColorStop(1, 'rgba(2, 132, 199, 0.45)');

      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, height * 0.6, width, height * 0.4);

      // Distant mountain silhouette at bottom
      ctx.save();
      ctx.fillStyle = '#020914';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.88);
      ctx.bezierCurveTo(
        width * 0.2,
        height * 0.82,
        width * 0.35,
        height * 0.9,
        width * 0.5,
        height * 0.86
      );
      ctx.bezierCurveTo(
        width * 0.7,
        height * 0.81,
        width * 0.85,
        height * 0.89,
        width,
        height * 0.84
      );
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw Stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.twinklePhase += star.twinkleSpeed;
        const currentAlpha = star.baseAlpha * (0.6 + 0.4 * Math.sin(star.twinklePhase));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.1, currentAlpha);
        ctx.fill();

        // Soft halo for brighter stars
        if (star.radius > 1.2 && currentAlpha > 0.6) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = (currentAlpha - 0.5) * 0.3;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      // Spawn shooting stars periodically
      if (Date.now() > nextShootingStarTime) {
        spawnShootingStar();
        nextShootingStarTime = Date.now() + Math.random() * 4000 + 2500;
      }

      // Update & Draw Shooting Stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;

        const progress = ss.life / ss.maxLife;
        const currentAlpha = (1 - progress) * ss.opacity;

        if (progress >= 1 || ss.x > width || ss.y > height) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const ssGrad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        ssGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        ssGrad.addColorStop(0.7, 'rgba(186, 230, 253, 0.4)');
        ssGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = ssGrad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        // Sparkle head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
        ctx.restore();
      }

      // Draw Floating Stardust Motes
      for (let i = 0; i < dustParticles.length; i++) {
        const p = dustParticles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(time + i));
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};
