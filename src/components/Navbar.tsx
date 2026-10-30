import React from 'react';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  openAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  openAdmin,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#07070a]/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Official Brand Logo - Big, High-Impact & Glowing */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 group transition-transform"
          title="BLACK RAVEN - Home"
        >
          <img
            src="/assets/aistudio/image_999d9928.png"
            alt="BLACK RAVEN"
            className="h-10 sm:h-12 md:h-14 w-auto max-w-[240px] sm:max-w-[320px] object-contain filter drop-shadow-[0_0_16px_rgba(139,92,246,0.4)] group-hover:drop-shadow-[0_0_26px_rgba(139,92,246,0.75)] group-hover:scale-105 transition-all duration-300"
          />
        </button>

        {/* Zone 2: 4–5 single-line concise text links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
          <button
            onClick={() => setActiveTab('builder')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 border-b-2 ${
              activeTab === 'builder'
                ? 'text-white border-purple-500'
                : 'text-zinc-400 border-transparent'
            }`}
          >
            3D Builder
          </button>
          <button
            onClick={() => setActiveTab('prebuilts')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 border-b-2 ${
              activeTab === 'prebuilts'
                ? 'text-white border-purple-500'
                : 'text-zinc-400 border-transparent'
            }`}
          >
            Ready-Made PCs
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'store'
                ? 'text-white border-purple-500'
                : 'text-zinc-400 border-transparent'
            }`}
          >
            <span>Store & Deals</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-red-600/90 text-white font-bold rounded">
              SALE
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 border-b-2 ${
              activeTab === 'wizard'
                ? 'text-white border-purple-500'
                : 'text-zinc-400 border-transparent'
            }`}
          >
            Budget Wizard
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 border-b-2 ${
              activeTab === 'quotations'
                ? 'text-white border-purple-500'
                : 'text-zinc-400 border-transparent'
            }`}
          >
            Official Proposals
          </button>
          <button
            onClick={() => setActiveTab('engineering')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 border-b-2 ${
              activeTab === 'engineering'
                ? 'text-white border-purple-500'
                : 'text-zinc-400 border-transparent'
            }`}
          >
            Engineering
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action group */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openAdmin}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            title="Business Admin Dashboard"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin</span>
          </button>

          <button
            onClick={openCart}
            className="relative px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-purple-400" />
            <span className="hidden xs:inline">Bag</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-600 text-[11px] font-bold text-white flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile subnav row for small screens */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-zinc-800/60 bg-[#060608] text-xs font-medium text-zinc-400 overflow-x-auto">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'builder' ? 'text-purple-400 font-semibold' : ''}`}
        >
          3D Builder
        </button>
        <button
          onClick={() => setActiveTab('prebuilts')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'prebuilts' ? 'text-purple-400 font-semibold' : ''}`}
        >
          Ready PCs
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-2 py-1 whitespace-nowrap flex items-center gap-1 ${activeTab === 'store' ? 'text-purple-400 font-semibold' : ''}`}
        >
          <span>Store</span>
          <span className="text-[9px] font-mono px-1 bg-red-600 text-white rounded">HOT</span>
        </button>
        <button
          onClick={() => setActiveTab('wizard')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'wizard' ? 'text-purple-400 font-semibold' : ''}`}
        >
          Wizard
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'quotations' ? 'text-purple-400 font-semibold' : ''}`}
        >
          Quotes
        </button>
        <button
          onClick={() => setActiveTab('engineering')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'engineering' ? 'text-purple-400 font-semibold' : ''}`}
        >
          Trust
        </button>
      </div>
    </header>
  );
};
