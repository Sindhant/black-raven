import React, { useState, useMemo } from 'react';
import { HardwareItem, CartItem, ComponentCategory } from '../types';
import {
  X,
  Scale,
  ArrowRight,
  Zap,
  ShoppingCart,
  Wrench,
  Check,
  TrendingDown,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  HardDrive,
  Fan,
  Box,
  ShieldCheck,
  ChevronDown,
  Info,
  RotateCcw,
} from 'lucide-react';

interface ComponentComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: HardwareItem[];
  initialItemAId?: string | null;
  initialItemBId?: string | null;
  onSelectForBuilder: (item: HardwareItem) => void;
  onAddToCart: (item: CartItem) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cpu: Cpu,
  motherboard: Layers,
  gpu: Sparkles,
  ram: Layers,
  storage: HardDrive,
  cooler: Fan,
  case: Box,
  psu: Zap,
};

const CATEGORY_LABELS: Record<string, string> = {
  cpu: 'Processors (CPU)',
  motherboard: 'Motherboards',
  gpu: 'Graphics Cards (GPU)',
  ram: 'Memory (RAM)',
  storage: 'Storage (NVMe)',
  cooler: 'Cooling Solutions',
  case: 'Chassis & Cabinets',
  psu: 'Power Supplies (PSU)',
  accessories: 'Accessories',
};

const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  cpu: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
  motherboard: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  gpu: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
  ram: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
  storage: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
  cooler: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
  case: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
  psu: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
  accessories: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
};

