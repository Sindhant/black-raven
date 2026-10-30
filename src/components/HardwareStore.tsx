import React, { useState, useMemo } from 'react';
import { HardwareItem, CartItem, ComponentCategory, SiteSettings } from '../types';
import { INITIAL_HARDWARE_CATALOG } from '../data/catalog';
import { ComponentComparatorModal } from './ComponentComparatorModal';
import {
  Search,
  ShoppingCart,
  Sparkles,
  Zap,
  Cpu,
  Layers,
  HardDrive,
  Fan,
  Box,
  Monitor,
  Check,
  ShieldCheck,
  Truck,
  Headphones,
  CreditCard,
  ChevronRight,
  Flame,
  ArrowRight,
  Star,
  Tag,
  Scale,
  Wrench,
  X,
  ArrowLeftRight,
  SlidersHorizontal,
} from 'lucide-react';

interface HardwareStoreProps {
  onAddToCart: (item: CartItem) => void;
  onOpenBuilder: () => void;
  catalog?: HardwareItem[];
  onApplyComponentToBuilder?: (item: HardwareItem) => void;
  settings?: SiteSettings;
}

interface HotProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  badge?: string;
  specs: string;
  inStock: boolean;
  image: string;
}

const POPULAR_CATEGORIES = [
  { id: 'cpu', name: 'Processors (CPU)', count: '24 Models', icon: Cpu, desc: 'Intel Core Ultra & AMD Ryzen 9000/7000' },
  { id: 'motherboard', name: 'Motherboards', count: '32 Models', icon: Layers, desc: 'Z890, X870E, B650 AM5 & LGA1700' },
  { id: 'gpu', name: 'Graphics Cards (GPU)', count: '48 Models', icon: Sparkles, desc: 'GeForce RTX 40-Series & RX 7000' },
  { id: 'ram', name: 'Memory (RAM)', count: '18 Models', icon: Layers, desc: 'High-speed DDR5 6000-8000 MT/s' },
  { id: 'storage', name: 'NVMe SSD & Storage', count: '26 Models', icon: HardDrive, desc: 'Gen 5 & Gen 4 up to 14,000 MB/s' },
  { id: 'cooling', name: 'Liquid Cooling & AIO', count: '16 Models', icon: Fan, desc: '360mm LCD Display & Custom Loops' },
  { id: 'case', name: 'Cabinets & Chassis', count: '22 Models', icon: Box, desc: 'Dual-Chamber & High-Airflow Towers' },
  { id: 'psu', name: 'Power Supplies (PSU)', count: '19 Models', icon: Zap, desc: 'ATX 3.1 & 80+ Gold/Platinum' },
  { id: 'monitor', name: 'Gaming Monitors', count: '14 Models', icon: Monitor, desc: '240Hz OLED & 4K Ultrawide' },
];

const HOT_SELLING_ITEMS: HotProduct[] = [
  {
    id: 'hot-smps-corsair-rm850e',
    name: 'Corsair RM850e ATX 3.1 Gold Fully Modular SMPS',
    brand: 'Corsair',
    category: 'Power Supply',
    originalPrice: 17999,
    salePrice: 10700,
    discountPercent: 40,
    badge: '-40% HOT DEAL',
    specs: '850W · 80 Plus Gold · PCIe 5.1 Native 12V-2x6',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hot-ram-gskill-ripjaws',
    name: 'G.Skill Trident Z5 RGB 32GB (2x16GB) 6000MHz CL30 DDR5',
    brand: 'G.Skill',
    category: 'Memory',
    originalPrice: 29520,
    salePrice: 13040,
    discountPercent: 55,
    badge: '-55% MEGA SALE',
    specs: '32GB Dual Channel · AMD EXPO & Intel XMP 3.0',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hot-supercomputer-dgx',
    name: 'NVIDIA DGX Spark 4TB Desktop AI Supercomputer Workstation',
    brand: 'NVIDIA',
    category: 'AI Supercomputer',
    originalPrice: 799999,
    salePrice: 686000,
    discountPercent: 14,
    badge: '-14% ENTERPRISE',
    specs: '4x Tensor Cores · 4TB Unified PCIe Gen5 SSD · Liquid Cooled',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hot-monitor-lg-ultragear',
    name: 'LG UltraGear 39GX900A-B 39 Inch Curved OLED Gaming Monitor',
    brand: 'LG',
    category: 'Monitor',
    originalPrice: 180000,
    salePrice: 99990,
    discountPercent: 44,
    badge: '-44% OLED DEAL',
    specs: '800R Curved OLED · 240Hz · 0.03ms GtG · DisplayPort 2.1',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hot-hdd-wd-blue',
    name: 'WD_BLACK SN850X 4TB NVMe M.2 PCIe Gen4 Gaming SSD',
    brand: 'Western Digital',
    category: 'Storage',
    originalPrice: 38500,
    salePrice: 28990,
    discountPercent: 25,
    badge: '-25% SPEED',
    specs: '7300 MB/s Read · In-House Heatsink · DirectStorage Ready',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hot-cpu-5800x3d',
    name: 'AMD Ryzen 7 7800X3D Processor 10th Anniversary Collector Edition',
    brand: 'AMD',
    category: 'Processor',
    originalPrice: 66000,
    salePrice: 37499,
    discountPercent: 43,
    badge: '-43% GAMING KING',
    specs: '8 Cores / 16 Threads · 104MB 3D V-Cache · 5.0 GHz Boost',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hot-gpu-msi-rtx4070tis',
    name: 'MSI GeForce RTX 4070 Ti Super 16GB Ventus 3X OC',
    brand: 'MSI',
    category: 'Graphics Card',
    originalPrice: 94999,
    salePrice: 81990,
    discountPercent: 14,
    badge: '-14% BESTSELLER',
    specs: '16GB GDDR6X · Torx Fan 4.0 · DLSS 3.5 Frame Gen',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hot-gpu-gigabyte-rtx4060ti',
    name: 'Gigabyte GeForce RTX 4060 Ti Windforce OC 8GB',
    brand: 'Gigabyte',
    category: 'Graphics Card',
    originalPrice: 48999,
    salePrice: 38490,
    discountPercent: 21,
    badge: '-21% VALUE',
    specs: 'Dual Windforce Fans · Ray Tracing · Low 160W TDP',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
  },
];

