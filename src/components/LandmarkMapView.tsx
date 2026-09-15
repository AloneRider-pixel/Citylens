import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  Maximize2,
  Minimize2,
  Footprints,
  Eye,
  Landmark as LandmarkIcon,
  TreePine,
  Building2,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { LandmarkRecognitionResult, NearbyPointOfInterest } from '../types';

interface LandmarkMapViewProps {
  recognition: LandmarkRecognitionResult;
}

type MapTheme = 'dark' | 'light' | 'street';

const MAP_TILE_PROVIDERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Cyber Dark',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Clean Light',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Topographic Street',
  },
};

export const LandmarkMapView: React.FC<LandmarkMapViewProps> = ({ recognition }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePOIId, setActivePOIId] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const coords = recognition.coordinatesEstimate || { latitude: 48.8584, longitude: 2.2945 };
  const pois = recognition.nearbyPOIs || [];

  const filteredPOIs = selectedCategory === 'all'
    ? pois
    : pois.filter((poi) => poi.category === selectedCategory);

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'museum':
        return { label: 'Museum', color: 'bg-indigo-500 text-white', hex: '#6366f1', icon: Building2 };
      case 'park':
        return { label: 'Park & Gardens', color: 'bg-emerald-500 text-slate-950', hex: '#10b981', icon: TreePine };
      case 'viewpoint':
        return { label: 'Viewpoint', color: 'bg-cyan-500 text-slate-950', hex: '#06b6d4', icon: Eye };
      case 'historic':
        return { label: 'Historic Site', color: 'bg-rose-500 text-white', hex: '#f43f5e', icon: LandmarkIcon };
      case 'monument':
      default:
        return { label: 'Monument', color: 'bg-amber-500 text-slate-950', hex: '#f59e0b', icon: MapPin };
    }
  };

  // Initialize and tear down Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if container is reused
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const lat = coords.latitude;
    const lng = coords.longitude;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
    });

    // Add Tile Layer
    const currentProvider = MAP_TILE_PROVIDERS[mapTheme];
    const tileLayer = L.tileLayer(currentProvider.url, {
      attribution: currentProvider.attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Add Range Circles: 500m and 1km
    L.circle([lat, lng], {
      radius: 500,
      color: '#f59e0b',
      weight: 1.5,
      opacity: 0.5,
      fillColor: '#f59e0b',
      fillOpacity: 0.04,
      dashArray: '4, 6',
    }).addTo(map);

    L.circle([lat, lng], {
      radius: 1000,
      color: '#38bdf8',
      weight: 1,
      opacity: 0.35,
      fillColor: '#38bdf8',
      fillOpacity: 0.02,
      dashArray: '3, 8',
    }).addTo(map);

    // Primary Landmark Marker
    const primaryIconHtml = `
      <div class="relative flex items-center justify-center">
        <span class="absolute -inset-3 rounded-full bg-amber-400 opacity-60 animate-ping"></span>
        <div class="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-amber-400/30">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `;

    const primaryIcon = L.divIcon({
      html: primaryIconHtml,
      className: 'landmark-primary-pin',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });

    const primaryMarker = L.marker([lat, lng], { icon: primaryIcon, zIndexOffset: 1000 }).addTo(map);
    primaryMarker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 180px; padding: 2px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #f59e0b; margin-bottom: 2px;">
          Primary Target
        </div>
        <div style="font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.2;">
          ${recognition.landmarkName}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
          ${recognition.city}, ${recognition.country}
        </div>
      </div>
    `);

    // Invalidate size on load so rendering is crisp inside dynamic flex layouts
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [coords.latitude, coords.longitude]);

  // Update Tile Layer when mapTheme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const currentProvider = MAP_TILE_PROVIDERS[mapTheme];
    tileLayerRef.current.setUrl(currentProvider.url);
  }, [mapTheme]);

  // Render or update Nearby POIs Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old POI markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => marker.remove());
    markersRef.current = {};

    filteredPOIs.forEach((poi) => {
      const meta = getCategoryMeta(poi.category);

      const poiIconHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-115">
          <div style="background-color: ${meta.hex};" class="w-7 h-7 rounded-full text-slate-950 flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-black/20">
            <span style="font-size: 11px; font-weight: 900; color: #0f172a;">•</span>
          </div>
        </div>
      `;

      const poiIcon = L.divIcon({
        html: poiIconHtml,
        className: `poi-marker-${poi.id}`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([poi.coordinates.latitude, poi.coordinates.longitude], {
        icon: poiIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 190px; max-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 9999px; background: ${meta.hex}25; color: ${meta.hex};">
              ${meta.label}
            </span>
            <span style="font-size: 10px; font-weight: 600; color: #64748b;">
              ${poi.distanceMeters} m (${poi.walkingTimeMinutes || Math.round(poi.distanceMeters / 80)} min walk)
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            ${poi.name}
          </div>
          <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.4;">
            ${poi.shortDescription}
          </p>
        </div>
      `);

      marker.on('click', () => {
        setActivePOIId(poi.id);
      });

      markersRef.current[poi.id] = marker;
    });
  }, [filteredPOIs]);

  // Handler to fly to POI from list
  const handleSelectPOI = (poi: NearbyPointOfInterest) => {
    setActivePOIId(poi.id);
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([poi.coordinates.latitude, poi.coordinates.longitude], 17, {
      duration: 1.2,
    });
    const marker = markersRef.current[poi.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 700);
    }
  };

  // Recenter map on primary landmark
  const handleRecenterLandmark = () => {
    setActivePOIId(null);
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([coords.latitude, coords.longitude], 15, {
      duration: 1.2,
    });
  };

  const categories = [
    { id: 'all', label: 'All Sights', count: pois.length },
    { id: 'viewpoint', label: 'Viewpoints', count: pois.filter((p) => p.category === 'viewpoint').length },
    { id: 'historic', label: 'Historic', count: pois.filter((p) => p.category === 'historic').length },
    { id: 'museum', label: 'Museums', count: pois.filter((p) => p.category === 'museum').length },
    { id: 'park', label: 'Parks & Nature', count: pois.filter((p) => p.category === 'park').length },
  ].filter((c) => c.id === 'all' || c.count > 0);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
      {/* Section Header */}
      <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Geographic Map & Exploration Radius</h3>
              <span className="text-[10px] font-mono bg-amber-500/10 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-500/20 dark:border-amber-700/60 px-2 py-0.5 rounded-full font-semibold">
                500m - 1km Radius
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {coords.latitude.toFixed(4)}°N, {coords.longitude.toFixed(4)}°E • {recognition.city}, {recognition.country}
            </p>
          </div>
        </div>

        {/* Map Actions */}
        <div className="flex items-center gap-2">
          {/* Map Layer Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-950 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                mapTheme === 'dark' ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cyber Dark
            </button>
            <button
              onClick={() => setMapTheme('light')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                mapTheme === 'light' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Clean Light
            </button>
            <button
              onClick={() => setMapTheme('street')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                mapTheme === 'street' ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Street
            </button>
          </div>

          {/* Recenter Button */}
          <button
            onClick={handleRecenterLandmark}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Recenter Map on Landmark"
            aria-label="Recenter Map on Landmark"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Recenter</span>
          </button>

          {/* External Google Maps link */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs text-xs flex items-center gap-1 transition-colors"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline text-[11px] font-medium">Open Maps</span>
          </a>

          {/* Expand/Collapse Map Size */}
          <button
            onClick={() => {
              setIsMapExpanded(!isMapExpanded);
              setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
              }, 150);
            }}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
            title={isMapExpanded ? 'Standard view' : 'Enlarge map view'}
            aria-label={isMapExpanded ? 'Standard view' : 'Enlarge map view'}
          >
            {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Map Body: Grid with Map & Nearby POIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Left 2 Cols: Interactive Leaflet Map Canvas */}
        <div className="lg:col-span-2 relative">
          <div
            ref={mapContainerRef}
            className={`w-full transition-all duration-300 z-0 ${
              isMapExpanded ? 'h-[540px]' : 'h-[380px] sm:h-[420px]'
            }`}
          />

          {/* Floating Map Legend Overlays */}
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 space-y-1 shadow-xl pointer-events-auto">
              <div className="flex items-center gap-2 font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                <Navigation className="w-3 h-3" />
                <span>Geographic HUD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                <span className="font-semibold text-white">{recognition.landmarkName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full border border-amber-400 border-dashed" />
                <span>500m Walk Radius</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 border-dashed" />
                <span>1km Exploration Radius</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Points of Interest List & Filter Chips */}
        <div className="flex flex-col h-[380px] sm:h-[420px] bg-slate-50/40 dark:bg-slate-950/40">
          {/* POI Filter Chips */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Nearby Attractions ({pois.length})
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Sorted by distance
              </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* POI Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredPOIs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500">
                <MapPin className="w-8 h-8 stroke-1 mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs">No points of interest match this filter category.</p>
              </div>
            ) : (
              filteredPOIs.map((poi) => {
                const meta = getCategoryMeta(poi.category);
                const IconComponent = meta.icon;
                const isSelected = activePOIId === poi.id;

                return (
                  <div
                    key={poi.id}
                    onClick={() => handleSelectPOI(poi)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20 shadow-xs'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${meta.color}`}>
                          <IconComponent className="w-3 h-3" />
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{poi.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300/40 dark:border-amber-800 px-1.5 py-0.5 rounded-sm shrink-0">
                        {poi.distanceMeters} m
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-2">
                      {poi.shortDescription}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Footprints className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>~{poi.walkingTimeMinutes || Math.round(poi.distanceMeters / 80)} min walk</span>
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold flex items-center gap-0.5">
                        <span>Locate on Map</span>
                        <Navigation className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
