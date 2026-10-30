import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#050507] border-t border-zinc-800/80 text-zinc-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-900">
          {/* Brand Info */}
          <div className="space-y-4">
            <img
              src="/assets/aistudio/image_999d9928.png"
              alt="BLACK RAVEN"
              className="h-12 sm:h-14 md:h-16 w-auto max-w-[280px] object-contain opacity-95 filter drop-shadow-[0_0_18px_rgba(139,92,246,0.4)] mb-2"
            />
            <p className="text-zinc-400 text-xs leading-relaxed">
              Built in Darkness. Engineered to Dominate. High-performance gaming PCs, deep learning rigs, and workstations built with aerospace tolerances.
            </p>
            <p className="text-[11px] font-mono text-zinc-500">
              CIN: U72900MH2026PTC109283 · GSTIN: 27AABCB1234F1Z8
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
              Systems & Builder
            </span>
            <ul className="space-y-1.5 text-zinc-400">
              <li>
                <button onClick={() => onNavigate('builder')} className="hover:text-purple-400 transition-colors">
                  3D Custom PC Configurator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('prebuilts')} className="hover:text-purple-400 transition-colors">
                  Factory-Tuned Prebuilts
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('store')} className="hover:text-purple-400 transition-colors">
                  Store & Hot Deals
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('wizard')} className="hover:text-purple-400 transition-colors">
                  Budget & FPS Wizard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('quotations')} className="hover:text-purple-400 transition-colors">
                  Official Build Proposals
                </button>
              </li>
            </ul>
          </div>

          {/* Warranty & Guarantees */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
              Support & Coverage
            </span>
            <ul className="space-y-1.5 text-zinc-400">
              <li>
                <button onClick={() => onNavigate('engineering')} className="hover:text-purple-400 transition-colors">
                  3-Year Doorstep Warranty
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('engineering')} className="hover:text-purple-400 transition-colors">
                  72-Hour Torture Test Protocol
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('engineering')} className="hover:text-purple-400 transition-colors">
                  Transit Freight Insurance
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('engineering')} className="hover:text-purple-400 transition-colors">
                  Technical Support & FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Coordinates */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
              Direct Engineering HQ
            </span>
            <p className="text-zinc-400 text-xs">
              Black Raven Technologies India Pvt Ltd<br />
              Hardware Lab 4, Cyber City Tech Zone<br />
              Pune, Maharashtra 411028
            </p>
            <p className="font-mono text-[11px] text-zinc-400 pt-1">
              Direct Line: +91 (020) 8920-4100<br />
              Email: engineering@blackraven.in
            </p>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-mono">
          <div>
            © {new Date().getFullYear()} BLACK RAVEN. All rights reserved. Registered trademark.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-zinc-400">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              100% Genuine Manufacturer Warranty
            </span>
            <span>·</span>
            <span>Made with pride in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
