import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, Gamepad2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { ParticleField } from './ParticleField';

export const Hero: React.FC = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -7, y: x * 9 });
  };

  return (
    <section className="hero-shell relative overflow-hidden">
      <ParticleField />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-glow hero-glow-one" aria-hidden="true" />
      <div className="hero-glow hero-glow-two" aria-hidden="true" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-24 lg:pt-24">
        <div className="hero-enter relative z-10">
          <div className="eyebrow-pill mb-7 w-fit"><Sparkles className="h-3.5 w-3.5" />Built for gamers in Bangladesh</div>
          <h1 className="hero-title max-w-3xl">Game credit that lands <span>when you need it.</span></h1>
          <p className="hero-copy mt-6 max-w-xl">Top up Valorant, PUBG Mobile, Free Fire and more with a checkout that speaks your language. Pay with bKash or Nagad, then get back in the game.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="#catalog" className="primary-button">Browse the shop <ArrowRight className="h-4 w-4" /></a><a href="#how-it-works" className="secondary-button">How delivery works</a></div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure local payments</span><span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Fast digital delivery</span></div>
        </div>

        <div className="hero-enter hero-enter-delay relative z-10" onPointerMove={handlePointerMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
          <div className="hero-scene" style={{ '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` } as React.CSSProperties}>
            <div className="hero-float-tag hero-float-tag-one"><span>01</span> Fast checkout</div>
            <div className="hero-float-tag hero-float-tag-two"><span>02</span> Local payment</div>
            <div className="hero-card">
              <div className="hero-card-topline"><span className="inline-flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> ZEROS' drop desk</span><span className="hero-live"><span /> Live</span></div>
              <div className="hero-art"><div className="hero-art-orbit hero-art-orbit-one" /><div className="hero-art-orbit hero-art-orbit-two" /><div className="hero-art-cross">+</div><div className="hero-art-copy"><span>Tonight's loadout</span><strong>Ready when<br />your squad is.</strong></div><div className="hero-controller"><Gamepad2 className="h-12 w-12" /></div></div>
              <div className="hero-card-bottom"><div><span>Popular now</span><strong>Valorant Points</strong></div><div className="hero-price">৳450</div></div>
            </div>
          </div>
          <div className="hero-proof"><BadgeCheck className="h-4 w-4 text-emerald-500" /> Digital delivery within 2–48 hours across Bangladesh</div>
        </div>
      </div>
    </section>
  );
};
