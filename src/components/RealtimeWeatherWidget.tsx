import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Snowflake,
  Moon,
  Wind,
  Droplets,
  Eye,
  Camera,
  Compass,
  RefreshCw,
  Sunrise,
  Sunset,
  Sparkles,
  Info,
} from 'lucide-react';
import { LandmarkRecognitionResult, LandmarkWeatherData } from '../types';
import { fetchLandmarkWeather } from '../services/geminiService';

interface RealtimeWeatherWidgetProps {
  recognition: LandmarkRecognitionResult;
}

export const RealtimeWeatherWidget: React.FC<RealtimeWeatherWidgetProps> = ({ recognition }) => {
  const [weather, setWeather] = useState<LandmarkWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const coords = recognition.coordinatesEstimate;

  const loadWeather = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await fetchLandmarkWeather(
        coords?.latitude,
        coords?.longitude,
        recognition.landmarkName,
        recognition.city,
        recognition.country
      );
      setWeather(data);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError('Unable to load live weather conditions.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [recognition.landmarkName, coords?.latitude, coords?.longitude]);

  // Weather condition icon & gradient styling helper
  const getWeatherVisuals = (code: number, isDay: boolean, condition: string) => {
    const text = condition.toLowerCase();

    if (text.includes('thunder') || code >= 95) {
      return {
        icon: CloudLightning,
        bgGradient: 'from-amber-900/10 via-slate-900/5 to-slate-100',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        iconColor: 'text-amber-500',
      };
    }
    if (text.includes('rain') || text.includes('drizzle') || (code >= 51 && code <= 82)) {
      return {
        icon: CloudRain,
        bgGradient: 'from-blue-900/10 via-slate-900/5 to-slate-100',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        iconColor: 'text-blue-500',
      };
    }
    if (text.includes('snow') || (code >= 71 && code <= 86)) {
      return {
        icon: Snowflake,
        bgGradient: 'from-sky-900/10 via-slate-900/5 to-slate-100',
        badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
        iconColor: 'text-sky-500',
      };
    }
    if (text.includes('fog') || code === 45 || code === 48) {
      return {
        icon: CloudFog,
        bgGradient: 'from-slate-900/10 via-slate-900/5 to-slate-100',
        badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
        iconColor: 'text-slate-500',
      };
    }
    if (text.includes('overcast') || code === 3) {
      return {
        icon: Cloud,
        bgGradient: 'from-slate-900/10 via-slate-900/5 to-slate-100',
        badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
        iconColor: 'text-slate-600',
      };
    }
    if (text.includes('cloud') || code === 2 || code === 1) {
      return {
        icon: CloudSun,
        bgGradient: 'from-amber-500/10 via-blue-500/5 to-slate-50',
        badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
        iconColor: 'text-amber-500',
      };
    }
    if (!isDay) {
      return {
        icon: Moon,
        bgGradient: 'from-indigo-950/10 via-slate-900/5 to-slate-50',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        iconColor: 'text-indigo-400',
      };
    }
    return {
      icon: Sun,
      bgGradient: 'from-amber-500/15 via-orange-500/5 to-slate-50',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      iconColor: 'text-amber-500',
    };
  };

  if (loading && !weather) {
    return (
      <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-200 rounded w-48"></div>
          <div className="h-4 bg-slate-200 rounded w-20"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-16 bg-slate-200 rounded-xl"></div>
          <div className="h-16 bg-slate-200 rounded-xl"></div>
          <div className="h-16 bg-slate-200 rounded-xl"></div>
          <div className="h-16 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400" />
          Real-time weather station temporarily updating for {recognition.city}.
        </span>
        <button
          onClick={() => loadWeather(true)}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const visuals = getWeatherVisuals(weather.weatherCode, weather.isDay, weather.condition);
  const WeatherIconComponent = visuals.icon;

  const currentTemp = unit === 'C' ? `${weather.temperatureC}°C` : `${weather.temperatureF}°F`;
  const apparentTemp = unit === 'C' ? `${weather.apparentTemperatureC}°C` : `${weather.apparentTemperatureF}°F`;

  return (
    <div className={`p-4 sm:p-6 bg-gradient-to-br ${visuals.bgGradient} border-b border-slate-200 relative overflow-hidden`}>
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Atmosphere</span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-600 font-medium">
            {recognition.city}, {recognition.country}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (Updated {weather.lastUpdated})
          </span>
        </div>

        {/* Controls: Unit switch & Refresh */}
        <div className="flex items-center gap-2">
          {/* Temperature Unit Toggle */}
          <div className="inline-flex bg-white/90 backdrop-blur-xs rounded-lg p-0.5 border border-slate-200 shadow-2xs text-xs font-semibold">
            <button
              onClick={() => setUnit('C')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                unit === 'C'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                unit === 'F'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              °F
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadWeather(true)}
            disabled={isRefreshing}
            className="p-1.5 bg-white/90 hover:bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
            title="Refresh live weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Weather Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column (5 cols): Main Temperature & Condition Showcase */}
        <div className="md:col-span-5 bg-white/85 backdrop-blur-sm p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-13 h-13 rounded-2xl bg-slate-900/5 flex items-center justify-center ${visuals.iconColor} shadow-inner`}>
              <WeatherIconComponent className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
                  {currentTemp}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Feels like {apparentTemp}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${visuals.badgeColor}`}>
                  {weather.condition}
                </span>
                {weather.cloudCoverPercent !== undefined && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {weather.cloudCoverPercent}% clouds
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns (7 cols): Atmospheric Instruments Sub-grid */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Wind Instrument */}
          <div className="bg-white/85 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Wind</span>
              <Wind className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="font-bold text-sm text-slate-900 font-mono truncate">
              {weather.windSpeedKmh} <span className="text-[10px] font-normal text-slate-500">km/h</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
              <Compass className="w-3 h-3 text-amber-600" />
              <span>{weather.windDirectionText}</span>
            </div>
          </div>

          {/* Humidity Instrument */}
          <div className="bg-white/85 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="font-bold text-sm text-slate-900 font-mono">
              {weather.relativeHumidity}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {weather.relativeHumidity > 70 ? 'High moisture' : weather.relativeHumidity < 30 ? 'Dry air' : 'Comfortable'}
            </div>
          </div>

          {/* UV Index / Sunlight */}
          <div className="bg-white/85 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">UV Index</span>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="font-bold text-sm text-slate-900 font-mono">
              {weather.uvIndex} <span className="text-[10px] font-normal text-slate-500">of 11</span>
            </div>
            <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
              {weather.uvIndex >= 8 ? 'Very High' : weather.uvIndex >= 6 ? 'High' : weather.uvIndex >= 3 ? 'Moderate' : 'Low'}
            </div>
          </div>

          {/* Sun Cycle / Ephemeris */}
          <div className="bg-white/85 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sun Cycle</span>
              {weather.isDay ? (
                <Sunset className="w-3.5 h-3.5 text-orange-500" />
              ) : (
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <div className="font-bold text-xs text-slate-900 font-mono truncate">
              {weather.sunsetTime ? `Set ${weather.sunsetTime}` : weather.sunriseTime ? `Rise ${weather.sunriseTime}` : weather.isDay ? 'Daylight' : 'Night'}
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">
              {weather.isDay ? 'Optimal Daylight' : 'Night Illumination'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Visiting & Architectural Photography Advisories */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {/* Sightseeing Tip */}
        <div className="bg-white/85 backdrop-blur-sm p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-700 shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-0.5 text-[11px] uppercase tracking-wider">
              Visiting Advisory
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              {weather.visitingAdvisory}
            </p>
          </div>
        </div>

        {/* Photography Tip */}
        <div className="bg-white/85 backdrop-blur-sm p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-700 shrink-0 mt-0.5">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-0.5 text-[11px] uppercase tracking-wider">
              Photo & Lighting Tip
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              {weather.photoTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
