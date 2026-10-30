import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2, CreditCard, Building2, Truck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onPlaceOrder: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
}) => {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmed'>('cart');
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'razorpay_test' | 'bank_transfer' | 'cod'>('razorpay_test');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handleStartCheckout = () => {
    setCheckoutStep('shipping');
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.pincode) return;
    setCheckoutStep('payment');
  };

  const handleCompleteOrder = () => {
    const orderNumber = `BR-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      customer,
      items: cartItems,
      subtotal,
      tax,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'razorpay_test' ? 'verified' : 'pending',
      orderStatus: 'received',
      createdAt: new Date().toISOString(),
    };

    onPlaceOrder(newOrder);
    setConfirmedOrder(newOrder);
    setCheckoutStep('confirmed');

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ef4444', '#a855f7', '#ffffff'],
      });
    } catch (e) {
      // safe fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0c0c14] border-l border-zinc-800 text-zinc-100 flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
              <h3 className="font-extrabold text-base tracking-wide uppercase">
                {checkoutStep === 'cart' && 'Your Shopping Bag'}
                {checkoutStep === 'shipping' && 'Delivery Coordinates'}
                {checkoutStep === 'payment' && 'Payment Architecture'}
                {checkoutStep === 'confirmed' && 'Order Received'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content based on Step */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {checkoutStep === 'cart' && (
              <>
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto" />
                    <p className="text-sm text-zinc-400">Your shopping bag is currently empty.</p>
                    <p className="text-xs text-zinc-600">Configure a custom PC or select a factory-tuned build to proceed.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 space-y-1">
                          <span className="text-[10px] font-mono text-purple-400 uppercase">
                            {item.type === 'custom'
                              ? 'Custom 3D Build'
                              : item.type === 'component'
                              ? 'Hardware Component'
                              : 'Prebuilt System'}
                          </span>
                          <h4 className="text-sm font-semibold text-white leading-tight">{item.title}</h4>
                          <p className="text-xs text-zinc-400 leading-snug">{item.subtitle}</p>

                          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                            <span className="font-extrabold text-zinc-100">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                            <span className="text-zinc-600">·</span>
                            <span className="text-zinc-500">Qty: {item.quantity}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between h-full space-y-2">
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-zinc-500 hover:text-red-400 p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex items-center border border-zinc-800 rounded bg-zinc-900 text-xs font-mono">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="px-2 py-0.5 text-zinc-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-1.5">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="px-2 py-0.5 text-zinc-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {checkoutStep === 'shipping' && (
              <form id="shipping-form" onSubmit={handleProceedToPayment} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none"
                    placeholder="Raghav Verma"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none"
                      placeholder="raghav@domain.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">10-Digit Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Street Address & Landmark *</label>
                  <textarea
                    required
                    rows={2}
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none resize-none"
                    placeholder="Flat 402, Raven Towers, Cyber City"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none"
                      placeholder="Pune"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={customer.pincode}
                      onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none font-mono"
                      placeholder="411001"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Dual-wall wooden crate freight with ₹5,00,000 transit insurance included.</span>
                </div>
              </form>
            )}

            {checkoutStep === 'payment' && (
              <div className="space-y-4 text-xs">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Select Settlement Method
                </span>

                {/* Option 1: Razorpay India */}
                <div
                  onClick={() => setPaymentMethod('razorpay_test')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'razorpay_test'
                      ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-white">Razorpay (UPI / NetBanking / Cards)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      Test Verification
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    India leading payment infrastructure with instant server-side verification.
                  </p>
                </div>

                {/* Option 2: Direct Bank Transfer */}
                <div
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-white">Direct RTGS / NEFT Transfer</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">0% Surcharge</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    HDFC Bank Current A/C: 502000891234 · IFSC: HDFC0001234 · Account Name: Black Raven Systems
                  </p>
                </div>

                {/* Option 3: COD with Token */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-white">Cash on Delivery (Advance Token)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Requires phone verification and ₹5,000 commitment token before custom assembly begins.
                  </p>
                </div>
              </div>
            )}

            {checkoutStep === 'confirmed' && confirmedOrder && (
              <div className="text-center py-6 space-y-4">
                <img
                  src={`${import.meta.env.BASE_URL}assets/aistudio/image_999d9928.png`}
                  alt="BLACK RAVEN"
                  className="h-12 w-auto object-contain mx-auto filter drop-shadow-[0_0_18px_rgba(139,92,246,0.5)] mb-1"
                />
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-xl font-bold text-white">Order Confirmed</h4>
                <p className="text-xs text-zinc-400 font-mono">
                  Order Reference: <span className="text-purple-400 font-bold">{confirmedOrder.orderNumber}</span>
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Your machine has been scheduled for component staging. Our build logs and 72-hour thermal charts will be delivered to <strong className="text-white">{confirmedOrder.customer.email}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Footer & Actions */}
          <div className="p-5 border-t border-zinc-800 bg-[#09090f] space-y-3">
            {checkoutStep !== 'confirmed' && (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>GST (18%)</span>
                  <span className="font-mono tabular-nums">₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Insured Transit</span>
                  <span className="text-emerald-400 font-mono">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-800">
                  <span>Grand Total</span>
                  <span className="font-mono text-purple-400 text-lg tabular-nums">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <div>
              {checkoutStep === 'cart' && (
                <button
                  disabled={cartItems.length === 0}
                  onClick={handleStartCheckout}
                  className="w-full py-3 px-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40"
                >
                  <span>Proceed to Delivery Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {checkoutStep === 'shipping' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className="py-2.5 px-3 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    form="shipping-form"
                    type="submit"
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {checkoutStep === 'payment' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCheckoutStep('shipping')}
                    className="py-2.5 px-3 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCompleteOrder}
                    className="flex-1 py-3 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Confirm Order (₹{total.toLocaleString('en-IN')})</span>
                  </button>
                </div>
              )}

              {checkoutStep === 'confirmed' && (
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                >
                  Return to Black Raven Experience
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
