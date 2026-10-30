import React, { useState, useMemo } from 'react';
import { ComponentCategory, HardwareItem, BuildSelection, CompatibilityReport } from '../types';
import { INITIAL_HARDWARE_CATALOG } from '../data/catalog';
import { checkCompatibility } from '../utils/compatibility';
import { calculatePerformanceScores } from '../utils/performanceBenchmarks';
import { ThreePCViewer } from './ThreePCViewer';
import { ModularPCChassisViewer } from './ModularPCChassisViewer';
import {
  Cpu,
  Layers,
  HardDrive,
  Fan,
  Box,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  FileText,
  Share2,
  Trash2,
  Sparkles,
  Info,
  Gauge,
  Activity,
  Sliders,
  ChevronRight,
  Search,
  Check,
  ArrowUpDown,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface ConfiguratorProps {
  customBuild: BuildSelection;
  setCustomBuild: React.Dispatch<React.SetStateAction<BuildSelection>>;
  lightingColor: string;
  setLightingColor: (color: string) => void;
  onOpenQuotationModal: () => void;
  onAddToCart: (customBuild: BuildSelection, lightingColor: string) => void;
  catalog?: HardwareItem[];
}

type WorkspaceViewMode = '3d-studio' | 'modular-assembly' | 'slot-deck' | 'benchmarks' | 'power-thermals';

const CATEGORY_DEFINITIONS: { id: ComponentCategory; label: string; icon: React.ComponentType<{ className?: string }>; tag: string }[] = [
  { id: 'cpu', label: 'Processor (CPU)', icon: Cpu, tag: 'Compute Core' },
  { id: 'motherboard', label: 'Motherboard', icon: Layers, tag: 'Platform & VRM' },
  { id: 'gpu', label: 'Graphics Card (GPU)', icon: Sparkles, tag: 'Ray Tracing & AI' },
  { id: 'ram', label: 'Memory (RAM)', icon: Layers, tag: 'DDR5 High-Speed' },
  { id: 'storage', label: 'Storage (NVMe SSD)', icon: HardDrive, tag: 'PCIe 4.0 / 5.0' },
  { id: 'cooler', label: 'CPU Cooling', icon: Fan, tag: 'Liquid AIO / Air' },
  { id: 'case', label: 'Chassis / Case', icon: Box, tag: 'Airflow & Dual-Chamber' },
  { id: 'psu', label: 'Power Supply (PSU)', icon: Zap, tag: '80+ Gold / ATX 3.0' },
  { id: 'accessories', label: 'Custom Sleeving', icon: Layers, tag: 'Enthusiast Aesthetic' },
];

export const Configurator: React.FC<ConfiguratorProps> = ({
  customBuild,
  setCustomBuild,
  lightingColor,
  setLightingColor,
  onOpenQuotationModal,
  onAddToCart,
  catalog = INITIAL_HARDWARE_CATALOG,
}) => {
  // BuildCores view mode
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceViewMode>('3d-studio');
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('cpu');
  const [swapModalCategory, setSwapModalCategory] = useState<ComponentCategory | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalBrandFilter, setModalBrandFilter] = useState<string>('all');
  const [benchmarkResolution, setBenchmarkResolution] = useState<'1080p' | '1440p' | '4k'>('1440p');
  const [shareCopied, setShareCopied] = useState(false);
  const [showCompatibilityDrawer, setShowCompatibilityDrawer] = useState(false);

  // Live compatibility report
  const compatibility: CompatibilityReport = useMemo(() => checkCompatibility(customBuild), [customBuild]);

  // Live performance & benchmark calculations
  const perfData = useMemo(() => calculatePerformanceScores(customBuild), [customBuild]);

  // Pricing calculations
  const subtotal = useMemo(
    () => Object.values(customBuild).reduce((acc, item) => (item ? acc + item.price : acc), 0),
    [customBuild]
  );
  const gstAmount = Math.round(subtotal * 0.18);
  const assemblyFee = 0; // Complimentary 72-hour torture testing included
  const shippingFee = 0; // Zero-cost insured delivery
  const grandTotal = subtotal + gstAmount + assemblyFee + shippingFee;

  // Selected components count
  const filledCount = Object.values(customBuild).filter(Boolean).length;
  const totalSlots = CATEGORY_DEFINITIONS.length;

  // Power PSU rating calculation
  const psuWattage = customBuild.psu?.wattage || 850;
  const estimatedDraw = compatibility.estimatedWattage || 520;
  const psuLoadPercentage = Math.min(100, Math.round((estimatedDraw / psuWattage) * 100));

  const handleSelectComponent = (item: HardwareItem) => {
    setCustomBuild((prev) => ({
      ...prev,
      [item.category]: item,
    }));
    setSwapModalCategory(null);
  };

  const handleRemoveComponent = (category: ComponentCategory) => {
    setCustomBuild((prev) => ({
      ...prev,
      [category]: null,
    }));
  };

  const handleResetBuild = () => {
    setCustomBuild({
      cpu: null,
      motherboard: null,
      gpu: null,
      ram: null,
      storage: null,
      cooler: null,
      case: null,
      psu: null,
      accessories: null,
    });
  };

  const handleShare = () => {
    const summary = Object.entries(customBuild)
      .filter(([_, item]) => item !== null)
      .map(([cat, item]) => `${cat.toUpperCase()}: ${item?.name}`)
      .join(' | ');
    navigator.clipboard.writeText(`BLACK RAVEN Custom Build: ${summary} - Total: ₹${grandTotal.toLocaleString('en-IN')}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  // Filter items for the Quick-Swap modal
  const swapItems = useMemo(() => {
    if (!swapModalCategory) return [];
    return catalog.filter((item) => {
      if (item.category !== swapModalCategory) return false;
      if (modalBrandFilter !== 'all' && item.brand.toLowerCase() !== modalBrandFilter.toLowerCase()) return false;
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [swapModalCategory, modalBrandFilter, modalSearch, catalog]);

  // Unique brands for the active swap category
  const modalBrands = useMemo(() => {
    if (!swapModalCategory) return [];
    const brands = new Set<string>();
    catalog.filter((c) => c.category === swapModalCategory).forEach((it) => brands.add(it.brand));
    return Array.from(brands);
  }, [swapModalCategory, catalog]);

  return (
    <div className="bg-[#060608] min-h-[calc(100vh-4rem)] pb-28 text-zinc-100 select-none">
      {/* 1. TOP BUILDCORES WORKSPACE NAVIGATION BAR */}
      <div className="border-b border-zinc-800/80 bg-[#09090f]/95 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3">
            {/* Left: Brand Identity & Current Build Spec Tag */}
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-sm shadow-purple-500" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white tracking-wide">
                    THE RAVEN BUILDER
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/80">
                    BUILDCORES ARCHITECTURE
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {customBuild.cpu?.name || 'Custom CPU'} · {customBuild.gpu?.name || 'Custom GPU'}
                </p>
              </div>
            </div>

            {/* Middle: 5 Workspace View Tabs (BuildCores Signature) */}
            <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 overflow-x-auto scrollbar-none">
              {[
                { id: '3d-studio', label: '3D Studio & Desk', icon: Box },
                { id: 'modular-assembly', label: 'Guided 3D Assembly', icon: Sliders },
                { id: 'slot-deck', label: 'Parts Matrix', icon: Layers },
                { id: 'benchmarks', label: 'FPS & Bottlenecks', icon: Gauge },
                { id: 'power-thermals', label: 'Power & Thermals', icon: Zap },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = workspaceMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setWorkspaceMode(tab.id as WorkspaceViewMode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Share & Reset */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
                title="Copy shareable configuration spec"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">{shareCopied ? 'Link Copied!' : 'Share'}</span>
              </button>

              <button
                onClick={handleResetBuild}
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 bg-zinc-900/60 border border-zinc-800 rounded-lg transition-colors"
                title="Clear all components"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE VIEWPORTS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ========================================================= */}
        {/* VIEW 1: 3D STUDIO & BATTLESTATION */}
        {/* ========================================================= */}
        {workspaceMode === '3d-studio' && (
          <div className="space-y-6">
            {/* Full-Bleed 3D PC Stage */}
            <div className="w-full h-[620px] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl relative bg-[#060609]">
              <ThreePCViewer
                parts={customBuild}
                lightingColor={lightingColor}
                onColorChange={setLightingColor}
                onSelectComponentCategory={(cat) => {
                  setSwapModalCategory(cat as ComponentCategory);
                }}
              />
            </div>

            {/* Horizontal Quick-Access Component Strip below 3D Viewer */}
            <div className="p-4 rounded-2xl bg-[#0b0b12] border border-zinc-800/80">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  INSTALLED HARDWARE BLUEPRINT ({filledCount}/{totalSlots} SLOTS)
                </span>
                <button
                  onClick={() => setWorkspaceMode('slot-deck')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Open Full Slot Deck</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
                {CATEGORY_DEFINITIONS.map((cat) => {
                  const part = customBuild[cat.id];
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSwapModalCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[92px] group ${
                        part
                          ? 'bg-zinc-900/90 border-zinc-700/80 hover:border-purple-500/80 hover:bg-[#12121e]'
                          : 'bg-zinc-950/60 border-dashed border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-3.5 h-3.5 ${part ? 'text-purple-400' : 'text-zinc-600'}`} />
                          {part && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block truncate">
                          {cat.label.split(' ')[0]}
                        </span>
                        <p className="text-[11px] font-medium text-white truncate mt-0.5">
                          {part ? part.name : 'Empty Slot'}
                        </p>
                      </div>

                      <div className="text-[10px] font-mono text-zinc-400 mt-1 flex justify-between items-center">
                        <span className="text-purple-300 font-semibold">
                          {part ? `₹${part.price.toLocaleString('en-IN')}` : '+ Select'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1B: GUIDED MODULAR ASSEMBLY */}
        {/* ========================================================= */}
        {workspaceMode === 'modular-assembly' && (
          <div className="space-y-6">
            <div className="w-full h-[620px] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl relative bg-[#060609]">
              <ModularPCChassisViewer
                parts={customBuild}
                lightingColor={lightingColor}
                onSelectComponentCategory={(cat) => setSwapModalCategory(cat)}
              />
            </div>

            {/* Quick Tips */}
            <div className="p-4 rounded-xl bg-[#0b0b12] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-zinc-300">
                  Each hardware slot in the dual-chamber chassis is verified for socket pins, cable clearance, and thermal airflow before locking into position.
                </span>
              </div>
              <button
                onClick={() => setWorkspaceMode('slot-deck')}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium border border-zinc-800 shrink-0 transition-colors"
              >
                Inspect All Specs in Slot Deck
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SLOT DECK (BuildCores Signature Parts List) */}
        {/* ========================================================= */}
        {workspaceMode === 'slot-deck' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Hardware Slot Matrix</span>
                  <span className="text-xs font-mono font-normal text-purple-400 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/80">
                    {filledCount} of {totalSlots} Chosen
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Inspect individual technical specs, power envelope, warranty coverage, and swap hardware.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkspaceMode('benchmarks')}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  <span>Simulate Benchmarks</span>
                </button>
              </div>
            </div>

            {/* Grid of 9 Tactile Slot Cards */}
            <div className="space-y-3">
              {CATEGORY_DEFINITIONS.map((cat) => {
                const item = customBuild[cat.id];
                const Icon = cat.icon;

                if (!item) {
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSwapModalCategory(cat.id)}
                      className="p-4 rounded-xl border border-dashed border-zinc-800 hover:border-purple-500/80 bg-[#09090f]/60 hover:bg-[#0e0e18] cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-purple-400 group-hover:border-purple-500/50 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                            {cat.label}
                          </span>
                          <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">
                            Click to Select Component
                          </span>
                        </div>
                      </div>

                      <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 group-hover:bg-purple-600 text-zinc-300 group-hover:text-white transition-colors border border-zinc-800 group-hover:border-purple-500">
                        + Add {cat.label.split(' ')[0]}
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl border border-zinc-800/90 bg-[#0b0b12] hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className="w-11 h-11 rounded-lg bg-purple-950/40 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-purple-400 uppercase font-semibold">
                            {cat.label}
                          </span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[11px] font-mono text-zinc-400">{item.brand}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[11px] font-mono text-zinc-500">{item.sku}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
                            {item.wattage}W TDP
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {item.name}
                        </h4>

                        {/* Specs Pill Strip */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Object.entries(item.specs).map(([specKey, specVal]) => (
                            <span
                              key={specKey}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-300"
                            >
                              <span className="text-zinc-500">{specKey}:</span> {specVal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-850 shrink-0">
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-extrabold text-white font-mono tabular-nums">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-zinc-500 block font-mono">
                          {item.warrantyYears}Y Black Raven Care
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSwapModalCategory(cat.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-purple-500 transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3 h-3 text-purple-400" />
                          <span>Swap</span>
                        </button>

                        <button
                          onClick={() => handleRemoveComponent(cat.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-colors"
                          title="Remove part"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: BENCHMARK & BOTTLENECK SIMULATOR (BuildCores Specialty) */}
        {/* ========================================================= */}
        {workspaceMode === 'benchmarks' && (
          <div className="space-y-6">
            {/* Resolution Selector Header */}
            <div className="p-5 rounded-2xl bg-[#09090f] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold">
                  BLACK RAVEN ARCHITECTURE BENCHMARK LAB
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  Real-World Gaming FPS & Hardware Synergy
                </h3>
                <p className="text-xs text-zinc-400">
                  Simulated from architectural micro-op benchmarks of your selected{' '}
                  <span className="text-purple-300 font-semibold">{customBuild.cpu?.name || 'CPU'}</span> and{' '}
                  <span className="text-purple-300 font-semibold">{customBuild.gpu?.name || 'GPU'}</span>.
                </p>
              </div>

              {/* Resolution Toggle */}
              <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0">
                {(['1080p', '1440p', '4k'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => setBenchmarkResolution(res)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all uppercase ${
                      benchmarkResolution === res
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {res === '4k' ? '4K Ultra (2160p)' : res === '1440p' ? '1440p QHD' : '1080p FHD'}
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware Bottleneck & Synergy Meter */}
            <div className="p-5 rounded-2xl bg-[#0c0c16] border border-purple-900/50 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                      HARDWARE BOTTLENECK ANALYSIS
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {perfData.bottleneck.verdict}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    {perfData.bottleneck.recommendation}
                  </p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">CPU Power</span>
                    <span className="text-lg font-mono font-bold text-white">{perfData.cpuIndex}/100</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">GPU Power</span>
                    <span className="text-lg font-mono font-bold text-white">{perfData.gpuIndex}/100</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Bottleneck</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {perfData.bottleneck.bottleneckPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Games Benchmark Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {perfData.games.map((g) => {
                const fps =
                  benchmarkResolution === '4k'
                    ? g.fps4k
                    : benchmarkResolution === '1440p'
                    ? g.fps1440p
                    : g.fps1080p;
                const fpsColor =
                  fps >= 144
                    ? 'text-emerald-400'
                    : fps >= 80
                    ? 'text-purple-400'
                    : 'text-amber-400';
                const barWidth = Math.min(100, Math.round((fps / 240) * 100));

                return (
                  <div
                    key={g.game}
                    className="p-4 rounded-xl bg-[#0b0b12] border border-zinc-800/90 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{g.genre}</span>
                        <h5 className="text-sm font-bold text-white">{g.game}</h5>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-extrabold font-mono tabular-nums ${fpsColor}`}>
                          {fps} FPS
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 block">Avg Framerate</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          fps >= 144 ? 'bg-emerald-500' : fps >= 80 ? 'bg-purple-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                      <span>{g.settings}</span>
                      <span className="text-purple-400">{g.rtxFeature}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Synthetic Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#09090f] border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  3DMARK TIME SPY (GRAPHICS)
                </span>
                <span className="text-2xl font-black font-mono text-white tabular-nums">
                  {perfData.synthetic.titleSpyScore.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-400 block font-mono">Top 2% Globally</span>
              </div>

              <div className="p-4 rounded-xl bg-[#09090f] border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  CINEBENCH R23 MULTI-CORE
                </span>
                <span className="text-2xl font-black font-mono text-white tabular-nums">
                  {perfData.synthetic.cinebenchR23Multi.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-purple-400 block font-mono">Full Workstation Muscle</span>
              </div>

              <div className="p-4 rounded-xl bg-[#09090f] border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  CINEBENCH R23 SINGLE-CORE
                </span>
                <span className="text-2xl font-black font-mono text-white tabular-nums">
                  {perfData.synthetic.cinebenchR23Single.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-zinc-400 block font-mono">Ultra-low 1% lows</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: POWER & THERMAL PROFILER (BuildCores Wattage Tool) */}
        {/* ========================================================= */}
        {workspaceMode === 'power-thermals' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#09090f] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold">
                  BLACK RAVEN ELECTRICAL PROFILER
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  Power Envelope & Thermal Headroom
                </h3>
                <p className="text-xs text-zinc-400">
                  Real-time power supply load curve analysis, component TDP breakdown, and Indian UPS guidance.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-zinc-900/90 px-4 py-2.5 rounded-xl border border-zinc-800 font-mono text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">ESTIMATED DRAW</span>
                  <span className="text-white font-bold text-sm">{estimatedDraw}W</span>
                </div>
                <div className="h-6 w-px bg-zinc-700" />
                <div>
                  <span className="text-zinc-500 block text-[10px]">PSU CAPACITY</span>
                  <span className="text-purple-400 font-bold text-sm">{psuWattage}W</span>
                </div>
                <div className="h-6 w-px bg-zinc-700" />
                <div>
                  <span className="text-zinc-500 block text-[10px]">EFFICIENCY LOAD</span>
                  <span className="text-emerald-400 font-bold text-sm">{psuLoadPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Power Load Gauge & 80+ Gold Efficiency Sweetspot */}
            <div className="p-5 rounded-2xl bg-[#0b0b12] border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Power Supply Utilization Curve</h4>
                  <p className="text-xs text-zinc-400">
                    Modern 80 Plus Gold and Platinum PSUs achieve highest electrical efficiency (~92%) between 50% and 80% load.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-mono font-semibold">
                  Sweet-Spot Efficiency Active
                </span>
              </div>

              {/* Graphical Load Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-zinc-900 rounded-full h-4 overflow-hidden border border-zinc-800 relative">
                  {/* Recommended 50-80% zone highlight */}
                  <div
                    className="absolute top-0 bottom-0 bg-purple-950/40 border-x border-purple-500/40"
                    style={{ left: '50%', width: '30%' }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${psuLoadPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>0W (Idle)</span>
                  <span className="text-purple-400">50% Load (Peak Efficiency Zone)</span>
                  <span>80% Load</span>
                  <span>100% ({psuWattage}W Rated)</span>
                </div>
              </div>
            </div>

            {/* Component-by-Component Wattage Breakdown */}
            <div className="p-5 rounded-2xl bg-[#0b0b12] border border-zinc-800 space-y-3">
              <h4 className="text-sm font-bold text-white">Hardware Power Allocation</h4>
              <div className="space-y-2.5">
                {[
                  {
                    name: customBuild.gpu?.name || 'Graphics Card (GPU)',
                    wattage: customBuild.gpu?.wattage || 320,
                    category: 'Graphics Subsystem',
                  },
                  {
                    name: customBuild.cpu?.name || 'Processor (CPU)',
                    wattage: customBuild.cpu?.wattage || 120,
                    category: 'Compute Core',
                  },
                  {
                    name: customBuild.motherboard?.name || 'Motherboard & Chipset',
                    wattage: 50,
                    category: 'VRM & PCIe Lanes',
                  },
                  {
                    name: customBuild.cooler?.name || 'Cooling & ARGB Fans',
                    wattage: 35,
                    category: 'Liquid Pump & Radiator',
                  },
                  {
                    name: customBuild.ram?.name || 'DDR5 Memory & NVMe',
                    wattage: 25,
                    category: 'Memory & Storage Bus',
                  },
                ].map((item, idx) => {
                  const percent = Math.round((item.wattage / estimatedDraw) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium truncate max-w-md">{item.name}</span>
                        <span className="text-purple-300 font-bold">
                          {item.wattage}W ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indian Electrical Grid & UPS Guidance */}
            <div className="p-5 rounded-2xl bg-[#09090f] border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                  INDIAN ELECTRICAL COMPLIANCE ADVISORY
                </span>
                <h5 className="text-sm font-bold text-white">
                  Recommended Uninterruptible Power Supply (UPS)
                </h5>
                <p className="text-xs text-zinc-400 max-w-xl">
                  To safeguard enthusiast components against voltage fluctuations and power outages in India,
                  we recommend a{' '}
                  <strong className="text-white">
                    {estimatedDraw > 600 ? '1500VA / 900W' : '1100VA / 660W'} Pure Sine Wave Inverter
                  </strong>{' '}
                  with active power factor correction (PFC) support.
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center shrink-0">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Min UPS Inverter</span>
                <span className="text-base font-mono font-extrabold text-purple-300">
                  {estimatedDraw > 600 ? '1500VA' : '1100VA'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BUILDCORES STICKY BOTTOM DOCK (Always visible at screen bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090f]/95 border-t border-zinc-800/90 backdrop-blur-lg px-4 sm:px-6 lg:px-8 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Telemetry & Status Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Parts Count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
              <span className={`w-2 h-2 rounded-full ${filledCount >= 8 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-zinc-300 font-semibold">{filledCount}/9 Slots</span>
            </div>

            {/* Wattage Metric */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-zinc-300">
                {estimatedDraw}W / {psuWattage}W PSU
              </span>
            </div>

            {/* Compatibility Shield */}
            <button
              onClick={() => setShowCompatibilityDrawer(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                compatibility.isCompatible
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/60 hover:bg-emerald-950/60'
                  : 'bg-red-950/40 text-red-300 border-red-500/60 hover:bg-red-950/60'
              }`}
            >
              {compatibility.isCompatible ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Compatible · 0 Conflicts</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>{compatibility.issues.filter((i) => i.severity === 'error').length} Conflicts</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Price Total & Action CTAs */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="text-right">
              <span className="text-xs text-zinc-400 font-mono block">Estimated Total</span>
              <span className="text-lg sm:text-2xl font-black text-white font-mono tabular-nums leading-none">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                Incl. 18% GST (₹{gstAmount.toLocaleString('en-IN')})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenQuotationModal}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-purple-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Official Proposal</span>
              </button>

              <button
                onClick={() => onAddToCart(customBuild, lightingColor)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-purple-950/60 whitespace-nowrap active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. QUICK-SWAP HARDWARE SELECTION MODAL (BuildCores Drawer) */}
      {swapModalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-[#0b0b14] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest font-bold">
                  HARDWARE COMPONENT PICKER
                </span>
                <h3 className="text-lg font-bold text-white capitalize">
                  Select {CATEGORY_DEFINITIONS.find((c) => c.id === swapModalCategory)?.label}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSwapModalCategory(null);
                  setModalSearch('');
                  setModalBrandFilter('all');
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-zinc-800/80 bg-[#08080d] flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search model, chipset, or SKU..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Brand Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                <button
                  onClick={() => setModalBrandFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                    modalBrandFilter === 'all'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                {modalBrands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setModalBrandFilter(b)}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors uppercase ${
                      modalBrandFilter === b
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware Items List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
              {swapItems.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No components match the search criteria.
                </div>
              ) : (
                swapItems.map((item) => {
                  const isCurrent = customBuild[swapModalCategory]?.id === item.id;
                  const currentPrice = customBuild[swapModalCategory]?.price || 0;
                  const priceDelta = item.price - currentPrice;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectComponent(item)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-purple-950/30 border-purple-500/80 ring-1 ring-purple-500/50'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{item.brand}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[10px] font-mono text-zinc-400">{item.sku}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[10px] font-mono text-emerald-400">{item.wattage}W</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">{item.description}</p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Object.entries(item.specs).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-300"
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-base font-bold font-mono text-white">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          {currentPrice > 0 && priceDelta !== 0 && (
                            <span
                              className={`text-[10px] font-mono block ${
                                priceDelta > 0 ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {priceDelta > 0 ? `+₹${priceDelta.toLocaleString('en-IN')}` : `-₹${Math.abs(priceDelta).toLocaleString('en-IN')}`}
                            </span>
                          )}
                        </div>

                        <button
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {isCurrent ? 'Selected' : 'Choose'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. COMPATIBILITY DETAILS MODAL */}
      {showCompatibilityDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-[#0b0b14] border border-zinc-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h4 className="text-base font-bold text-white">Authoritative Compatibility Report</h4>
              </div>
              <button
                onClick={() => setShowCompatibilityDrawer(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs space-y-1">
                <span className="font-mono text-purple-400 font-bold uppercase block">
                  PHYSICAL & ELECTRICAL VALIDATION ENGINE
                </span>
                <p className="text-zinc-300">
                  Every custom configuration is verified against socket standards (AM5 / LGA1700), DDR5 clearance, PCIe 4.0 bandwidth, PSU 80+ Gold capacity, and 360mm radiator spacing.
                </p>
              </div>

              {compatibility.issues.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-xs flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">No Compatibility Conflicts Detected</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      All socket pins, PCIe power rails, and chassis clearances are 100% matched for assembly.
                    </p>
                  </div>
                </div>
              ) : (
                compatibility.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                      issue.severity === 'error'
                        ? 'bg-red-950/20 border-red-500/40'
                        : 'bg-amber-950/20 border-amber-500/40'
                    }`}
                  >
                    {issue.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-white">{issue.title}</span>
                      <p className="text-zinc-400 text-[11px] mt-0.5">{issue.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowCompatibilityDrawer(false)}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Close Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
