import React, { useState } from 'react';
import { CustomerInquiry } from '../types';
import { ShieldCheck, Flame, Wrench, Headphones, Send, CheckCircle2, ChevronDown } from 'lucide-react';

interface TrustAndEngineeringProps {
  onSubmitInquiry: (inquiry: CustomerInquiry) => void;
}

export const TrustAndEngineering: React.FC<TrustAndEngineeringProps> = ({
  onSubmitInquiry,
}) => {
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [budgetRange, setBudgetRange] = useState('₹1,50,000 - ₹2,50,000');
  const [intendedUse, setIntendedUse] = useState('AAA 1440p / 4K Gaming');
  const [message, setMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail) return;

    const newInquiry: CustomerInquiry = {
      id: `inq-${Date.now()}`,
      name: inquiryName,
      email: inquiryEmail,
      phone: inquiryPhone,
      budgetRange,
      intendedUse,
      message,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    onSubmitInquiry(newInquiry);
    setInquirySent(true);
  };

  const FAQS = [
    {
      q: 'How does Black Raven protect my custom PC during pan-India transit?',
      a: 'We use a dual-wall reinforced freight crate with high-density custom InstaPak expanding polyurethane foam cast directly around your graphics card and CPU cooler inside the chassis. This immobilizes internal components, preventing PCIe slot stress or cooler dislocation.',
    },
    {
      q: 'What is the Black Raven 72-Hour Burn-In Torture Protocol?',
      a: 'Before any system is signed off for delivery, it undergoes 72 hours of uninterrupted computational burn-in: AIDA64 FPU stress test, FurMark extreme GPU load, MemTest86 memory integrity verification, and SSD thermal monitoring. We ensure zero thermal throttling and stable VRM temperatures.',
    },
    {
      q: 'Are any proprietary parts used, or can I upgrade in the future?',
      a: 'We strictly ban proprietary motherboard shapes, non-standard power supplies, or locked BIOS firmware. Every Black Raven machine uses 100% industry-standard ATX, AM5, or LGA1700 components, allowing effortless upgrades for years to come.',
    },
    {
      q: 'How does the 3-Year Pan-India Doorstep Warranty work?',
      a: 'If any component develops an issue, our hardware engineering team performs remote diagnostics. If physical service is needed, we dispatch a replacement part with doorstep courier pickup, or arrange a field technician visit in Tier-1 and Tier-2 Indian metro areas.',
    },
    {
      q: 'Is the operating system and BIOS tuned before shipping?',
      a: 'Yes. Every PC arrives with a clean, bloatware-free Windows 11 installation, latest motherboard BIOS firmware, memory EXPO/XMP profiles enabled for maximum clock speed, and custom acoustic fan curves tuned for silent idle and aggressive cooling under gaming load.',
    },
  ];

  return (
    <section className="py-16 bg-[#060608] border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Engineering Standards */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-400 block mb-1">
              THE BLACK RAVEN CRITERIA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Zero Compromise Engineering
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              Why esports champions and leading game studios trust Black Raven for their critical computational hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#0c0c14] border border-zinc-800 space-y-3">
              <Flame className="w-6 h-6 text-purple-400" />
              <h4 className="text-base font-bold text-white">72-Hour Torture Test</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every build is subjected to full-load AIDA64 + FurMark burn-in. If any core spikes beyond our thermal ceiling, we repaste and re-engineer airflow.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c0c14] border border-zinc-800 space-y-3">
              <Wrench className="w-6 h-6 text-purple-400" />
              <h4 className="text-base font-bold text-white">Aerospace Cable Combs</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Individually routed braided cables secured with CNC aluminum combs. Clean air channels guarantee laminar airflow straight to your GPU fans.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c0c14] border border-zinc-800 space-y-3">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              <h4 className="text-base font-bold text-white">3-Year Doorstep Warranty</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Comprehensive coverage across all components with zero depreciation deduction. Free insured shipping for any repair requirement nationwide.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c0c14] border border-zinc-800 space-y-3">
              <Headphones className="w-6 h-6 text-purple-400" />
              <h4 className="text-base font-bold text-white">Lifetime Hardware Support</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct phone, WhatsApp, and email access to our senior hardware engineers who built your computer, not a call center script reader.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs & Direct Hardware Consultation Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-6 border-t border-zinc-800/80">
          {/* FAQ Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-400 block mb-1">
              QUESTIONS & PROTOCOLS
            </span>
            <h3 className="text-2xl font-extrabold text-white mb-6">
              Frequently Asked Technical Questions
            </h3>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#0d0d15] border border-zinc-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-4 text-left text-xs sm:text-sm font-semibold text-white flex items-center justify-between gap-4 hover:text-purple-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 transition-transform ${
                        openFaq === idx ? 'rotate-180 text-purple-400' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="p-4 pt-0 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Consultation Form (5 cols) */}
          <div className="lg:col-span-5 p-7 rounded-2xl bg-[#0e0e18] border border-zinc-800 shadow-xl space-y-5">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-purple-400 block">
                DIRECT HARDWARE CONSULTATION
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Speak with an Engineer</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Have specific workload requirements, ML models, or custom liquid cooling requests? Submit your inquiry below.
              </p>
            </div>

            {inquirySent ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Inquiry Received</h4>
                <p className="text-xs text-zinc-400">
                  Our hardware engineering team will review your specifications and reach out within 2 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="Arjun Kapoor"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="arjun@domain.com"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Mobile</label>
                    <input
                      type="tel"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1">Budget Target</label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none"
                    >
                      <option>Under ₹1,00,000</option>
                      <option>₹1,00,000 - ₹1,80,000</option>
                      <option>₹1,80,000 - ₹3,00,000</option>
                      <option>Above ₹3,00,000</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Primary Workload</label>
                    <select
                      value={intendedUse}
                      onChange={(e) => setIntendedUse(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none"
                    >
                      <option>1440p / 4K Gaming</option>
                      <option>Competitive eSports</option>
                      <option>Video Editing / 3D Animation</option>
                      <option>AI / Machine Learning</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Special Requirements (Optional)</label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Need extra NVMe drive bays, whisper-quiet fans, or custom laser logo..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Custom Consultation</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
