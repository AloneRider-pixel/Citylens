import React from 'react';
import { Eye, Globe, Volume2, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { ProcessingStep } from '../types';

interface ScanningOverlayProps {
  currentStep: ProcessingStep;
  imagePreview: string;
}

export const ScanningOverlay: React.FC<ScanningOverlayProps> = ({
  currentStep,
  imagePreview,
}) => {
  const steps = [
    {
      id: 'recognizing',
      title: 'Vision Landmark Recognition',
      desc: 'Analyzing architectural geometry & coordinates with Gemini 3.1 Pro',
      icon: Eye,
      isActive: currentStep === 'recognizing',
      isDone: currentStep === 'fetching_history' || currentStep === 'generating_audio' || currentStep === 'completed',
    },
    {
      id: 'fetching_history',
      title: 'Google Search Grounding',
      desc: 'Retrieving verified historical records, secrets & citations with Gemini 3.5 Flash',
      icon: Globe,
      isActive: currentStep === 'fetching_history',
      isDone: currentStep === 'generating_audio' || currentStep === 'completed',
    },
    {
      id: 'generating_audio',
      title: 'AR Narrated Voice Synthesis',
      desc: 'Crafting expressive vocal narration clip with Gemini 3.1 Flash TTS',
      icon: Volume2,
      isActive: currentStep === 'generating_audio',
      isDone: currentStep === 'completed',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar & Image Preview thumbnail */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-amber-500/60 shadow-md bg-slate-800 shrink-0">
            <img
              src={imagePreview}
              alt="Scanning Target"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Animated laser scan line */}
            <div className="absolute inset-x-0 h-0.5 bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-bounce" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono mb-1">
              <Sparkles className="w-3 h-3" />
              <span>AR MULTIMODAL PIPELINE</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Deconstructing City Landmark...
            </h3>
            <p className="text-xs text-slate-400">
              Transforming your photo into an interactive narrated AR experience.
            </p>
          </div>
        </div>

        {/* Pipeline Step Progression */}
        <div className="space-y-3.5 mb-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3.5 ${
                  step.isActive
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : step.isDone
                    ? 'bg-emerald-950/20 border-emerald-600/40 text-slate-300'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    step.isActive
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : step.isDone
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step.isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : step.isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">
                      {step.title}
                    </h4>
                    {step.isActive && (
                      <span className="text-[10px] font-mono text-amber-400 animate-pulse">
                        PROCESSING
                      </span>
                    )}
                    {step.isDone && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live telemetry bar */}
        <div className="p-3 bg-black/40 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            AI TELEMETRY STREAM
          </span>
          <span className="text-amber-300">
            PORT: 3000 • LATENCY OPTIMIZED
          </span>
        </div>
      </div>
    </div>
  );
};
