import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BuildSelection, HardwareItem } from '../types';
import {
  Maximize2,
  RotateCcw,
  Eye,
  Layers,
  Palette,
  ChevronDown,
  ChevronUp,
  Cpu as CpuIcon,
  Zap,
  Gauge,
  Volume2,
  VolumeX,
  Sparkles,
  Thermometer,
  Monitor,
  Ruler,
} from 'lucide-react';

interface ThreePCViewerProps {
  parts?: Partial<BuildSelection>;
  lightingColor?: string;
  className?: string;
  onColorChange?: (color: string) => void;
  showControlDock?: boolean;
  onSelectComponentCategory?: (category: string) => void;
  sceneMode?: 'turntable' | 'battlestation';
  onSceneModeChange?: (mode: 'turntable' | 'battlestation') => void;
}

export const PRESET_LIGHTING_COLORS = [
  { name: 'Electric Violet', hex: '#8b5cf6', accent: '#a855f7' },
  { name: 'Crimson Fury', hex: '#ef4444', accent: '#dc2626' },
  { name: 'Cyber Cyan', hex: '#06b6d4', accent: '#3b82f6' },
  { name: 'Emerald Phantom', hex: '#10b981', accent: '#059669' },
  { name: 'Obsidian Stealth', hex: '#1f1f2e', accent: '#2e2e42' },
  { name: 'Pure White', hex: '#f8fafc', accent: '#cbd5e1' },
];

