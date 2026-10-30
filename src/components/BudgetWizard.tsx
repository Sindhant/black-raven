import React, { useState } from 'react';
import { PREBUILT_SYSTEMS } from '../data/catalog';
import { PrebuiltPC } from '../types';
import { Cpu, Gamepad2, CheckCircle2, ArrowRight, Gauge, Shield, Sparkles } from 'lucide-react';

interface BudgetWizardProps {
  onLoadBuild: (prebuilt: PrebuiltPC) => void;
  onAddToCart: (prebuilt: PrebuiltPC) => void;
  prebuilts?: PrebuiltPC[];
}

export const BudgetWizard: React.FC<BudgetWizardProps> = ({
  onLoadBuild,
  onAddToCart,
  prebuilts,
}) => {
  const [selectedBudget, setSelectedBudget] = useState<number>(170000);
  const [selectedUse, setSelectedUse] = useState<'gaming' | 'esports' | 'creator' | 'enthusiast'>('gaming');

  const systems = prebuilts && prebuilts.length > 0 ? prebuilts : PREBUILT_SYSTEMS;

  // Match optimal prebuilt based on budget and use case
  const getOptimalSystem = (): PrebuiltPC => {
    if (selectedBudget < 120000 || selectedUse === 'esports') {
      return systems[0] || PREBUILT_SYSTEMS[0];
    }
    if (selectedBudget < 210000 || selectedUse === 'gaming') {
      return systems[1] || systems[0] || PREBUILT_SYSTEMS[1];
    }
    if (selectedBudget < 320000 || selectedUse === 'creator') {
      return systems[2] || systems[1] || PREBUILT_SYSTEMS[2];
    }
    return systems[3] || systems[2] || PREBUILT_SYSTEMS[3];
  };

  const system = getOptimalSystem();

  return (
    <div className="py-12 bg-[#060608]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/40 border border-purple-500/30 rounded-full text-xs font-mono text-purple-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>BLACK RAVEN INTELLIGENT MATCH</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Budget & Performance Wizard
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Tell us your budget or workload requirements. We will engineer the perfectly balanced, zero-bottleneck machine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0d0d15] border border-zinc-800/80 shadow-xl space-y-7">
            {/* 1. Target Budget Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Target Budget
                </label>
                <span className="text-base font-extrabold text-purple-400 font-mono tabular-nums">
                  ₹{selectedBudget.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={75000}
                max={450000}
                step={5000}
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono mt-1.5">
                <span>₹75K (eSports)</span>
                <span>₹200K (1440p)</span>
                <span>₹450K (Apex 4K)</span>
              </div>
            </div>

            {/* 2. Primary Intended Use Case */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
                Primary Intended Workload
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'esports', label: 'eSports / High FPS', desc: 'Valorant, CS2, Apex (240Hz+)' },
                  { id: 'gaming', label: '1440p Ultra Gaming', desc: 'Ray Tracing, DLSS 3, AAA Titles' },
                  { id: 'creator', label: '4K Content / Streaming', desc: 'Premiere, Blender, Unreal Engine' },
                  { id: 'enthusiast', label: 'Apex 4K & AI Models', desc: 'RTX 4090 Max Silicon Power' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedUse(item.id as any)}
                    className={`p-3 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
                      selectedUse === item.id
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-semibold text-zinc-100">{item.label}</span>
                    <span className="text-[10px] text-zinc-500 mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Raven Build Guarantee */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 space-y-2">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Zero-Bottleneck Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Every recommended tier pairs memory bus speeds, CPU multi-core clocks, and GPU PCIe bandwidth with zero architecture bottlenecks.
              </p>
            </div>
          </div>

          {/* Resulting Recommendation Card */}
          <div className="lg:col-span-7 p-7 rounded-2xl bg-[#0e0e18] border border-purple-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400">
                  OPTIMAL SYSTEM ARCHITECTURE
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                  {system.name}
                </h3>
                <p className="text-xs text-zinc-400">{system.tagline}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-zinc-500 block">Complete Rig Price</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                  ₹{system.basePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  Incl. 18% GST & Doorstep Warranty
                </span>
              </div>
            </div>

            {/* Core Component Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-zinc-500 block">Processor</span>
                  <span className="font-semibold text-zinc-100">{system.components.cpu}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <Gamepad2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-zinc-500 block">Graphics Card</span>
                  <span className="font-semibold text-zinc-100">{system.components.gpu}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <Gauge className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-zinc-500 block">Memory & Storage</span>
                  <span className="font-semibold text-zinc-100">{system.components.ram}</span>
                  <span className="text-[10px] text-zinc-400 block">{system.components.storage}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-zinc-500 block">Thermal & Chassis</span>
                  <span className="font-semibold text-zinc-100">{system.components.cooler}</span>
                  <span className="text-[10px] text-zinc-400 block">{system.components.chassis}</span>
                </div>
              </div>
            </div>

            {/* Live Projected FPS Targets */}
            <div className="mb-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block mb-3">
                Projected Benchmark Framerates
              </span>
              <div className="space-y-2.5">
                {system.fpsTargets.map((fps) => (
                  <div key={fps.game} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{fps.game}</span>
                    <span className="text-zinc-500 text-[11px]">{fps.resolution} ({fps.settings})</span>
                    <span className="font-mono font-bold text-purple-400 tabular-nums">
                      {fps.fps} FPS
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onLoadBuild(system)}
                className="flex-1 py-3 px-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50"
              >
                <span>Customize in 3D Configurator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onAddToCart(system)}
                className="py-3 px-5 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
