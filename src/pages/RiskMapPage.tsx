import React, { useState } from 'react';
import { 
  Map as MapIcon, 
  Filter, 
  Layers, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Home, 
  Compass, 
  Search,
  ExternalLink
} from 'lucide-react';
import { AlertItem, ShelterItem } from '../types';
import { MapComponent } from '../components/MapComponent';

interface RiskMapPageProps {
  currentLocation: { name: string; lat: number; lon: number };
  alerts: AlertItem[];
  shelters: ShelterItem[];
  onSelectAlert?: (alert: AlertItem) => void;
  onSelectShelter?: (shelter: ShelterItem) => void;
}

export const RiskMapPage: React.FC<RiskMapPageProps> = ({
  currentLocation,
  alerts,
  shelters,
  onSelectAlert,
  onSelectShelter
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showAlerts, setShowAlerts] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [activeAlertDetails, setActiveAlertDetails] = useState<AlertItem | null>(null);

  const handleMarkerClick = (alert: AlertItem) => {
    setActiveAlertDetails(alert);
    if (onSelectAlert) onSelectAlert(alert);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
              Geospatial Operations Canvas
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">OpenStreetMap Tile Engine</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-rose-500" />
            Interactive Disaster Risk & Asset Radar Map
          </h1>
        </div>

        {/* Filters & Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Severities</option>
            <option value="Extreme">Extreme Severity</option>
            <option value="High">High Severity</option>
            <option value="Moderate">Moderate Severity</option>
            <option value="Low">Low Severity</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Disaster Hazards</option>
            <option value="Flood">Floods</option>
            <option value="Cyclone">Cyclones</option>
            <option value="Wildfire">Wildfires</option>
            <option value="Drought">Droughts</option>
            <option value="Heatwave">Heatwaves</option>
          </select>

          {/* Toggle Layers */}
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showAlerts 
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Hazard Markers</span>
          </button>

          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showShelters 
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' 
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Safe Shelters</span>
          </button>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="relative">
        <MapComponent
          center={[currentLocation.lat, currentLocation.lon]}
          zoom={5}
          alerts={alerts}
          shelters={shelters}
          selectedLocationName={currentLocation.name}
          filterSeverity={filterSeverity}
          filterCategory={filterCategory}
          showAlerts={showAlerts}
          showShelters={showShelters}
          height="620px"
          onSelectAlert={handleMarkerClick}
        />

        {/* Selected Alert Details Floating Flyout (if clicked) */}
        {activeAlertDetails && (
          <div className="absolute top-4 right-4 z-[1000] w-80 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs text-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                activeAlertDetails.severity === 'Extreme' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                activeAlertDetails.severity === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {activeAlertDetails.severity} • {activeAlertDetails.category}
              </span>
              <button 
                onClick={() => setActiveAlertDetails(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h3 className="font-bold text-sm text-white mt-2 mb-1">{activeAlertDetails.title}</h3>
            <p className="text-slate-300 text-xs mb-2 leading-relaxed">{activeAlertDetails.description}</p>
            
            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 mb-2">
              <div className="text-[10px] font-semibold text-amber-300 uppercase mb-0.5">Primary Directive</div>
              <div>{activeAlertDetails.recommendedActions[0] || 'Observe local advisories.'}</div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex justify-between">
              <span>{activeAlertDetails.location}</span>
              <span>{activeAlertDetails.isSimulated ? 'Demo Marker' : 'Verified'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Verification & Citation Notice */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            OpenStreetMap geospatial projections. Red/orange markers denote verified and demonstration hazard events.
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          GIS Center Coordinates: [{currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}]
        </span>
      </div>
    </div>
  );
};
