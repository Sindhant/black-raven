import { BuildSelection } from '../types';

export interface GameBenchmark {
  game: string;
  genre: string;
  fps1080p: number;
  fps1440p: number;
  fps4k: number;
  settings: string;
  rtxFeature: string;
}

export interface SyntheticBenchmark {
  titleSpyScore: number;
  cinebenchR23Multi: number;
  cinebenchR23Single: number;
}

export interface BottleneckAnalysis {
  cpuScore: number;
  gpuScore: number;
  bottleneckPercentage: number;
  bottleneckComponent: 'cpu' | 'gpu' | 'balanced';
  verdict: string;
  recommendation: string;
}

// Relative performance weight maps
const GPU_PERF_INDEX: Record<string, number> = {
  'RTX 4090': 100,
  'RTX 4080': 78,
  'RTX 4070 Ti': 64,
  'RTX 4070': 52,
  'RTX 4060 Ti': 38,
  'RTX 4060': 28,
  'RX 7900 XTX': 82,
  'RX 7800 XT': 55,
  'RX 7700 XT': 44,
};

const CPU_GAMING_INDEX: Record<string, number> = {
  '7800X3D': 100,
  '7950X3D': 99,
  '14900KS': 98,
  '14900K': 97,
  '14700K': 92,
  '7700X': 85,
  '7600X': 78,
  '14600K': 84,
  '13600K': 80,
};

export function calculatePerformanceScores(customBuild: BuildSelection) {
  const gpuName = customBuild.gpu?.name || '';
  const cpuName = customBuild.cpu?.name || '';

  // Determine GPU index
  let gpuIndex = 45; // baseline default
  for (const [key, score] of Object.entries(GPU_PERF_INDEX)) {
    if (gpuName.includes(key)) {
      gpuIndex = score;
      break;
    }
  }

  // Determine CPU index
  let cpuIndex = 75; // baseline default
  for (const [key, score] of Object.entries(CPU_GAMING_INDEX)) {
    if (cpuName.includes(key)) {
      cpuIndex = score;
      break;
    }
  }

  // Calculate game benchmarks across resolutions
  const rawGpuRatio = gpuIndex / 100;
  const rawCpuRatio = cpuIndex / 100;

  const games: GameBenchmark[] = [
    {
      game: 'Cyberpunk 2077',
      genre: 'Open World RPG',
      fps1080p: Math.round(145 * rawGpuRatio * (0.8 + 0.2 * rawCpuRatio)),
      fps1440p: Math.round(108 * rawGpuRatio * (0.9 + 0.1 * rawCpuRatio)),
      fps4k: Math.round(68 * rawGpuRatio),
      settings: 'Ray Tracing Ultra',
      rtxFeature: 'DLSS 3.5 + Frame Gen',
    },
    {
      game: 'Black Myth: Wukong',
      genre: 'Action RPG',
      fps1080p: Math.round(135 * rawGpuRatio * (0.85 + 0.15 * rawCpuRatio)),
      fps1440p: Math.round(98 * rawGpuRatio * (0.92 + 0.08 * rawCpuRatio)),
      fps4k: Math.round(62 * rawGpuRatio),
      settings: 'Cinematic High',
      rtxFeature: 'TSR / DLSS Super Res',
    },
    {
      game: 'Counter-Strike 2',
      genre: 'Competitive eSports',
      fps1080p: Math.round(420 * rawCpuRatio * 0.95),
      fps1440p: Math.round(340 * rawCpuRatio * 0.9 + 40 * rawGpuRatio),
      fps4k: Math.round(210 * rawGpuRatio),
      settings: 'Competitive Very High',
      rtxFeature: 'NVIDIA Reflex Low Latency',
    },
    {
      game: 'Call of Duty: Warzone',
      genre: 'Battle Royale',
      fps1080p: Math.round(195 * rawGpuRatio * (0.75 + 0.25 * rawCpuRatio)),
      fps1440p: Math.round(145 * rawGpuRatio * (0.85 + 0.15 * rawCpuRatio)),
      fps4k: Math.round(92 * rawGpuRatio),
      settings: 'Extreme Preset',
      rtxFeature: 'DLSS Quality',
    },
    {
      game: 'Forza Horizon 5',
      genre: 'Racing Simulation',
      fps1080p: Math.round(210 * rawGpuRatio),
      fps1440p: Math.round(165 * rawGpuRatio),
      fps4k: Math.round(112 * rawGpuRatio),
      settings: 'Extreme Graphics',
      rtxFeature: 'MSAA 4x + Ray Tracing',
    },
    {
      game: 'Alan Wake 2',
      genre: 'Survival Horror',
      fps1080p: Math.round(110 * rawGpuRatio * (0.85 + 0.15 * rawCpuRatio)),
      fps1440p: Math.round(82 * rawGpuRatio),
      fps4k: Math.round(52 * rawGpuRatio),
      settings: 'Path Tracing High',
      rtxFeature: 'Full Ray Reconstruction',
    },
  ];

  // Synthetics
  const synthetic: SyntheticBenchmark = {
    titleSpyScore: Math.round(36500 * (gpuIndex / 100)),
    cinebenchR23Multi: cpuName.includes('7950X3D')
      ? 38500
      : cpuName.includes('14900')
      ? 40200
      : cpuName.includes('14700')
      ? 34500
      : cpuName.includes('7800X3D')
      ? 18900
      : 15200,
    cinebenchR23Single: cpuName.includes('14900')
      ? 2320
      : cpuName.includes('7800X3D')
      ? 1820
      : 2050,
  };

  // Bottleneck calculation
  // At 1440p standard enthusiast gaming:
  const diff = Math.abs(gpuIndex - cpuIndex);
  let bottleneckPercentage = Math.min(24, Math.round(diff * 0.25));
  let bottleneckComponent: 'cpu' | 'gpu' | 'balanced' = 'balanced';
  let verdict = '';
  let recommendation = '';

  if (gpuIndex > cpuIndex + 25) {
    bottleneckComponent = 'cpu';
    verdict = `Minor CPU Bottleneck (~${bottleneckPercentage}%) at 1080p high refresh.`;
    recommendation = `The GPU is extremely fast. At 1440p or 4K resolution, this bottleneck disappears completely as load shifts entirely to the GPU.`;
  } else if (cpuIndex > gpuIndex + 25) {
    bottleneckComponent = 'gpu';
    bottleneckPercentage = Math.round(diff * 0.22);
    verdict = `GPU-Bound Workload (~${bottleneckPercentage}%).`;
    recommendation = `Optimal gaming state. Your CPU has massive headroom and will never stutter or limit framerates.`;
  } else {
    bottleneckComponent = 'balanced';
    bottleneckPercentage = Math.max(2, Math.round(diff * 0.12));
    verdict = `Synergistic High-Performance Balance (<${bottleneckPercentage}% variance).`;
    recommendation = `Excellent architectural pairing. Both processor and graphics card operate in lockstep with minimal resource wastage.`;
  }

  return {
    gpuIndex,
    cpuIndex,
    games,
    synthetic,
    bottleneck: {
      cpuScore: cpuIndex,
      gpuScore: gpuIndex,
      bottleneckPercentage,
      bottleneckComponent,
      verdict,
      recommendation,
    },
  };
}
