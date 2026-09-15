import React, { useState } from 'react';
import {
  History,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Building,
  MapPin,
  Calendar,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { LandmarkHistoryResult, LandmarkRecognitionResult } from '../types';
import { RealtimeWeatherWidget } from './RealtimeWeatherWidget';

interface LandmarkHistoryViewProps {
  recognition: LandmarkRecognitionResult;
  history: LandmarkHistoryResult;
}

export const LandmarkHistoryView: React.FC<LandmarkHistoryViewProps> = ({
  recognition,
  history,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'secrets' | 'sources'>('overview');

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Top Landmark Title & Metadata Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950/80 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/60">
                <MapPin className="w-3 h-3" />
                {recognition.city}, {recognition.country}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {recognition.architecturalStyle}
              </span>
              {recognition.alternateNames && recognition.alternateNames.length > 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                  (Also known as {recognition.alternateNames.slice(0, 2).join(', ')})
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {recognition.landmarkName}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-3xl leading-relaxed">
              {recognition.shortVisualDescription}
            </p>
          </div>

          {/* Quick Specs Pill Box */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100/80 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0 md:w-64">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Completed</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{recognition.yearCompletedOrPeriod}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Builder/Architect</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{recognition.architectOrBuilder}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">AI Confidence</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400">{recognition.confidenceScore}% Vision Match</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Grounding</div>
              <div className="font-bold text-blue-600 dark:text-blue-400 truncate">Google Search Live</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Weather Station Widget */}
      <RealtimeWeatherWidget recognition={recognition} />

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-950/40 gap-6 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Origin & Inception</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Historical Timeline</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
            {history.historicalTimeline.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('secrets')}
          className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'secrets'
              ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Secrets & Hidden Trivia</span>
          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
            {history.hiddenSecrets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'sources'
              ? 'border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Search Citations</span>
          <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
            {history.searchSources.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8">
        {/* Tab 1: Overview & Inception */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">The Origin Story</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-serif">
                {history.originStory}
              </p>
            </div>

            {history.modernContext && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Modern Day Status & Preservation
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {history.modernContext}
                </p>
              </div>
            )}

            {/* Visitor Tips */}
            {history.visitorTips && history.visitorTips.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Insider Visitor & Photography Tips
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {history.visitorTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-xs sm:text-sm text-amber-950 dark:text-amber-200"
                    >
                      <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Historical Timeline */}
        {activeTab === 'timeline' && (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-400/80 dark:border-amber-500/60 space-y-8 max-w-3xl">
            {history.historicalTimeline.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-amber-500 dark:bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300/40 dark:border-amber-700/60 px-2 py-0.5 rounded">
                      {item.yearOrPeriod}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {item.era}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.event}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.significance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Hidden Secrets & Unknown Trivia */}
        {activeTab === 'secrets' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {history.hiddenSecrets.map((secret, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-slate-850 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {secret.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {secret.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  SECRET #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Google Search Citations */}
        {activeTab === 'sources' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Grounded via Google Search live web index</span>
            </div>

            {history.searchSources.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No external source links retrieved.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {history.searchSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group block"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {source.title}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {source.url}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                      Open &rarr;
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
