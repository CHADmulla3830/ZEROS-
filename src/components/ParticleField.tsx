import React, { useEffect, useRef } from 'react';

interface ParticleFieldProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
  hue: 'violet' | 'mint';
}

export const ParticleField: React.FC<ParticleFieldProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    let frame = 0;
    let animationFrame = 0;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const pointer = { x: 0.5, y: 0.35, active: false };
    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(coarsePointer.matches ? 24 : 48, Math.max(14, Math.floor(width / 24)));
      particles.length = 0;
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.8 + 0.6,
          speed: Math.random() * 0.18 + 0.05,
          drift: Math.random() * 0.7 + 0.35,
          phase: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.34 + 0.12,
          hue: index % 3 === 0 ? 'mint' : 'violet',
        });
      }
    };

    const draw = () => {
      if (!isVisible) return;
      frame += 1;
      context.clearRect(0, 0, width, height);
      const motionScale = reduceMotion.matches ? 0 : 1;
      const pointerX = (pointer.x - 0.5) * 18;
      const pointerY = (pointer.y - 0.5) * 12;

      particles.forEach((particle) => {
        const time = frame * particle.speed * motionScale + particle.phase;
        const x = particle.x + Math.sin(time) * particle.drift + (pointer.active ? pointerX * particle.alpha : 0);
        const y = ((particle.y - frame * particle.speed * 0.25 * motionScale + height) % height) + (pointer.active ? pointerY * particle.alpha : 0);
        const color = particle.hue === 'mint' ? '174, 242, 214' : '169, 151, 255';
        const glow = context.createRadialGradient(x, y, 0, x, y, particle.radius * 5);
        glow.addColorStop(0, `rgba(${color}, ${particle.alpha})`);
        glow.addColorStop(1, `rgba(${color}, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, particle.radius * 5, 0, Math.PI * 2);
        context.fill();
      });

      animationFrame = window.requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (!isVisible && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      if (isVisible && !animationFrame && !reduceMotion.matches) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    }, { threshold: 0.05 });

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = true;
    };
    const onPointerLeave = () => { pointer.active = false; };

    resize();
    observer.observe(canvas);
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    if (!reduceMotion.matches) animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={`particle-field ${className}`} aria-hidden="true" />;
};
