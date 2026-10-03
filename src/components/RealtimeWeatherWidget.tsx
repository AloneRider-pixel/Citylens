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
  MapPin,
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
      <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400" />
          Real-time weather station temporarily updating for {recognition.city}.
        </span>
        <button
          onClick={() => loadWeather(true)}
          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
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

  const formatCoords = (lat?: number, lng?: number) => {
    if (lat === undefined || lng === undefined) return null;
    const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
    return `${latStr}, ${lngStr}`;
  };

  const coordsText = formatCoords(coords?.latitude, coords?.longitude);

  return (
    <div className={`p-4 sm:p-6 bg-gradient-to-br ${visuals.bgGradient} dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors`}>
      {/* Top Header Row with Landmark Coordinates & External API Source */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Atmosphere</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
            {recognition.city}, {recognition.country}
          </span>

          {/* Precise Landmark Coordinates Badge */}
          {coordsText && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-2xs font-medium">
              <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{coordsText}</span>
            </span>
          )}

          {/* External Weather API Provider Tag */}
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <CloudSun className="w-3 h-3 text-amber-500 shrink-0" />
            <span>{weather.source || 'Open-Meteo API'}</span>
          </span>

          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden lg:inline">
            (Updated {weather.lastUpdated})
          </span>
        </div>

        {/* Controls: Unit switch & Refresh */}
        <div className="flex items-center gap-2">
          {/* Temperature Unit Toggle */}
          <div className="inline-flex bg-white/90 dark:bg-slate-900 backdrop-blur-xs rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold">
            <button
              onClick={() => setUnit('C')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                unit === 'C'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                unit === 'F'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              °F
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadWeather(true)}
            disabled={isRefreshing}
            className="p-1.5 bg-white/90 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-colors cursor-pointer"
            title="Refresh live weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600 dark:text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Weather Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column (5 cols): Main Temperature & Condition Showcase */}
        <div className="md:col-span-5 bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-13 h-13 rounded-2xl bg-slate-900/5 dark:bg-slate-900 flex items-center justify-center ${visuals.iconColor} shadow-inner`}>
              <WeatherIconComponent className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {currentTemp}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Feels like {apparentTemp}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${visuals.badgeColor} dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700`}>
                  {weather.condition}
                </span>
                {weather.cloudCoverPercent !== undefined && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
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
          <div className="bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Wind</span>
              <Wind className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white font-mono truncate">
              {weather.windSpeedKmh} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">km/h</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <Compass className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>{weather.windDirectionText}</span>
            </div>
          </div>

          {/* Humidity Instrument */}
          <div className="bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white font-mono">
              {weather.relativeHumidity}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {weather.relativeHumidity > 70 ? 'High moisture' : weather.relativeHumidity < 30 ? 'Dry air' : 'Comfortable'}
            </div>
          </div>

          {/* UV Index / Sunlight */}
          <div className="bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">UV Index</span>
              <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white font-mono">
              {weather.uvIndex} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">of 11</span>
            </div>
            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
              {weather.uvIndex >= 8 ? 'Very High' : weather.uvIndex >= 6 ? 'High' : weather.uvIndex >= 3 ? 'Moderate' : 'Low'}
            </div>
          </div>

          {/* Sun Cycle / Ephemeris */}
          <div className="bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Sun Cycle</span>
              {weather.isDay ? (
                <Sunset className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              ) : (
                <Sunrise className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              )}
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white font-mono truncate">
              {weather.sunsetTime ? `Set ${weather.sunsetTime}` : weather.sunriseTime ? `Rise ${weather.sunriseTime}` : weather.isDay ? 'Daylight' : 'Night'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {weather.isDay ? 'Optimal Daylight' : 'Night Illumination'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Visiting & Architectural Photography Advisories */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {/* Sightseeing Tip */}
        <div className="bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-amber-500/10 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white mb-0.5 text-[11px] uppercase tracking-wider">
              Visiting Advisory
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
              {weather.visitingAdvisory}
            </p>
          </div>
        </div>

        {/* Photography Tip */}
        <div className="bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-blue-500/10 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white mb-0.5 text-[11px] uppercase tracking-wider">
              Photo & Lighting Tip
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
              {weather.photoTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
