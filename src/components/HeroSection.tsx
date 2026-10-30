import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Shield, Zap, Award, RotateCw, AlertTriangle, Box, Sparkles } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroSectionProps {
  onStartBuild: () => void;
  onExplorePrebuilts: () => void;
  onOpenWizard: () => void;
  settings?: SiteSettings;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartBuild,
  onExplorePrebuilts,
  onOpenWizard,
  settings,
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-loading strategy: Observe viewport entry before attaching video source
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: '150px' }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      // Fallback for environments without IntersectionObserver
      setIsInView(true);
    }
  }, []);

  const handleRetryVideo = () => {
    setVideoError(false);
    setVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Handled via onError
      });
    }
  };
  const headline = settings?.heroHeadline || 'BUILD YOUR LEGACY.';
  const tagline = settings?.heroTagline || 'Built in Darkness. Engineered to Dominate.';
  const subtext =
    settings?.heroSubtext ||
    'Precision-tuned custom gaming rigs and deep learning workstations. Assembled with aerospace-grade tolerances, 72-hour thermal stress verification, and lifetime engineering support across India.';

  return (
    <section className="relative overflow-hidden pt-6 pb-16 lg:pt-10 lg:pb-20 border-b border-zinc-800/80">
      {/* Subtle atmospheric violet radial background gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-900/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-red-900/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Split 2-Column Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            {/* Big Brand Insignia Showcase */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[11px] font-mono uppercase tracking-widest text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                CUSTOM HIGH-PERFORMANCE COMPUTING
              </div>
              <div className="pt-1">
                <img
                  src={`${import.meta.env.BASE_URL}assets/aistudio/image_999d9928.png`}
                  alt="BLACK RAVEN"
                  className="h-14 sm:h-18 lg:h-22 w-auto max-w-[320px] sm:max-w-[460px] object-contain filter drop-shadow-[0_0_24px_rgba(139,92,246,0.45)] hover:drop-shadow-[0_0_36px_rgba(139,92,246,0.7)] transition-all duration-300"
                />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] text-balance">
              {headline.includes('LEGACY') ? (
                <>
                  BUILD YOUR <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-red-400">
                    LEGACY.
                  </span>
                </>
              ) : (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-red-400">
                  {headline}
                </span>
              )}
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-xl font-normal leading-relaxed">
              <strong className="text-zinc-200 font-medium">{tagline}</strong>{' '}
              {subtext}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                onClick={onStartBuild}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-lg shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 group"
              >
                <span>BUILD YOUR PC</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onExplorePrebuilts}
                className="px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-all flex items-center justify-center whitespace-nowrap shrink-0"
              >
                SHOP READY-MADE PCs
              </button>
            </div>

            {/* Quiet Trust Points */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>3-Year Doorstep Warranty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Insured Pan-India Express Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>0% Thermal Throttling Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Cinematic Transparent PC Video Showcase with Lazy Loading & Fallback */}
          <div
            ref={containerRef}
            className="lg:col-span-6 w-full h-[440px] sm:h-[500px] lg:h-[560px] rounded-2xl overflow-hidden border border-zinc-800/80 bg-gradient-to-b from-[#090913] to-[#040407] relative shadow-2xl flex items-center justify-center group"
          >
            {/* Atmospheric backlight & reflections */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18)_0%,rgba(239,68,68,0.06)_45%,transparent_75%)] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none animate-pulse" />

            {videoError ? (
              /* Fallback Display if Video Fails to Load */
              <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 shadow-inner shadow-purple-900/30 relative">
                  <img
                    src={`${import.meta.env.BASE_URL}assets/aistudio/image_999d9928.png`}
                    alt="BLACK RAVEN"
                    className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]"
                  />
                  <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    Video Showcase Stream Offline
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Hyperion Flagship Rig Preview
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    The 4K hardware animation stream could not be loaded in this session. You can retry or explore the rig directly in the interactive 3D builder.
                  </p>
                </div>

                {/* Specs snapshot pills */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                    RTX 4090 24GB OC
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                    Core i9-14900KS
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-purple-300">
                    Custom Hardline Loop
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    onClick={handleRetryVideo}
                    className="px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry Video</span>
                  </button>
                  <button
                    onClick={onStartBuild}
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-md shadow-purple-900/50 transition-all flex items-center gap-1.5"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Open 3D PC Builder</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Poster & Loading Shimmer Overlay while video is downloading */}
                {!videoLoaded && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#090913] to-[#040407] transition-opacity duration-500">
                    <img
                      src={`${import.meta.env.BASE_URL}assets/hero-poster.svg`}
                      alt="BLACK RAVEN Rig Poster"
                      className="w-full h-full object-contain opacity-75 filter drop-shadow-[0_15px_30px_rgba(139,92,246,0.25)]"
                    />
                    <div className="absolute bottom-14 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-purple-500/30 text-purple-300 text-xs font-mono shadow-xl animate-pulse">
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>Buffering 4K Hardware Model...</span>
                    </div>
                  </div>
                )}

                {/* Video Showcase Element with Poster & Lazy Loading */}
                <video
                  ref={videoRef}
                  poster={`${import.meta.env.BASE_URL}assets/hero-poster.svg`}
                  preload="metadata"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onLoadedData={() => setVideoLoaded(true)}
                  onError={() => setVideoError(true)}
                  className={`w-full h-full object-contain filter drop-shadow-[0_20px_45px_rgba(139,92,246,0.35)] relative z-10 transition-all duration-700 ease-out group-hover:scale-[1.03] ${
                    videoLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {isInView && (
                    <source
                      src={`${import.meta.env.BASE_URL}assets/aistudio/pass4-1440-transparent.v3__1__1890eb65.webm`}
                      type="video/webm"
                    />
                  )}
                  {/* Standard markup fallback */}
                  <p className="text-zinc-500 text-xs p-4 text-center">
                    Your browser does not support WebM video streaming.
                  </p>
                </video>

                {/* Top Badges */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-black/70 backdrop-blur-md border border-purple-500/30 text-purple-300 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3.5" />
                    BLACK RAVEN ARCHITECTURE
                  </span>
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-mono bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-zinc-400">
                    4K HDR PREVIEW
                  </span>
                </div>


              </>
            )}
          </div>
        </div>

        {/* 4-Column KPI Trust Strip */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-xl bg-[#0b0b12]/80 border border-zinc-800/80 shadow-lg">
          <div className="flex flex-col space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              72<span className="text-purple-400">h</span>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Burn-In Torture Test</span>
            <span className="text-[11px] text-zinc-500">AIDA64 + FurMark certified stability</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              3<span className="text-purple-400">Y</span>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Doorstep Warranty</span>
            <span className="text-[11px] text-zinc-500">Pan-India courier swap or technician visit</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              100<span className="text-purple-400">%</span>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Authoritative Validation</span>
            <span className="text-[11px] text-zinc-500">Rigorous socket, wattage & dimension checks</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              ₹0<span className="text-purple-400">.00</span>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Assembly Fee (Limited)</span>
            <span className="text-[11px] text-zinc-500">Free pro cable comb routing & OS tuning</span>
          </div>
        </div>
      </div>
    </section>
  );
};
