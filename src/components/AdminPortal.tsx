import React, { useState, useEffect } from 'react';
import {
  HardwareItem,
  Quotation,
  Order,
  ComponentCategory,
  PrebuiltPC,
  SiteSettings,
  CustomerInquiry,
} from '../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
} from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  createProductInDb,
  updateProductInDb,
  deleteProductFromDb,
  seedInitialCatalogIfEmpty,
  savePrebuiltToDb,
  deletePrebuiltFromDb,
  saveSettingsToDb,
} from '../services/catalogService';
import {
  Lock,
  Unlock,
  Package,
  FileText,
  ShoppingBag,
  Settings,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  RefreshCw,
  LogOut,
  AlertCircle,
  Database,
  Monitor,
  Sparkles,
  Flame,
  Globe,
  Sliders,
  DollarSign,
  Tag,
  Search,
  MessageSquare,
} from 'lucide-react';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: HardwareItem[];
  onUpdateProduct?: (product: HardwareItem) => void;
  onCreateProduct?: (product: HardwareItem) => void;
  onDeleteProduct?: (id: string) => void;
  prebuilts?: PrebuiltPC[];
  onUpdatePrebuilt?: (pc: PrebuiltPC) => void;
  onCreatePrebuilt?: (pc: PrebuiltPC) => void;
  onDeletePrebuilt?: (id: string) => void;
  siteSettings?: SiteSettings;
  onUpdateSettings?: (settings: SiteSettings) => void;
  quotations: Quotation[];
  onUpdateQuoteStatus: (id: string, status: Quotation['status']) => void;
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: Order['orderStatus']) => void;
  inquiries?: CustomerInquiry[];
  onUpdateInquiryStatus?: (id: string, status: CustomerInquiry['status']) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  catalog,
  onUpdateProduct,
  onCreateProduct,
  onDeleteProduct,
  prebuilts = [],
  onUpdatePrebuilt,
  onCreatePrebuilt,
  onDeletePrebuilt,
  siteSettings,
  onUpdateSettings,
  quotations,
  onUpdateQuoteStatus,
  orders,
  onUpdateOrderStatus,
  inquiries = [],
  onUpdateInquiryStatus,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPasscodeAuthed, setIsPasscodeAuthed] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'prebuilts' | 'deals' | 'branding' | 'quotes' | 'orders' | 'inquiries'
  >('catalog');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // State for Create Product Modal / Form
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<HardwareItem>>({
    id: '',
    sku: '',
    name: '',
    brand: '',
    category: 'gpu',
    price: 49999,
    wattage: 200,
    warrantyYears: 3,
    inStock: true,
    socket: 'AM5',
    formFactor: 'ATX',
    description: '',
  });

  // State for Editing Product Modal
  const [editingProduct, setEditingProduct] = useState<HardwareItem | null>(null);

  // Inline Quick Price & Description Edit
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState<number>(0);
  const [inlineDescId, setInlineDescId] = useState<string | null>(null);
  const [inlineDescVal, setInlineDescVal] = useState<string>('');

  // Prebuilts management state
  const [editingPrebuilt, setEditingPrebuilt] = useState<PrebuiltPC | null>(null);
  const [isCreatingPrebuilt, setIsCreatingPrebuilt] = useState(false);
  const [newPrebuilt, setNewPrebuilt] = useState<Partial<PrebuiltPC>>({
    id: '',
    sku: '',
    name: '',
    tagline: '',
    tier: 'Elite',
    basePrice: 149999,
    description: '',
    inStock: true,
    warrantyYears: 3,
    components: {
      cpu: 'AMD Ryzen 7 7800X3D',
      gpu: 'GeForce RTX 4070 Ti Super 16GB',
      motherboard: 'B650 WiFi AM5 Gaming Board',
      ram: '32GB (2x16GB) DDR5 6000MHz CL30',
      storage: '2TB PCIe Gen4 NVMe M.2 SSD',
      cooler: 'Black Raven Liquid Nexus 360 ARGB',
      chassis: 'Raven Obsidian Dual-Chamber Tempered Glass',
      psu: '850W 80-Plus Gold ATX 3.0 Modular',
    },
    fpsTargets: [
      { game: 'Cyberpunk 2077', resolution: '1440p Ultra', fps: 115, settings: 'Ray Tracing Ultra' },
      { game: 'Valorant', resolution: '1440p Max', fps: 540, settings: 'Competitive High' },
    ],
    caseColor: 'Obsidian Black',
    accentRgb: '#8b5cf6',
  });

  // Site Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>({
    heroHeadline: siteSettings?.heroHeadline || 'BUILD YOUR LEGACY.',
    heroTagline: siteSettings?.heroTagline || 'Built in Darkness. Engineered to Dominate.',
    heroSubtext:
      siteSettings?.heroSubtext ||
      'Aerospace-grade thermal engineering, liquid loops, and custom battle stations engineered with zero compromise. Handcrafted in India.',
    contactEmail: siteSettings?.contactEmail || 'engineering@blackraven.in',
    contactPhone: siteSettings?.contactPhone || '+91 (020) 8920-4100',
    address: siteSettings?.address || 'Level 4, Synergy Cyber Park, Viman Nagar, Pune, Maharashtra 411014',
    gstNumber: siteSettings?.gstNumber || '27AABCB1234F1Z8',
    freeShippingThreshold: siteSettings?.freeShippingThreshold || 50000,
    diwaliBannerHeadline:
      siteSettings?.diwaliBannerHeadline || 'UP TO 55% OFF ON NVME SSDs, DDR5 RAM & RTX HARDWARE',
    diwaliBannerSubtext:
      siteSettings?.diwaliBannerSubtext ||
      'Take advantage of special festival discounts on high-performance gaming components. Insured doorstep delivery with full manufacturer warranty across India.',
    sharkXOfferText:
      siteSettings?.sharkXOfferText ||
      'Buy Shark-X & get a MasterHub Stream Kit completely free. Limited period festival bundle.',
  });

  // Notification / Toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync settingsForm if siteSettings change
  useEffect(() => {
    if (siteSettings) {
      setSettingsForm(siteSettings);
    }
  }, [siteSettings]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const isAuthorized = !!currentUser || isPasscodeAuthed;

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      await signInWithPopup(auth, googleProvider);
      showToast('Successfully authenticated via Google Firebase Auth.');
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setAuthError(err.message || 'Failed to authenticate via Google.');
    }
  };

  const handlePasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'RAVEN2026' || passcode.trim() === 'admin') {
      setIsPasscodeAuthed(true);
      setAuthError('');
      showToast('Console unlocked via administrative key.');
    } else {
      setAuthError('Invalid passcode. Use RAVEN2026 or Sign in with Google.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsPasscodeAuthed(false);
    showToast('Logged out of Admin Portal.');
  };

  // Seed / Sync Sample Catalog
  const handleSeedCatalog = async () => {
    setIsSyncing(true);
    try {
      await seedInitialCatalogIfEmpty();
      showToast('Sample hardware products initialized in Cloud Firestore.');
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Create Product Handler
  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || !newProduct.price) {
      alert('Please fill in required fields: Name, SKU, and Price.');
      return;
    }

    const id = newProduct.id || `${newProduct.category}-${Date.now()}`;
    const productToSave: HardwareItem = {
      id,
      sku: newProduct.sku,
      name: newProduct.name,
      brand: newProduct.brand || 'Black Raven',
      category: (newProduct.category as ComponentCategory) || 'gpu',
      price: Number(newProduct.price),
      wattage: Number(newProduct.wattage) || 50,
      warrantyYears: Number(newProduct.warrantyYears) || 3,
      inStock: newProduct.inStock ?? true,
      specs: {
        Series: 'Raven Enterprise',
        Segment: 'Custom Hardware',
      },
      socket: newProduct.socket as any,
      formFactor: newProduct.formFactor as any,
      description: newProduct.description || 'Precision hardware component.',
    };

    if (onCreateProduct) {
      onCreateProduct(productToSave);
    }

    try {
      await createProductInDb(productToSave);
      showToast(`Created & persisted product: ${productToSave.name}`);
    } catch (err: any) {
      showToast(`Saved locally. Cloud sync status: ${err.message}`);
    }

    setIsCreatingProduct(false);
    setNewProduct({
      id: '',
      sku: '',
      name: '',
      brand: '',
      category: 'gpu',
      price: 49999,
      wattage: 200,
      warrantyYears: 3,
      inStock: true,
      socket: 'AM5',
      formFactor: 'ATX',
      description: '',
    });
  };

  // 2. Update Product Handler
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (onUpdateProduct) {
      onUpdateProduct(editingProduct);
    }

    try {
      await updateProductInDb(editingProduct.id, {
        name: editingProduct.name,
        sku: editingProduct.sku,
        brand: editingProduct.brand,
        price: Number(editingProduct.price),
        wattage: Number(editingProduct.wattage),
        warrantyYears: Number(editingProduct.warrantyYears),
        inStock: editingProduct.inStock,
        description: editingProduct.description,
      });
      showToast(`Updated product: ${editingProduct.name}`);
    } catch (err: any) {
      showToast(`Updated locally! Cloud notice: ${err.message}`);
    }

    setEditingProduct(null);
  };

  // 3. Toggle Stock (Deactivate / Activate)
  const handleToggleStock = async (item: HardwareItem) => {
    const updated = { ...item, inStock: !item.inStock };
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
    try {
      await updateProductInDb(item.id, { inStock: updated.inStock });
      showToast(`${item.name} set to ${updated.inStock ? 'In Stock' : 'Deactivated / Out of Stock'}`);
    } catch (err: any) {
      showToast(`Updated locally! Cloud notice: ${err.message}`);
    }
  };

  // 4. Save Inline Price
  const handleSaveInlinePrice = async (item: HardwareItem) => {
    const updated = { ...item, price: inlinePriceVal };
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
    setInlinePriceId(null);
    try {
      await updateProductInDb(item.id, { price: inlinePriceVal });
      showToast(`Updated price for ${item.name} to ₹${inlinePriceVal.toLocaleString('en-IN')}`);
    } catch (err: any) {
      showToast(`Updated locally! Cloud notice: ${err.message}`);
    }
  };

  // 5. Save Inline Description
  const handleSaveInlineDesc = async (item: HardwareItem) => {
    const updated = { ...item, description: inlineDescVal };
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
    setInlineDescId(null);
    try {
      await updateProductInDb(item.id, { description: inlineDescVal });
      showToast(`Updated description for ${item.name}`);
    } catch (err: any) {
      showToast(`Updated locally! Cloud notice: ${err.message}`);
    }
  };

  // 6. Delete Product
  const handleDeleteProduct = async (item: HardwareItem) => {
    if (window.confirm(`Permanently remove ${item.name} from website and database?`)) {
      if (onDeleteProduct) {
        onDeleteProduct(item.id);
      }
      try {
        await deleteProductFromDb(item.id);
        showToast(`Deleted ${item.name}`);
      } catch (err: any) {
        showToast(`Removed locally! Cloud notice: ${err.message}`);
      }
    }
  };

  // 7. Save Site Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings) {
      onUpdateSettings(settingsForm);
    }
    try {
      await saveSettingsToDb(settingsForm);
      showToast('Website headlines, branding, and parameters updated across entire site!');
    } catch (err: any) {
      showToast(`Saved locally! Cloud notice: ${err.message}`);
    }
  };

  // 8. Update Prebuilt Handler
  const handleSavePrebuilt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrebuilt) return;

    if (onUpdatePrebuilt) {
      onUpdatePrebuilt(editingPrebuilt);
    }

    try {
      await savePrebuiltToDb(editingPrebuilt);
      showToast(`Updated prebuilt PC: ${editingPrebuilt.name}`);
    } catch (err: any) {
      showToast(`Updated locally! Cloud notice: ${err.message}`);
    }

    setEditingPrebuilt(null);
  };

  // 9. Create Prebuilt Handler
  const handleCreatePrebuilt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrebuilt.name || !newPrebuilt.basePrice) {
      alert('Please fill in System Name and Base Price.');
      return;
    }

    const id = newPrebuilt.id || `prebuilt-${Date.now()}`;
    const pcToSave: PrebuiltPC = {
      id,
      sku: newPrebuilt.sku || `BR-${id.toUpperCase()}`,
      name: newPrebuilt.name,
      tagline: newPrebuilt.tagline || 'Engineered Performance',
      tier: (newPrebuilt.tier as any) || 'Elite',
      basePrice: Number(newPrebuilt.basePrice),
      description: newPrebuilt.description || 'Custom factory-tuned rig.',
      inStock: newPrebuilt.inStock ?? true,
      warrantyYears: Number(newPrebuilt.warrantyYears) || 3,
      components: newPrebuilt.components as any,
      fpsTargets: newPrebuilt.fpsTargets || [],
      caseColor: newPrebuilt.caseColor || 'Obsidian Black',
      accentRgb: newPrebuilt.accentRgb || '#8b5cf6',
    };

    if (onCreatePrebuilt) {
      onCreatePrebuilt(pcToSave);
    }

    try {
      await savePrebuiltToDb(pcToSave);
      showToast(`Created prebuilt PC: ${pcToSave.name}`);
    } catch (err: any) {
      showToast(`Saved locally! Cloud notice: ${err.message}`);
    }

    setIsCreatingPrebuilt(false);
  };

  // Filtered Catalog Items
  const filteredProducts = catalog.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#09090f] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 bg-[#0c0c14] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/image_999d9928.png"
              alt="BLACK RAVEN"
              className="h-9 sm:h-11 w-auto object-contain filter drop-shadow-[0_0_14px_rgba(139,92,246,0.4)]"
            />
            <div className="border-l border-zinc-800 pl-4 hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest font-semibold">
                  EXECUTIVE CONSOLE
                </span>
                <span className="text-zinc-600">/</span>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wide">
                  MASTER SITE CONTROL
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Full-Stack Business & Storefront Management
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthorized && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-950/50 border border-emerald-800/50 rounded-lg text-emerald-300 text-xs font-mono">
                <Unlock className="w-3.5 h-3.5" />
                <span>
                  {currentUser ? `Admin: ${currentUser.email?.split('@')[0]}` : 'Passcode Verified'}
                </span>
              </div>
            )}

            {isAuthorized && (
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Log Out of Admin Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              aria-label="Close Admin Portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Alert */}
        {statusMessage && (
          <div className="px-6 py-2.5 bg-purple-950/90 border-b border-purple-800 text-purple-200 text-xs font-mono flex items-center justify-between animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-purple-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Auth Gate if not logged in */}
        {!isAuthorized ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto space-y-6">
            <img
              src="/assets/aistudio/image_999d9928.png"
              alt="BLACK RAVEN"
              className="h-16 sm:h-20 w-auto object-contain mx-auto filter drop-shadow-[0_0_24px_rgba(139,92,246,0.6)]"
            />
            <div className="space-y-2">
              <h4 className="text-xl font-extrabold text-white">Owner Authorization Required</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Unlock the executive control console to adjust prices, hardware inventory, promotional banners, prebuilts, and business copy.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2"
              >
                <span>Sign In via Google (Owner Account)</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-[#09090f] px-3 text-[11px] font-mono text-zinc-500 uppercase absolute">
                  or administrative passcode
                </span>
              </div>

              <form onSubmit={handlePasscodeLogin} className="space-y-2">
                <input
                  type="password"
                  placeholder="Enter passcode (e.g. RAVEN2026)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-center font-mono"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 font-semibold transition-colors"
                >
                  Verify Master Key
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authorized Admin Workspace */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="px-6 py-2.5 bg-[#07070c] border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
              {[
                { id: 'catalog', label: 'Hardware Products & Prices', icon: Package, count: catalog.length },
                { id: 'prebuilts', label: 'Pre-Built PCs', icon: Monitor, count: prebuilts.length },
                { id: 'deals', label: 'Store Deals & Banners', icon: Flame },
                { id: 'branding', label: 'Branding & Site Copy', icon: Globe },
                { id: 'quotes', label: 'Proposals & Quotes', icon: FileText, count: quotations.length },
                { id: 'orders', label: 'Production Orders', icon: ShoppingBag, count: orders.length },
                { id: 'inquiries', label: 'Consultations', icon: MessageSquare, count: inquiries.length },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-white text-purple-900 font-bold' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: HARDWARE CATALOG */}
              {activeTab === 'catalog' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Filter by name, brand, SKU or description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSeedCatalog}
                        disabled={isSyncing}
                        className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center gap-1.5 transition-colors"
                        title="Re-seed initial catalog from local manifest into Cloud Firestore"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Seed Firestore</span>
                      </button>

                      <button
                        onClick={() => setIsCreatingProduct(true)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/60"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Product</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
                    {['all', 'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'cooler', 'case', 'psu'].map(
                      (cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg uppercase whitespace-nowrap transition-colors border ${
                            selectedCategory === cat
                              ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold'
                              : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>

                  {/* Products Table */}
                  <div className="rounded-2xl border border-zinc-800/80 bg-[#07070d] overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                          <th className="p-3">Product Name & Description</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Price (INR)</th>
                          <th className="p-3">Specs / TDP</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {filteredProducts.map((prod) => {
                          const isEditingPrice = inlinePriceId === prod.id;
                          const isEditingDesc = inlineDescId === prod.id;

                          return (
                            <tr key={prod.id} className="hover:bg-zinc-900/40 transition-colors">
                              {/* Name & Description */}
                              <td className="p-3 max-w-xs">
                                <div className="font-sans font-bold text-white text-xs">{prod.name}</div>
                                <div className="text-[11px] text-zinc-500 font-mono">
                                  {prod.brand} · SKU: {prod.sku}
                                </div>
                                {isEditingDesc ? (
                                  <div className="mt-1 flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={inlineDescVal}
                                      onChange={(e) => setInlineDescVal(e.target.value)}
                                      className="w-full px-2 py-0.5 bg-zinc-950 border border-purple-500 rounded text-xs text-white font-sans"
                                    />
                                    <button
                                      onClick={() => handleSaveInlineDesc(prod)}
                                      className="p-1 bg-purple-600 text-white rounded hover:bg-purple-500"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setInlineDescId(null)}
                                      className="p-1 bg-zinc-800 text-zinc-400 rounded hover:text-white"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      setInlineDescId(prod.id);
                                      setInlineDescVal(prod.description);
                                    }}
                                    className="text-[11px] text-zinc-400 line-clamp-1 cursor-pointer hover:text-purple-300 transition-colors mt-0.5"
                                    title="Click to quickly edit description"
                                  >
                                    {prod.description} ✎
                                  </div>
                                )}
                              </td>

                              {/* Category */}
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-zinc-900 text-purple-300 border border-zinc-800 text-[10px] uppercase font-bold">
                                  {prod.category}
                                </span>
                              </td>

                              {/* Price */}
                              <td className="p-3">
                                {isEditingPrice ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-zinc-400">₹</span>
                                    <input
                                      type="number"
                                      value={inlinePriceVal}
                                      onChange={(e) => setInlinePriceVal(Number(e.target.value))}
                                      className="w-24 px-1.5 py-0.5 bg-zinc-950 border border-purple-500 rounded text-white text-xs font-mono font-bold"
                                    />
                                    <button
                                      onClick={() => handleSaveInlinePrice(prod)}
                                      className="p-1 bg-purple-600 text-white rounded hover:bg-purple-500"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setInlinePriceId(null)}
                                      className="p-1 bg-zinc-800 text-zinc-400 rounded hover:text-white"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      setInlinePriceId(prod.id);
                                      setInlinePriceVal(prod.price);
                                    }}
                                    className="font-extrabold text-white text-xs cursor-pointer hover:text-purple-300 transition-colors inline-flex items-center gap-1 group"
                                    title="Click to edit price"
                                  >
                                    <span>₹{prod.price.toLocaleString('en-IN')}</span>
                                    <Edit className="w-3 h-3 text-zinc-600 group-hover:text-purple-400" />
                                  </div>
                                )}
                              </td>

                              {/* Specs / TDP */}
                              <td className="p-3 text-zinc-400">
                                <div>{prod.wattage}W TDP</div>
                                <div className="text-[10px] text-zinc-500">
                                  {prod.warrantyYears}yr warranty
                                </div>
                              </td>

                              {/* Stock status */}
                              <td className="p-3">
                                <button
                                  onClick={() => handleToggleStock(prod)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                    prod.inStock
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-red-950 text-red-300 border border-red-800'
                                  }`}
                                  title="Click to toggle availability"
                                >
                                  {prod.inStock ? 'IN STOCK' : 'DEACTIVATED'}
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingProduct(prod)}
                                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                                    title="Full Edit Details"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod)}
                                    className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 transition-colors"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: PRE-BUILT PCS */}
              {activeTab === 'prebuilts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Pre-Built Flagship Computers</h4>
                      <p className="text-xs text-zinc-400">
                        Adjust names, prices, hardware allocations, and descriptions for ready-made systems.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsCreatingPrebuilt(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Pre-Built Rig</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prebuilts.map((pc) => (
                      <div
                        key={pc.id}
                        className="p-4 rounded-2xl border border-zinc-800 bg-[#0a0a12] flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                              {pc.tier.toUpperCase()} TIER
                            </span>
                            <span className="text-base font-black font-mono text-white">
                              ₹{pc.basePrice.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <h5 className="text-sm font-extrabold text-white">{pc.name}</h5>
                          <p className="text-xs text-purple-400 font-mono">{pc.tagline}</p>
                          <p className="text-xs text-zinc-400 leading-snug">{pc.description}</p>

                          <div className="pt-2 border-t border-zinc-900 grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                            <div>CPU: {pc.components.cpu}</div>
                            <div>GPU: {pc.components.gpu}</div>
                            <div>RAM: {pc.components.ram}</div>
                            <div>Storage: {pc.components.storage}</div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              pc.inStock ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {pc.inStock ? '● Active in Store' : '○ Deactivated'}
                          </span>
                          <button
                            onClick={() => setEditingPrebuilt(pc)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit System Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: STORE DEALS & BANNERS */}
              {activeTab === 'deals' && (
                <div className="max-w-2xl space-y-5 text-xs">
                  <div className="pb-2 border-b border-zinc-800">
                    <h4 className="text-sm font-extrabold text-white">Promotional Campaigns & Banners</h4>
                    <p className="text-xs text-zinc-400">
                      Edit festival headline text, promotional discounts, and limited-period deals shown across the storefront.
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                      <div className="flex items-center gap-2 text-purple-400 font-bold font-mono">
                        <Flame className="w-4 h-4 text-red-400" />
                        <span>Festival Campaign Banner (Diwali & Sales)</span>
                      </div>

                      <div>
                        <label className="block text-zinc-400 mb-1 font-mono">Banner Headline Text</label>
                        <input
                          type="text"
                          value={settingsForm.diwaliBannerHeadline}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, diwaliBannerHeadline: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 mb-1 font-mono">Banner Subtext & Delivery Guarantees</label>
                        <textarea
                          rows={2}
                          value={settingsForm.diwaliBannerSubtext}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, diwaliBannerSubtext: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                      <div className="flex items-center gap-2 text-blue-400 font-bold font-mono">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span>Shark-X & Special Bundle Offer</span>
                      </div>

                      <div>
                        <label className="block text-zinc-400 mb-1 font-mono">Shark-X Bundle Description</label>
                        <input
                          type="text"
                          value={settingsForm.sharkXOfferText}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, sharkXOfferText: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/60"
                    >
                      Publish Deal & Banner Changes
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: BRANDING & SITE COPY */}
              {activeTab === 'branding' && (
                <div className="max-w-2xl space-y-5 text-xs">
                  <div className="pb-2 border-b border-zinc-800">
                    <h4 className="text-sm font-extrabold text-white">Site Branding, Headlines & Business Parameters</h4>
                    <p className="text-xs text-zinc-400">
                      Changes here update the homepage headlines, tagline, footer coordinates, contact numbers, and commercial tax rate.
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                      <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                        Homepage Hero Copy
                      </span>

                      <div>
                        <label className="block text-zinc-400 mb-1 font-mono">Hero Main Headline</label>
                        <input
                          type="text"
                          value={settingsForm.heroHeadline}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 mb-1 font-mono">Brand Tagline</label>
                        <input
                          type="text"
                          value={settingsForm.heroTagline}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroTagline: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 mb-1 font-mono">Engineering Subtext</label>
                        <textarea
                          rows={2}
                          value={settingsForm.heroSubtext}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroSubtext: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                      <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                        Business & Engineering Coordinates
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-400 mb-1 font-mono">Official Contact Email</label>
                          <input
                            type="email"
                            value={settingsForm.contactEmail}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, contactEmail: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 mb-1 font-mono">Direct Support Hotline</label>
                          <input
                            type="text"
                            value={settingsForm.contactPhone}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, contactPhone: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-400 mb-1 font-mono">GSTIN Tax Registration</label>
                          <input
                            type="text"
                            value={settingsForm.gstNumber}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, gstNumber: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 mb-1 font-mono">Free Insured Shipping Min (INR)</label>
                          <input
                            type="number"
                            value={settingsForm.freeShippingThreshold}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                freeShippingThreshold: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-400 mb-1 font-mono">Headquarters / Assembly Facility Address</label>
                        <input
                          type="text"
                          value={settingsForm.address}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, address: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#09090f] border border-zinc-800 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/60"
                    >
                      Save & Commit Site Settings
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: QUOTATIONS */}
              {activeTab === 'quotes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs text-zinc-400 font-mono">
                      Logged Customer Quotations ({quotations.length})
                    </span>
                  </div>

                  <div className="space-y-3">
                    {quotations.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-purple-400 font-bold">{q.quoteNumber}</span>
                            <h5 className="font-semibold text-white mt-0.5">
                              {q.customerName} ({q.city})
                            </h5>
                            <span className="text-zinc-500 text-[11px]">
                              {q.customerEmail} · {q.customerPhone}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-base font-extrabold text-white block">
                              ₹{q.total.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Valid: {q.validUntil}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-900">
                          <span className="text-[11px] text-zinc-500 mr-1 font-mono">Status:</span>
                          {(['draft', 'submitted', 'contacted', 'approved', 'expired'] as const).map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() => onUpdateQuoteStatus(q.id, st)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                                  q.status === st
                                    ? 'bg-purple-600 text-white font-bold'
                                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs text-zinc-400 font-mono">
                      Orders in Production Pipeline ({orders.length})
                    </span>
                  </div>

                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-purple-400 font-bold">{ord.orderNumber}</span>
                            <h5 className="font-semibold text-white mt-0.5">
                              {ord.customer.name} ({ord.customer.city})
                            </h5>
                            <span className="text-zinc-400 text-[11px]">
                              {ord.customer.phone} · Method: {ord.paymentMethod} ({ord.paymentStatus})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-base font-extrabold text-white block">
                              ₹{ord.total.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Stage: {ord.orderStatus.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 pt-2 border-t border-zinc-900 overflow-x-auto">
                          <span className="text-[11px] text-zinc-500 mr-1 font-mono">Stage:</span>
                          {(['received', 'assembly', 'testing', 'shipped', 'delivered'] as const).map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() => onUpdateOrderStatus(ord.id, st)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                                  ord.orderStatus === st
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: INQUIRIES */}
              {activeTab === 'inquiries' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs text-zinc-400 font-mono">
                      Customer Consultation Inquiries ({inquiries.length})
                    </span>
                  </div>

                  {inquiries.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs font-mono">
                      No pending customer consultation inquiries.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-bold text-white">{inq.name}</h5>
                              <span className="text-zinc-400 font-mono text-[11px]">
                                {inq.email} · {inq.phone}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-purple-400 uppercase">
                              Budget: {inq.budgetRange}
                            </span>
                          </div>
                          <p className="text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                            "{inq.message}"
                          </p>
                          {onUpdateInquiryStatus && (
                            <div className="flex items-center gap-1.5 pt-1">
                              {(['new', 'contacted', 'resolved'] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => onUpdateInquiryStatus(inq.id, st)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                                    inq.status === st
                                      ? 'bg-purple-600 text-white font-bold'
                                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: CREATE HARDWARE COMPONENT */}
        {isCreatingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-xl w-full bg-[#0e0e16] border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="font-bold text-white text-base">Add New Hardware Component</h4>
                <button
                  onClick={() => setIsCreatingProduct(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNewProduct} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Category *</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, category: e.target.value as ComponentCategory })
                      }
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    >
                      {['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'cooler', 'case', 'psu', 'accessories'].map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat.toUpperCase()}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">SKU / Model Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BR-RTX-5080-16G"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NVIDIA GeForce RTX 5080 16GB GDDR7"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Brand</label>
                    <input
                      type="text"
                      placeholder="ASUS / MSI"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Price (INR) *</label>
                    <input
                      type="number"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Wattage (TDP W)</label>
                    <input
                      type="number"
                      value={newProduct.wattage}
                      onChange={(e) => setNewProduct({ ...newProduct, wattage: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Description / Key Features</label>
                  <textarea
                    rows={2}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Component thermal details, clock speeds, and clearance..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsCreatingProduct(false)}
                    className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded"
                  >
                    Save Component
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT HARDWARE COMPONENT */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-xl w-full bg-[#0e0e16] border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="font-bold text-white text-base">Edit {editingProduct.name}</h4>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Component Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">SKU</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.sku}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Brand</label>
                    <input
                      type="text"
                      value={editingProduct.brand}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Power Draw (W)</label>
                    <input
                      type="number"
                      value={editingProduct.wattage}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, wattage: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Warranty (Years)</label>
                    <input
                      type="number"
                      value={editingProduct.warrantyYears}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, warrantyYears: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded"
                  >
                    Commit Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT PRE-BUILT PC */}
        {editingPrebuilt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-xl w-full bg-[#0e0e16] border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="font-bold text-white text-base">Edit {editingPrebuilt.name}</h4>
                <button onClick={() => setEditingPrebuilt(null)} className="text-zinc-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePrebuilt} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">System Name</label>
                  <input
                    type="text"
                    required
                    value={editingPrebuilt.name}
                    onChange={(e) => setEditingPrebuilt({ ...editingPrebuilt, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={editingPrebuilt.tagline}
                      onChange={(e) => setEditingPrebuilt({ ...editingPrebuilt, tagline: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Base Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={editingPrebuilt.basePrice}
                      onChange={(e) =>
                        setEditingPrebuilt({ ...editingPrebuilt, basePrice: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">CPU Allocation</label>
                    <input
                      type="text"
                      value={editingPrebuilt.components.cpu}
                      onChange={(e) =>
                        setEditingPrebuilt({
                          ...editingPrebuilt,
                          components: { ...editingPrebuilt.components, cpu: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">GPU Allocation</label>
                    <input
                      type="text"
                      value={editingPrebuilt.components.gpu}
                      onChange={(e) =>
                        setEditingPrebuilt({
                          ...editingPrebuilt,
                          components: { ...editingPrebuilt.components, gpu: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingPrebuilt.description}
                    onChange={(e) =>
                      setEditingPrebuilt({ ...editingPrebuilt, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingPrebuilt(null)}
                    className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded"
                  >
                    Commit Pre-Built Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE PRE-BUILT PC */}
        {isCreatingPrebuilt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-xl w-full bg-[#0e0e16] border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="font-bold text-white text-base">Add New Pre-Built System</h4>
                <button
                  onClick={() => setIsCreatingPrebuilt(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePrebuilt} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">System Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raven Hyperion Apex"
                    value={newPrebuilt.name}
                    onChange={(e) => setNewPrebuilt({ ...newPrebuilt, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Tagline</label>
                    <input
                      type="text"
                      placeholder="Ultimate 4K Dominator"
                      value={newPrebuilt.tagline}
                      onChange={(e) => setNewPrebuilt({ ...newPrebuilt, tagline: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Base Price (INR) *</label>
                    <input
                      type="number"
                      required
                      value={newPrebuilt.basePrice}
                      onChange={(e) => setNewPrebuilt({ ...newPrebuilt, basePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newPrebuilt.description}
                    onChange={(e) => setNewPrebuilt({ ...newPrebuilt, description: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPrebuilt(false)}
                    className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded"
                  >
                    Save Pre-Built System
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
