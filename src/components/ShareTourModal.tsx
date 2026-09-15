import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Quote,
} from 'lucide-react';
import { LandmarkHistoryResult, LandmarkRecognitionResult } from '../types';

interface ShareTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  recognition: LandmarkRecognitionResult;
  history: LandmarkHistoryResult;
  lensFilter?: string;
}

type CardTheme = 'cyber' | 'postcard' | 'midnight';

export const ShareTourModal: React.FC<ShareTourModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  recognition,
  history,
  lensFilter,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [cardTheme, setCardTheme] = useState<CardTheme>('cyber');

  if (!isOpen) return null;

  // Construct a shareable URL with parameters
  const shareUrl = (() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('landmark', recognition.landmarkName);
      url.searchParams.set('city', recognition.city);
      url.searchParams.set('country', recognition.country);
      return url.toString();
    } catch {
      return window.location.href;
    }
  })();

  const shareText = `Just discovered ${recognition.landmarkName} in ${recognition.city}, ${recognition.country} with CityLens AR! Recognized by Gemini Pro with grounded history from Google Search. Explore the narrated tour:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      prompt('Copy this shareable link:', shareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${recognition.landmarkName} - CityLens AR Tour`,
          text: shareText,
          url: shareUrl,
        });
      } catch (e) {
        console.warn('Native share cancelled or failed', e);
      }
    } else {
      handleCopyLink();
    }
  };

  // High-resolution Canvas rendering to export Social Media Card as PNG
  const handleDownloadCard = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350; // 4:5 Instagram/Social story aspect ratio
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      // 1. Background based on theme
      if (cardTheme === 'cyber') {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 1080, 1350);

        // Cyber grid & accents
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1080; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 1350);
          ctx.stroke();
        }
        for (let y = 0; y < 1350; y += 60) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1080, y);
          ctx.stroke();
        }
      } else if (cardTheme === 'postcard') {
        ctx.fillStyle = '#f8f6f0';
        ctx.fillRect(0, 0, 1080, 1350);
        // Subtle vintage border
        ctx.strokeStyle = '#d9d2c5';
        ctx.lineWidth = 8;
        ctx.strokeRect(24, 24, 1032, 1302);
      } else {
        // Midnight theme
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1080, 1350);
      }

      // 2. Load landmark image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // continue even if image CORS fails
        img.src = imageSrc;
      });

      // Draw photo container (rounded rectangle)
      const photoX = 60;
      const photoY = 140;
      const photoW = 960;
      const photoH = 640;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, 24);
      ctx.clip();
      if (img.width > 0) {
        // Draw image cover-fit
        const imgRatio = img.width / img.height;
        const targetRatio = photoW / photoH;
        let sWidth, sHeight, sx, sy;
        if (imgRatio > targetRatio) {
          sHeight = img.height;
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = img.width;
          sHeight = img.width / targetRatio;
          sx = 0;
          sy = (img.height - sHeight) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, photoX, photoY, photoW, photoH);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(photoX, photoY, photoW, photoH);
      }

      // Add subtle dark gradient overlay at bottom of photo
      const photoGrad = ctx.createLinearGradient(0, photoY + photoH - 180, 0, photoY + photoH);
      photoGrad.addColorStop(0, 'rgba(0,0,0,0)');
      photoGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = photoGrad;
      ctx.fillRect(photoX, photoY + photoH - 180, photoW, 180);
      ctx.restore();

      // Cyber reticle corner markers over photo
      if (cardTheme === 'cyber') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(photoX + 16, photoY + 36);
        ctx.lineTo(photoX + 16, photoY + 16);
        ctx.lineTo(photoX + 36, photoY + 16);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(photoX + photoW - 36, photoY + 16);
        ctx.lineTo(photoX + photoW - 16, photoY + 16);
        ctx.lineTo(photoX + photoW - 16, photoY + 36);
        ctx.stroke();
      }

      // 3. Header branding
      ctx.fillStyle = cardTheme === 'postcard' ? '#1c1917' : '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('CITYLENS AR', 60, 85);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('• URBAN TOURIST DISCOVERY CARD', 330, 80);

      // 4. Landmark Title & Location
      const textBaseY = 840;
      ctx.fillStyle = cardTheme === 'postcard' ? '#0c0a09' : '#ffffff';
      ctx.font = '800 52px sans-serif';
      ctx.fillText(recognition.landmarkName, 60, textBaseY);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`📍 ${recognition.city}, ${recognition.country}`, 60, textBaseY + 45);

      // 5. Specs Pills
      const specY = textBaseY + 105;
      const specBoxW = 300;
      const specBoxH = 75;

      const drawSpecBox = (x: number, label: string, val: string) => {
        ctx.fillStyle = cardTheme === 'postcard' ? '#e7e2d7' : '#1e293b';
        ctx.beginPath();
        ctx.roundRect(x, specY, specBoxW, specBoxH, 14);
        ctx.fill();

        ctx.fillStyle = cardTheme === 'postcard' ? '#78716c' : '#94a3b8';
        ctx.font = '600 16px sans-serif';
        ctx.fillText(label.toUpperCase(), x + 16, specY + 28);

        ctx.fillStyle = cardTheme === 'postcard' ? '#1c1917' : '#f8fafc';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(val, x + 16, specY + 56);
      };

      drawSpecBox(60, 'Completed', recognition.yearCompletedOrPeriod || 'Historic');
      drawSpecBox(390, 'Architecture', (recognition.architecturalStyle || 'Iconic').slice(0, 22));
      drawSpecBox(720, 'Vision Match', `${recognition.confidenceScore}% Confidence`);

      // 6. Narrator Monologue Quote
      const quoteY = specY + 120;
      ctx.fillStyle = cardTheme === 'postcard' ? '#e7e2d7' : '#131b2c';
      ctx.beginPath();
      ctx.roundRect(60, quoteY, 960, 145, 16);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px serif';
      ctx.fillText('“', 80, quoteY + 45);

      ctx.fillStyle = cardTheme === 'postcard' ? '#292524' : '#cbd5e1';
      ctx.font = 'italic 20px serif';
      const quoteText = history.narratedMonologue
        ? history.narratedMonologue.slice(0, 175) + '...'
        : `An extraordinary urban wonder explored through immersive AI multimodal vision.`;
      
      // Wrap text
      const words = quoteText.split(' ');
      let line = '';
      let curY = quoteY + 45;
      for (const w of words) {
        const testLine = line + w + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 860) {
          ctx.fillText(line, 115, curY);
          line = w + ' ';
          curY += 28;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 115, curY);

      // 7. Footer watermark
      ctx.fillStyle = cardTheme === 'postcard' ? '#a8a29e' : '#64748b';
      ctx.font = '500 16px monospace';
      ctx.fillText('GEMINI 3.1 PRO VISION • GOOGLE SEARCH GROUNDING • GEMINI FLASH TTS', 60, 1290);

      // Convert canvas to download link
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `CityLens-${recognition.landmarkName.replace(/\s+/g, '-')}-TourCard.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate social card:', err);
      alert('Could not export social card image. Please try copying the share link instead.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Share Landmark & Tour</h3>
              <p className="text-xs text-slate-400">Generate a social story card or shareable tour link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Section 1: Social Media Card Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Social Media Card Preview
              </span>

              {/* Theme selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setCardTheme('cyber')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    cardTheme === 'cyber' ? 'bg-slate-900 text-amber-400 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cyber AR
                </button>
                <button
                  onClick={() => setCardTheme('postcard')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    cardTheme === 'postcard' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Postcard
                </button>
                <button
                  onClick={() => setCardTheme('midnight')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    cardTheme === 'midnight' ? 'bg-black text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Midnight
                </button>
              </div>
            </div>

            {/* Visual Social Card Container */}
            <div
              ref={cardRef}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-md ${
                cardTheme === 'cyber'
                  ? 'bg-slate-950 text-white border-amber-500/40'
                  : cardTheme === 'postcard'
                  ? 'bg-[#fcfbf9] text-stone-900 border-stone-300'
                  : 'bg-black text-white border-slate-800'
              }`}
            >
              {/* Card top banner */}
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs tracking-wider">CITYLENS AR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {lensFilter && lensFilter !== 'Standard' && (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {lensFilter} Lens
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    EXPEDITION CARD
                  </span>
                </div>
              </div>

              {/* Photo */}
              <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden mb-3 border border-white/10">
                <img
                  src={imageSrc}
                  alt={recognition.landmarkName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <div className="text-white">
                    <div className="text-base sm:text-lg font-black tracking-tight drop-shadow-sm">
                      {recognition.landmarkName}
                    </div>
                    <div className="text-xs text-amber-300 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3" />
                      <span>{recognition.city}, {recognition.country}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs row */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                  <div className="text-[9px] uppercase font-mono text-slate-400">Completed</div>
                  <div className="font-bold truncate mt-0.5">{recognition.yearCompletedOrPeriod}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                  <div className="text-[9px] uppercase font-mono text-slate-400">Style</div>
                  <div className="font-bold truncate mt-0.5">{recognition.architecturalStyle.split(' ')[0]}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                  <div className="text-[9px] uppercase font-mono text-slate-400">AI Match</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{recognition.confidenceScore}%</div>
                </div>
              </div>

              {/* Quote from Narration */}
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 italic font-serif relative">
                <Quote className="w-3.5 h-3.5 text-amber-400 inline-block mr-1 -mt-1" />
                <span>
                  {history.narratedMonologue
                    ? history.narratedMonologue.slice(0, 140) + '...'
                    : 'Discovered and recognized through multimodal AI.'}
                </span>
              </div>
            </div>

            {/* Download card image button */}
            <div className="mt-3 flex justify-end">
              <button
                id="download-social-card-btn"
                onClick={handleDownloadCard}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{isExporting ? 'Generating PNG...' : 'Download Social Card (PNG)'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Shareable Web Link */}
          <div className="border-t border-slate-200 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Shareable Tour Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                id="copy-share-link-btn"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: 1-Click Social Shares */}
          <div className="border-t border-slate-200 pt-5">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Share Directly to Platforms
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Native Mobile Share */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-amber-600" />
                  <span>Device Share</span>
                </button>
              )}

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors"
              >
                <span className="font-black text-sm">𝕏</span>
                <span>Post on X</span>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-emerald-700 flex items-center justify-center gap-2 transition-colors"
              >
                <span className="font-bold text-sm">💬</span>
                <span>WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-sky-700 flex items-center justify-center gap-2 transition-colors"
              >
                <span className="font-bold text-sm">✈️</span>
                <span>Telegram</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
