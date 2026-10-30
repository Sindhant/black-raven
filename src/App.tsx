import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { Configurator } from './components/Configurator';
import { PrebuiltCatalog } from './components/PrebuiltCatalog';
import { BudgetWizard } from './components/BudgetWizard';
import { QuotationModal } from './components/QuotationModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminPortal } from './components/AdminPortal';
import { TrustAndEngineering } from './components/TrustAndEngineering';
import { HardwareStore } from './components/HardwareStore';
import { Footer } from './components/Footer';
import { INITIAL_HARDWARE_CATALOG, PREBUILT_SYSTEMS } from './data/catalog';
import {
  BuildSelection,
  CartItem,
  HardwareItem,
  Order,
  PrebuiltPC,
  Quotation,
  CustomerInquiry,
  SiteSettings,
} from './types';
import {
  seedInitialCatalogIfEmpty,
  subscribeToProducts,
  subscribeToQuotations,
  subscribeToOrders,
  subscribeToSettings,
  subscribeToPrebuilts,
  saveQuotationToDb,
  saveOrderToDb,
  saveInquiryToDb,
} from './services/catalogService';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');

  // Hardware catalog loaded from Firestore with fallback to initial curated catalog
  const [catalog, setCatalog] = useState<HardwareItem[]>(INITIAL_HARDWARE_CATALOG);

  // Active Custom 3D Build (pre-loaded with a balanced enthusiast configuration)
  const [customBuild, setCustomBuild] = useState<BuildSelection>({
    cpu: catalog.find((c) => c.id === 'cpu-7800x3d') || null,
    motherboard: catalog.find((c) => c.id === 'mobo-b650-raven') || null,
    gpu: catalog.find((c) => c.id === 'gpu-rtx4070tis') || null,
    ram: catalog.find((c) => c.id === 'ram-corsair-32gb') || null,
    storage: catalog.find((c) => c.id === 'ssd-samsung-990pro-2tb') || null,
    cooler: catalog.find((c) => c.id === 'cooler-raven-360-aio') || null,
    case: catalog.find((c) => c.id === 'case-raven-nexus-atx') || null,
    psu: catalog.find((c) => c.id === 'psu-corsair-rm1000x') || null,
    accessories: catalog.find((c) => c.id === 'acc-crimson-cables') || null,
  });

  const [lightingColor, setLightingColor] = useState<string>('#8b5cf6'); // Electric Violet

  // E-commerce & Business state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([
    {
      id: 'quote-sample-1',
      quoteNumber: 'BR-QUO-2026-9041',
      customerName: 'Aditya Sharma',
      customerEmail: 'aditya.sharma@studios.in',
      customerPhone: '+91 98200 41290',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      items: [
        { category: 'CPU', name: 'AMD Ryzen 7 7800X3D', sku: 'AMD-R7-7800X3D', price: 36999, warrantyYears: 3 },
        { category: 'GPU', name: 'GeForce RTX 4070 Ti Super 16GB', sku: 'GIGABYTE-RTX4070TIS', price: 82999, warrantyYears: 3 },
        { category: 'CASE', name: 'Black Raven Nexus Dual-Chamber', sku: 'RAVEN-NEXUS-ATX', price: 14999, warrantyYears: 3 },
      ],
      subtotal: 134997,
      gstAmount: 24299,
      assemblyFee: 0,
      shippingFee: 0,
      total: 159296,
      createdAt: new Date().toISOString(),
      validUntil: '12 Nov 2026',
      status: 'submitted',
    },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'order-sample-1',
      orderNumber: 'BR-ORD-88194',
      customer: {
        name: 'Vikram Joshi',
        email: 'vikram.j@techlab.org',
        phone: '9845012345',
        address: '14/B, Prestige Technology Park, Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
      },
      items: [
        {
          id: 'prebuilt-shadow-elite',
          type: 'prebuilt',
          title: 'Raven Shadow Elite',
          subtitle: 'AMD Ryzen 7 7800X3D · RTX 4070 Ti Super 16GB · 32GB DDR5',
          price: 169900,
          quantity: 1,
        },
      ],
      subtotal: 169900,
      tax: 30582,
      total: 200482,
      paymentMethod: 'razorpay_test',
      paymentStatus: 'verified',
      orderStatus: 'testing',
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);

  // Pre-Built systems state (fully editable by admin)
  const [prebuilts, setPrebuilts] = useState<PrebuiltPC[]>(PREBUILT_SYSTEMS);

  // Site Branding & Business Parameters (fully editable by admin)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    heroHeadline: 'BUILD YOUR LEGACY.',
    heroTagline: 'Built in Darkness. Engineered to Dominate.',
    heroSubtext:
      'Aerospace-grade thermal engineering, liquid loops, and custom battle stations engineered with zero compromise. Handcrafted in India.',
    contactEmail: 'engineering@blackraven.in',
    contactPhone: '+91 (020) 8920-4100',
    address: 'Level 4, Synergy Cyber Park, Viman Nagar, Pune, Maharashtra 411014',
    gstNumber: '27AABCB1234F1Z8',
    freeShippingThreshold: 50000,
    diwaliBannerHeadline: 'UP TO 55% OFF ON NVME SSDs, DDR5 RAM & RTX HARDWARE',
    diwaliBannerSubtext:
      'Take advantage of special festival discounts on high-performance gaming components. Insured doorstep delivery with full manufacturer warranty across India.',
    sharkXOfferText:
      'Buy Shark-X & get a MasterHub Stream Kit completely free. Limited period festival bundle.',
  });

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Firestore Real-Time Subscriptions & Initialization
  useEffect(() => {
    // 1. Attempt seed if Firestore collection is empty
    seedInitialCatalogIfEmpty();

    // 2. Subscribe to real-time Cloud Firestore updates for products
    const unsubProducts = subscribeToProducts(
      (items) => {
        if (items && items.length > 0) {
          setCatalog(items);
        }
      },
      (err) => {
        console.warn('Real-time products subscription info:', err.message);
      }
    );

    // 3. Subscribe to real-time quotations
    const unsubQuotes = subscribeToQuotations(
      (quotes) => {
        if (quotes && quotes.length > 0) {
          setQuotations(quotes);
        }
      },
      (err) => {
        console.warn('Real-time quotations listener note:', err.message);
      }
    );

    // 4. Subscribe to real-time orders
    const unsubOrders = subscribeToOrders(
      (ordersList) => {
        if (ordersList && ordersList.length > 0) {
          setOrders(ordersList);
        }
      },
      (err) => {
        console.warn('Real-time orders listener note:', err.message);
      }
    );

    // 5. Subscribe to real-time site settings
    const unsubSettings = subscribeToSettings((settings) => {
      if (settings) {
        setSiteSettings(settings);
      }
    });

    // 6. Subscribe to real-time prebuilts
    const unsubPrebuilts = subscribeToPrebuilts((items) => {
      if (items && items.length > 0) {
        setPrebuilts(items);
      }
    });

    return () => {
      unsubProducts();
      unsubQuotes();
      unsubOrders();
      unsubSettings();
      unsubPrebuilts();
    };
  }, []);

  // Sync custom build parts whenever catalog updates (e.g. price change)
  useEffect(() => {
    setCustomBuild((prev) => {
      const updated: BuildSelection = { ...prev };
      (Object.keys(updated) as (keyof BuildSelection)[]).forEach((cat) => {
        const currentItem = updated[cat];
        if (currentItem) {
          const freshItem = catalog.find((c) => c.id === currentItem.id);
          if (freshItem) {
            updated[cat] = freshItem;
          }
        }
      });
      return updated;
    });
  }, [catalog]);

  // Cart Handlers
  const handleAddPrebuiltToCart = (pc: PrebuiltPC) => {
    const existingIndex = cartItems.findIndex((it) => it.id === pc.id);
    if (existingIndex >= 0) {
      setCartItems((prev) =>
        prev.map((it, idx) => (idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it))
      );
    } else {
      const newItem: CartItem = {
        id: pc.id,
        type: 'prebuilt',
        title: pc.name,
        subtitle: `${pc.components.cpu} · ${pc.components.gpu}`,
        price: pc.basePrice,
        quantity: 1,
        prebuiltDetails: pc,
      };
      setCartItems((prev) => [...prev, newItem]);
    }
    setIsCartOpen(true);
  };

  const handleAddToCartFromStore = (item: CartItem) => {
    const existingIndex = cartItems.findIndex((it) => it.id === item.id);
    if (existingIndex >= 0) {
      setCartItems((prev) =>
        prev.map((it, idx) => (idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it))
      );
    } else {
      setCartItems((prev) => [...prev, item]);
    }
    setIsCartOpen(true);
  };

  const handleApplyComponentToBuilder = (item: HardwareItem) => {
    setCustomBuild((prev) => ({
      ...prev,
      [item.category]: item,
    }));
    setActiveTab('builder');
  };

  const handleAddCustomBuildToCart = (build: BuildSelection, color: string) => {
    const selectedList = Object.entries(build)
      .filter(([_, item]) => item !== null)
      .map(([cat, item]) => ({
        category: cat.toUpperCase(),
        name: item!.name,
        price: item!.price,
      }));

    const buildSubtotal = selectedList.reduce((acc, it) => acc + it.price, 0);

    const customItem: CartItem = {
      id: `custom-pc-${Date.now()}`,
      type: 'custom',
      title: 'Black Raven Custom Engineered Rig',
      subtitle: `${build.cpu?.name || 'High-Performance CPU'} + ${build.gpu?.name || 'Flagship GPU'}`,
      price: buildSubtotal,
      quantity: 1,
      customDetails: {
        partsSummary: selectedList,
        lightingColor: color,
      },
    };

    setCartItems((prev) => [...prev, customItem]);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePlaceOrder = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    try {
      await saveOrderToDb(newOrder);
    } catch (err) {
      console.warn('Order persisted locally; Firestore sync status:', err);
    }
  };

  const handleSubmitQuotation = async (newQuote: Quotation) => {
    setQuotations((prev) => [newQuote, ...prev]);
    try {
      await saveQuotationToDb(newQuote);
    } catch (err) {
      console.warn('Quotation persisted locally; Firestore sync status:', err);
    }
  };

  const handleSubmitInquiry = async (inquiry: CustomerInquiry) => {
    setInquiries((prev) => [inquiry, ...prev]);
    try {
      await saveInquiryToDb(inquiry);
    } catch (err) {
      console.warn('Inquiry saved locally; Firestore sync status:', err);
    }
  };

  // Prebuilt selection that transfers into Configurator
  const handleLoadPrebuiltIntoBuilder = (pc: PrebuiltPC) => {
    const newBuild: BuildSelection = {
      cpu: catalog.find((c) => c.category === 'cpu' && pc.components.cpu.includes(c.name.split(' ')[0])) || customBuild.cpu,
      motherboard: catalog.find((c) => c.category === 'motherboard') || customBuild.motherboard,
      gpu: catalog.find((c) => c.category === 'gpu' && pc.components.gpu.includes(c.brand)) || customBuild.gpu,
      ram: catalog.find((c) => c.category === 'ram') || customBuild.ram,
      storage: catalog.find((c) => c.category === 'storage') || customBuild.storage,
      cooler: catalog.find((c) => c.category === 'cooler') || customBuild.cooler,
      case: catalog.find((c) => c.category === 'case') || customBuild.case,
      psu: catalog.find((c) => c.category === 'psu') || customBuild.psu,
      accessories: customBuild.accessories,
    };
    setCustomBuild(newBuild);
    setLightingColor(pc.accentRgb || '#8b5cf6');
    setActiveTab('builder');
  };

  const handleUpdateQuoteStatus = (id: string, status: Quotation['status']) => {
    setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  };

  const handleUpdateOrderStatus = (id: string, status: Order['orderStatus']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, orderStatus: status } : o)));
  };

  // Master Admin Mutation Handlers
  const handleUpdateProduct = (product: HardwareItem) => {
    setCatalog((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  };

  const handleCreateProduct = (product: HardwareItem) => {
    setCatalog((prev) => [product, ...prev]);
  };

  const handleDeleteProduct = (id: string) => {
    setCatalog((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePrebuilt = (pc: PrebuiltPC) => {
    setPrebuilts((prev) => prev.map((p) => (p.id === pc.id ? pc : p)));
  };

  const handleCreatePrebuilt = (pc: PrebuiltPC) => {
    setPrebuilts((prev) => [pc, ...prev]);
  };

  const handleDeletePrebuilt = (id: string) => {
    setPrebuilts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateSettings = (settings: SiteSettings) => {
    setSiteSettings(settings);
  };

  const handleUpdateInquiryStatus = (id: string, status: CustomerInquiry['status']) => {
    setInquiries((prev) => prev.map((inq) => (inq.id === id ? { ...inq, status } : inq)));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060608] text-zinc-100">
      {/* Strict 3-Zone Navigation Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
        openCart={() => setIsCartOpen(true)}
        openAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main App Body */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <HeroSection
              onStartBuild={() => setActiveTab('builder')}
              onExplorePrebuilts={() => setActiveTab('prebuilts')}
              onOpenWizard={() => setActiveTab('wizard')}
              settings={siteSettings}
            />

            {/* Featured Showcase: Official Hardware Store & Hot Deals */}
            <HardwareStore
              catalog={catalog}
              onAddToCart={handleAddToCartFromStore}
              onOpenBuilder={() => setActiveTab('builder')}
              onApplyComponentToBuilder={handleApplyComponentToBuilder}
              settings={siteSettings}
            />

            {/* Featured Section 1: Ready-Made PCs */}
            <PrebuiltCatalog
              onSelectPrebuilt={handleLoadPrebuiltIntoBuilder}
              onAddToCart={handleAddPrebuiltToCart}
              prebuilts={prebuilts}
            />

            {/* Featured Section 2: Budget & Workload Wizard */}
            <BudgetWizard
              onLoadBuild={handleLoadPrebuiltIntoBuilder}
              onAddToCart={handleAddPrebuiltToCart}
              prebuilts={prebuilts}
            />

            {/* Featured Section 3: Engineering Standards & FAQs */}
            <TrustAndEngineering onSubmitInquiry={handleSubmitInquiry} />
          </>
        )}

        {activeTab === 'store' && (
          <HardwareStore
            catalog={catalog}
            onAddToCart={handleAddToCartFromStore}
            onOpenBuilder={() => setActiveTab('builder')}
            onApplyComponentToBuilder={handleApplyComponentToBuilder}
            settings={siteSettings}
          />
        )}

        {activeTab === 'builder' && (
          <Configurator
            customBuild={customBuild}
            setCustomBuild={setCustomBuild}
            lightingColor={lightingColor}
            setLightingColor={setLightingColor}
            onOpenQuotationModal={() => setIsQuotationModalOpen(true)}
            onAddToCart={handleAddCustomBuildToCart}
            catalog={catalog}
          />
        )}

        {activeTab === 'prebuilts' && (
          <PrebuiltCatalog
            onSelectPrebuilt={handleLoadPrebuiltIntoBuilder}
            onAddToCart={handleAddPrebuiltToCart}
            prebuilts={prebuilts}
          />
        )}

        {activeTab === 'wizard' && (
          <BudgetWizard
            onLoadBuild={handleLoadPrebuiltIntoBuilder}
            onAddToCart={handleAddPrebuiltToCart}
            prebuilts={prebuilts}
          />
        )}

        {activeTab === 'quotations' && (
          <div className="py-12 bg-[#060608]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-xl mx-auto mb-10">
                <span className="text-xs font-mono uppercase tracking-widest text-purple-400">
                  BLACK RAVEN COMMERCIAL PORTAL
                </span>
                <h2 className="text-3xl font-extrabold text-white mt-1">Official Build Proposals</h2>
                <p className="text-xs text-zinc-400 mt-2">
                  Create itemized, GST-compliant quotations with 14-day price lock and official engineering sign-off.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setIsQuotationModalOpen(true)}
                    className="px-6 py-2.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg shadow-purple-950/40"
                  >
                    Generate Proposal for Current Configuration
                  </button>
                </div>
              </div>

              {/* Existing Proposals List */}
              <div className="space-y-4">
                <span className="text-xs font-mono text-zinc-400 uppercase">Logged Build Proposals</span>
                <div className="space-y-3">
                  {quotations.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-[#0e0e16] border border-zinc-800 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-purple-400 font-bold">{q.quoteNumber}</span>
                          <span className="text-zinc-600">·</span>
                          <span className="text-zinc-300 font-semibold">{q.customerName}</span>
                          <span className="text-zinc-600">·</span>
                          <span className="text-zinc-500 font-mono text-[11px]">{q.city || 'Pan-India'}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          {q.items.length} Custom Components · Valid Until: {q.validUntil}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-base font-extrabold text-white">
                          ₹{q.total.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => setIsQuotationModalOpen(true)}
                          className="px-3 py-1.5 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded border border-zinc-700"
                        >
                          View / Print
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'engineering' && (
          <TrustAndEngineering onSubmitInquiry={handleSubmitInquiry} />
        )}
      </main>

      {/* Global Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onPlaceOrder={handlePlaceOrder}
      />

      {isQuotationModalOpen && (
        <QuotationModal
          customBuild={customBuild}
          lightingColor={lightingColor}
          onClose={() => setIsQuotationModalOpen(false)}
          onSubmitQuotation={handleSubmitQuotation}
        />
      )}

      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        catalog={catalog}
        onUpdateProduct={handleUpdateProduct}
        onCreateProduct={handleCreateProduct}
        onDeleteProduct={handleDeleteProduct}
        prebuilts={prebuilts}
        onUpdatePrebuilt={handleUpdatePrebuilt}
        onCreatePrebuilt={handleCreatePrebuilt}
        onDeletePrebuilt={handleDeletePrebuilt}
        siteSettings={siteSettings}
        onUpdateSettings={handleUpdateSettings}
        quotations={quotations}
        onUpdateQuoteStatus={handleUpdateQuoteStatus}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        inquiries={inquiries}
        onUpdateInquiryStatus={handleUpdateInquiryStatus}
      />

      {/* Footer */}
      <Footer onNavigate={(tab) => setActiveTab(tab)} />
    </div>
  );
}
