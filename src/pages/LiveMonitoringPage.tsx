import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  RefreshCw, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Sun, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Compass,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { WeatherData } from '../types';
import { API } from '../services/api';

interface LiveMonitoringPageProps {
  currentLocation: { name: string; lat: number; lon: number };
  weather: WeatherData | null;
  onLocationChange: (loc: { name: string; lat: number; lon: number }) => void;
  onRefreshWeather: () => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  currentLocation,
  weather,
  onLocationChange,
  onRefreshWeather
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await API.geocode(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (item: { display_name: string; lat: string; lon: string }) => {
    onLocationChange({
      name: item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefreshWeather();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Severe Weather Anomaly Highlights
  const anomalyWarnings: string[] = [];
  if (weather) {
    if (weather.temperature >= 40) {
      anomalyWarnings.push(`Severe Heat Stress: Ambient temperature is ${weather.temperature}°C, presenting extreme hyperthermia danger.`);
    }
    if (weather.windSpeed >= 50) {
      anomalyWarnings.push(`High Wind Advisory: Wind speed exceeds ${weather.windSpeed} km/h with gale potential.`);
    }
    if (weather.precipitation >= 15) {
      anomalyWarnings.push(`Heavy Precipitation Rate: Active downpour at ${weather.precipitation} mm/h may cause rapid localized runoff.`);
    }
    if (weather.humidity <= 20) {
      anomalyWarnings.push(`Critical Low Relative Humidity: ${weather.humidity}% relative humidity sharply elevates vegetative fire risk.`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Atmospheric Telemetry Radar
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">Live Weather Model Integration</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-400" />
            Real-Time Meteorological & Climate Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live surface observations, pressure systems, and numerical forecast models streaming from Open-Meteo API.
          </p>
        </div>

        {/* Refresh & Location status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Geocoding City Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search any global city, district, or coordinates (e.g., Guwahati, Mumbai, Miami, Dhaka)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Locate</span>
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 p-2 bg-slate-850 rounded-xl border border-slate-700 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono px-2 py-1">
              Select Coordinate Zone
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(item)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-700/60 transition-colors flex items-center justify-between"
              >
                <span className="truncate max-w-md">{item.display_name}</span>
                <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                  {parseFloat(item.lat).toFixed(2)}°, {parseFloat(item.lon).toFixed(2)}°
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Atmospheric Anomaly Callout Banner (if applicable) */}
      {anomalyWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Notable Meteorological Conditions Detected</span>
          </div>
          <ul className="text-xs space-y-1 text-amber-100/90 list-disc list-inside">
            {anomalyWarnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Observations Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Temp */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Air Temp</span>
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {weather ? `${weather.temperature}` : '26.4'}°C
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Feels like {weather?.apparentTemperature ?? 28}°C
          </div>
        </div>

        {/* Metric 2: Precipitation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Rainfall</span>
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {weather?.precipitation ?? 0} <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Current rate/hour</div>
        </div>

        {/* Metric 3: Wind Speed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Wind Speed</span>
            <Wind className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {weather?.windSpeed ?? 14} <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Heading: {weather?.windDirection ?? 180}°
          </div>
        </div>

        {/* Metric 4: Humidity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {weather?.humidity ?? 68}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Relative humidity</div>
        </div>

        {/* Metric 5: Surface Pressure */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pressure</span>
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {weather?.surfacePressure ? Math.round(weather.surfacePressure) : 1012}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">hPa barometric</div>
        </div>

        {/* Metric 6: Weather Code */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Conditions</span>
            <Sun className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-sm font-bold text-white mt-1 truncate">
            {weather?.precipitation && weather.precipitation > 0 ? 'Precipitating' : 'Fair / Clear'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            WMO Code: {weather?.weatherCode ?? 0}
          </div>
        </div>
      </div>

      {/* 7-Day Daily Forecast Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">7-Day Numerical Weather Prediction (NWP)</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Station: {currentLocation.name} ({currentLocation.lat.toFixed(2)}°, {currentLocation.lon.toFixed(2)}°)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {weather?.daily?.time ? (
            weather.daily.time.map((day, idx) => (
              <div key={day} className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex flex-col justify-between text-center">
                <div className="text-xs font-semibold text-slate-300 font-mono">
                  {new Date(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="my-2">
                  <div className="text-base font-black text-white font-mono">
                    {Math.round(weather.daily!.tempMax[idx])}°
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      {Math.round(weather.daily!.tempMin[idx])}°
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-sky-400 flex items-center justify-center gap-1 font-mono">
                  <CloudRain className="w-3 h-3" />
                  <span>{weather.daily!.precipitationSum[idx]} mm</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Wind: {Math.round(weather.daily!.windMax[idx])} km/h
                </div>
              </div>
            ))
          ) : (
            [...Array(7)].map((_, i) => (
              <div key={i} className="bg-slate-850 p-3 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                Day {i + 1}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Official Disaster Information Sources Verification Box */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Official Disaster Authority Directives & Verification Protocol</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Meteorological telemetry alone does NOT substantiate an official disaster declaration or mandatory evacuation order. DisasterGuard AI integrates numerical weather observations for analytical support. For legally binding civil defense directives, consult official emergency portals:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
          <a
            href="https://ndma.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>NDMA (India)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <a
            href="https://www.fema.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>FEMA (United States)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <a
            href="https://worldweather.wmo.int"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>WMO World Weather</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <a
            href="https://emergency.copernicus.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>Copernicus EMS</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
          <span>Telemetry Source: {weather?.dataSource || 'Open-Meteo'}</span>
          <span>Observation Timestamp: {weather?.retrievedAt ? new Date(weather.retrievedAt).toLocaleTimeString() : 'Current'}</span>
        </div>
      </div>
    </div>
  );
};
