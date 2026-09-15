import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBase64: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isShuttering, setIsShuttering] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Failed to open camera:', err);
      setError(err.message || 'Could not access device camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flash effect
    setIsShuttering(true);
    setTimeout(() => setIsShuttering(false), 200);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">City Camera Viewfinder</span>
          </div>
          <button
            id="close-camera-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative aspect-4/3 w-full bg-black overflow-hidden flex items-center justify-center">
          {error ? (
            <div className="p-6 text-center max-w-sm text-slate-300">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="font-medium text-sm text-white mb-1">Camera Unavailable</p>
              <p className="text-xs text-slate-400 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-colors"
              >
                Retry Access
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* AR Target Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Grid guidelines */}
                <div className="absolute inset-8 border border-white/20 rounded-xl grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-b border-white/10" />
                  <div className="border-r border-white/10" />
                  <div className="border-r border-white/10" />
                  <div />
                </div>

                {/* Center target circle */}
                <div className="w-24 h-24 border-2 border-amber-400/80 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                </div>

                {/* Corner brackets */}
                <div className="absolute top-12 left-12 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute top-12 right-12 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute bottom-12 left-12 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute bottom-12 right-12 w-6 h-6 border-b-2 border-r-2 border-amber-400" />

                {/* Telemetry pill */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REC • 1080P • AI READY
                </div>
              </div>

              {/* Shutter flash effect */}
              {isShuttering && (
                <div className="absolute inset-0 bg-white pointer-events-none animate-fade-out" />
              )}
            </>
          )}
        </div>

        {/* Shutter & Switch Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-around">
          <button
            onClick={toggleFacingMode}
            className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Switch Camera Direction"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            id="shutter-capture-btn"
            onClick={takePhoto}
            disabled={!stream}
            className="w-16 h-16 rounded-full bg-white hover:bg-amber-100 flex items-center justify-center p-1 border-4 border-slate-700 active:scale-95 transition-transform disabled:opacity-50"
            title="Take Photo"
          >
            <div className="w-full h-full rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-slate-950">
              <Camera className="w-6 h-6" />
            </div>
          </button>

          <div className="w-11" /> {/* Balanced spacer */}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