const KARNAGE_GEAR = [
  {
    id: 'karnage-kb',
    title: 'KEYBOARD',
    name: 'Karnage Apex Pro Wireless Mechanical Keyboard',
    price: 8990,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    desc: 'Hot-swappable tactile violet switches, sound dampening foam & PBT shine-through keycaps.',
  },
  {
    id: 'karnage-mouse',
    title: 'MOUSE',
    name: 'Karnage Ultralight 49g Wireless Gaming Mouse',
    price: 4990,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    desc: 'PixArt 3395 26,000 DPI sensor, 4000Hz polling rate & optical switches.',
  },
  {
    id: 'karnage-headset',
    title: 'HEADSET',
    name: 'Karnage Spatial Audio 7.1 Studio Headset',
    price: 6490,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    desc: '50mm neodymium planar drivers, broadcast-grade mic & breathable memory foam.',
  },
  {
    id: 'karnage-fans',
    title: 'CABINET FAN',
    name: 'Karnage Vortex ARGB 120mm Magnetic Daisy-Chain 3-Pack',
    price: 3490,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    desc: 'Zero-cable pin connection, hydraulic bearing & mirror infinity halo lighting.',
  },
];

const HOT_TO_CATALOG_ID_MAP: Record<string, string> = {
  'hot-cpu-5800x3d': 'cpu-7800x3d',
  'hot-gpu-msi-rtx4070tis': 'gpu-rtx4070tis',
  'hot-gpu-gigabyte-rtx4060ti': 'gpu-rtx4060',
  'hot-smps-corsair-rm850e': 'psu-corsair-rm1000x',
  'hot-ram-gskill-ripjaws': 'ram-gskill-64gb',
  'hot-hdd-wd-blue': 'ssd-samsung-990pro-2tb',
  'hot-supercomputer-dgx': 'gpu-rtx4090',
  'hot-monitor-lg-ultragear': 'gpu-rtx4080s',
};

