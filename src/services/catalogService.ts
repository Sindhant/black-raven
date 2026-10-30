import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { HardwareItem, Quotation, Order, CustomerInquiry, PrebuiltPC, SiteSettings } from '../types';
import { INITIAL_HARDWARE_CATALOG, PREBUILT_SYSTEMS } from '../data/catalog';

const PRODUCTS_COLLECTION = 'products';
const QUOTATIONS_COLLECTION = 'quotations';
const ORDERS_COLLECTION = 'orders';
const INQUIRIES_COLLECTION = 'inquiries';
const PREBUILTS_COLLECTION = 'prebuilts';
const SETTINGS_COLLECTION = 'settings';

/**
 * Seeds initial catalog into Firestore if the collection is empty.
 */
export async function seedInitialCatalogIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snap.empty) {
      console.log('Seeding initial Black Raven catalog to Firestore...');
      for (const item of INITIAL_HARDWARE_CATALOG) {
        // Clean undefined fields so Firestore doesn't error
        const cleanItem: Record<string, any> = {};
        Object.entries(item).forEach(([k, v]) => {
          if (v !== undefined) cleanItem[k] = v;
        });
        await setDoc(doc(db, PRODUCTS_COLLECTION, item.id), cleanItem);
      }
      console.log('Seeded', INITIAL_HARDWARE_CATALOG.length, 'hardware products to Firestore.');
    }
  } catch (err) {
    console.warn('Could not auto-seed Firestore (may lack admin write rules until signed in):', err);
  }
}

/**
 * Subscribes to real-time updates for hardware products.
 */
export function subscribeToProducts(
  onUpdate: (items: HardwareItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: HardwareItem[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as HardwareItem);
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (error) => {
      console.warn(`Firestore subscription notice for ${PRODUCTS_COLLECTION}:`, error.message);
      onError?.(error);
    }
  );
}

/**
 * Creates a new hardware product in Firestore.
 */
export async function createProductInDb(item: HardwareItem): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${item.id}`;
  try {
    const cleanItem: Record<string, any> = {};
    Object.entries(item).forEach(([k, v]) => {
      if (v !== undefined) cleanItem[k] = v;
    });
    await setDoc(doc(db, PRODUCTS_COLLECTION, item.id), cleanItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Updates an existing hardware product (e.g. price, stock, specs).
 */
export async function updateProductInDb(id: string, updates: Partial<HardwareItem>): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined) cleanUpdates[k] = v;
    });
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deactivates or permanently removes a product from Firestore.
 */
export async function deleteProductFromDb(id: string): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Persists an official Quotation to Firestore.
 */
export async function saveQuotationToDb(quote: Quotation): Promise<void> {
  const path = `${QUOTATIONS_COLLECTION}/${quote.id}`;
  try {
    const cleanQuote: Record<string, any> = {};
    Object.entries(quote).forEach(([k, v]) => {
      if (v !== undefined) cleanQuote[k] = v;
    });
    await setDoc(doc(db, QUOTATIONS_COLLECTION, quote.id), cleanQuote);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Subscribes to Quotations.
 */
export function subscribeToQuotations(
  onUpdate: (quotes: Quotation[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, QUOTATIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const quotes: Quotation[] = [];
      snapshot.forEach((d) => {
        quotes.push(d.data() as Quotation);
      });
      onUpdate(quotes);
    },
    (error) => {
      console.warn('Firestore quotations listener notice:', error.message);
      onError?.(error);
    }
  );
}

/**
 * Persists an Order to Firestore.
 */
export async function saveOrderToDb(order: Order): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${order.id}`;
  try {
    const cleanOrder: Record<string, any> = {};
    Object.entries(order).forEach(([k, v]) => {
      if (v !== undefined) cleanOrder[k] = v;
    });
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), cleanOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Subscribes to Orders.
 */
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, ORDERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((d) => {
        orders.push(d.data() as Order);
      });
      onUpdate(orders);
    },
    (error) => {
      console.warn('Firestore orders listener notice:', error.message);
      onError?.(error);
    }
  );
}

/**
 * Persists a Customer Consultation Inquiry to Firestore.
 */
export async function saveInquiryToDb(inquiry: CustomerInquiry): Promise<void> {
  const path = `${INQUIRIES_COLLECTION}/${inquiry.id}`;
  try {
    const cleanInquiry: Record<string, any> = {};
    Object.entries(inquiry).forEach(([k, v]) => {
      if (v !== undefined) cleanInquiry[k] = v;
    });
    await setDoc(doc(db, INQUIRIES_COLLECTION, inquiry.id), cleanInquiry);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Saves or updates site branding, headlines, and business parameters in Firestore.
 */
export async function saveSettingsToDb(settings: SiteSettings): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/main`;
  try {
    const cleanSettings: Record<string, any> = {};
    Object.entries(settings).forEach(([k, v]) => {
      if (v !== undefined) cleanSettings[k] = v;
    });
    await setDoc(doc(db, SETTINGS_COLLECTION, 'main'), cleanSettings);
  } catch (error) {
    console.warn('Could not save settings to Firestore, persisting locally:', error);
  }
}

/**
 * Subscribes to real-time site settings updates.
 */
export function subscribeToSettings(
  onUpdate: (settings: SiteSettings) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, 'main');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SiteSettings);
      }
    },
    (err) => {
      console.warn('Settings listener fallback notice:', err.message);
    }
  );
}

/**
 * Subscribes to real-time prebuilts from Firestore.
 */
export function subscribeToPrebuilts(
  onUpdate: (prebuilts: PrebuiltPC[]) => void
): () => void {
  const colRef = collection(db, PREBUILTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: PrebuiltPC[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as PrebuiltPC);
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (err) => {
      console.warn('Prebuilts listener notice:', err.message);
    }
  );
}

/**
 * Creates or updates a Prebuilt PC in Firestore.
 */
export async function savePrebuiltToDb(pc: PrebuiltPC): Promise<void> {
  const path = `${PREBUILTS_COLLECTION}/${pc.id}`;
  try {
    const cleanPC: Record<string, any> = {};
    Object.entries(pc).forEach(([k, v]) => {
      if (v !== undefined) cleanPC[k] = v;
    });
    await setDoc(doc(db, PREBUILTS_COLLECTION, pc.id), cleanPC);
  } catch (error) {
    console.warn('Could not save prebuilt to Firestore, saved locally:', error);
  }
}

/**
 * Deletes a Prebuilt PC from Firestore.
 */
export async function deletePrebuiltFromDb(id: string): Promise<void> {
  const path = `${PREBUILTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, PREBUILTS_COLLECTION, id));
  } catch (error) {
    console.warn('Could not delete prebuilt from Firestore:', error);
  }
}
