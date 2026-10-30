# Implementation Plan: Modular 3D PC Chassis & Hardware Storefront Integration

Integrate an interchangeable modular 3D PC chassis visualizer with guided step-by-step assembly into the Configurator, and integrate an MDComputers-inspired Hardware Storefront & Deals showcase (Popular Categories, Hot Selling Items with INR discounts, Promotional Banners, and Gaming Gear) into BLACK RAVEN.

---

## 1. System Architecture & User Flow

### A. Guided Step-by-Step 3D Assembly Engine
- **Component**: `src/components/ModularPCChassisViewer.tsx`
- **Core Functionality**:
  - Renders a precision dual-chamber PC chassis with dedicated spatial slots:
    1. **Chassis & Frame**: Outer steel frame with tempered glass guide rails.
    2. **Motherboard Tray & Socket**: Motherboard PCB, VRM heatsinks, LGA1700/AM5 socket.
    3. **CPU Slot**: Guided drop-in animation with realistic laser-etched IHS.
    4. **CPU Cooler Slot**: Liquid AIO 360mm pump & radiator or dual-tower air cooler.
    5. **Memory (RAM) Slots**: DIMM slots 2 & 4 with dual-channel RGB sticks.
    6. **Storage (NVMe SSD) Slot**: M.2 slot with thermal armor shield.
    7. **Graphics Card (GPU) Slot**: PCIe 4.0 x16 slot with anti-sag bracket & 12VHPWR cable.
    8. **Power Supply (PSU) Basement**: Shroud compartment with modular cable routing.
  - **Sequential Assembly Guide Mode**:
    - Users can advance step-by-step (`Step 1: CPU` $\to$ `Step 2: Motherboard` $\to$ `Step 3: Cooler` $\to$ `Step 4: RAM` $\to$ `Step 5: Storage` $\to$ `Step 6: GPU` $\to$ `Step 7: PSU` $\to$ `Step 8: Chassis Completion`).
    - Active slot glows with an electric violet aura; upon part selection, a smooth drop-in transition installs the hardware into place.
    - Integrated with the existing `Configurator.tsx` and works hand-in-hand with the BuildCores Parts Matrix and 3D Studio.

### B. Hardware Store & Deals Showcase (Screenshots Integration)
- **Component**: `src/components/HardwareStore.tsx`
- **Sections adapted to Black Raven Luxury Obsidian Theme**:
  1. **Store Header & Category Quick-Bar**: Quick filter by Processors, Graphics Cards, Motherboards, Liquid Cooling, Memory, Storage, Monitors, PSUs, and Cabinets.
  2. **Hero Promotional Banners**:
     - *BLACK RAVEN Apex Hardware Bonanza*: Festive discounts on high-performance NVMe storage & DDR5 kits.
     - *Shark-X & Liquid AIO Super Deal*: Bundle promotions for custom water blocks & streaming gear.
     - *Pre-Built Gaming Systems vs Office Workstations*: Promotional split banners with instant savings.
  3. **Popular Category Podiums**:
     - Visual podium showcase with hardware on illuminated pedestals (CPUs, Motherboards, Custom Liquid Cooling, ARGB Coolers, GPUs, DDR5 RAM, PCIe Gen 5 SSDs, Curved OLED Monitors, PSUs, Chassis).
  4. **Hot Selling Hardware Grid**:
     - Real-time product cards featuring:
       - Discount badge (e.g. `-40%`, `-55%`, `-14%`)
       - High-resolution component imagery
       - Original strike-through MRP and discounted selling price in INR
       - One-click "Add to Cart" button linked to active checkout state.
  5. **Brand & Peripheral Spotlight ("KARNAGE" by Black Raven)**:
     - Mechanical Keyboards, Ergonomic Gaming Mice, Studio Headsets, and Triple ARGB Cabinet Fans.
  6. **Indian E-Commerce Trust Strip & Enhanced Footer**:
     - Free Insured Shipping Across India, 24/7 Priority Support, 100% Secure Payments (UPI / RuPay / Cards / EMI), Fast Doorstep Delivery.

---

## 2. File Modification & Creation Roadmap

### 1. New Component: `src/components/ModularPCChassisViewer.tsx`
- Build a dedicated Three.js component with slot highlighting, step-by-step camera choreography, component visibility toggles based on current build state, and interactive slot inspection.
- Embed seamlessly into `src/components/Configurator.tsx` as an interactive mode or toggle alongside the full Battlestation viewer.

### 2. New Component: `src/components/HardwareStore.tsx`
- Create the MDComputers-inspired retail storefront tailored to the Black Raven obsidian aesthetic.
- Support instant category filtering, price search, direct "Add to Cart", and "Load into 3D Builder" buttons.

### 3. Navigation & App Integration: `src/components/Navbar.tsx` & `src/App.tsx`
- Add "STORE & DEALS" tab to `Navbar.tsx` and integrate it into the category dropdown.
- Add the featured storefront showcase to the Homepage below the Hero section and allow full-page browsing under the dedicated `store` tab.

---

## 3. Verification & Quality Assurance
- Run `lint_applet` (`tsc --noEmit`) to verify zero syntax or typing errors.
- Run `compile_applet` to confirm the production build completes cleanly.
- Verify real-time cart updates when clicking "Add to Cart" from the new Hot Selling Items.
- Test step-by-step guided assembly in the Configurator to verify smooth component swapping.
