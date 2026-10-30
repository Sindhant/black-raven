import React, { useState } from 'react';
import { PREBUILT_SYSTEMS } from '../data/catalog';
import { PrebuiltPC } from '../types';
import { ShoppingBag, ArrowRight, Check, Eye, Cpu, Gauge, Zap, Shield } from 'lucide-react';

interface PrebuiltCatalogProps {
  onSelectPrebuilt: (pc: PrebuiltPC) => void;
  onAddToCart: (pc: PrebuiltPC) => void;
  prebuilts?: PrebuiltPC[];
}

export const PrebuiltCatalog: React.FC<PrebuiltCatalogProps> = ({
  onSelectPrebuilt,
  onAddToCart,
  prebuilts,
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [detailModalPC, setDetailModalPC] = useState<PrebuiltPC | null>(null);

  const systems = prebuilts && prebuilts.length > 0 ? prebuilts : PREBUILT_SYSTEMS;

  const filteredSystems =
    selectedTier === 'all'
      ? systems
      : systems.filter((p) => p.tier.toLowerCase() === selectedTier.toLowerCase());

  return (
    <div className="py-12 bg-[#060608]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              <span>FACTORY-TUNED BLACK RAVEN EDITIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              Ready-Made Flagship PCs
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mt-1">
              Engineered, thermal-tuned, and stress-tested for 72 hours before dispatch. Same-day or next-day insured shipping across India.
            </p>
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-x-auto">
            {['all', 'eSports', 'Elite', 'Apex', 'Workstation'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedTier === tier
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tier === 'all' ? 'All Systems' : tier}
              </button>
            ))}
          </div>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          {filteredSystems.map((pc) => (
            <div
              key={pc.id}
              className="rounded-2xl bg-[#0d0d15] border border-zinc-800/90 hover:border-zinc-700 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-purple-950/20 group"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-purple-400 uppercase font-semibold">
                        {pc.tier}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-[11px] font-mono text-zinc-500">{pc.sku}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1 group-hover:text-purple-300 transition-colors">
                      {pc.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{pc.tagline}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tabular-nums block">
                      ₹{pc.basePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      Incl. 18% GST
                    </span>
                  </div>
                </div>

                {/* PC Specs Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-6 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-zinc-200 truncate font-medium">{pc.components.cpu}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-zinc-200 truncate font-medium">{pc.components.gpu}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-zinc-200 truncate font-medium">{pc.components.ram}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-zinc-200 truncate font-medium">{pc.components.storage}</span>
                  </div>
                </div>

                {/* Benchmark FPS preview */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 mb-6">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 font-mono uppercase">
                    <span>Performance Benchmark</span>
                    <span className="text-purple-400 font-bold">{pc.fpsTargets[0]?.game}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-medium">
                      {pc.fpsTargets[0]?.resolution} ({pc.fpsTargets[0]?.settings})
                    </span>
                    <span className="text-base font-extrabold text-white font-mono tabular-nums text-purple-400">
                      {pc.fpsTargets[0]?.fps} FPS
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/80">
                <button
                  onClick={() => setDetailModalPC(pc)}
                  className="flex-1 py-2.5 px-3 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Rig Specs</span>
                </button>

                <button
                  onClick={() => onAddToCart(pc)}
                  className="flex-1 py-2.5 px-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/40"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={() => onSelectPrebuilt(pc)}
                  className="p-2.5 text-zinc-400 hover:text-purple-400 bg-zinc-900 border border-zinc-800 rounded-lg transition-colors"
                  title="Customize in 3D Configurator"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Modal */}
        {detailModalPC && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="max-w-2xl w-full bg-[#0d0d15] border border-zinc-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
                <div>
                  <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">
                    BLACK RAVEN SPECIFICATION SHEET
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">{detailModalPC.name}</h3>
                  <p className="text-xs text-zinc-400">{detailModalPC.tagline}</p>
                </div>
                <button
                  onClick={() => setDetailModalPC(null)}
                  className="text-zinc-400 hover:text-white p-1 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Full Specs List */}
              <div className="space-y-2 text-xs">
                {Object.entries(detailModalPC.components).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500 uppercase font-mono w-32">{key}</span>
                    <span className="text-zinc-200 font-medium text-right flex-1">{val}</span>
                  </div>
                ))}
              </div>

              {/* Framerates */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block mb-1">
                  Gaming Benchmarks (Native 1440p / 4K)
                </span>
                {detailModalPC.fpsTargets.map((item) => (
                  <div key={item.game} className="flex justify-between text-xs">
                    <span className="text-zinc-300">{item.game} - {item.resolution}</span>
                    <span className="font-mono text-purple-400 font-bold">{item.fps} FPS</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    const pc = detailModalPC;
                    setDetailModalPC(null);
                    onSelectPrebuilt(pc);
                  }}
                  className="py-2.5 px-4 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 rounded-lg transition-colors"
                >
                  Load into 3D Builder
                </button>
                <button
                  onClick={() => {
                    onAddToCart(detailModalPC);
                    setDetailModalPC(null);
                  }}
                  className="py-2.5 px-5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                >
                  Add to Cart (₹{detailModalPC.basePrice.toLocaleString('en-IN')})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