export const HardwareStore: React.FC<HardwareStoreProps> = ({
  onAddToCart,
  onOpenBuilder,
  catalog,
  onApplyComponentToBuilder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Comparison State
  const [compareItemIds, setCompareItemIds] = useState<string[]>([]);
  const [isComparatorModalOpen, setIsComparatorModalOpen] = useState(false);
  const [catalogCategoryTab, setCatalogCategoryTab] = useState<string>('all');

  const allCatalogItems = useMemo(() => {
    return catalog && catalog.length > 0 ? catalog : INITIAL_HARDWARE_CATALOG;
  }, [catalog]);

  const handleBuyProduct = (prod: HotProduct) => {
    onAddToCart({
      id: prod.id,
      type: 'component',
      title: prod.name,
      subtitle: `${prod.brand} · ${prod.specs}`,
      price: prod.salePrice,
      quantity: 1,
    });
    setAddedItemIds((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [prod.id]: false }));
    }, 2000);
  };

  const handleBuyGear = (gear: typeof KARNAGE_GEAR[0]) => {
    onAddToCart({
      id: gear.id,
      type: 'component',
      title: gear.name,
      subtitle: `KARNAGE by BLACK RAVEN · ${gear.title}`,
      price: gear.price,
      quantity: 1,
    });
    setAddedItemIds((prev) => ({ ...prev, [gear.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [gear.id]: false }));
    }, 2000);
  };

  const handleBuyCatalogItem = (item: HardwareItem) => {
    onAddToCart({
      id: item.id,
      type: 'component',
      title: item.name,
      subtitle: `${item.brand} · ${item.category.toUpperCase()}`,
      price: item.price,
      quantity: 1,
    });
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  // Toggle item in comparison
  const handleToggleCompare = (idOrHotId: string) => {
    const targetId = HOT_TO_CATALOG_ID_MAP[idOrHotId] || idOrHotId;
    setCompareItemIds((prev) => {
      if (prev.includes(targetId)) {
        return prev.filter((id) => id !== targetId);
      }
      if (prev.length >= 2) {
        return [prev[0], targetId];
      }
      return [...prev, targetId];
    });
  };

  const isItemInCompare = (idOrHotId: string) => {
    const targetId = HOT_TO_CATALOG_ID_MAP[idOrHotId] || idOrHotId;
    return compareItemIds.includes(targetId);
  };

  const filteredHotItems = HOT_SELLING_ITEMS.filter((item) => {
    if (selectedCategoryFilter !== 'all' && item.category.toLowerCase() !== selectedCategoryFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.specs.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredCatalogItems = allCatalogItems.filter((item) => {
    if (catalogCategoryTab !== 'all' && item.category !== catalogCategoryTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Resolved items for floating dock
  const comparedItemA = allCatalogItems.find((c) => c.id === compareItemIds[0]);
  const comparedItemB = allCatalogItems.find((c) => c.id === compareItemIds[1]);

  return (
    <div className="bg-[#060608] min-h-screen text-zinc-100 py-6 space-y-12 select-none relative pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* 1. STORE HEADER & CAMPAIGN HERO BANNER */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                <span>BLACK RAVEN RETAIL & HARDWARE VAULT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Enthusiast Components & Limited Deals
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Direct wholesale pricing, authorized brand warranties, insured doorstep delivery across India.
              </p>
            </div>

            {/* Search Bar & Comparator Shortcut Button */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search RTX 4090, 7800X3D, DDR5..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 shadow-sm"
                />
              </div>

              <button
                onClick={() => setIsComparatorModalOpen(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all border shrink-0 ${
                  compareItemIds.length > 0
                    ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-950/60 animate-pulse'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
                title="Open Side-by-Side Component Comparator"
              >
                <Scale className="w-4 h-4 text-purple-300" />
                <span className="hidden sm:inline">Compare</span>
                {compareItemIds.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-purple-950 text-[10px] font-black">
                    {compareItemIds.length}/2
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Hero Promotional Banner (Diwali & Enthusiast Hardware Bonanza) */}
          <div className="rounded-2xl overflow-hidden border border-purple-900/50 bg-gradient-to-r from-[#120b22] via-[#090812] to-[#120b22] p-6 sm:p-8 relative shadow-2xl">
            <div className="max-w-2xl space-y-3 relative z-10">
              <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-600/60 text-[11px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-purple-400" />
                <span>DIWALI STORAGE & HARDWARE BONANZA</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                UP TO 55% OFF ON NVME SSDs, DDR5 RAM & RTX HARDWARE
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Take advantage of special festival discounts on high-performance gaming components. Insured doorstep delivery with full manufacturer warranty across India.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenBuilder}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-950/60 flex items-center gap-2"
                >
                  <span>Build Custom PC With These Deals</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsComparatorModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-purple-300 border border-purple-500/30 font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare Specs Side-by-Side</span>
                </button>
                <span className="text-[11px] font-mono text-zinc-400">
                  *Limited-time offer while stocks last
                </span>
              </div>
            </div>

            {/* Glowing Accent Ring */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-600/10 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* 2. POPULAR CATEGORIES (PODIUM SHOWCASE) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                EXPLORE CATALOG BY HARDWARE CLASS
              </span>
              <h3 className="text-xl font-extrabold text-white">Popular Component Podiums</h3>
            </div>
            <button
              onClick={() => {
                setSelectedCategoryFilter('all');
                setCatalogCategoryTab('all');
              }}
              className="text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {POPULAR_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategoryFilter.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    const next = isSelected ? 'all' : cat.id;
                    setSelectedCategoryFilter(next);
                    setCatalogCategoryTab(next === 'all' ? 'all' : next);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all group flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-950/40'
                      : 'border-zinc-800/80 bg-[#0a0a10] hover:border-zinc-700 hover:bg-[#0e0e16]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {cat.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 mt-2 block font-semibold">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. HOT SELLING ITEMS (PRODUCT CARDS) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>HOT SELLING ITEMS</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">Featured Hardware & Instant Discounts</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Showing {filteredHotItems.length} Available Deals
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredHotItems.map((prod) => {
              const isAdded = addedItemIds[prod.id];
              const isCompared = isItemInCompare(prod.id);
              return (
                <div
                  key={prod.id}
                  className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-lg group ${
                    isCompared
                      ? 'border-purple-500 bg-[#0f0e1c] shadow-purple-950/40'
                      : 'border-zinc-800/90 bg-[#0b0b12] hover:border-zinc-700 hover:bg-[#0d0d16]'
                  }`}
                >
                  {/* Image & Discount Badge */}
                  <div className="p-4 relative bg-[#07070b] flex items-center justify-center min-h-[180px] overflow-hidden">
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white shadow-md">
                      {prod.badge}
                    </span>
                    {isCompared && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-600 text-white shadow-md flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        In Compare
                      </span>
                    )}
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="max-h-36 w-auto object-contain group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{prod.brand}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[10px] font-mono text-purple-400">{prod.category}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 font-mono">{prod.specs}</p>
                    </div>

                    {/* Price, Compare & Cart Buttons */}
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-black font-mono text-white">
                            ₹{prod.salePrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-mono text-zinc-500 line-through">
                            ₹{prod.originalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleToggleCompare(prod.id)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 border ${
                            isCompared
                              ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-md shadow-purple-950/60'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                          title="Compare side-by-side with another part"
                        >
                          <Scale className="w-3.5 h-3.5 text-purple-400" />
                          <span>{isCompared ? 'Compared' : 'Compare'}</span>
                        </button>

                        <button
                          onClick={() => handleBuyProduct(prod)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-950/50'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Buy Now</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. COMPREHENSIVE HARDWARE SPECIFICATION & COMPARISON MATRIX */}
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>SIDE-BY-SIDE COMPONENT BROWSER & COMPARATOR</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">Full Hardware Specifications Catalog</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Select any two components to launch the comprehensive engineering spec-by-spec comparison matrix.
              </p>
            </div>

            <button
              onClick={() => setIsComparatorModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-950/50 self-start sm:self-auto"
            >
              <Scale className="w-4 h-4" />
              <span>Launch Comparator Tool</span>
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            {[
              { id: 'all', label: 'All Hardware' },
              { id: 'cpu', label: 'CPUs' },
              { id: 'gpu', label: 'GPUs' },
              { id: 'motherboard', label: 'Motherboards' },
              { id: 'ram', label: 'RAM' },
              { id: 'storage', label: 'Storage' },
              { id: 'cooler', label: 'Cooling' },
              { id: 'case', label: 'Cases' },
              { id: 'psu', label: 'PSUs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCatalogCategoryTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors border ${
                  catalogCategoryTab === tab.id
                    ? 'bg-purple-600 text-white border-purple-500 font-bold'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalogItems.map((item) => {
              const isAdded = addedItemIds[item.id];
              const isCompared = isItemInCompare(item.id);
              const specEntries = Object.entries(item.specs || {}).slice(0, 3);
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isCompared
                      ? 'border-purple-500 bg-[#0e0d1a] shadow-lg shadow-purple-950/40'
                      : 'border-zinc-800/80 bg-[#0a0a10] hover:border-zinc-700 hover:bg-[#0c0c14]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                        {item.category.toUpperCase()} · {item.brand}
                      </span>
                      {isCompared ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-600 text-white">
                          In Compare
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-500">{item.wattage}W TDP</span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-1">{item.description}</p>

                    {/* Spec tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {specEntries.map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                        >
                          <span className="text-zinc-500">{k}: </span>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-extrabold font-mono text-white">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {item.warrantyYears}yr Warranty
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleToggleCompare(item.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 border ${
                          isCompared
                            ? 'bg-purple-950 text-purple-300 border-purple-500'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                        }`}
                        title="Add to side-by-side comparison"
                      >
                        <Scale className="w-3 h-3 text-purple-400" />
                        <span>{isCompared ? 'Compared' : 'Compare'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onApplyComponentToBuilder) {
                            onApplyComponentToBuilder(item);
                          } else {
                            onOpenBuilder();
                          }
                        }}
                        className="py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center justify-center gap-1 border border-zinc-700"
                        title="Load this part directly into active 3D chassis"
                      >
                        <Wrench className="w-3 h-3 text-cyan-400" />
                        <span>To 3D Rig</span>
                      </button>

                      <button
                        onClick={() => handleBuyCatalogItem(item)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        {isAdded ? 'Added' : 'Bag'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. FESTIVAL PROMOTIONAL BANNERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-blue-900/40 bg-gradient-to-br from-[#070b1a] via-[#050711] to-[#0a1128] p-6 relative overflow-hidden">
            <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold uppercase tracking-wider inline-block">
              DIWALI DHAMAKA OFFER
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">
              SHARK-X SUPER DEAL
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Buy Shark-X & get a MasterHub Stream Kit completely free. Limited period festival bundle.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500">27 October – 15 November 2026</span>
              <button
                onClick={onOpenBuilder}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md"
              >
                Claim Deal
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-900/40 bg-gradient-to-br from-[#12081d] via-[#09050f] to-[#170a24] p-6 relative overflow-hidden">
            <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold uppercase tracking-wider inline-block">
              FACTORY OVERCLOCKED
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">
              GAMING PRE-BUILT BUNDLES
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              More Power. More Frames. More Dominance. Save up to ₹7,000 on ready-to-ship tuned gaming PCs.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Save up to ₹7,000 INR</span>
              <button
                onClick={onOpenBuilder}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md"
              >
                Shop Systems
              </button>
            </div>
          </div>
        </div>

        {/* 6. KARNAGE BRAND PERIPHERAL SPOTLIGHT */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-red-500 font-bold uppercase tracking-wider">
                <span>KARNAGE</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">ENGINEERED BY BLACK RAVEN</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">Competitive Esports Peripherals</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">Tournament Grade</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KARNAGE_GEAR.map((gear) => {
              const isAdded = addedItemIds[gear.id];
              return (
                <div
                  key={gear.id}
                  className="rounded-2xl border border-zinc-800 bg-[#08080d] p-4 flex flex-col justify-between space-y-3 group hover:border-zinc-700 transition-all"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-red-500 font-extrabold uppercase">
                      {gear.title}
                    </span>
                    <div className="h-36 rounded-xl bg-zinc-950 flex items-center justify-center overflow-hidden p-2">
                      <img
                        src={gear.image}
                        alt={gear.name}
                        className="max-h-32 object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{gear.name}</h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-2">{gear.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-sm font-extrabold font-mono text-white">
                      ₹{gear.price.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleBuyGear(gear)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      {isAdded ? 'Added' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. INDIAN E-COMMERCE TRUST STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-y border-zinc-800/80">
          <div className="flex items-center gap-3.5 p-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Free Insured Shipping</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">Across all pin codes in India</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Direct Engineer Support</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">Senior PC builders on standby</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">100% Secure Payments</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">UPI, RuPay, NetBanking & No-Cost EMI</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Authorised Warranty</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">3–5 Year direct brand coverage</p>
            </div>
          </div>
        </div>
      </div>

      {/* 8. FLOATING STICKY COMPARISON DOCK */}
      {compareItemIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-[#0c0c16]/95 backdrop-blur-md border border-purple-500/50 rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in ring-1 ring-purple-500/20">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider">
                  Hardware Comparison ({compareItemIds.length}/2)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white font-medium truncate mt-0.5">
                {comparedItemA && (
                  <span className="truncate max-w-[140px] sm:max-w-[180px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {comparedItemA.name}
                  </span>
                )}
                {comparedItemB ? (
                  <>
                    <span className="text-purple-400 font-bold text-xs">vs</span>
                    <span className="truncate max-w-[140px] sm:max-w-[180px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {comparedItemB.name}
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-400 text-[11px] italic">
                    + Select 1 more part to compare
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => setCompareItemIds([])}
              className="px-3 py-2 text-xs font-mono text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsComparatorModalOpen(true)}
              className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare Side-by-Side</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. SIDE-BY-SIDE COMPONENT COMPARATOR MODAL */}
      <ComponentComparatorModal
        isOpen={isComparatorModalOpen}
        onClose={() => setIsComparatorModalOpen(false)}
        catalog={allCatalogItems}
        initialItemAId={compareItemIds[0] || 'cpu-7800x3d'}
        initialItemBId={compareItemIds[1] || (compareItemIds[0] === 'cpu-14700k' ? 'cpu-7800x3d' : 'cpu-14700k')}
        onSelectForBuilder={(item) => {
          if (onApplyComponentToBuilder) {
            onApplyComponentToBuilder(item);
          } else {
            onOpenBuilder();
          }
        }}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};
