import React, { useState } from 'react';
import { BuildSelection, Quotation } from '../types';
import { Printer, Download, Send, CheckCircle2, X } from 'lucide-react';

interface QuotationModalProps {
  customBuild: BuildSelection;
  lightingColor: string;
  onClose: () => void;
  onSubmitQuotation: (quote: Quotation) => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  customBuild,
  lightingColor,
  onClose,
  onSubmitQuotation,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Generate unique quotation ID
  const quoteNumber = `BR-QUO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const creationDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate items
  const items = Object.entries(customBuild)
    .filter(([_, item]) => item !== null)
    .map(([cat, item]) => ({
      category: cat.toUpperCase(),
      name: item!.name,
      sku: item!.sku,
      price: item!.price,
      warrantyYears: item!.warrantyYears,
    }));

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const assemblyFee = 0; // Promoted free
  const shippingFee = 0; // Free pan-India delivery
  const total = subtotal + gstAmount + assemblyFee + shippingFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) return;

    const quoteRecord: Quotation = {
      id: `quote-${Date.now()}`,
      quoteNumber,
      customerName,
      customerEmail,
      customerPhone,
      city,
      state,
      pincode,
      items,
      subtotal,
      gstAmount,
      assemblyFee,
      shippingFee,
      total,
      createdAt: new Date().toISOString(),
      validUntil,
      notes: notes || undefined,
      status: 'submitted',
    };

    onSubmitQuotation(quoteRecord);
    setIsSubmitted(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:text-black">
      <div className="relative w-full max-w-4xl bg-[#0d0d15] print:bg-white text-zinc-100 print:text-black rounded-2xl print:rounded-none border border-zinc-700 print:border-none shadow-2xl p-6 sm:p-9 space-y-6">
        {/* Close Button (Hidden on Print) */}
        <button
          onClick={onClose}
          className="print:hidden absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-12 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            <h3 className="text-2xl font-extrabold text-white">Quotation Submitted to Engineering Team</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Your official Black Raven Build Proposal <span className="font-mono text-purple-400 font-bold">{quoteNumber}</span> has been logged. A senior hardware specialist will review your thermal specs and contact you within 2 business hours.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-purple-400" />
                <span>Print Official PDF</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Proposal Printable Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-zinc-800 print:border-zinc-300">
              <div>
                <img
                  src={`${import.meta.env.BASE_URL}assets/aistudio/image_999d9928.png`}
                  alt="BLACK RAVEN"
                  className="h-9 w-auto object-contain mb-2 print:invert"
                />
                <p className="text-xs text-zinc-400 print:text-zinc-600 mt-0.5">
                  Built in Darkness. Engineered to Dominate.
                </p>
                <p className="text-[11px] font-mono text-zinc-500 print:text-zinc-500 mt-1">
                  GSTIN: 27AABCB1234F1Z8 · Support: engineering@blackraven.in
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs">
                <span className="inline-block px-2.5 py-1 bg-purple-950/60 print:bg-purple-100 text-purple-300 print:text-purple-800 border border-purple-800/40 rounded font-bold text-[11px] mb-1">
                  OFFICIAL BUILD PROPOSAL
                </span>
                <p className="font-bold text-white print:text-black">{quoteNumber}</p>
                <p className="text-zinc-400 print:text-zinc-600 text-[11px]">Date: {creationDate}</p>
                <p className="text-zinc-400 print:text-zinc-600 text-[11px]">Valid Until: {validUntil}</p>
              </div>
            </div>

            {/* Customer Information Form (Interactive in web, formatted text in print) */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="p-4 rounded-xl bg-zinc-950/60 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 print:text-purple-700 mb-3">
                  Recipient & Delivery Specifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-zinc-400 print:text-zinc-600 mb-1">Customer / Organization *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 print:bg-white border border-zinc-700 print:border-zinc-300 rounded text-zinc-100 print:text-black focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 print:text-zinc-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="client@domain.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 print:bg-white border border-zinc-700 print:border-zinc-300 rounded text-zinc-100 print:text-black focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 print:text-zinc-600 mb-1">Phone Number (+91) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 print:bg-white border border-zinc-700 print:border-zinc-300 rounded text-zinc-100 print:text-black focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 print:text-zinc-600 mb-1">Destination City</label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 print:bg-white border border-zinc-700 print:border-zinc-300 rounded text-zinc-100 print:text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 print:text-zinc-600 mb-1">State / Province</label>
                    <input
                      type="text"
                      placeholder="Maharashtra"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 print:bg-white border border-zinc-700 print:border-zinc-300 rounded text-zinc-100 print:text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 print:text-zinc-600 mb-1">GSTIN (Optional for B2B Input Tax Credit)</label>
                    <input
                      type="text"
                      placeholder="27XXXXX1234X1ZX"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 print:bg-white border border-zinc-700 print:border-zinc-300 rounded text-zinc-100 print:text-black font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Itemized Hardware Proposal Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 print:border-zinc-300 text-zinc-400 print:text-zinc-600 font-mono uppercase text-[11px]">
                      <th className="py-2.5 px-3">Item Category</th>
                      <th className="py-2.5 px-3">Hardware Description & SKU</th>
                      <th className="py-2.5 px-3">Warranty</th>
                      <th className="py-2.5 px-3 text-right">Price (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 print:divide-zinc-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30 print:hover:bg-transparent">
                        <td className="py-2 px-3 font-mono text-[11px] text-purple-400 print:text-purple-800">
                          {item.category}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-zinc-200 print:text-black block">{item.name}</span>
                          <span className="font-mono text-[10px] text-zinc-500">{item.sku}</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-400 print:text-zinc-600">
                          {item.warrantyYears} Years
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-zinc-100 print:text-black">
                          ₹{item.price.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoicing Breakdown */}
              <div className="p-4 rounded-xl bg-zinc-950/80 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs font-mono">
                <div className="space-y-1 text-zinc-400 print:text-zinc-600 text-[11px]">
                  <p>• Prices include standard packaging in dual-wall reinforced wooden crate.</p>
                  <p>• 72-Hour continuous AIDA64 + 3DMark thermal verification included.</p>
                  <p>• 3-Year Pan-India Doorstep Warranty coverage active from invoice date.</p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-right shrink-0">
                  <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                    <span>Taxable Base:</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                    <span>IGST (18%):</span>
                    <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                    <span>Precision Assembly:</span>
                    <span className="text-emerald-400 print:text-emerald-700">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                    <span>Insured Transit:</span>
                    <span className="text-emerald-400 print:text-emerald-700">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white print:text-black pt-2 border-t border-zinc-800 print:border-zinc-300">
                    <span>Total Proposal:</span>
                    <span className="text-purple-400 print:text-purple-800 text-lg">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Controls (Hidden on Print) */}
              <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-purple-400" />
                  <span>Print / Save PDF</span>
                </button>

                <div className="w-full sm:w-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Proposal to Black Raven</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
