import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, 
  Layers, 
  RefreshCw, 
  Sliders, 
  LifeBuoy, 
  Globe, 
  ExternalLink,
  Radio,
  Activity,
  AlertTriangle,
  Home,
  CloudRain,
  Compass,
  ArrowRight,
  ShieldAlert,
  Flame,
  Waves
} from 'lucide-react';
import { 
  AlertItem, 
  ShelterItem, 
  RealWorldDisasterItem, 
  DistressBeaconItem,
  ScenarioSimulationResult,
  SensorItem
} from '../types';
import { MapComponent } from '../components/MapComponent';
import { API } from '../services/api';

interface RiskMapPageProps {
  currentLocation: { name: string; lat: number; lon: number };
  alerts: AlertItem[];
  shelters: ShelterItem[];
  onSelectAlert?: (alert: AlertItem) => void;
  onSelectShelter?: (shelter: ShelterItem) => void;
  onNavigateTab?: (tab: any) => void;
}

// Haversine distance calculator
function getDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const RiskMapPage: React.FC<RiskMapPageProps> = ({
  currentLocation,
  alerts,
  shelters,
  onSelectAlert,
  onSelectShelter,
  onNavigateTab
}) => {
  // Map View State
  const [mapCenter, setMapCenter] = useState<[number, number]>([currentLocation.lat, currentLocation.lon]);
  const [mapZoom, setMapZoom] = useState<number>(6);

  // Layer Toggles
  const [showRealWorld, setShowRealWorld] = useState<boolean>(true);
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showAlerts, setShowAlerts] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showDistress, setShowDistress] = useState<boolean>(true);
  const [showImpactRadius, setShowImpactRadius] = useState<boolean>(true);
  const [showLiveRadar, setShowLiveRadar] = useState<boolean>(false);

  // Filters
  const [minMagnitude, setMinMagnitude] = useState<number>(2.5);
  const [filterHazardType, setFilterHazardType] = useState<string>('All');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Real-world data state
  const [realWorldDisasters, setRealWorldDisasters] = useState<RealWorldDisasterItem[]>([]);
  const [realWorldSource, setRealWorldSource] = useState<string>('USGS & Global Multi-Hazard Real-Time Network');
  const [loadingRealWorld, setLoadingRealWorld] = useState<boolean>(false);

  // IoT Sensors state
  const [sensors, setSensors] = useState<SensorItem[]>([]);

  // Distress Beacons state
  const [distressBeacons, setDistressBeacons] = useState<DistressBeaconItem[]>([]);

  // Selected item flyout
  const [selectedDisaster, setSelectedDisaster] = useState<RealWorldDisasterItem | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<SensorItem | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [selectedBeacon, setSelectedBeacon] = useState<DistressBeaconItem | null>(null);

  // What-If Simulation Sandbox State
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [simHazard, setSimHazard] = useState<string>('Cyclone');
  const [simIntensity, setSimIntensity] = useState<string>('Extreme');
  const [simCoords, setSimCoords] = useState<[number, number]>([currentLocation.lat, currentLocation.lon]);
  const [simResult, setSimResult] = useState<ScenarioSimulationResult | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Distress Beacon SOS Modal
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [sosSender, setSosSender] = useState('');
  const [sosContact, setSosContact] = useState('');
  const [sosLocation, setSosLocation] = useState(currentLocation.name);
  const [sosType, setSosType] = useState<any>('Trapped by Water');
  const [sosPeople, setSosPeople] = useState(4);
  const [sosNotes, setSosNotes] = useState('');
  const [submittingSos, setSubmittingSos] = useState(false);

  // Fetch real-world disasters
  const loadRealWorldDisasters = async (mag = minMagnitude, type = filterHazardType) => {
    setLoadingRealWorld(true);
    try {
      const res = await API.getRealWorldDisasters(mag);
      let list = res.disasters || [];
      if (type !== 'All') {
        list = list.filter(d => d.type === type);
      }
      setRealWorldDisasters(list);
      if (res.source) setRealWorldSource(res.source);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRealWorld(false);
    }
  };

  // Fetch IoT sensors
  const loadSensors = async () => {
    try {
      const res = await API.getSensors();
      setSensors(res.sensors || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch distress beacons
  const loadDistressBeacons = async () => {
    try {
      const beacons = await API.getDistressBeacons();
      setDistressBeacons(beacons || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRealWorldDisasters(minMagnitude, filterHazardType);
    loadSensors();
    loadDistressBeacons();

    // Periodic 4-second refresh for live real-time sensor & disaster status
    const interval = setInterval(() => {
      loadSensors();
    }, 4000);

    return () => clearInterval(interval);
  }, [minMagnitude, filterHazardType]);

  // Sync center when currentLocation prop changes
  useEffect(() => {
    setMapCenter([currentLocation.lat, currentLocation.lon]);
  }, [currentLocation.lat, currentLocation.lon]);

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const res = await API.simulateScenario({
        hazard: simHazard,
        location: currentLocation.name,
        coordinates: simCoords,
        intensityLevel: simIntensity
      });
      setSimResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleBeaconStatusUpdate = async (id: string, status: string) => {
    try {
      const updated = await API.updateDistressBeaconStatus(id, status);
      setDistressBeacons(prev => prev.map(b => b.id === id ? updated : b));
      if (selectedBeacon && selectedBeacon.id === id) {
        setSelectedBeacon(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostSosBeacon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosSender.trim() || !sosLocation.trim()) return;
    setSubmittingSos(true);
    try {
      const newB = await API.createDistressBeacon({
        senderName: sosSender.trim(),
        contact: sosContact.trim() || '+1-EMERGENCY',
        locationName: sosLocation.trim(),
        coordinates: [currentLocation.lat, currentLocation.lon],
        emergencyType: sosType,
        peopleCount: Number(sosPeople) || 1,
        urgency: 'Critical (Life at Risk)',
        notes: sosNotes.trim() || 'Immediate evacuation needed.'
      });
      setDistressBeacons([newB, ...distressBeacons]);
      setShowSosModal(false);
      setSosSender('');
      setSosNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingSos(false);
    }
  };

  // Preset Regions Navigator
  const regionPresets = [
    { label: '📍 Current Station', coords: [currentLocation.lat, currentLocation.lon] as [number, number], zoom: 6 },
    { label: '🌐 Global Scope', coords: [20.0, 0.0] as [number, number], zoom: 2 },
    { label: '⚡ Pacific Ring of Fire', coords: [12.0, 140.0] as [number, number], zoom: 4 },
    { label: '🌀 Bay of Bengal', coords: [19.2, 87.2] as [number, number], zoom: 6 },
    { label: '🔥 California Fire & Fault', coords: [37.2, -120.5] as [number, number], zoom: 6 },
    { label: '🌊 Japan Seismic Trench', coords: [36.2, 141.2] as [number, number], zoom: 6 },
    { label: '🏔️ Himalayan Ridge', coords: [31.1, 77.2] as [number, number], zoom: 7 }
  ];

  // Build impact circles for simulation
  const simulationImpactCircles = simResult ? [
    {
      center: simResult.coordinates,
      radiusKm: simResult.impactRadiusKm,
      color: '#ef4444',
      fillColor: '#ef4444',
      label: `Impact Zone (~${simResult.impactRadiusKm} km)`
    },
    {
      center: simResult.coordinates,
      radiusKm: simResult.recommendedEvacPerimeterKm,
      color: '#f97316',
      fillColor: '#f97316',
      label: `Evacuation Perimeter (~${simResult.recommendedEvacPerimeterKm} km)`
    }
  ] : [];

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Real-World Disaster GIS Radar & IoT Sensor Grid
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">Live USGS, GDACS & RainViewer Feeds</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-rose-500" />
            Global Real-World Disaster Map & Live Operations
          </h1>
        </div>

        {/* Action Buttons: Simulator & Distress SOS */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('sensors')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 transition-all cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Open IoT Sensor Hub</span>
            </button>
          )}

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showSimulator 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-950/40' 
                : 'bg-slate-850 border-slate-700 text-purple-300 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showSimulator ? 'Close Sandbox' : 'What-If Disaster Sandbox'}</span>
          </button>

          <button
            onClick={() => setShowSosModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-950/40 flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Civilian SOS Beacon</span>
          </button>

          <button
            onClick={() => {
              loadRealWorldDisasters(minMagnitude, filterHazardType);
              loadSensors();
            }}
            disabled={loadingRealWorld}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh All Feeds"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRealWorld ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Region Presets Flyout Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] font-bold">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Region Focus:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {regionPresets.map((reg, idx) => (
            <button
              key={idx}
              onClick={() => {
                setMapCenter(reg.coords);
                setMapZoom(reg.zoom);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-750 border border-slate-700/80 text-slate-300 hover:text-white font-medium text-[11px] transition-all cursor-pointer"
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Toggles & Feed Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Active Layers:
          </span>

          {/* Toggle Real World */}
          <button
            onClick={() => setShowRealWorld(!showRealWorld)}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showRealWorld
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Real-World Disasters ({realWorldDisasters.length})</span>
          </button>

          {/* Toggle IoT Real-Time Sensors */}
          <button
            onClick={() => setShowSensors(!showSensors)}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showSensors
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>IoT Sensors ({sensors.length})</span>
          </button>

          {/* Toggle Live Weather Radar */}
          <button
            onClick={() => setShowLiveRadar(!showLiveRadar)}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showLiveRadar
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50'
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <CloudRain className={`w-3 h-3 ${showLiveRadar ? 'text-cyan-300 animate-bounce' : ''}`} />
            <span>Live Rain Radar</span>
          </button>

          {/* Toggle Regional Alerts */}
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showAlerts
                ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Alerts ({alerts.length})</span>
          </button>

          {/* Toggle Safe Shelters */}
          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showShelters
                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <Home className="w-3 h-3" />
            <span>Shelters ({shelters.length})</span>
          </button>

          {/* Toggle SOS Beacons */}
          <button
            onClick={() => setShowDistress(!showDistress)}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showDistress
                ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <LifeBuoy className="w-3 h-3" />
            <span>SOS ({distressBeacons.length})</span>
          </button>

          {/* Toggle Impact Radius Circles */}
          <button
            onClick={() => setShowImpactRadius(!showImpactRadius)}
            className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showImpactRadius
                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                : 'bg-slate-850 border-slate-700 text-slate-500'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Impact Rings</span>
          </button>
        </div>

        {/* Hazard Category Filter & Min Magnitude */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono">Hazard:</span>
            <select
              value={filterHazardType}
              onChange={(e) => setFilterHazardType(e.target.value)}
              className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-rose-500"
            >
              <option value="All">All Hazards</option>
              <option value="Earthquake">Earthquakes (USGS)</option>
              <option value="Cyclone">Tropical Cyclones</option>
              <option value="Wildfire">Wildfire Hotspots (NASA)</option>
              <option value="Volcano">Volcanoes</option>
              <option value="Severe Weather">Basin Floods</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono">Min Mag:</span>
            <select
              value={minMagnitude}
              onChange={(e) => setMinMagnitude(parseFloat(e.target.value))}
              className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-rose-500"
            >
              <option value="2.5">All M2.5+ (Past 24h)</option>
              <option value="4.5">M4.5+ Significant (Past 7d)</option>
              <option value="6.0">M6.0+ Major Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* What-If Disaster Scenario Sandbox Tray */}
      {showSimulator && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">
                Disaster Impact Scenario Sandbox ("What-If" Analysis)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
              Computational Physics Simulation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Hazard Type</label>
              <select
                value={simHazard}
                onChange={(e) => setSimHazard(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="Cyclone">Tropical Cyclone / Storm Surge</option>
                <option value="Flood">Riverine Flash Flood Inundation</option>
                <option value="Earthquake">Shallow Crustal Earthquake</option>
                <option value="Wildfire">Rapid Spread Crown Wildfire</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Intensity Category</label>
              <select
                value={simIntensity}
                onChange={(e) => setSimIntensity(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="Extreme">Extreme (Catastrophic Scenario)</option>
                <option value="High">High (Major Incident)</option>
                <option value="Moderate">Moderate (Standard Response)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Target Epicenter Coords</label>
              <input
                type="text"
                value={`${simCoords[0].toFixed(3)}, ${simCoords[1].toFixed(3)}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',').map(p => parseFloat(p.trim()));
                  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    setSimCoords([parts[0], parts[1]]);
                  }
                }}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{simulating ? 'Simulating...' : 'Run Simulation'}</span>
              </button>
            </div>
          </div>

          {simResult && (
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-purple-300 text-xs">
                  Simulation Output: {simResult.hazard} ({simResult.intensityMetric})
                </span>
                <span className="text-[10px] text-purple-400 font-mono">
                  Impact Radius: ~{simResult.impactRadiusKm} km | Evacuation Perimeter: ~{simResult.recommendedEvacPerimeterKm} km
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-850 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Affected Population</div>
                  <div className="text-sm font-black text-rose-400">~{simResult.estimatedAffectedPop.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-850 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Vulnerable Structures</div>
                  <div className="text-sm font-black text-amber-400">~{simResult.vulnerableStructuresEst.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-850 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Shelter Bed Deficit</div>
                  <div className="text-sm font-black text-purple-400">~{simResult.shelterDeficitEst.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-850 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Impact Rings Plotted</div>
                  <div className="text-sm font-black text-emerald-400">2 Zones Active</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1">
                <strong className="text-purple-300">Prescribed Emergency Action Plan:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {simResult.actionPlan.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Map Box */}
      <div className="relative">
        <MapComponent
          center={mapCenter}
          zoom={mapZoom}
          alerts={alerts}
          shelters={shelters}
          realWorldDisasters={realWorldDisasters}
          sensors={sensors}
          distressBeacons={distressBeacons}
          impactCircles={simulationImpactCircles}
          selectedLocationName={currentLocation.name}
          filterSeverity={filterSeverity}
          filterCategory={filterCategory}
          showAlerts={showAlerts}
          showShelters={showShelters}
          showRealWorld={showRealWorld}
          showSensors={showSensors}
          showDistress={showDistress}
          showImpactRadius={showImpactRadius}
          showLiveRadar={showLiveRadar}
          defaultBaseLayer="satellite"
          height="640px"
          onSelectRealWorld={(d) => {
            setSelectedDisaster(d);
            setSelectedSensor(null);
            setSelectedAlert(null);
            setSelectedBeacon(null);
          }}
          onSelectSensor={(s) => {
            setSelectedSensor(s);
            setSelectedDisaster(null);
            setSelectedAlert(null);
            setSelectedBeacon(null);
          }}
          onSelectAlert={(a) => {
            setSelectedAlert(a);
            setSelectedDisaster(null);
            setSelectedSensor(null);
            setSelectedBeacon(null);
            if (onSelectAlert) onSelectAlert(a);
          }}
          onSelectBeacon={(b) => {
            setSelectedBeacon(b);
            setSelectedDisaster(null);
            setSelectedSensor(null);
            setSelectedAlert(null);
          }}
          onMapClick={(lat, lng) => {
            setSimCoords([lat, lng]);
          }}
        />

        {/* Selected Disaster Item Floating Details Drawer */}
        {selectedDisaster && (
          <div className="absolute top-4 right-4 z-[1000] w-84 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs text-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                REAL-WORLD {selectedDisaster.type.toUpperCase()}
              </span>
              <button 
                onClick={() => setSelectedDisaster(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="font-bold text-sm text-white mt-2 mb-1">{selectedDisaster.title}</h3>
            
            <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1.5 my-2 text-[11px]">
              <div><strong>Location:</strong> {selectedDisaster.location}</div>
              {selectedDisaster.depthKm && <div><strong>Depth:</strong> {selectedDisaster.depthKm} km</div>}
              <div><strong>Impact Buffer:</strong> ~{selectedDisaster.radiusKm} km</div>
              <div><strong>Coordinates:</strong> [{selectedDisaster.coordinates[0].toFixed(3)}°, {selectedDisaster.coordinates[1].toFixed(3)}°]</div>
              {selectedDisaster.type === 'Earthquake' && (
                <div><strong>Tsunami Marine Alert:</strong> {selectedDisaster.tsunami ? '⚠️ YES - ACTIVE BULLETIN' : 'No Tsunami Generated'}</div>
              )}
              <div><strong>Timestamp:</strong> {new Date(selectedDisaster.time).toLocaleString()}</div>
            </div>

            {/* Distance & Wave propagation */}
            {(() => {
              const dist = getDistKm(currentLocation.lat, currentLocation.lon, selectedDisaster.coordinates[0], selectedDisaster.coordinates[1]);
              const pWave = Math.round(dist / 6.0);
              const sWave = Math.round(dist / 3.5);
              return (
                <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 mb-2">
                  <div className="font-bold">Distance to Your Operations Base: ~{dist} km</div>
                  {selectedDisaster.type === 'Earthquake' && (
                    <div className="text-[10px] text-cyan-300/80 mt-1">
                      Estimated P-Wave ETA: ~{pWave}s | S-Wave ETA: ~{sWave}s
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex flex-col gap-1.5 mt-2">
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('evacuation')}
                  className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Plot Evacuation Route From Hazard</span>
                </button>
              )}

              {selectedDisaster.url && (
                <a
                  href={selectedDisaster.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Inspect Official Feed Telemetry</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Selected Sensor Floating Details Drawer */}
        {selectedSensor && (
          <div className="absolute top-4 right-4 z-[1000] w-88 bg-slate-900/95 backdrop-blur border border-emerald-500/50 rounded-2xl p-4 shadow-2xl text-xs text-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                selectedSensor.status === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                selectedSensor.status === 'Warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                IOT SENSOR TELEMETRY &bull; {selectedSensor.status.toUpperCase()}
              </span>
              <button 
                onClick={() => setSelectedSensor(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="font-bold text-sm text-white mt-2 mb-1">{selectedSensor.name}</h3>
            
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-2 my-2">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 font-medium">Instantaneous Value:</span>
                <span className={`text-xl font-black font-mono ${
                  selectedSensor.status === 'Critical' ? 'text-rose-400' :
                  selectedSensor.status === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {selectedSensor.currentValue} {selectedSensor.unit}
                </span>
              </div>

              {/* Threshold Gauge Bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Warn: {selectedSensor.warningThreshold} {selectedSensor.unit}</span>
                  <span>Crit: {selectedSensor.criticalThreshold} {selectedSensor.unit}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full ${
                      selectedSensor.status === 'Critical' ? 'bg-rose-500 animate-pulse' :
                      selectedSensor.status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.round((selectedSensor.currentValue / selectedSensor.criticalThreshold) * 100))}%` 
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1">
                <div><strong>Rate of Rise:</strong> {selectedSensor.rateOfChange && selectedSensor.rateOfChange > 0 ? `+${selectedSensor.rateOfChange}` : selectedSensor.rateOfChange || '0.00'} {selectedSensor.rateOfChangeUnit || ''}</div>
                <div><strong>Anomaly Score:</strong> <span className="font-bold text-rose-400">{selectedSensor.anomalyScore ?? 75}/100</span></div>
                <div><strong>Signal Uplink:</strong> {selectedSensor.signalQuality}</div>
                <div><strong>Roundtrip Latency:</strong> {selectedSensor.latencyMs}ms</div>
                <div><strong>Station Battery:</strong> {selectedSensor.batteryLevel}%</div>
                <div><strong>Hazard Monitored:</strong> {selectedSensor.hazard}</div>
              </div>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('sensors')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Open Live Oscilloscope & High-Speed Stream</span>
              </button>
            )}
          </div>
        )}

        {/* Selected Beacon Floating Details Drawer */}
        {selectedBeacon && (
          <div className="absolute top-4 right-4 z-[1000] w-80 bg-slate-900/95 backdrop-blur border border-rose-500/60 rounded-2xl p-4 shadow-2xl text-xs text-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono bg-rose-600/30 text-rose-300 border border-rose-500/50">
                DISTRESS BEACON • {selectedBeacon.status}
              </span>
              <button 
                onClick={() => setSelectedBeacon(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="font-bold text-sm text-white mt-2 mb-1">
              SOS: {selectedBeacon.emergencyType}
            </h3>

            <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1 my-2 text-[11px]">
              <div><strong>Caller:</strong> {selectedBeacon.senderName} ({selectedBeacon.peopleCount} People)</div>
              <div><strong>Location:</strong> {selectedBeacon.locationName}</div>
              <div><strong>Contact:</strong> {selectedBeacon.contact}</div>
              <div className="bg-rose-950/40 border border-rose-500/30 p-1.5 rounded text-rose-200 mt-1">
                "{selectedBeacon.notes}"
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Reported: {new Date(selectedBeacon.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              {selectedBeacon.status === 'Pending Rescue' && (
                <button
                  onClick={() => handleBeaconStatusUpdate(selectedBeacon.id, 'Team Dispatched')}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                >
                  Dispatch Rescue Team
                </button>
              )}
              {selectedBeacon.status !== 'Resolved / Rescued' && (
                <button
                  onClick={() => handleBeaconStatusUpdate(selectedBeacon.id, 'Resolved / Rescued')}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                >
                  Mark Rescued
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Distress Beacon Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-rose-500 animate-pulse" />
                <h2 className="text-base font-bold text-white">Broadcast Civilian Emergency SOS</h2>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostSosBeacon} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Name of Person / Community Ward</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh & Sharma Family"
                  value={sosSender}
                  onChange={(e) => setSosSender(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Emergency Category</label>
                  <select
                    value={sosType}
                    onChange={(e) => setSosType(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Trapped by Water">Trapped by Rising Water</option>
                    <option value="Medical Urgent">Medical Urgent / Critical Care</option>
                    <option value="Structure Collapse">Structure Collapse Hazard</option>
                    <option value="Elderly/Infant Evac">Elderly / Infant Evacuation</option>
                    <option value="Food/Water Cutoff">Food / Potable Water Depletion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Number of Individuals</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={sosPeople}
                    onChange={(e) => setSosPeople(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Detailed Location / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Ground floor behind Primary School, Majuli"
                  value={sosLocation}
                  onChange={(e) => setSosLocation(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Contact Phone / Wireless Radio</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={sosContact}
                  onChange={(e) => setSosContact(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Urgent Situation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Provide water depth, immediate medical constraints..."
                  value={sosNotes}
                  onChange={(e) => setSosNotes(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSos}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/40"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>{submittingSos ? 'Broadcasting...' : 'Broadcast SOS Beacon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
