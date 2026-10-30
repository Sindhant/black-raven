import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BuildSelection, ComponentCategory, HardwareItem } from '../types';
import {
  Maximize2,
  RotateCcw,
  Eye,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Box,
  Layers,
  Sparkles,
  Zap,
  Cpu as CpuIcon,
  HardDrive,
  Fan,
  RefreshCw,
  Info,
} from 'lucide-react';

interface ModularPCChassisViewerProps {
  parts: BuildSelection;
  lightingColor?: string;
  onSelectComponentCategory?: (category: ComponentCategory) => void;
  className?: string;
}

interface AssemblyStep {
  id: ComponentCategory;
  stepNumber: number;
  title: string;
  slotName: string;
  description: string;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
}

const ASSEMBLY_STEPS: AssemblyStep[] = [
  {
    id: 'cpu',
    stepNumber: 1,
    title: 'Install Processor (CPU)',
    slotName: 'LGA1700 / AM5 Socket',
    description: 'Align pin 1 indicator, seat the processor into the socket substrate, and lock the load lever.',
    cameraPos: [0.2, 2.15, 1.6],
    lookAt: [-0.62, 2.15, -0.05],
  },
  {
    id: 'motherboard',
    stepNumber: 2,
    title: 'Mount Motherboard & VRM Tray',
    slotName: 'ATX Standoff Matrix',
    description: 'Secure motherboard onto pre-installed brass chassis standoffs and connect 24-pin ATX power.',
    cameraPos: [1.8, 2.2, 3.4],
    lookAt: [-0.6, 2.0, 0],
  },
  {
    id: 'cooler',
    stepNumber: 3,
    title: 'Mount CPU Cooling Block / Radiator',
    slotName: 'Top 360mm Bracket & Cold Plate',
    description: 'Apply thermal interface compound, mount AIO pump onto CPU IHS, and install 360mm top radiator.',
    cameraPos: [2.0, 3.1, 2.8],
    lookAt: [-0.2, 2.6, 0],
  },
  {
    id: 'ram',
    stepNumber: 4,
    title: 'Install Memory (DDR5 RAM)',
    slotName: 'DIMM Slots 2 & 4',
    description: 'Open latch tabs, seat high-speed DDR5 modules into dual-channel slots until tactile snap clicks.',
    cameraPos: [0.8, 2.6, 1.8],
    lookAt: [-0.58, 2.45, 0.4],
  },
  {
    id: 'storage',
    stepNumber: 5,
    title: 'Insert NVMe SSD & M.2 Shield',
    slotName: 'PCIe 4.0 / 5.0 M.2 Heatsink',
    description: 'Insert M.2 SSD at 30-degree angle, press down, and secure with thermal armor screw.',
    cameraPos: [0.6, 1.8, 1.6],
    lookAt: [-0.6, 1.7, 0.2],
  },
  {
    id: 'gpu',
    stepNumber: 6,
    title: 'Seat Graphics Card (GPU)',
    slotName: 'PCIe 4.0 x16 Primary Slot',
    description: 'Slide discrete graphics card into reinforced PCIe slot, screw rear bracket, and connect 12VHPWR cable.',
    cameraPos: [2.8, 1.4, 2.4],
    lookAt: [0, 1.35, 0.1],
  },
  {
    id: 'psu',
    stepNumber: 7,
    title: 'Install Power Supply (PSU)',
    slotName: 'Lower Shroud Basement',
    description: 'Mount ATX 3.1 modular power supply with fan facing downward ventilation intake.',
    cameraPos: [2.2, 0.5, 3.0],
    lookAt: [0, 0.35, 0],
  },
  {
    id: 'case',
    stepNumber: 8,
    title: 'Close Tempered Glass & Inspect Rig',
    slotName: 'Chassis Dual-Chamber Complete',
    description: 'Inspect cable routing, verify airflow channels, and mount the edge-to-edge tempered glass side panel.',
    cameraPos: [4.8, 3.2, 5.2],
    lookAt: [0, 1.8, 0],
  },
];

