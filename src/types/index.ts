export type ComponentCategory =
  | 'cpu'
  | 'motherboard'
  | 'gpu'
  | 'ram'
  | 'storage'
  | 'cooler'
  | 'case'
  | 'psu'
  | 'accessories';

export interface HardwareItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: ComponentCategory;
  price: number; // in INR
  image?: string;
  specs: Record<string, string>;
  inStock: boolean;
  warrantyYears: number;
  wattage: number; // estimated power draw or delivery
  // Compatibility metadata
  socket?: 'LGA1700' | 'AM5' | 'AM4';
  ramType?: 'DDR5' | 'DDR4';
  ramSlots?: number;
  formFactor?: 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX';
  supportedFormFactors?: ('ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX')[];
  maxGpuLengthMm?: number;
  gpuLengthMm?: number;
  coolerMaxHeightMm?: number;
  coolerHeightMm?: number;
  radiatorSupportMm?: number[];
  coolerRadiatorMm?: number;
  psuFormFactor?: 'ATX' | 'SFX';
  pcieConnectorsNeeded?: number;
  pcieConnectorsProvided?: number;
  description: string;
}

export interface PrebuiltPC {
  id: string;
  sku: string;
  name: string;
  tagline: string;
  tier: 'eSports' | 'Elite' | 'Apex' | 'Workstation';
  basePrice: number; // in INR
  components: {
    cpu: string;
    gpu: string;
    motherboard: string;
    ram: string;
    storage: string;
    cooler: string;
    chassis: string;
    psu: string;
  };
  fpsTargets: {
    game: string;
    resolution: string;
    fps: number;
    settings: string;
  }[];
  badge?: string;
  description: string;
  inStock: boolean;
  warrantyYears: number;
  caseColor: string;
  accentRgb: string;
}

export type BuildSelection = {
  [K in ComponentCategory]: HardwareItem | null;
};

export interface CustomBuild {
  parts: BuildSelection;
  lightingColor: string;
  caseColor: string;
  accessories: string[];
}

export interface CompatibilityIssue {
  severity: 'error' | 'warning' | 'info';
  category: ComponentCategory | 'system';
  title: string;
  message: string;
  componentA?: string;
  componentB?: string;
}

export interface CompatibilityReport {
  isCompatible: boolean;
  hasWarnings: boolean;
  issues: CompatibilityIssue[];
  estimatedWattage: number;
  recommendedPsuWattage: number;
}

export interface CartItem {
  id: string;
  type: 'prebuilt' | 'custom' | 'component';
  title: string;
  subtitle: string;
  price: number;
  quantity: number;
  customDetails?: {
    partsSummary: { category: string; name: string; price: number }[];
    lightingColor: string;
  };
  prebuiltDetails?: PrebuiltPC;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  state: string;
  pincode: string;
  items: {
    category: string;
    name: string;
    sku: string;
    price: number;
    warrantyYears: number;
  }[];
  subtotal: number;
  gstAmount: number;
  assemblyFee: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  validUntil: string;
  notes?: string;
  status: 'draft' | 'submitted' | 'contacted' | 'approved' | 'expired';
}

export interface CustomerInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  budgetRange: string;
  intendedUse: string;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'resolved';
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'razorpay_test' | 'bank_transfer' | 'cod';
  paymentStatus: 'pending' | 'verified' | 'failed';
  orderStatus: 'received' | 'assembly' | 'testing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface SiteSettings {
  heroHeadline: string;
  heroTagline: string;
  heroSubtext: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  gstNumber: string;
  freeShippingThreshold: number;
  diwaliBannerHeadline: string;
  diwaliBannerSubtext: string;
  sharkXOfferText: string;
}
