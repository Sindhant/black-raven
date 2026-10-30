import { BuildSelection, CompatibilityIssue, CompatibilityReport } from '../types';

export function checkCompatibility(parts: BuildSelection): CompatibilityReport {
  const issues: CompatibilityIssue[] = [];

  const {
    cpu,
    motherboard,
    gpu,
    ram,
    storage,
    cooler,
    case: pcCase,
    psu,
  } = parts;

  // 1. Socket Compatibility: CPU vs Motherboard
  if (cpu && motherboard) {
    if (cpu.socket && motherboard.socket && cpu.socket !== motherboard.socket) {
      issues.push({
        severity: 'error',
        category: 'cpu',
        title: 'Socket Incompatibility Detected',
        message: `Processor ${cpu.name} requires socket ${cpu.socket}, but motherboard ${motherboard.name} has socket ${motherboard.socket}. These components cannot be installed together physically.`,
        componentA: cpu.name,
        componentB: motherboard.name,
      });
    }
  }

  // 2. RAM standard vs Motherboard
  if (ram && motherboard) {
    if (ram.ramType && motherboard.ramType && ram.ramType !== motherboard.ramType) {
      issues.push({
        severity: 'error',
        category: 'ram',
        title: 'Memory Standard Mismatch',
        message: `${ram.name} is ${ram.ramType}, while ${motherboard.name} strictly supports ${motherboard.ramType} DIMMs.`,
        componentA: ram.name,
        componentB: motherboard.name,
      });
    }
  }

  // 3. Motherboard Form Factor vs Case
  if (motherboard && pcCase) {
    if (
      motherboard.formFactor &&
      pcCase.supportedFormFactors &&
      !pcCase.supportedFormFactors.includes(motherboard.formFactor)
    ) {
      issues.push({
        severity: 'error',
        category: 'motherboard',
        title: 'Motherboard Does Not Fit In Chassis',
        message: `The ${motherboard.name} is an ${motherboard.formFactor} board, but ${pcCase.name} only accommodates [${pcCase.supportedFormFactors.join(', ')}].`,
        componentA: motherboard.name,
        componentB: pcCase.name,
      });
    }
  }

  // 4. GPU Clearance in Case
  if (gpu && pcCase) {
    if (gpu.gpuLengthMm && pcCase.maxGpuLengthMm) {
      if (gpu.gpuLengthMm > pcCase.maxGpuLengthMm) {
        issues.push({
          severity: 'error',
          category: 'gpu',
          title: 'Graphics Card Exceeds Chassis Clearance',
          message: `${gpu.name} length is ${gpu.gpuLengthMm}mm, exceeding the maximum clearance of ${pcCase.maxGpuLengthMm}mm inside ${pcCase.name}.`,
          componentA: gpu.name,
          componentB: pcCase.name,
        });
      } else if (pcCase.maxGpuLengthMm - gpu.gpuLengthMm < 15) {
        issues.push({
          severity: 'warning',
          category: 'gpu',
          title: 'Extremely Tight GPU Clearance',
          message: `Only ${pcCase.maxGpuLengthMm - gpu.gpuLengthMm}mm of clearance remains between ${gpu.name} and the front fans. Precision cable routing required.`,
          componentA: gpu.name,
          componentB: pcCase.name,
        });
      }
    }
  }

  // 5. Air Cooler Height vs Case Clearance
  if (cooler && pcCase) {
    if (cooler.coolerHeightMm && pcCase.coolerMaxHeightMm) {
      if (cooler.coolerHeightMm > pcCase.coolerMaxHeightMm) {
        issues.push({
          severity: 'error',
          category: 'cooler',
          title: 'CPU Cooler Height Exceeds Case Width',
          message: `${cooler.name} height (${cooler.coolerHeightMm}mm) will hit the tempered glass panel of ${pcCase.name} (max ${pcCase.coolerMaxHeightMm}mm).`,
          componentA: cooler.name,
          componentB: pcCase.name,
        });
      }
    }

    // 6. Liquid AIO Radiator Support in Case
    if (cooler.coolerRadiatorMm && pcCase.radiatorSupportMm) {
      if (!pcCase.radiatorSupportMm.includes(cooler.coolerRadiatorMm)) {
        issues.push({
          severity: 'error',
          category: 'cooler',
          title: 'Chassis Lacks Radiator Mounting Bracket',
          message: `${pcCase.name} does not support a ${cooler.coolerRadiatorMm}mm radiator AIO liquid cooler. Supported sizes: ${pcCase.radiatorSupportMm.join('mm, ')}mm.`,
          componentA: cooler.name,
          componentB: pcCase.name,
        });
      }
    }
  }

  // 7. Power Supply Wattage calculation
  let totalEstimatedWattage = 75; // baseline for fans, chipset, RGB, storage, controller
  if (cpu) totalEstimatedWattage += cpu.wattage;
  if (gpu) totalEstimatedWattage += gpu.wattage;
  if (ram) totalEstimatedWattage += ram.wattage;
  if (storage) totalEstimatedWattage += storage.wattage;
  if (cooler) totalEstimatedWattage += cooler.wattage;
  if (pcCase) totalEstimatedWattage += pcCase.wattage;

  // Recommended PSU adds 30% transient spike overhead (vital for RTX 4080/4090 and high-clock Intel/AMD chips)
  const recommendedPsuWattage = Math.ceil((totalEstimatedWattage * 1.3) / 50) * 50;

  if (psu) {
    if (psu.wattage < totalEstimatedWattage) {
      issues.push({
        severity: 'error',
        category: 'psu',
        title: 'Insufficient Power Supply Capacity',
        message: `Your configuration consumes approximately ${totalEstimatedWattage}W under load. The selected ${psu.name} delivers ${psu.wattage}W and will shut down under thermal stress. Minimum recommended: ${recommendedPsuWattage}W.`,
        componentA: psu.name,
      });
    } else if (psu.wattage < recommendedPsuWattage) {
      issues.push({
        severity: 'warning',
        category: 'psu',
        title: 'Marginal Power Headroom',
        message: `Total draw is ~${totalEstimatedWattage}W. A ${psu.wattage}W PSU will operate near maximum efficiency limits during high-load gaming sessions. We recommend ${recommendedPsuWattage}W for silence and transient handling.`,
        componentA: psu.name,
      });
    }
  }

  // 8. Informational checks
  if (cpu && !cooler) {
    issues.push({
      severity: 'info',
      category: 'cooler',
      title: 'Cooler Selection Required',
      message: `${cpu.name} does not include an in-box thermal solution and requires a high-performance liquid or dual-tower cooler.`,
    });
  }

  const isCompatible = !issues.some((issue) => issue.severity === 'error');
  const hasWarnings = issues.some((issue) => issue.severity === 'warning');

  return {
    isCompatible,
    hasWarnings,
    issues,
    estimatedWattage: totalEstimatedWattage,
    recommendedPsuWattage,
  };
}