export const ThreePCViewer: React.FC<ThreePCViewerProps> = ({
  parts,
  lightingColor = '#8b5cf6',
  className = '',
  onColorChange,
  showControlDock = true,
  onSelectComponentCategory,
  sceneMode: initialSceneMode = 'turntable',
  onSceneModeChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeColor, setActiveColor] = useState(lightingColor);
  const [explodedAmount, setExplodedAmount] = useState(0);
  const [cameraView, setCameraView] = useState<'hero' | 'cpu' | 'gpu' | 'ram' | 'front' | 'desk'>('hero');
  const [isGlassOpen, setIsGlassOpen] = useState(false);
  const [isCoolerRemoved, setIsCoolerRemoved] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false); // default stable so user can inspect
  const [fanSpeedMode, setFanSpeedMode] = useState<'silent' | 'balanced' | 'turbo'>('balanced');
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [sceneMode, setSceneMode] = useState<'turntable' | 'battlestation'>(initialSceneMode);
  const [showClearance, setShowClearance] = useState(false);

  // References for animation and three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rgbLightsRef = useRef<THREE.PointLight[]>([]);
  const rgbMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const glassPanelRef = useRef<THREE.Mesh | null>(null);
  const coolerGroupRef = useRef<THREE.Group | null>(null);
  const gpuGroupRef = useRef<THREE.Group | null>(null);
  const deskGroupRef = useRef<THREE.Group | null>(null);
  const clearanceGroupRef = useRef<THREE.Group | null>(null);
  const fanMeshesRef = useRef<THREE.Mesh[]>([]);
  const animFrameId = useRef<number>(0);
  const explodedTargetRef = useRef(0);
  const cameraTargetPos = useRef(new THREE.Vector3(4.8, 3.2, 5.2));
  const cameraCurrentLookAt = useRef(new THREE.Vector3(0, 1.8, 0));
  const fanSpeedMultiplier = useRef(1.0);
  const sceneModeRef = useRef(sceneMode);
  const showClearanceRef = useRef(showClearance);

  // Web Audio Context for realistic silent/turbo fan acoustics
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);

  // Sync external lighting color prop
  useEffect(() => {
    setActiveColor(lightingColor);
  }, [lightingColor]);

  // Sync scene mode and clearance refs
  useEffect(() => {
    sceneModeRef.current = sceneMode;
    onSceneModeChange?.(sceneMode);
  }, [sceneMode, onSceneModeChange]);

  useEffect(() => {
    showClearanceRef.current = showClearance;
  }, [showClearance]);

  // Adjust fan speed multiplier based on mode
  useEffect(() => {
    if (fanSpeedMode === 'silent') fanSpeedMultiplier.current = 0.5;
    else if (fanSpeedMode === 'balanced') fanSpeedMultiplier.current = 1.0;
    else fanSpeedMultiplier.current = 2.2;

    if (audioGainRef.current) {
      audioGainRef.current.gain.value = isAudioMuted
        ? 0
        : fanSpeedMode === 'silent'
        ? 0.015
        : fanSpeedMode === 'balanced'
        ? 0.03
        : 0.06;
    }
  }, [fanSpeedMode, isAudioMuted]);

  // Handle Audio Synthesis for Fan Acoustics
  const toggleAudio = () => {
    if (!audioCtxRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // White noise buffer for gentle airflow
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Low-pass filter to sound like smooth laminar airflow
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.025;
        audioGainRef.current = gainNode;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start();
      } catch (e) {
        console.warn('Audio not available', e);
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    setIsAudioMuted(!isAudioMuted);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 2. Initialize Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060609);
    scene.fog = new THREE.FogExp2(0x060609, 0.045);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(4.8, 3.2, 5.2);
    camera.lookAt(0, 1.8, 0);
    cameraRef.current = camera;

    // 3. Renderer with physical lighting & tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Environment Reflection (PMREMGenerator + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.9);
    keyLight.position.set(5, 7, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4c3a75, 1.6);
    fillLight.position.set(-6, 3, -3);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x2d1f4d, 0x050508, 0.9);
    scene.add(hemiLight);

    // Dynamic ARGB Internal Lights
    const rgbColor = new THREE.Color(activeColor);
    const pumpLight = new THREE.PointLight(rgbColor, 4.5, 3.5);
    pumpLight.position.set(-0.55, 2.15, 0.2);
    scene.add(pumpLight);

    const gpuLight = new THREE.PointLight(rgbColor, 5.0, 3.0);
    gpuLight.position.set(0.3, 1.4, 0.4);
    scene.add(gpuLight);

    const topFanLight = new THREE.PointLight(rgbColor, 3.8, 3.0);
    topFanLight.position.set(0, 3.2, 0);
    scene.add(topFanLight);

    rgbLightsRef.current = [pumpLight, gpuLight, topFanLight];

    // 6. Ground Studio Pedestal & Contact Shadow
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07070a,
      roughness: 0.25,
      metalness: 0.85,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Soft circular contact shadow
    const shadowGeo = new THREE.PlaneGeometry(4.8, 3.2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.005, 0);
    scene.add(contactShadow);

    // 7. REALISTIC THREE.JS HARDWARE BLUEPRINT
    const pcGroup = new THREE.Group();
    scene.add(pcGroup);

    // Materials Library
    const matteBlackMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.55,
      metalness: 0.7,
    });

    const darkAnodizedMat = new THREE.MeshStandardMaterial({
      color: 0x181822,
      roughness: 0.22,
      metalness: 0.92,
    });

    const crimsonAccMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.8,
    });

    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x07070a,
      roughness: 0.75,
      metalness: 0.15,
    });

    const nickelIhsMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8de,
      roughness: 0.2,
      metalness: 0.95,
    });

    const goldPinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.9,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.92,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 1,
      roughness: 0.05,
      ior: 1.52,
      thickness: 0.4,
      depthWrite: false,
    });

    const rgbGlowMat = new THREE.MeshStandardMaterial({
      color: rgbColor,
      emissive: rgbColor,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.1,
    });
    rgbMaterialsRef.current = [rgbGlowMat];

    // Procedural CPU Texture generator for true realistic IHS detail!
    const createCpuCanvasTexture = (cpuName: string, isAmd: boolean) => {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 512;
      const ctx = cvs.getContext('2d')!;

      // Nickel-plated heatspreader background
      ctx.fillStyle = '#b8b8c2';
      ctx.fillRect(0, 0, 512, 512);

      // Brushed texture grain
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      for (let i = 0; i < 512; i += 4) {
        ctx.fillRect(0, i, 512, 2);
      }

      // Laser etched text & micro-markings
      ctx.fillStyle = '#42424b';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';

      if (isAmd) {
        ctx.fillText('AMD Ryzen™', 256, 170);
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(cpuName.replace('AMD ', ''), 256, 215);

        ctx.font = '16px monospace';
        ctx.fillStyle = '#555562';
        ctx.fillText('100-000000910 · 8-CORE 3D V-CACHE', 256, 260);
        ctx.fillText('DIFFUSED IN TAIWAN · MADE IN MALAYSIA', 256, 290);
        ctx.fillText('SOCKET AM5 · 2420PNT', 256, 320);

        // Gold Pin-1 triangle indicator at bottom-left
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(35, 475);
        ctx.lineTo(65, 475);
        ctx.lineTo(35, 445);
        ctx.fill();
      } else {
        ctx.fillText('intel® Core™', 256, 170);
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(cpuName.replace('Intel ', ''), 256, 215);

        ctx.font = '16px monospace';
        ctx.fillStyle = '#555562';
        ctx.fillText('CONFIDENTIAL / UNLOCKED 6.20GHz', 256, 260);
        ctx.fillText('SRN48 MALAY 2024 · 320W MAX', 256, 290);
        ctx.fillText('LGA1700 SOCKET COMPATIBLE', 256, 320);

        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(35, 475);
        ctx.lineTo(65, 475);
        ctx.lineTo(35, 445);
        ctx.fill();
      }

      // 2D Data matrix simulation
      ctx.fillStyle = '#33333d';
      ctx.fillRect(400, 380, 70, 70);
      ctx.fillStyle = '#b8b8c2';
      ctx.fillRect(410, 390, 15, 15);
      ctx.fillRect(440, 420, 15, 15);

      const tex = new THREE.CanvasTexture(cvs);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Load authentic Black Raven Logo onto case and pump
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load('/assets/aistudio/image_999d9928.png');
    logoTexture.colorSpace = THREE.SRGBColorSpace;

    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    // (A) Main Outer Case Frame
    const caseWidth = 2.4;
    const caseHeight = 3.4;
    const caseDepth = 3.6;

    // Back Panel & Spine
    const backPanelGeo = new THREE.BoxGeometry(caseWidth, caseHeight, 0.1);
    const backPanel = new THREE.Mesh(backPanelGeo, matteBlackMat);
    backPanel.position.set(0, caseHeight / 2, -caseDepth / 2);
    backPanel.castShadow = true;
    backPanel.receiveShadow = true;
    pcGroup.add(backPanel);

    // Top Panel with mesh cutouts
    const topPanelGeo = new THREE.BoxGeometry(caseWidth, 0.12, caseDepth);
    const topPanel = new THREE.Mesh(topPanelGeo, darkAnodizedMat);
    topPanel.position.set(0, caseHeight, 0);
    topPanel.castShadow = true;
    pcGroup.add(topPanel);

    // Front Panel with Black Raven Logo Emblem
    const frontBadgeGeo = new THREE.PlaneGeometry(1.6, 0.45);
    const frontBadge = new THREE.Mesh(frontBadgeGeo, logoMat);
    frontBadge.position.set(0, 0.35, caseDepth / 2 + 0.01);
    pcGroup.add(frontBadge);

    // Bottom PSU Shroud & Compartment
    const shroudGeo = new THREE.BoxGeometry(caseWidth - 0.1, 0.7, caseDepth - 0.2);
    const shroudMesh = new THREE.Mesh(shroudGeo, darkAnodizedMat);
    shroudMesh.position.set(0, 0.35, 0);
    shroudMesh.castShadow = true;
    shroudMesh.receiveShadow = true;
    pcGroup.add(shroudMesh);

    // PSU Shroud Logo Plate with subtle crimson accent
    const logoPlateGeo = new THREE.BoxGeometry(0.04, 0.2, 1.4);
    const logoPlate = new THREE.Mesh(logoPlateGeo, crimsonAccMat);
    logoPlate.position.set(caseWidth / 2 - 0.08, 0.35, 0.4);
    pcGroup.add(logoPlate);

    // Right Metal Side Panel
    const rightPanelGeo = new THREE.BoxGeometry(0.08, caseHeight - 0.2, caseDepth);
    const rightPanel = new THREE.Mesh(rightPanelGeo, matteBlackMat);
    rightPanel.position.set(-caseWidth / 2, caseHeight / 2, 0);
    pcGroup.add(rightPanel);

    // (B) Left Tempered Glass Panel (removable/openable)
    const glassGeo = new THREE.BoxGeometry(0.04, caseHeight - 0.75, caseDepth - 0.2);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(caseWidth / 2 - 0.02, 0.7 + (caseHeight - 0.75) / 2, 0);
    glassMesh.renderOrder = 2;
    pcGroup.add(glassMesh);
    glassPanelRef.current = glassMesh;

    // (C) Motherboard Tray & VRM Heatsinks
    const moboGeo = new THREE.BoxGeometry(0.08, 2.2, 2.2);
    const mobo = new THREE.Mesh(moboGeo, pcbMat);
    mobo.position.set(-0.7, 1.9, 0);
    mobo.castShadow = true;
    mobo.receiveShadow = true;
    pcGroup.add(mobo);

    // Motherboard PCIe Armor Shield & M.2 Heatsink
    const pcieArmorGeo = new THREE.BoxGeometry(0.12, 0.14, 1.8);
    const pcieArmor = new THREE.Mesh(pcieArmorGeo, darkAnodizedMat);
    pcieArmor.position.set(-0.64, 1.55, 0.2);
    pcGroup.add(pcieArmor);

    // Brushed VRM Heatsinks with subtle crimson trace lines
    const vrmGeo = new THREE.BoxGeometry(0.18, 0.65, 1.4);
    const vrmMesh = new THREE.Mesh(vrmGeo, darkAnodizedMat);
    vrmMesh.position.set(-0.6, 2.6, -0.2);
    pcGroup.add(vrmMesh);

    // (D) THE REAL CPU & MOTHERBOARD SOCKET
    const cpuGroup = new THREE.Group();
    cpuGroup.position.set(-0.62, 2.15, -0.05);

    // 1. Metal Socket Retention Frame
    const socketFrameGeo = new THREE.BoxGeometry(0.05, 0.85, 0.85);
    const socketFrame = new THREE.Mesh(socketFrameGeo, darkAnodizedMat);
    cpuGroup.add(socketFrame);

    // 2. Gold LGA/AM5 Pin Array / Substrate
    const subGeo = new THREE.BoxGeometry(0.06, 0.75, 0.75);
    const subMesh = new THREE.Mesh(subGeo, goldPinMat);
    cpuGroup.add(subMesh);

    // 3. Realistic CPU Integrated Heat Spreader (IHS) with Laser Etched Typography
    const isAmdCpu = parts?.cpu?.brand?.toLowerCase().includes('amd') ?? true;
    const cpuDisplayName = parts?.cpu?.name || 'AMD Ryzen 7 7800X3D';
    const cpuTex = createCpuCanvasTexture(cpuDisplayName, isAmdCpu);

    const ihsGeo = new THREE.BoxGeometry(0.08, 0.65, 0.65);
    const ihsMat = new THREE.MeshStandardMaterial({
      map: cpuTex,
      roughness: 0.35,
      metalness: 0.85,
    });
    const ihsMesh = new THREE.Mesh(ihsGeo, ihsMat);
    ihsMesh.rotation.y = Math.PI / 2; // Face outward toward open glass side panel!
    cpuGroup.add(ihsMesh);

    // 4. Socket Lever Arm
    const leverGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.75, 8);
    const leverMesh = new THREE.Mesh(leverGeo, nickelIhsMat);
    leverMesh.position.set(0.04, -0.4, 0);
    leverMesh.rotation.x = Math.PI / 2;
    cpuGroup.add(leverMesh);

    pcGroup.add(cpuGroup);

    // (E) CPU COOLER (Liquid AIO or Air Cooler)
    const coolerGroup = new THREE.Group();
    coolerGroup.position.set(0, 0, 0);

    const isAirCooler = parts?.cooler?.name?.toLowerCase().includes('ak620') || parts?.cooler?.name?.toLowerCase().includes('air');

    if (isAirCooler) {
      // Dual-Tower Air Cooler (e.g. DeepCool AK620 Zero Dark)
      const tower1 = new THREE.BoxGeometry(0.45, 1.2, 0.9);
      const towerMesh1 = new THREE.Mesh(tower1, matteBlackMat);
      towerMesh1.position.set(-0.45, 2.15, -0.3);
      coolerGroup.add(towerMesh1);

      const tower2 = new THREE.BoxGeometry(0.45, 1.2, 0.9);
      const towerMesh2 = new THREE.Mesh(tower2, matteBlackMat);
      towerMesh2.position.set(-0.45, 2.15, 0.2);
      coolerGroup.add(towerMesh2);

      // Copper heatpipe caps
      for (let h = -0.3; h <= 0.3; h += 0.15) {
        const pipeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8);
        const pipeMesh = new THREE.Mesh(pipeGeo, crimsonAccMat);
        pipeMesh.position.set(-0.45, 2.76, h);
        coolerGroup.add(pipeMesh);
      }
    } else {
      // Obsidian 360mm AIO Pump Block
      const pumpGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 32);
      const pumpMesh = new THREE.Mesh(pumpGeo, darkAnodizedMat);
      pumpMesh.rotation.z = Math.PI / 2;
      pumpMesh.position.set(-0.52, 2.15, -0.05);
      coolerGroup.add(pumpMesh);

      // Infinity Mirror Center Cap on Pump with Black Raven Logo!
      const capGeo = new THREE.PlaneGeometry(0.42, 0.14);
      const capMesh = new THREE.Mesh(capGeo, logoMat);
      capMesh.rotation.y = Math.PI / 2;
      capMesh.position.set(-0.38, 2.15, -0.05);
      coolerGroup.add(capMesh);

      // Glowing ARGB Ring around pump
      const ringPumpGeo = new THREE.TorusGeometry(0.3, 0.025, 16, 32);
      const ringPump = new THREE.Mesh(ringPumpGeo, rgbGlowMat);
      ringPump.rotation.y = Math.PI / 2;
      ringPump.position.set(-0.39, 2.15, -0.05);
      coolerGroup.add(ringPump);

      // Braided Liquid Coolant Tubes
      const tubeCurve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.48, 2.22, 0.1),
        new THREE.Vector3(-0.15, 2.55, 0.45),
        new THREE.Vector3(0.1, 3.1, 0.2),
      ]);
      const tubeGeo1 = new THREE.TubeGeometry(tubeCurve1, 24, 0.045, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x0c0c12,
        roughness: 0.8,
        metalness: 0.3,
      });
      const tubeMesh1 = new THREE.Mesh(tubeGeo1, tubeMat);
      coolerGroup.add(tubeMesh1);

      const tubeCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.48, 2.08, 0.1),
        new THREE.Vector3(-0.18, 2.45, 0.52),
        new THREE.Vector3(0.1, 3.1, 0.35),
      ]);
      const tubeGeo2 = new THREE.TubeGeometry(tubeCurve2, 24, 0.045, 8, false);
      const tubeMesh2 = new THREE.Mesh(tubeGeo2, tubeMat);
      coolerGroup.add(tubeMesh2);
    }

    pcGroup.add(coolerGroup);
    coolerGroupRef.current = coolerGroup;

    // (F) HIGH-END DISCRETE GRAPHIC CARD (GPU)
    const gpuGroup = new THREE.Group();
    gpuGroup.position.set(0, 1.35, 0.1);

    // GPU Dimensions scaled by model
    const is4090 = parts?.gpu?.name?.includes('4090');
    const is4060 = parts?.gpu?.name?.includes('4060');
    const gpuLength = is4090 ? 2.9 : is4060 ? 1.8 : 2.6;
    const gpuThickness = is4090 ? 0.62 : is4060 ? 0.35 : 0.48;

    // GPU Cooler Shroud & Aluminum Fin Array
    const gpuShroudGeo = new THREE.BoxGeometry(0.85, gpuThickness, gpuLength);
    const gpuShroud = new THREE.Mesh(gpuShroudGeo, darkAnodizedMat);
    gpuShroud.castShadow = true;
    gpuShroud.receiveShadow = true;
    gpuGroup.add(gpuShroud);

    // GPU Backplate with flow-through cutout
    const gpuBackplateGeo = new THREE.BoxGeometry(0.85, 0.05, gpuLength);
    const gpuBackplate = new THREE.Mesh(gpuBackplateGeo, matteBlackMat);
    gpuBackplate.position.set(0, gpuThickness / 2 + 0.02, 0);
    gpuGroup.add(gpuBackplate);

    // GPU Side Illuminated Lightbar ("GEFORCE RTX / BLACK RAVEN")
    const gpuLightbarGeo = new THREE.BoxGeometry(0.04, 0.12, gpuLength * 0.7);
    const gpuLightbar = new THREE.Mesh(gpuLightbarGeo, rgbGlowMat);
    gpuLightbar.position.set(0.43, 0.08, 0);
    gpuGroup.add(gpuLightbar);

    // 12VHPWR 600W Power Cable with Comb
    const psuCableGeo = new THREE.BoxGeometry(0.18, 0.1, 0.2);
    const psuCable = new THREE.Mesh(psuCableGeo, crimsonAccMat);
    psuCable.position.set(0.44, 0.15, -0.3);
    gpuGroup.add(psuCable);

    // Anti-Sag GPU Bracket
    const bracketGeo = new THREE.BoxGeometry(0.06, 0.8, 0.06);
    const bracketMesh = new THREE.Mesh(bracketGeo, darkAnodizedMat);
    bracketMesh.position.set(0.4, -0.4, gpuLength / 2 - 0.2);
    gpuGroup.add(bracketMesh);

    // GPU Fans
    const fanMeshes: THREE.Mesh[] = [];
    const fanCount = is4060 ? 2 : 3;
    const fanRadius = 0.32;
    const fanGeo = new THREE.CylinderGeometry(fanRadius, fanRadius, 0.06, 16);
    const fanMat = new THREE.MeshStandardMaterial({
      color: 0x14141c,
      roughness: 0.4,
      metalness: 0.6,
    });

    const fanZOffsets = fanCount === 2 ? [-0.45, 0.45] : [-0.85, 0, 0.85];
    fanZOffsets.forEach((zOffset) => {
      const fan = new THREE.Mesh(fanGeo, fanMat);
      fan.rotation.z = Math.PI / 2;
      fan.position.set(0.43, -0.05, zOffset);
      gpuGroup.add(fan);
      fanMeshes.push(fan);
    });

    pcGroup.add(gpuGroup);
    gpuGroupRef.current = gpuGroup;
    fanMeshesRef.current = fanMeshes;

    // (G) RAM MEMORY STICKS (DDR5 Dual/Quad Channel)
    const ramStickCount = parts?.ram?.specs?.Capacity?.includes('64GB') ? 4 : 2;
    const ramZOffsets = ramStickCount === 4 ? [-0.15, -0.05, 0.05, 0.15] : [-0.08, 0.08];

    ramZOffsets.forEach((zOff) => {
      const ramStickGeo = new THREE.BoxGeometry(0.12, 0.42, 0.035);
      const ramStick = new THREE.Mesh(ramStickGeo, darkAnodizedMat);
      ramStick.position.set(-0.58, 2.45, 0.4 + zOff);
      pcGroup.add(ramStick);

      const ramLightbarGeo = new THREE.BoxGeometry(0.12, 0.06, 0.035);
      const ramLightbar = new THREE.Mesh(ramLightbarGeo, rgbGlowMat);
      ramLightbar.position.set(-0.58, 2.68, 0.4 + zOff);
      pcGroup.add(ramLightbar);
    });

    // (H) TOP 360mm RADIATOR & 3 GLOWING ARGB FANS
    const radGeo = new THREE.BoxGeometry(0.9, 0.14, 2.7);
    const radMesh = new THREE.Mesh(radGeo, matteBlackMat);
    radMesh.position.set(0, 3.25, 0);
    pcGroup.add(radMesh);

    [-0.85, 0, 0.85].forEach((zOff) => {
      const ringGeo = new THREE.TorusGeometry(0.35, 0.04, 12, 24);
      const ringMesh = new THREE.Mesh(ringGeo, rgbGlowMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(0, 3.16, zOff);
      pcGroup.add(ringMesh);

      // Radiator fan blades
      const radFan = new THREE.Mesh(fanGeo, fanMat);
      radFan.position.set(0, 3.2, zOff);
      pcGroup.add(radFan);
      fanMeshes.push(radFan);
    });

    // (I) BATTLESTATION GAMING DESK SETUP
    const deskGroup = new THREE.Group();

    // 1. Sleek Carbon/Dark Walnut Desktop Surface
    const deskTopGeo = new THREE.BoxGeometry(10.5, 0.14, 4.6);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.35,
      metalness: 0.6,
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskMat);
    deskTop.position.set(-1.0, -0.07, 0);
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Modern Industrial Steel Desk Frame Legs
    const legGeo = new THREE.BoxGeometry(0.12, 2.6, 3.8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x12121a,
      roughness: 0.5,
      metalness: 0.8,
    });
    const legLeft = new THREE.Mesh(legGeo, legMat);
    legLeft.position.set(-5.8, -1.4, 0);
    deskGroup.add(legLeft);

    const legRight = new THREE.Mesh(legGeo, legMat);
    legRight.position.set(3.8, -1.4, 0);
    deskGroup.add(legRight);

    // 2. Custom Stitched Black Raven Extended Desk Mat
    const deskPadGeo = new THREE.PlaneGeometry(4.6, 2.0);
    const deskPadMat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      roughness: 0.8,
      metalness: 0.1,
      color: 0x22222c,
    });
    const deskPad = new THREE.Mesh(deskPadGeo, deskPadMat);
    deskPad.rotation.x = -Math.PI / 2;
    deskPad.position.set(-1.8, 0.005, 0.35);
    deskPad.receiveShadow = true;
    deskGroup.add(deskPad);

    // 3. 34-Inch Curved Ultrawide Gaming Monitor
    const monGroup = new THREE.Group();
    monGroup.position.set(-1.8, 0, -0.7);

    // Monitor Heavy Cast-Aluminum V-Stand
    const monStandGeo = new THREE.BoxGeometry(1.6, 0.04, 0.9);
    const monStand = new THREE.Mesh(monStandGeo, darkAnodizedMat);
    monStand.position.set(0, 0.02, 0);
    monGroup.add(monStand);

    const monArmGeo = new THREE.BoxGeometry(0.18, 1.8, 0.12);
    const monArm = new THREE.Mesh(monArmGeo, darkAnodizedMat);
    monArm.position.set(0, 1.0, -0.2);
    monArm.rotation.x = -0.12;
    monGroup.add(monArm);

    // Monitor Bezel & Chassis
    const monBezelGeo = new THREE.BoxGeometry(4.4, 1.9, 0.12);
    const monBezel = new THREE.Mesh(monBezelGeo, matteBlackMat);
    monBezel.position.set(0, 1.8, 0);
    monGroup.add(monBezel);

    // Monitor Display Screen with Live Telemetry Canvas Texture
    const monCvs = document.createElement('canvas');
    monCvs.width = 1024;
    monCvs.height = 512;
    const mCtx = monCvs.getContext('2d')!;
    mCtx.fillStyle = '#06060c';
    mCtx.fillRect(0, 0, 1024, 512);

    // Header bar
    mCtx.fillStyle = '#10101c';
    mCtx.fillRect(0, 0, 1024, 64);
    mCtx.fillStyle = '#8b5cf6';
    mCtx.font = 'bold 22px monospace';
    mCtx.fillText('BLACK RAVEN ENTHUSIAST ARCHITECTURE // TELEMETRY OSD', 36, 42);

    // Telemetry Cards
    mCtx.fillStyle = '#0a0a14';
    mCtx.fillRect(40, 90, 290, 170);
    mCtx.strokeStyle = '#8b5cf6';
    mCtx.lineWidth = 2;
    mCtx.strokeRect(40, 90, 290, 170);
    mCtx.fillStyle = '#ffffff';
    mCtx.font = 'bold 36px monospace';
    mCtx.fillText('240+ FPS', 65, 150);
    mCtx.fillStyle = '#94a3b8';
    mCtx.font = '15px monospace';
    mCtx.fillText('4K ULTRA HIGH REFRESH', 65, 185);
    mCtx.fillText('DLSS 3.5 RAY RECONSTRUCTION', 65, 215);

    mCtx.fillStyle = '#0a0a14';
    mCtx.fillRect(365, 90, 290, 170);
    mCtx.strokeStyle = '#3b82f6';
    mCtx.strokeRect(365, 90, 290, 170);
    mCtx.fillStyle = '#ffffff';
    mCtx.font = 'bold 36px monospace';
    mCtx.fillText('42°C CPU', 390, 150);
    mCtx.fillStyle = '#94a3b8';
    mCtx.font = '15px monospace';
    mCtx.fillText('360mm AIO PUMP: 2600 RPM', 390, 185);
    mCtx.fillText('104MB 3D V-CACHE LOAD 34%', 390, 215);

    mCtx.fillStyle = '#0a0a14';
    mCtx.fillRect(690, 90, 290, 170);
    mCtx.strokeStyle = '#10b981';
    mCtx.strokeRect(690, 90, 290, 170);
    mCtx.fillStyle = '#ffffff';
    mCtx.font = 'bold 36px monospace';
    mCtx.fillText('54°C GPU', 715, 150);
    mCtx.fillStyle = '#94a3b8';
    mCtx.font = '15px monospace';
    mCtx.fillText('VRAM: 24GB GDDR6X', 715, 185);
    mCtx.fillText('PCIE 4.0 X16 · CLOCK 2750MHz', 715, 215);

    // Frame-time wave graph
    mCtx.strokeStyle = '#a855f7';
    mCtx.lineWidth = 3;
    mCtx.beginPath();
    mCtx.moveTo(40, 420);
    for (let x = 40; x < 984; x += 30) {
      const y = 420 + Math.sin(x * 0.04) * 22;
      mCtx.lineTo(x, y);
    }
    mCtx.stroke();

    const monTex = new THREE.CanvasTexture(monCvs);
    monTex.colorSpace = THREE.SRGBColorSpace;
    const monScreenGeo = new THREE.PlaneGeometry(4.3, 1.8);
    const monScreenMat = new THREE.MeshBasicMaterial({
      map: monTex,
    });
    const monScreen = new THREE.Mesh(monScreenGeo, monScreenMat);
    monScreen.position.set(0, 1.8, 0.07);
    monGroup.add(monScreen);

    // Monitor Ambient Bias Glow Strip behind screen
    const monBiasLight = new THREE.PointLight(rgbColor, 2.5, 4.0);
    monBiasLight.position.set(0, 1.8, -0.4);
    monGroup.add(monBiasLight);
    rgbLightsRef.current.push(monBiasLight);

    deskGroup.add(monGroup);

    // 4. Compact 75% Mechanical Gaming Keyboard
    const kbGroup = new THREE.Group();
    kbGroup.position.set(-2.2, 0.04, 0.5);

    const kbBaseGeo = new THREE.BoxGeometry(1.6, 0.06, 0.65);
    const kbBase = new THREE.Mesh(kbBaseGeo, matteBlackMat);
    kbGroup.add(kbBase);

    // Keycaps with glowing RGB backlight
    const keyGeo = new THREE.BoxGeometry(1.5, 0.04, 0.55);
    const keyMesh = new THREE.Mesh(keyGeo, rgbGlowMat);
    keyMesh.position.set(0, 0.04, 0);
    kbGroup.add(keyMesh);
    deskGroup.add(kbGroup);

    // 5. Ergonomic Wireless Gaming Mouse
    const mouseGeo = new THREE.BoxGeometry(0.25, 0.1, 0.45);
    const mouseMesh = new THREE.Mesh(mouseGeo, darkAnodizedMat);
    mouseMesh.position.set(-0.7, 0.05, 0.5);
    deskGroup.add(mouseMesh);

    scene.add(deskGroup);
    deskGroupRef.current = deskGroup;
    deskGroup.visible = (sceneModeRef.current === 'battlestation');

    // (J) 3D SPATIAL CLEARANCE DIMENSION MARKERS
    const clearanceGroup = new THREE.Group();

    // GPU Length Clearance Ruler
    const createRulerLabelCanvas = (text: string, color: string) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 128;
      const x = c.getContext('2d')!;
      x.fillStyle = 'rgba(10, 10, 18, 0.85)';
      x.roundRect(4, 4, 504, 120, 16);
      x.fill();
      x.strokeStyle = color;
      x.lineWidth = 4;
      x.roundRect(4, 4, 504, 120, 16);
      x.stroke();
      x.fillStyle = '#ffffff';
      x.font = 'bold 30px monospace';
      x.textAlign = 'center';
      x.fillText(text, 256, 75);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };

    // GPU Length Dimension
    const gpuLabelTex = createRulerLabelCanvas('GPU: 357mm (420mm MAX CLEARANCE - OK)', '#10b981');
    const gpuLabelMat = new THREE.MeshBasicMaterial({ map: gpuLabelTex, transparent: true });
    const gpuLabelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), gpuLabelMat);
    gpuLabelMesh.position.set(0.6, 1.6, 0.1);
    gpuLabelMesh.rotation.y = Math.PI / 2;
    clearanceGroup.add(gpuLabelMesh);

    // Top Radiator Clearance Dimension
    const radLabelTex = createRulerLabelCanvas('TOP 360mm RADIATOR (RAM CLEARANCE - OK)', '#8b5cf6');
    const radLabelMat = new THREE.MeshBasicMaterial({ map: radLabelTex, transparent: true });
    const radLabelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), radLabelMat);
    radLabelMesh.position.set(0.6, 3.4, 0);
    radLabelMesh.rotation.y = Math.PI / 2;
    clearanceGroup.add(radLabelMesh);

    scene.add(clearanceGroup);
    clearanceGroupRef.current = clearanceGroup;
    clearanceGroup.visible = showClearanceRef.current;

    // 8. Pointer Drag Interaction for 3D Camera Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      setAutoRotate(false);
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

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.003;
      const curDist = camera.position.distanceTo(cameraCurrentLookAt.current);
      if ((curDist > 1.2 && zoomFactor < 0) || (curDist < 10 && zoomFactor > 0)) {
        camera.position.addScaledVector(
          camera.position.clone().sub(cameraCurrentLookAt.current).normalize(),
          zoomFactor
        );
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Main Render Loop
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);

      // Auto-rotation when not interacting
      if (autoRotate && !isDragging) {
        pcGroup.rotation.y += delta * 0.25;
      } else {
        pcGroup.rotation.y += rotationVelocityY;
        rotationVelocityY *= 0.88;
        pcGroup.rotation.x = Math.max(-0.35, Math.min(0.35, pcGroup.rotation.x + rotationVelocityX));
        rotationVelocityX *= 0.88;
      }

      // Rotate all fans dynamically according to fan speed mode!
      const spinSpeed = delta * 7.0 * fanSpeedMultiplier.current;
      fanMeshes.forEach((fan) => {
        fan.rotation.y += spinSpeed;
      });

      // Smooth camera position interpolation
      camera.position.lerp(cameraTargetPos.current, 0.08);
      camera.lookAt(cameraCurrentLookAt.current);

      // Exploded View smooth animation
      const curExp = explodedAmount;
      const targetExp = explodedTargetRef.current;
      const nextExp = THREE.MathUtils.damp(curExp, targetExp, 6, delta);

      if (glassPanelRef.current) {
        glassPanelRef.current.position.x = caseWidth / 2 - 0.02 + nextExp * 1.6 + (isGlassOpen ? 1.4 : 0);
        glassPanelRef.current.rotation.y = isGlassOpen ? 0.35 : 0;
      }

      if (gpuGroupRef.current) {
        gpuGroupRef.current.position.x = nextExp * 0.6;
      }

      // Cooler lift-off animation when inspecting bare CPU!
      if (coolerGroupRef.current) {
        coolerGroupRef.current.position.x = isCoolerRemoved ? 1.2 : 0;
        coolerGroupRef.current.position.y = isCoolerRemoved ? 0.4 : 0;
      }

      // Update Battlestation Desk and Clearance group visibility
      if (deskGroupRef.current) {
        deskGroupRef.current.visible = (sceneModeRef.current === 'battlestation');
      }
      if (clearanceGroupRef.current) {
        clearanceGroupRef.current.visible = showClearanceRef.current;
      }

      // Reposition PC when in battlestation desk mode
      const targetPcX = sceneModeRef.current === 'battlestation' ? 1.4 : 0;
      pcGroup.position.x = THREE.MathUtils.damp(pcGroup.position.x, targetPcX, 4, delta);

      renderer.render(scene, camera);
      animFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);

      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      matteBlackMat.dispose();
      darkAnodizedMat.dispose();
      crimsonAccMat.dispose();
      pcbMat.dispose();
      glassMat.dispose();
      rgbGlowMat.dispose();
      container.innerHTML = '';
    };
  }, [parts]);

  // Update RGB color across lights and emissive materials
  useEffect(() => {
    const col = new THREE.Color(activeColor);
    rgbLightsRef.current.forEach((light) => {
      light.color = col;
    });
    rgbMaterialsRef.current.forEach((mat) => {
      mat.color = col;
      mat.emissive = col;
    });
  }, [activeColor]);

  // Exploded View target updates
  useEffect(() => {
    explodedTargetRef.current = explodedAmount;
  }, [explodedAmount]);

  // Camera presets
  const applyCameraPreset = (preset: 'hero' | 'cpu' | 'gpu' | 'ram' | 'front' | 'desk') => {
    setCameraView(preset);
    setAutoRotate(false);
    switch (preset) {
      case 'hero':
        cameraTargetPos.current.set(4.8, 3.2, 5.2);
        cameraCurrentLookAt.current.set(0, 1.8, 0);
        setSelectedHotspot(null);
        break;
      case 'desk':
        cameraTargetPos.current.set(0.6, 4.2, 8.4);
        cameraCurrentLookAt.current.set(-0.8, 1.6, 0);
        setSelectedHotspot(null);
        break;
      case 'cpu':
        // Close-up Macro view into bare CPU socket
        cameraTargetPos.current.set(0.1, 2.15, 1.4);
        cameraCurrentLookAt.current.set(-0.62, 2.15, -0.05);
        setSelectedHotspot('cpu');
        break;
      case 'gpu':
        // Close-up on graphics card
        cameraTargetPos.current.set(2.2, 1.35, 1.8);
        cameraCurrentLookAt.current.set(0, 1.35, 0.1);
        setSelectedHotspot('gpu');
        break;
      case 'ram':
        // Close-up on memory slots
        cameraTargetPos.current.set(0.6, 2.7, 1.6);
        cameraCurrentLookAt.current.set(-0.58, 2.45, 0.4);
        setSelectedHotspot('ram');
        break;
      case 'front':
        cameraTargetPos.current.set(0, 2.0, 5.8);
        cameraCurrentLookAt.current.set(0, 1.8, 0);
        setSelectedHotspot(null);
        break;
    }
  };

  const handleColorSelect = (hex: string) => {
    setActiveColor(hex);
    onColorChange?.(hex);
  };

  return (
    <div className={`relative w-full h-full select-none overflow-hidden bg-[#060609] ${className}`}>
      {/* 3D WebGL Canvas isolated mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Spec / State Tag with Authentic Logo */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#0e0e16]/85 border border-zinc-800/80 rounded-lg text-xs font-mono text-zinc-300 backdrop-blur-md shadow-lg">
          <img
            src="/assets/aistudio/image_999d9928.png"
            alt="BLACK RAVEN"
            className="h-4.5 w-auto object-contain filter drop-shadow"
          />
          <span className="text-zinc-600">|</span>
          <span className="text-purple-400 font-semibold">3D HARDWARE SIMULATOR</span>
        </div>

        {/* Live Simulated Telemetry Badge */}
        <div className="flex items-center gap-3 px-3 py-1 bg-black/60 border border-zinc-800/80 rounded-md text-[11px] font-mono text-zinc-400 backdrop-blur-md">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-purple-400" />
            <span>CPU: 42°C</span>
          </div>
          <span className="text-zinc-700">·</span>
          <div>GPU: 58°C</div>
          <span className="text-zinc-700">·</span>
          <div className="text-emerald-400">
            {fanSpeedMode === 'silent' ? '800 RPM' : fanSpeedMode === 'balanced' ? '1400 RPM' : '2200 RPM'}
          </div>
        </div>
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Fan Acoustic Sound Toggle */}
        <button
          onClick={toggleAudio}
          className={`px-2.5 py-1.5 text-xs rounded-md transition-colors border flex items-center gap-1.5 backdrop-blur-md ${
            !isAudioMuted
              ? 'bg-purple-950/80 text-purple-300 border-purple-500'
              : 'bg-[#0e0e16]/80 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
          title="Toggle Acoustic Fan Sound"
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
          <span className="hidden sm:inline">{isAudioMuted ? 'Muted' : 'Acoustic On'}</span>
        </button>

        {/* Turntable Rotation */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1.5 text-xs rounded-md transition-colors border flex items-center gap-1.5 backdrop-blur-md ${
            autoRotate
              ? 'bg-purple-950/80 text-purple-300 border-purple-500'
              : 'bg-[#0e0e16]/80 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
          title="Toggle Turntable Rotation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{autoRotate ? 'Turntable' : 'Manual'}</span>
        </button>

        <button
          onClick={() => applyCameraPreset('hero')}
          className="p-1.5 bg-[#0e0e16]/80 border border-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors backdrop-blur-md"
          title="Reset Camera View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Component Focus Tooltip Overlay */}
      {selectedHotspot && (
        <div className="absolute top-16 right-4 z-20 max-w-xs p-3.5 bg-[#0e0e16]/95 border border-purple-500/60 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="font-mono text-[10px] text-purple-400 uppercase tracking-widest font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {selectedHotspot.toUpperCase()} HARDWARE INSPECT
            </span>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {selectedHotspot === 'cpu' && (
            <div>
              <h5 className="font-bold text-white text-sm">
                {parts?.cpu?.name || 'AMD Ryzen 7 7800X3D'}
              </h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {parts?.cpu?.specs?.Cores || '8 Cores / 16 Threads'} · Socket {parts?.cpu?.socket || 'AM5'}
              </p>
              <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">IHS Finish: Nickel-Plated</span>
                <span className="text-emerald-400 font-mono">38W Idle / 84W Gaming</span>
              </div>
            </div>
          )}

          {selectedHotspot === 'gpu' && (
            <div>
              <h5 className="font-bold text-white text-sm">
                {parts?.gpu?.name || 'ASUS ROG Strix RTX 4090'}
              </h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {parts?.gpu?.specs?.VRAM || '24GB GDDR6X'} · PCIe 4.0 x16
              </p>
              <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Triple Axial Fans</span>
                <span className="text-purple-400 font-mono">DLSS 3.5 Active</span>
              </div>
            </div>
          )}

          {selectedHotspot === 'ram' && (
            <div>
              <h5 className="font-bold text-white text-sm">
                {parts?.ram?.name || 'Corsair Vengeance RGB DDR5'}
              </h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {parts?.ram?.specs?.Capacity || '32GB (2x16GB)'} · {parts?.ram?.specs?.Speed || '6000 MT/s'}
              </p>
            </div>
          )}

          {onSelectComponentCategory && (
            <button
              onClick={() => onSelectComponentCategory(selectedHotspot)}
              className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold text-[11px] mt-1 transition-colors"
            >
              Configure in Builder
            </button>
          )}
        </div>
      )}

      {/* Unified Bottom Control Dock */}
      {showControlDock && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-3xl">
          {/* Collapse / Expand Toggle Tab */}
          <div className="flex justify-center -mb-px">
            <button
              onClick={() => setIsDockCollapsed(!isDockCollapsed)}
              className="px-4 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-[#0e0e16]/95 border-t border-x border-zinc-800/90 rounded-t-md transition-colors flex items-center gap-1.5 shadow-lg"
            >
              {isDockCollapsed ? (
                <>
                  <ChevronUp className="w-3 h-3 text-purple-400" />
                  Show Hardware Configurator
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                  Cinema Mode
                </>
              )}
            </button>
          </div>

          {!isDockCollapsed && (
            <div className="p-3 bg-[#0d0d14]/95 border border-zinc-800/90 rounded-b-xl rounded-t-sm shadow-2xl backdrop-blur-md space-y-2.5">
              {/* Row 1: Camera Angle & Component Focus */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Camera / Component Presets */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-zinc-500 mr-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Focus:
                  </span>
                  {[
                    { id: 'hero', label: 'Overview' },
                    { id: 'desk', label: 'Battlestation' },
                    { id: 'cpu', label: 'CPU Socket' },
                    { id: 'gpu', label: 'GPU' },
                    { id: 'ram', label: 'RAM' },
                    { id: 'front', label: 'Chassis' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyCameraPreset(preset.id as any)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        cameraView === preset.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Environment Mode: Turntable vs Desk */}
                  <button
                    onClick={() => {
                      const next = sceneMode === 'battlestation' ? 'turntable' : 'battlestation';
                      setSceneMode(next);
                      if (next === 'battlestation') applyCameraPreset('desk');
                      else applyCameraPreset('hero');
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border flex items-center gap-1.5 ${
                      sceneMode === 'battlestation'
                        ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-sm'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                    title="Toggle between studio turntable and immersive battlestation desk"
                  >
                    <Monitor className="w-3 h-3 text-purple-400" />
                    <span>{sceneMode === 'battlestation' ? 'Desk Setup' : 'Studio Turntable'}</span>
                  </button>

                  {/* 3D Spatial Clearance Dimension Markers */}
                  <button
                    onClick={() => setShowClearance(!showClearance)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border flex items-center gap-1.5 ${
                      showClearance
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                    title="Inspect GPU length and radiator clearances in 3D"
                  >
                    <Ruler className="w-3 h-3 text-emerald-400" />
                    <span>{showClearance ? 'Clearances: Active' : 'Check Clearances'}</span>
                  </button>

                  {/* Inspect Bare CPU Toggle */}
                  <button
                    onClick={() => {
                      setIsCoolerRemoved(!isCoolerRemoved);
                      if (!isCoolerRemoved) {
                        applyCameraPreset('cpu');
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border flex items-center gap-1.5 ${
                      isCoolerRemoved
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-purple-500'
                    }`}
                    title="Lift off cooler to view raw CPU heatspreader"
                  >
                    <CpuIcon className="w-3 h-3 text-purple-400" />
                    <span>{isCoolerRemoved ? 'Cooler Lifted' : 'Lift Cooler (CPU)'}</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Lighting, Fan Tuning & Exploded Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs">
                {/* RGB Lighting Swatches */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-500 mr-1 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> RGB
                  </span>
                  {PRESET_LIGHTING_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      onClick={() => handleColorSelect(col.hex)}
                      className={`w-5 h-5 rounded-full transition-transform border ${
                        activeColor === col.hex
                          ? 'scale-125 border-white ring-2 ring-purple-500/50'
                          : 'border-zinc-700 hover:scale-110 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>

                {/* Fan Speed Tuning */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-zinc-500 mr-1 flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> Fan Curve:
                  </span>
                  {(['silent', 'balanced', 'turbo'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFanSpeedMode(mode)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-colors ${
                        fanSpeedMode === mode
                          ? 'bg-purple-950 text-purple-300 border border-purple-500 font-bold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Glass Door & Exploded Inspection */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsGlassOpen(!isGlassOpen)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors border ${
                      isGlassOpen
                        ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isGlassOpen ? 'Close Glass' : 'Open Glass'}
                  </button>

                  <div className="flex items-center gap-1.5" title="Exploded View Separation">
                    <Layers className="w-3 h-3 text-zinc-500" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={explodedAmount}
                      onChange={(e) => setExplodedAmount(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
