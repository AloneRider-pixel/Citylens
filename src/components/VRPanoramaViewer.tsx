import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Compass,
  RotateCcw,
  Smartphone,
  Eye,
  Glasses,
  X,
  Sparkles,
  Layers,
  Shield,
  Flame,
  Maximize2,
  Minimize2,
  Split,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { KeyFocalPoint, LandmarkRecognitionResult } from '../types';

interface VRPanoramaViewerProps {
  imageSrc: string;
  recognition: LandmarkRecognitionResult;
  activePointId: string | null;
  onSelectPoint: (point: KeyFocalPoint | null) => void;
  onExitVR: () => void;
  filterStyle?: string;
}

export const VRPanoramaViewer: React.FC<VRPanoramaViewerProps> = ({
  imageSrc,
  recognition,
  activePointId,
  onSelectPoint,
  onExitVR,
  filterStyle = 'none',
}) => {
  // Orientation angles in degrees
  const [yaw, setYaw] = useState<number>(0); // Horizontal rotation (0 - 360°)
  const [pitch, setPitch] = useState<number>(0); // Vertical tilt (-75° to 75°)
  const [roll, setRoll] = useState<number>(0); // Device roll tilt (-45° to 45°)

  // Gyroscope tracking state
  const [hasGyro, setHasGyro] = useState<boolean>(false);
  const [gyroActive, setGyroActive] = useState<boolean>(false);
  const [permissionRequired, setPermissionRequired] = useState<boolean>(false);

  // Calibration baseline
  const initialAlphaRef = useRef<number | null>(null);
  const initialBetaRef = useRef<number | null>(null);

  // Drag interaction state (for mouse / touch fallback and manual offset)
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const baseYawRef = useRef<number>(0);
  const basePitchRef = useRef<number>(0);

  // VR Display mode: 'mono' (single full viewport) or 'cardboard' (stereoscopic split)
  const [isCardboardMode, setIsCardboardMode] = useState<boolean>(false);
  const [fov, setFov] = useState<number>(80); // Virtual field-of-view in degrees
  const [gazeTarget, setGazeTarget] = useState<KeyFocalPoint | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Play subtle feedback sound when gaze locks onto a hotspot
  const playGazeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // E6
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context not allowed or unsupported
    }
  };

  // Check & Request DeviceOrientation API
  const requestOrientationPermission = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionRequired(false);
          setGyroActive(true);
        } else {
          setPermissionRequired(false);
        }
      } catch (err) {
        console.warn('Orientation permission error:', err);
        setPermissionRequired(false);
      }
    } else {
      setGyroActive(true);
    }
  };

  // Listen to DeviceOrientation API
  useEffect(() => {
    // Check if DeviceOrientation requires iOS permission
    if (
      typeof window !== 'undefined' &&
      typeof (window as any).DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      setPermissionRequired(true);
    } else {
      setGyroActive(true);
    }

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const { alpha, beta, gamma } = event;
      if (alpha === null || beta === null) return;

      setHasGyro(true);

      // Initialize baseline orientation on first reading to face monument directly
      if (initialAlphaRef.current === null) {
        initialAlphaRef.current = alpha;
        initialBetaRef.current = beta;
      }

      // Compute relative angles
      const relAlpha = alpha - (initialAlphaRef.current ?? 0);
      const relBeta = beta - (initialBetaRef.current ?? 0);
      const relGamma = gamma ?? 0;

      // Wrap yaw to 0 - 360
      let computedYaw = (baseYawRef.current - relAlpha) % 360;
      if (computedYaw < 0) computedYaw += 360;

      // Clamp pitch to realistic sight range (-70° to 70°)
      const computedPitch = Math.max(-70, Math.min(70, basePitchRef.current + relBeta));
      const computedRoll = Math.max(-30, Math.min(30, relGamma * 0.4));

      setYaw(computedYaw);
      setPitch(computedPitch);
      setRoll(computedRoll);
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    };
  }, []);

  // Recenter VR view directly in front of the landmark
  const handleRecenter = () => {
    initialAlphaRef.current = null;
    initialBetaRef.current = null;
    baseYawRef.current = 0;
    basePitchRef.current = 0;
    setYaw(0);
    setPitch(0);
    setRoll(0);
  };

  // Touch and Mouse Dragging Handlers for non-gyro devices or manual panning
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    dragStartRef.current = { x: clientX, y: clientY };

    // Update yaw and pitch
    setYaw((prevYaw) => {
      const nextYaw = (prevYaw - deltaX * 0.3) % 360;
      const normalized = nextYaw < 0 ? nextYaw + 360 : nextYaw;
      baseYawRef.current = normalized;
      return normalized;
    });

    setPitch((prevPitch) => {
      const nextPitch = Math.max(-70, Math.min(70, prevPitch + deltaY * 0.25));
      basePitchRef.current = nextPitch;
      return nextPitch;
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom/FOV adjustment with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    setFov((prev) => Math.max(50, Math.min(105, prev + (e.deltaY > 0 ? 3 : -3))));
  };

  // Convert landmark key focal points from 2D image coordinates to 3D spatial panorama coordinates
  const spatialPoints = useMemo(() => {
    return recognition.keyFocalPoints.map((point) => {
      // Map relativeX (0 to 100%) to spherical azimuth (-50° to +50°)
      const azimuthDeg = (point.relativeX - 50) * 1.05;
      // Map relativeY (0 to 100%) to spherical elevation (+25° to -25°)
      const elevationDeg = (50 - point.relativeY) * 0.55;

      return {
        ...point,
        azimuthDeg,
        elevationDeg,
        distanceRadius: 650, // 3D projection radius in px
      };
    });
  }, [recognition.keyFocalPoints]);

  // Gaze Detection: check if current crosshair (yaw, pitch) is looking directly at a hotspot
  useEffect(() => {
    // Current looking angle normalized (-180 to 180)
    let lookYaw = yaw > 180 ? yaw - 360 : yaw;
    let lookPitch = pitch;

    // Find if any point is within the gaze threshold (~7 degrees)
    const threshold = 7;
    const hit = spatialPoints.find((point) => {
      const yawDiff = Math.abs(point.azimuthDeg - lookYaw);
      const pitchDiff = Math.abs(point.elevationDeg - lookPitch);
      return yawDiff <= threshold && pitchDiff <= threshold;
    });

    if (hit) {
      if (!gazeTarget || gazeTarget.id !== hit.id) {
        playGazeSound();
      }
      setGazeTarget(hit);
    } else {
      setGazeTarget(null);
    }
  }, [yaw, pitch, spatialPoints]);

  // Compass Heading calculation and Cardinal text
  const getCompassHeadingText = (heading: number) => {
    const deg = (heading % 360 + 360) % 360;
    const cardinals = [
      { name: 'N', min: 348.75, max: 11.25 },
      { name: 'NNE', min: 11.25, max: 33.75 },
      { name: 'NE', min: 33.75, max: 56.25 },
      { name: 'ENE', min: 56.25, max: 78.75 },
      { name: 'E', min: 78.75, max: 101.25 },
      { name: 'ESE', min: 101.25, max: 123.75 },
      { name: 'SE', min: 123.75, max: 146.25 },
      { name: 'SSE', min: 146.25, max: 168.75 },
      { name: 'S', min: 168.75, max: 191.25 },
      { name: 'SSW', min: 191.25, max: 213.75 },
      { name: 'SW', min: 213.75, max: 236.25 },
      { name: 'WSW', min: 236.25, max: 258.75 },
      { name: 'W', min: 258.75, max: 281.25 },
      { name: 'WNW', min: 281.25, max: 303.75 },
      { name: 'NW', min: 303.75, max: 326.25 },
      { name: 'NNW', min: 326.25, max: 348.75 },
    ];

    const match = cardinals.find((c) =>
      c.name === 'N' ? deg >= c.min || deg < c.max : deg >= c.min && deg < c.max
    );
    return `${Math.round(deg)}° ${match?.name || 'N'}`;
  };

  const getTagBadge = (type: string) => {
    switch (type) {
      case 'architectural':
        return { label: 'Arch Detail', icon: Layers, color: 'bg-cyan-500 text-slate-950' };
      case 'historical':
        return { label: 'Historical', icon: Shield, color: 'bg-amber-500 text-slate-950' };
      case 'trivia':
        return { label: 'Secret Trivia', icon: Flame, color: 'bg-rose-500 text-white' };
      case 'viewpoint':
      default:
        return { label: 'Vantage Point', icon: Eye, color: 'bg-emerald-500 text-slate-950' };
    }
  };

  // Cylinder panel segments for 360° geometry
  const CYLINDER_SEGMENTS = 12;
  const cylinderPanels = useMemo(() => {
    const panels = [];
    const angleStep = 360 / CYLINDER_SEGMENTS;
    const radius = 680; // cylinder radius

    for (let i = 0; i < CYLINDER_SEGMENTS; i++) {
      const angle = i * angleStep;
      // Front panels (around angle 0) display slices of the landmark photo
      const isFrontFacing = i <= 2 || i >= CYLINDER_SEGMENTS - 2;
      panels.push({
        index: i,
        angle,
        isFrontFacing,
        radius,
      });
    }
    return panels;
  }, []);

  // Render Single VR Eye Viewport (used once in mono, twice in cardboard split mode)
  const renderEyeViewport = (eyeOffset: number = 0, isRightEye: boolean = false) => {
    // Camera rotation matrix
    const cameraYaw = yaw + eyeOffset;
    const cameraPitch = pitch;
    const cameraRoll = roll;

    return (
      <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 flex items-center justify-center">
        {/* 3D World Stage with Perspective Projection */}
        <div
          className="relative w-full h-full flex items-center justify-center pointer-events-none"
          style={{
            perspective: `${(800 * 80) / fov}px`,
            perspectiveOrigin: '50% 50%',
          }}
        >
          {/* Virtual Camera Rig (Rotates around Y, X, Z) */}
          <div
            className="w-0 h-0 transition-transform duration-75 ease-out preserve-3d"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateZ(${-cameraRoll}deg) rotateX(${cameraPitch}deg) rotateY(${-cameraYaw}deg)`,
            }}
          >
            {/* 360° SPATIAL GEOMETRY: Ground Wireframe Horizon Grid */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-[2400px] h-[2400px] pointer-events-none opacity-25"
              style={{
                transform: 'translateY(360px) rotateX(90deg)',
                backgroundImage:
                  'radial-gradient(circle, transparent 20%, #020617 80%), linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                backgroundSize: '100% 100%, 60px 60px, 60px 60px',
              }}
            />

            {/* 360° SPATIAL GEOMETRY: Celestial Architectural Dome */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-[2400px] h-[2400px] pointer-events-none opacity-20"
              style={{
                transform: 'translateY(-480px) rotateX(90deg)',
                backgroundImage:
                  'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 60%), radial-gradient(#fbbf24 1px, transparent 1px)',
                backgroundSize: '100% 100%, 80px 80px',
              }}
            />

            {/* 360° Horizon Cardinal Compass Ring in 3D Space */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] rounded-full border border-amber-500/20 pointer-events-none flex items-center justify-center"
              style={{ transform: 'translateY(220px) rotateX(90deg)' }}
            >
              <div className="absolute top-4 text-xs font-mono font-bold text-amber-400">0° NORTH</div>
              <div className="absolute right-4 text-xs font-mono font-bold text-cyan-400">90° EAST</div>
              <div className="absolute bottom-4 text-xs font-mono font-bold text-amber-400">180° SOUTH</div>
              <div className="absolute left-4 text-xs font-mono font-bold text-cyan-400">270° WEST</div>
            </div>

            {/* 360° Cylindrical Projection Mesh */}
            {cylinderPanels.map((panel) => {
              // Calculate panel width based on circumference: 2 * pi * r / N
              const panelWidth = Math.ceil((2 * Math.PI * panel.radius) / CYLINDER_SEGMENTS) + 4;
              const panelHeight = 720;

              return (
                <div
                  key={panel.index}
                  className="absolute -translate-x-1/2 -translate-y-1/2 backface-hidden overflow-hidden"
                  style={{
                    width: `${panelWidth}px`,
                    height: `${panelHeight}px`,
                    transform: `rotateY(${panel.angle}deg) translateZ(${panel.radius}px)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Frontal Facets Display High-Resolution Geometric Landmark Projection */}
                  {panel.isFrontFacing ? (
                    <div className="w-full h-full relative overflow-hidden bg-slate-900">
                      <img
                        src={imageSrc}
                        alt={recognition.landmarkName}
                        referrerPolicy="no-referrer"
                        className="absolute max-w-none h-full object-cover"
                        style={{
                          width: `${panelWidth * 4}px`,
                          left: `${-((panel.angle <= 60 ? panel.angle : panel.angle - 360) + 60) * (panelWidth / 30)}px`,
                          filter: filterStyle,
                        }}
                      />
                      {/* Geometric Perspective Edge Shading */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />
                      {/* Architectural Vector Grid Overlay */}
                      <div
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        style={{
                          backgroundImage:
                            'linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)',
                          backgroundSize: '40px 40px',
                        }}
                      />
                    </div>
                  ) : (
                    /* Rear & Flank Ambient Environment (Night Sky & Architectural Wireframe Panorama) */
                    <div className="w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800/40 relative flex flex-col justify-between p-4">
                      {/* Ambient stars */}
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 70%, #38bdf8 1px, transparent 1px)',
                          backgroundSize: '60px 60px, 90px 90px',
                        }}
                      />
                      {/* Distant City Skyline Wireframe */}
                      <div className="absolute bottom-0 inset-x-0 h-32 opacity-20 border-t border-cyan-500/30 bg-gradient-to-t from-cyan-950/40 to-transparent" />
                      <div className="relative text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">
                        PANORAMA EXTENSION • {Math.round(panel.angle)}°
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 3D Spatial Floating AR Hotspot Beacons */}
            {spatialPoints.map((point) => {
              const isSelected = point.id === activePointId;
              const isTargeted = gazeTarget?.id === point.id;
              const badge = getTagBadge(point.arTagType);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={point.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                  style={{
                    transform: `rotateY(${point.azimuthDeg}deg) rotateX(${-point.elevationDeg}deg) translateZ(${point.distanceRadius}px) rotateX(${point.elevationDeg}deg) rotateY(${-point.azimuthDeg}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    onClick={() => onSelectPoint(isSelected ? null : point)}
                    className={`relative cursor-pointer transition-all duration-200 group ${
                      isTargeted || isSelected ? 'scale-125' : 'hover:scale-115'
                    }`}
                  >
                    {/* Pulsing Beacon Rings */}
                    <span
                      className={`absolute -inset-3 rounded-full pointer-events-none animate-ping ${
                        isTargeted
                          ? 'bg-amber-400 opacity-90'
                          : isSelected
                          ? 'bg-cyan-400 opacity-75'
                          : 'bg-amber-500/50 opacity-40'
                      }`}
                    />

                    {/* Spatial Core Button */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl border-2 backdrop-blur-md transition-all ${
                        isTargeted
                          ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/50 animate-bounce'
                          : isSelected
                          ? 'bg-amber-500 border-white text-slate-950 ring-4 ring-amber-400/30'
                          : 'bg-slate-950/90 border-amber-400/80 text-amber-300 hover:bg-amber-400 hover:text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      <BadgeIcon className="w-5 h-5" />
                    </div>

                    {/* Floating 3D Title Plate */}
                    <div
                      className={`absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-xl font-mono text-xs font-bold tracking-wide shadow-xl border backdrop-blur-md pointer-events-none transition-all ${
                        isTargeted || isSelected
                          ? 'bg-amber-500 text-slate-950 border-white opacity-100 scale-105'
                          : 'bg-slate-950/90 text-slate-200 border-slate-700 opacity-80 group-hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{point.title}</span>
                        {isTargeted && (
                          <span className="text-[10px] bg-slate-950 text-amber-400 px-1.5 py-0.2 rounded font-mono">
                            LOCKED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Central VR Crosshair & Gaze Reticle HUD */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="relative flex items-center justify-center">
            {/* Outer Gaze Lock Ring */}
            <div
              className={`w-10 h-10 rounded-full border transition-all duration-200 flex items-center justify-center ${
                gazeTarget
                  ? 'w-14 h-14 border-2 border-amber-400 bg-amber-500/20 scale-110 shadow-[0_0_20px_#f59e0b]'
                  : 'border-white/30'
              }`}
            >
              {/* Inner Center Aim Dot */}
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  gazeTarget ? 'bg-amber-400 animate-ping' : 'bg-white/70'
                }`}
              />
            </div>

            {/* Gaze Lock Indicator Badge */}
            {gazeTarget && (
              <div className="absolute -bottom-8 whitespace-nowrap bg-amber-500 text-slate-950 font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-lg flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3 h-3" />
                <span>HOTSPOT IN SIGHT • CLICK TO INSPECT</span>
              </div>
            )}
          </div>
        </div>

        {/* Eye Indicator for Cardboard mode */}
        {isCardboardMode && (
          <div className="absolute top-3 left-3 pointer-events-none text-[10px] font-mono text-slate-500 bg-black/60 px-2 py-0.5 rounded border border-slate-800">
            {isRightEye ? 'RIGHT EYE (R)' : 'LEFT EYE (L)'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={handlePointerUp}
      onTouchStart={(e) => {
        if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top VR Viewport Navigation HUD */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2 z-30">
        {/* VR Heading & Gyroscope Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold tracking-wider">
            <Glasses className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>360° VR ENVIRONMENT</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Compass readout */}
          <div className="flex items-center gap-1.5 text-slate-200 font-mono text-[11px] bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>{getCompassHeadingText(yaw)}</span>
          </div>

          {/* Sensor status pill */}
          <div
            className={`hidden md:flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
              hasGyro && gyroActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>{hasGyro && gyroActive ? 'GYROSCOPE ACTIVE' : 'DRAG TO ROTATE'}</span>
          </div>
        </div>

        {/* VR Action Buttons: Recenter, Cardboard Split Toggle, Exit VR */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* iOS Permission Prompt Trigger if blocked */}
          {permissionRequired && (
            <button
              onClick={requestOrientationPermission}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <Smartphone className="w-3 h-3" />
              <span>Enable Gyro</span>
            </button>
          )}

          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Recenter camera to monument face"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Recenter</span>
          </button>

          {/* Cardboard Split Screen Toggle */}
          <button
            onClick={() => setIsCardboardMode(!isCardboardMode)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              isCardboardMode
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Split-Screen Stereoscopic VR mode for Cardboard/Headset"
          >
            <Split className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cardboard VR</span>
          </button>

          {/* Exit VR button */}
          <button
            onClick={onExitVR}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            title="Exit 360° VR View and return to standard AR Viewfinder"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit VR</span>
          </button>
        </div>
      </div>

      {/* Main Interactive 3D Viewing Area */}
      <div className="relative w-full aspect-16/10 sm:aspect-16/9 overflow-hidden bg-black flex">
        {isCardboardMode ? (
          /* Dual-Eye Split Stereoscopic Projection */
          <div className="grid grid-cols-2 w-full h-full divide-x-2 divide-slate-900">
            {renderEyeViewport(-1.5, false)}
            {renderEyeViewport(1.5, true)}
          </div>
        ) : (
          /* Single Monoscopic 360° Panoramic Viewport */
          renderEyeViewport(0, false)
        )}

        {/* 360° Horizon Scrolling Compass Tape (Top Center) */}
        <div className="absolute top-4 inset-x-0 mx-auto w-72 sm:w-96 pointer-events-none z-20 flex flex-col items-center">
          <div className="w-full bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 overflow-hidden shadow-lg">
            {/* Center Pointer Triangle */}
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-400 mx-auto mb-1" />
            {/* Sliding Degree Tape */}
            <div className="relative h-4 overflow-hidden">
              <div
                className="absolute flex items-center gap-6 text-[10px] font-mono text-slate-400 transition-transform duration-75 ease-out whitespace-nowrap"
                style={{
                  left: '50%',
                  transform: `translateX(-${(yaw / 360) * 720}px)`,
                }}
              >
                {/* 720-degree extended strip for smooth wrapping */}
                {[0, 45, 90, 135, 180, 225, 270, 315, 360, 405, 450, 495, 540, 585, 630, 675, 720].map(
                  (d, idx) => {
                    const norm = d % 360;
                    const label =
                      norm === 0
                        ? 'N'
                        : norm === 90
                        ? 'E'
                        : norm === 180
                        ? 'S'
                        : norm === 270
                        ? 'W'
                        : `${norm}°`;
                    const isMajor = norm % 90 === 0;
                    return (
                      <span
                        key={idx}
                        className={`${
                          isMajor ? 'font-bold text-amber-400 text-[11px]' : 'text-slate-500'
                        }`}
                      >
                        {label}
                      </span>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Telemetry & Guide Pill */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto pointer-events-none z-20 flex flex-col gap-2 max-w-sm">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 shadow-xl">
            <div className="flex items-center justify-between font-mono text-[10px] text-amber-400 uppercase mb-1">
              <span>Telemetry HUD</span>
              <span>FOV: {fov}°</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-200">
              <div>
                <span className="text-slate-500 text-[10px] block">YAW:</span>
                <span className="font-bold text-white">{Math.round(yaw)}°</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">PITCH:</span>
                <span className="font-bold text-white">{Math.round(pitch)}°</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">ROLL:</span>
                <span className="font-bold text-white">{Math.round(roll)}°</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 backdrop-blur-md border border-amber-500/30 rounded-lg px-3 py-1.5 text-[11px] font-mono text-amber-300 flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Turn your device or drag screen to inspect in 360°</span>
          </div>
        </div>

        {/* Active Hotspot AR Card Overlay (When Gaze Locked or Clicked) */}
        {(gazeTarget || activePointId) && (
          <div className="absolute bottom-4 right-4 max-w-xs sm:max-w-sm z-30 bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500 rounded-2xl p-4 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
            {(() => {
              const point =
                spatialPoints.find((p) => p.id === activePointId) || gazeTarget;
              if (!point) return null;
              const badge = getTagBadge(point.arTagType);

              return (
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <h4 className="font-bold text-sm text-white">{point.title}</h4>
                    </div>
                    <button
                      onClick={() => onSelectPoint(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {point.briefFact}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* VR Focal Points Horizontal Dock */}
      <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto z-20">
        <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase shrink-0 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Focal Points:
        </span>
        {spatialPoints.map((point) => {
          const isSelected = point.id === activePointId;
          const isTargeted = gazeTarget?.id === point.id;

          return (
            <button
              key={point.id}
              onClick={() => {
                onSelectPoint(isSelected ? null : point);
                // Rotate camera towards this point's azimuth and elevation
                setYaw((point.azimuthDeg + 360) % 360);
                setPitch(point.elevationDeg);
                baseYawRef.current = (point.azimuthDeg + 360) % 360;
                basePitchRef.current = point.elevationDeg;
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isTargeted || isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{point.title}</span>
              <span className="text-[10px] font-mono text-slate-400">
                {Math.round(point.azimuthDeg)}°
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