export const ModularPCChassisViewer: React.FC<ModularPCChassisViewerProps> = ({
  parts,
  lightingColor = '#8b5cf6',
  onSelectComponentCategory,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activeSlotHighlight, setActiveSlotHighlight] = useState<ComponentCategory>('cpu');

  const currentStep = ASSEMBLY_STEPS[currentStepIndex];

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);
  const cameraTargetPos = useRef(new THREE.Vector3(0.2, 2.15, 1.6));
  const cameraCurrentLookAt = useRef(new THREE.Vector3(-0.62, 2.15, -0.05));

  // Dynamic slot mesh group references
  const slotGroupsRef = useRef<Record<string, THREE.Group>>({});
  const slotWireframesRef = useRef<Record<string, THREE.LineSegments | THREE.Mesh>>({});
  const rgbLightsRef = useRef<THREE.PointLight[]>([]);

  // Update step and camera position
  const goToStep = (index: number) => {
    const step = ASSEMBLY_STEPS[index];
    if (!step) return;
    setCurrentStepIndex(index);
    setActiveSlotHighlight(step.id);
    cameraTargetPos.current.set(...step.cameraPos);
    cameraCurrentLookAt.current.set(...step.lookAt);
  };

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = (prev + 1) % ASSEMBLY_STEPS.length;
        goToStep(next);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060609);
    scene.fog = new THREE.FogExp2(0x060609, 0.045);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(...currentStep.cameraPos);
    camera.lookAt(...currentStep.lookAt);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5, 7, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4c3a75, 1.5);
    fillLight.position.set(-6, 3, -3);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x2d1f4d, 0x050508, 0.85);
    scene.add(hemiLight);

    // RGB Lighting
    const rgbColor = new THREE.Color(lightingColor);
    const pumpLight = new THREE.PointLight(rgbColor, 4.0, 3.5);
    pumpLight.position.set(-0.55, 2.15, 0.2);
    scene.add(pumpLight);

    const gpuLight = new THREE.PointLight(rgbColor, 4.5, 3.0);
    gpuLight.position.set(0.3, 1.4, 0.4);
    scene.add(gpuLight);
    rgbLightsRef.current = [pumpLight, gpuLight];

    // Studio Pedestal Floor
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07070a,
      roughness: 0.25,
      metalness: 0.85,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Materials Library
    const matteBlackMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.55, metalness: 0.7 });
    const darkAnodizedMat = new THREE.MeshStandardMaterial({ color: 0x181822, roughness: 0.22, metalness: 0.92 });
    const crimsonAccMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.9 });
    const nickelIhsMat = new THREE.MeshStandardMaterial({ color: 0xd8d8de, roughness: 0.2, metalness: 0.95 });
    const rgbMat = new THREE.MeshStandardMaterial({ color: rgbColor, emissive: rgbColor, emissiveIntensity: 2.2 });

    // Chassis Group
    const chassisGroup = new THREE.Group();
    scene.add(chassisGroup);

    // 1. CHASSIS OUTER FRAME (Always visible as reference)
    const caseWidth = 2.4;
    const caseHeight = 3.4;
    const caseDepth = 3.6;

    // Spine and back plate
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(caseWidth, caseHeight, 0.08), matteBlackMat);
    backPanel.position.set(0, caseHeight / 2, -caseDepth / 2);
    chassisGroup.add(backPanel);

    // Top radiator bracket
    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(caseWidth, 0.1, caseDepth), darkAnodizedMat);
    topPanel.position.set(0, caseHeight, 0);
    chassisGroup.add(topPanel);

    // Bottom PSU Shroud
    const psuShroud = new THREE.Mesh(new THREE.BoxGeometry(caseWidth - 0.1, 0.7, caseDepth - 0.2), darkAnodizedMat);
    psuShroud.position.set(0, 0.35, 0);
    chassisGroup.add(psuShroud);

    // Right Metal Side Panel
    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, caseHeight - 0.2, caseDepth), matteBlackMat);
    rightPanel.position.set(-caseWidth / 2, caseHeight / 2, 0);
    chassisGroup.add(rightPanel);

    // 2. MODULAR SLOT 1: CPU & SOCKET
    const cpuSlotGroup = new THREE.Group();
    cpuSlotGroup.position.set(-0.62, 2.15, -0.05);

    // Socket Frame
    const socketFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.85), darkAnodizedMat);
    cpuSlotGroup.add(socketFrame);

    // Gold Pin Array
    const goldPins = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.75), goldMat);
    cpuSlotGroup.add(goldPins);

    // CPU IHS
    const ihsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.65), nickelIhsMat);
    ihsMesh.rotation.y = Math.PI / 2;
    cpuSlotGroup.add(ihsMesh);

    // Lever
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 8), nickelIhsMat);
    lever.position.set(0.04, -0.4, 0);
    lever.rotation.x = Math.PI / 2;
    cpuSlotGroup.add(lever);

    chassisGroup.add(cpuSlotGroup);
    slotGroupsRef.current['cpu'] = cpuSlotGroup;

    // 3. MODULAR SLOT 2: MOTHERBOARD & VRM
    const moboSlotGroup = new THREE.Group();
    moboSlotGroup.position.set(-0.7, 1.9, 0);

    const moboPCB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 2.2), matteBlackMat);
    moboSlotGroup.add(moboPCB);

    const vrmHeatsink = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 1.4), darkAnodizedMat);
    vrmHeatsink.position.set(0.08, 0.7, -0.2);
    moboSlotGroup.add(vrmHeatsink);

    chassisGroup.add(moboSlotGroup);
    slotGroupsRef.current['motherboard'] = moboSlotGroup;

    // 4. MODULAR SLOT 3: COOLING AIO PUMP & TOP RADIATOR
    const coolerSlotGroup = new THREE.Group();

    // Pump block
    const pumpGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
    const pumpMesh = new THREE.Mesh(pumpGeo, darkAnodizedMat);
    pumpMesh.rotation.z = Math.PI / 2;
    pumpMesh.position.set(-0.48, 2.15, -0.05);
    coolerSlotGroup.add(pumpMesh);

    // Pump RGB ring
    const pumpRgb = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 12, 24), rgbMat);
    pumpRgb.rotation.y = Math.PI / 2;
    pumpRgb.position.set(-0.33, 2.15, -0.05);
    coolerSlotGroup.add(pumpRgb);

    // Top 360mm Radiator
    const radMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 2.7), matteBlackMat);
    radMesh.position.set(0, 3.25, 0);
    coolerSlotGroup.add(radMesh);

    // Glowing RGB Fans
    [-0.85, 0, 0.85].forEach((zOff) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 12, 24), rgbMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 3.16, zOff);
      coolerSlotGroup.add(ring);
    });

    chassisGroup.add(coolerSlotGroup);
    slotGroupsRef.current['cooler'] = coolerSlotGroup;

    // 5. MODULAR SLOT 4: DDR5 RAM
    const ramSlotGroup = new THREE.Group();
    [-0.08, 0.08].forEach((zOff) => {
      const stick = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.035), darkAnodizedMat);
      stick.position.set(-0.58, 2.45, 0.4 + zOff);
      ramSlotGroup.add(stick);

      const lightbar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.035), rgbMat);
      lightbar.position.set(-0.58, 2.68, 0.4 + zOff);
      ramSlotGroup.add(lightbar);
    });
    chassisGroup.add(ramSlotGroup);
    slotGroupsRef.current['ram'] = ramSlotGroup;

    // 6. MODULAR SLOT 5: STORAGE (NVMe SSD M.2)
    const storageSlotGroup = new THREE.Group();
    const m2Shield = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.6), crimsonAccMat);
    m2Shield.position.set(-0.62, 1.75, 0.2);
    storageSlotGroup.add(m2Shield);
    chassisGroup.add(storageSlotGroup);
    slotGroupsRef.current['storage'] = storageSlotGroup;

    // 7. MODULAR SLOT 6: GPU (GRAPHICS CARD)
    const gpuSlotGroup = new THREE.Group();
    gpuSlotGroup.position.set(0, 1.35, 0.1);

    const gpuBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.52, 2.7), darkAnodizedMat);
    gpuSlotGroup.add(gpuBody);

    const gpuLightbar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 1.9), rgbMat);
    gpuLightbar.position.set(0.43, 0.08, 0);
    gpuSlotGroup.add(gpuLightbar);

    chassisGroup.add(gpuSlotGroup);
    slotGroupsRef.current['gpu'] = gpuSlotGroup;

    // 8. MODULAR SLOT 7: POWER SUPPLY (PSU)
    const psuSlotGroup = new THREE.Group();
    const psuBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 1.6), darkAnodizedMat);
    psuBox.position.set(0, 0.35, -0.6);
    psuSlotGroup.add(psuBox);
    chassisGroup.add(psuSlotGroup);
    slotGroupsRef.current['psu'] = psuSlotGroup;

    // Pointer Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      rotationVelocityY += deltaX * 0.005;
      rotationVelocityX += deltaY * 0.003;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);

      if (!isDragging) {
        chassisGroup.rotation.y += rotationVelocityY;
        rotationVelocityY *= 0.88;
        chassisGroup.rotation.x = Math.max(-0.35, Math.min(0.35, chassisGroup.rotation.x + rotationVelocityX));
        rotationVelocityX *= 0.88;
      }

      // Smooth camera interpolation toward active step angle
      camera.position.lerp(cameraTargetPos.current, 0.08);
      camera.lookAt(cameraCurrentLookAt.current);

      renderer.render(scene, camera);
      animFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden bg-[#060609] ${className}`}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Assembly Stage HUD */}
      <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0e0e16]/90 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 backdrop-blur-md shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="font-bold text-white">GUIDED MODULAR ASSEMBLY</span>
          <span className="text-zinc-600">|</span>
          <span className="text-purple-400 font-semibold">
            STEP {currentStep.stepNumber} OF {ASSEMBLY_STEPS.length}
          </span>
        </div>

        {/* Active Step Card */}
        <div className="p-3.5 bg-[#0c0c16]/95 border border-purple-500/50 rounded-xl shadow-2xl backdrop-blur-md max-w-sm pointer-events-auto space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">
              {currentStep.slotName}
            </span>
            {parts[currentStep.id] ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Installed</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-400">Awaiting Part</span>
            )}
          </div>

          <h4 className="text-sm font-bold text-white">{currentStep.title}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">{currentStep.description}</p>

          {/* Currently Selected Part in this Slot */}
          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between">
            <span className="text-[11px] font-medium text-white truncate max-w-[190px]">
              {parts[currentStep.id]?.name || 'No component selected yet'}
            </span>
            {onSelectComponentCategory && (
              <button
                onClick={() => onSelectComponentCategory(currentStep.id)}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{parts[currentStep.id] ? 'Swap' : 'Select'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Right: Step Navigation & Auto-Play */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-1.5 backdrop-blur-md ${
            isAutoPlaying
              ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-sm'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:text-white'
          }`}
          title="Auto-play assembly walkthrough"
        >
          {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-purple-400" />}
          <span>{isAutoPlaying ? 'Pause Tour' : 'Auto-Tour'}</span>
        </button>

        <button
          onClick={() => goToStep(0)}
          className="p-1.5 bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors backdrop-blur-md"
          title="Restart from Step 1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Step Indicator Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-2xl bg-[#0c0c16]/95 border border-zinc-800/90 rounded-xl p-2.5 backdrop-blur-md shadow-2xl flex items-center justify-between gap-2">
        <button
          onClick={() => goToStep((currentStepIndex - 1 + ASSEMBLY_STEPS.length) % ASSEMBLY_STEPS.length)}
          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Previous Step"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {ASSEMBLY_STEPS.map((s, idx) => {
            const isInstalled = !!parts[s.id];
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={s.id}
                onClick={() => goToStep(idx)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isCurrent
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-950/60'
                    : isInstalled
                    ? 'bg-zinc-900 text-zinc-300 border border-emerald-500/50'
                    : 'bg-zinc-950 text-zinc-500 border border-zinc-850 hover:text-zinc-300'
                }`}
              >
                <span>{idx + 1}</span>
                <span className="hidden sm:inline">{s.id.toUpperCase()}</span>
                {isInstalled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToStep((currentStepIndex + 1) % ASSEMBLY_STEPS.length)}
          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Next Step"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