export const ComponentComparatorModal: React.FC<ComponentComparatorModalProps> = ({
  isOpen,
  onClose,
  catalog,
  initialItemAId,
  initialItemBId,
  onSelectForBuilder,
  onAddToCart,
}) => {
  // Available categories in catalog
  const categories = useMemo(() => {
    const set = new Set<ComponentCategory>();
    catalog.forEach((item) => set.add(item.category));
    return Array.from(set);
  }, [catalog]);

  // Selected Category filter
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('cpu');

  // Currently selected item IDs for Slot A and Slot B
  const [itemAId, setItemAId] = useState<string>(() => {
    if (initialItemAId && catalog.some((c) => c.id === initialItemAId)) return initialItemAId;
    const firstInCat = catalog.find((c) => c.category === 'cpu');
    return firstInCat?.id || catalog[0]?.id || '';
  });

  const [itemBId, setItemBId] = useState<string>(() => {
    if (initialItemBId && catalog.some((c) => c.id === initialItemBId)) return initialItemBId;
    const catItems = catalog.filter((c) => c.category === 'cpu');
    return catItems[1]?.id || catItems[0]?.id || catalog[1]?.id || '';
  });

  // Track button feedback
  const [addedItemA, setAddedItemA] = useState(false);
  const [addedItemB, setAddedItemB] = useState(false);

  // Sync state if initial props change
  React.useEffect(() => {
    if (initialItemAId && catalog.some((c) => c.id === initialItemAId)) {
      setItemAId(initialItemAId);
      const item = catalog.find((c) => c.id === initialItemAId);
      if (item) setSelectedCategory(item.category);
    }
    if (initialItemBId && catalog.some((c) => c.id === initialItemBId)) {
      setItemBId(initialItemBId);
    }
  }, [initialItemAId, initialItemBId, catalog]);

  if (!isOpen) return null;

  // Resolved items
  const itemA = catalog.find((c) => c.id === itemAId) || catalog[0];
  const itemB = catalog.find((c) => c.id === itemBId) || catalog[1] || catalog[0];

  // Items eligible in current selected category
  const categoryItems = catalog.filter((c) => c.category === selectedCategory);

  // Combined unique specification keys
  const specKeys = Array.from(
    new Set([...Object.keys(itemA?.specs || {}), ...Object.keys(itemB?.specs || {})])
  );

  // Price analysis
  const priceDiff = Math.abs(itemA.price - itemB.price);
  const percentDiff = Math.round((priceDiff / Math.max(itemA.price, itemB.price, 1)) * 100);
  const cheaperItem = itemA.price < itemB.price ? 'A' : itemA.price > itemB.price ? 'B' : 'EQUAL';

  // Wattage analysis
  const wattageDiff = Math.abs(itemA.wattage - itemB.wattage);
  const moreEfficient = itemA.wattage < itemB.wattage ? 'A' : itemA.wattage > itemB.wattage ? 'B' : 'EQUAL';

  const handleSwapItems = () => {
    const temp = itemAId;
    setItemAId(itemBId);
    setItemBId(temp);
  };

  const handleCategorySwitch = (cat: ComponentCategory) => {
    setSelectedCategory(cat);
    const catItems = catalog.filter((c) => c.category === cat);
    if (catItems.length > 0) {
      setItemAId(catItems[0].id);
      setItemBId(catItems[1]?.id || catItems[0].id);
    }
  };

  const handleAddToCartClick = (item: HardwareItem, slot: 'A' | 'B') => {
    onAddToCart({
      id: item.id,
      type: 'component',
      title: item.name,
      subtitle: `${item.brand} · ${item.category.toUpperCase()}`,
      price: item.price,
      quantity: 1,
    });

    if (slot === 'A') {
      setAddedItemA(true);
      setTimeout(() => setAddedItemA(false), 2000);
    } else {
      setAddedItemB(true);
      setTimeout(() => setAddedItemB(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#09090f] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 bg-[#0c0c14] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest font-semibold">
                  BLACK RAVEN ENGINEERING
                </span>
                <span className="text-zinc-600">/</span>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wide">
                  HARDWARE COMPARATOR
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Side-by-Side Specification & Price Analysis
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSwapItems}
              className="px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Swap Item A and Item B"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Swap Slots</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors"
              aria-label="Close Comparator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="px-6 py-2.5 bg-[#07070c] border-b border-zinc-800/60 overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-zinc-500 mr-1 whitespace-nowrap">Category:</span>
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || Layers;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySwitch(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/50'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{CATEGORY_LABELS[cat] || cat.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Comparison Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Item Selector Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot A Picker */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/90 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-400 font-bold uppercase tracking-wide">Slot A: Baseline</span>
                <span className="text-zinc-500">{categoryItems.length} options</span>
              </div>
              <div className="relative">
                <select
                  value={itemA.id}
                  onChange={(e) => setItemAId(e.target.value)}
                  className="w-full bg-[#0e0e18] border border-zinc-700/80 text-white text-xs sm:text-sm rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-purple-500 font-medium"
                >
                  {categoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.brand} {item.name} — ₹{item.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Slot B Picker */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/90 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold uppercase tracking-wide">Slot B: Contender</span>
                <span className="text-zinc-500">{categoryItems.length} options</span>
              </div>
              <div className="relative">
                <select
                  value={itemB.id}
                  onChange={(e) => setItemBId(e.target.value)}
                  className="w-full bg-[#0e0e18] border border-zinc-700/80 text-white text-xs sm:text-sm rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-purple-500 font-medium"
                >
                  {categoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.brand} {item.name} — ₹{item.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pricing Delta Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-purple-950/30 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-zinc-400">Price Variance: </span>
                {cheaperItem === 'EQUAL' ? (
                  <span className="font-bold text-white">Both items share the exact same price point</span>
                ) : (
                  <span className="font-extrabold text-white">
                    {cheaperItem === 'A' ? itemA.name : itemB.name} is{' '}
                    <span className="text-emerald-400 font-mono">₹{priceDiff.toLocaleString('en-IN')} ({percentDiff}%)</span>{' '}
                    more budget-friendly
                  </span>
                )}
                {wattageDiff > 0 && (
                  <span className="block text-zinc-400 text-[11px] mt-0.5">
                    Thermal draw:{' '}
                    <span className="text-purple-300 font-mono">
                      {moreEfficient === 'A' ? itemA.name : itemB.name} consumes {wattageDiff}W less power
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-zinc-500">Live INR Pricing</span>
            </div>
          </div>

          {/* Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ITEM A CARD */}
            <div className="p-5 rounded-2xl bg-[#0c0c16] border border-purple-500/30 relative flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800/80">
                    SLOT A · {itemA.brand}
                  </span>
                  {cheaperItem === 'A' && priceDiff > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      <TrendingDown className="w-3 h-3" />
                      Save ₹{priceDiff.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Product Image */}
                <div className="h-44 w-full bg-[#07070c] rounded-xl border border-zinc-800/80 flex items-center justify-center p-3 overflow-hidden group">
                  <img
                    src={itemA.image || CATEGORY_IMAGE_FALLBACKS[itemA.category] || CATEGORY_IMAGE_FALLBACKS.cpu}
                    alt={itemA.name}
                    className="max-h-36 max-w-full object-contain filter drop-shadow-[0_0_12px_rgba(139,92,246,0.2)] group-hover:scale-105 transition-transform"
                  />
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-white leading-snug">{itemA.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{itemA.description}</p>
                </div>

                <div className="pt-2 flex items-baseline justify-between border-t border-zinc-800/70">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Price (Inclusive of GST)</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-white">
                      ₹{itemA.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Power Envelope</span>
                    <span className="text-sm font-mono font-bold text-purple-300">{itemA.wattage}W TDP</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Item A */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    onSelectForBuilder(itemA);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-950/50"
                  title="Load this component into 3D Builder"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Add to 3D Rig</span>
                </button>
                <button
                  onClick={() => handleAddToCartClick(itemA, 'A')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    addedItemA
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80'
                  }`}
                >
                  {addedItemA ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ITEM B CARD */}
            <div className="p-5 rounded-2xl bg-[#0c0c16] border border-cyan-500/30 relative flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                    SLOT B · {itemB.brand}
                  </span>
                  {cheaperItem === 'B' && priceDiff > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      <TrendingDown className="w-3 h-3" />
                      Save ₹{priceDiff.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Product Image */}
                <div className="h-44 w-full bg-[#07070c] rounded-xl border border-zinc-800/80 flex items-center justify-center p-3 overflow-hidden group">
                  <img
                    src={itemB.image || CATEGORY_IMAGE_FALLBACKS[itemB.category] || CATEGORY_IMAGE_FALLBACKS.cpu}
                    alt={itemB.name}
                    className="max-h-36 max-w-full object-contain filter drop-shadow-[0_0_12px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform"
                  />
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-white leading-snug">{itemB.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{itemB.description}</p>
                </div>

                <div className="pt-2 flex items-baseline justify-between border-t border-zinc-800/70">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Price (Inclusive of GST)</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-white">
                      ₹{itemB.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Power Envelope</span>
                    <span className="text-sm font-mono font-bold text-cyan-300">{itemB.wattage}W TDP</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Item B */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    onSelectForBuilder(itemB);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50"
                  title="Load this component into 3D Builder"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Add to 3D Rig</span>
                </button>
                <button
                  onClick={() => handleAddToCartClick(itemB, 'B')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    addedItemB
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80'
                  }`}
                >
                  {addedItemB ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Technical Specification Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                <span>Authoritative Specification Matrix</span>
              </h4>
              <span className="text-xs font-mono text-zinc-500">Verified Black Raven Hardware Specs</span>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-[#07070d] overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                    <th className="p-3 w-1/3">Parameter</th>
                    <th className="p-3 w-1/3 text-purple-300 font-bold">{itemA.name}</th>
                    <th className="p-3 w-1/3 text-cyan-300 font-bold">{itemB.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {/* Manufacturer & SKU */}
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 text-zinc-400">Manufacturer</td>
                    <td className="p-3 text-white font-semibold">{itemA.brand}</td>
                    <td className="p-3 text-white font-semibold">{itemB.brand}</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 text-zinc-400">Hardware SKU</td>
                    <td className="p-3 text-zinc-300">{itemA.sku}</td>
                    <td className="p-3 text-zinc-300">{itemB.sku}</td>
                  </tr>

                  {/* Warranty */}
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 text-zinc-400">Manufacturer Warranty</td>
                    <td className="p-3 text-white">
                      {itemA.warrantyYears} Years Direct
                      {itemA.warrantyYears > itemB.warrantyYears && (
                        <span className="ml-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded">
                          +{itemA.warrantyYears - itemB.warrantyYears}yr Longer
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-white">
                      {itemB.warrantyYears} Years Direct
                      {itemB.warrantyYears > itemA.warrantyYears && (
                        <span className="ml-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded">
                          +{itemB.warrantyYears - itemA.warrantyYears}yr Longer
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* TDP / Wattage */}
                  <tr className="hover:bg-zinc-900/40">
                    <td className="p-3 text-zinc-400">TDP / Rated Power Draw</td>
                    <td className="p-3 text-white">
                      {itemA.wattage} Watts
                      {itemA.wattage < itemB.wattage && (
                        <span className="ml-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded">
                          Lower Power Draw
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-white">
                      {itemB.wattage} Watts
                      {itemB.wattage < itemA.wattage && (
                        <span className="ml-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded">
                          Lower Power Draw
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Socket Compatibility if applicable */}
                  {(itemA.socket || itemB.socket) && (
                    <tr className="hover:bg-zinc-900/40">
                      <td className="p-3 text-zinc-400">Motherboard Socket</td>
                      <td className="p-3 text-purple-300 font-bold">{itemA.socket || 'N/A'}</td>
                      <td className="p-3 text-cyan-300 font-bold">{itemB.socket || 'N/A'}</td>
                    </tr>
                  )}

                  {/* RAM Type if applicable */}
                  {(itemA.ramType || itemB.ramType) && (
                    <tr className="hover:bg-zinc-900/40">
                      <td className="p-3 text-zinc-400">Memory Type</td>
                      <td className="p-3 text-white">{itemA.ramType || 'N/A'}</td>
                      <td className="p-3 text-white">{itemB.ramType || 'N/A'}</td>
                    </tr>
                  )}

                  {/* Form Factor if applicable */}
                  {(itemA.formFactor || itemB.formFactor) && (
                    <tr className="hover:bg-zinc-900/40">
                      <td className="p-3 text-zinc-400">Form Factor</td>
                      <td className="p-3 text-white">{itemA.formFactor || 'N/A'}</td>
                      <td className="p-3 text-white">{itemB.formFactor || 'N/A'}</td>
                    </tr>
                  )}

                  {/* Physical Clearance if applicable */}
                  {(itemA.gpuLengthMm || itemB.gpuLengthMm) && (
                    <tr className="hover:bg-zinc-900/40">
                      <td className="p-3 text-zinc-400">Physical GPU Length</td>
                      <td className="p-3 text-white">{itemA.gpuLengthMm ? `${itemA.gpuLengthMm} mm` : 'N/A'}</td>
                      <td className="p-3 text-white">{itemB.gpuLengthMm ? `${itemB.gpuLengthMm} mm` : 'N/A'}</td>
                    </tr>
                  )}

                  {/* Dynamic Technical Specs dictionary */}
                  {specKeys.map((key) => {
                    const valA = itemA.specs?.[key] || '—';
                    const valB = itemB.specs?.[key] || '—';
                    const isDiff = valA !== valB;
                    return (
                      <tr key={key} className={isDiff ? 'bg-zinc-900/30' : 'hover:bg-zinc-900/20'}>
                        <td className="p-3 text-zinc-400 font-medium">{key}</td>
                        <td className={`p-3 ${isDiff ? 'text-purple-200 font-semibold' : 'text-zinc-300'}`}>
                          {valA}
                        </td>
                        <td className={`p-3 ${isDiff ? 'text-cyan-200 font-semibold' : 'text-zinc-300'}`}>
                          {valB}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Black Raven Engineering Verdict */}
          <div className="p-5 rounded-2xl bg-[#0b0b14] border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>BLACK RAVEN ENGINEERING VERDICT</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 space-y-1.5">
                <span className="font-bold text-purple-300 block">Why choose {itemA.name}:</span>
                <p>
                  {cheaperItem === 'A'
                    ? `Offers superior cost efficiency, saving ₹${priceDiff.toLocaleString('en-IN')} while maintaining enthusiast-grade stability.`
                    : `Engineered for extreme performance workloads, offering higher headroom for intensive workflows and heavy rendering.`}
                  {itemA.wattage < itemB.wattage && ` Operates at lower thermals with a ${itemA.wattage}W power profile.`}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/30 space-y-1.5">
                <span className="font-bold text-cyan-300 block">Why choose {itemB.name}:</span>
                <p>
                  {cheaperItem === 'B'
                    ? `Offers superior price-to-performance value, saving ₹${priceDiff.toLocaleString('en-IN')} with no compromise on core feature set.`
                    : `Delivers top-tier silicon performance, maximized boost clocks, and extended multi-core endurance.`}
                  {itemB.wattage < itemA.wattage && ` Operates with high thermal efficiency at ${itemB.wattage}W TDP.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0c0c14] border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-zinc-500">
            Selected components can be loaded directly into your live 3D chassis build.
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
          >
            Close Comparator
          </button>
        </div>
      </div>
    </div>
  );
};
