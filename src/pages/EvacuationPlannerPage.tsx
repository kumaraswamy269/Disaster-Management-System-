import React, { useState } from 'react';
import { 
  Route as RouteIcon, 
  MapPin, 
  Home, 
  Car, 
  Footprints, 
  Bus, 
  Clock, 
  AlertTriangle, 
  Save, 
  CheckCircle, 
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { EvacuationPlanItem, ShelterItem } from '../types';
import { MapComponent } from '../components/MapComponent';
import { API } from '../services/api';

interface EvacuationPlannerProps {
  shelters: ShelterItem[];
  currentLocation: { name: string; lat: number; lon: number };
}

export const EvacuationPlannerPage: React.FC<EvacuationPlannerProps> = ({
  shelters,
  currentLocation
}) => {
  const [originName, setOriginName] = useState('Home / Ward Community Point');
  const [originLat, setOriginLat] = useState(currentLocation.lat);
  const [originLon, setOriginLon] = useState(currentLocation.lon);

  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelters[0]?.id || 'SHL-01');
  const [evacuationMode, setEvacuationMode] = useState<'Vehicle' | 'Walking' | 'Emergency Transit'>('Vehicle');
  const [planNotes, setPlanNotes] = useState('Pack 72-hour survival kit, document waterproof pouch, and pet carriers.');

  const [savedPlans, setSavedPlans] = useState<EvacuationPlanItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load plans on mount
  React.useEffect(() => {
    API.getEvacuationPlans().then(setSavedPlans).catch(console.error);
  }, []);

  const selectedShelter = shelters.find(s => s.id === selectedShelterId) || shelters[0];

  // Calculate approximate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const distanceKm = selectedShelter 
    ? calculateDistance(originLat, originLon, selectedShelter.coordinates[0], selectedShelter.coordinates[1])
    : 4.8;

  const estimatedMinutes = Math.round(
    evacuationMode === 'Vehicle' ? (distanceKm / 28) * 60 : // 28 km/h storm traffic
    evacuationMode === 'Walking' ? (distanceKm / 4.2) * 60 : // 4.2 km/h
    (distanceKm / 18) * 60 // 18 km/h emergency transit
  );

  const routeCoordinates: [number, number][] = selectedShelter ? [
    [originLat, originLon],
    // midpoint waypoint for realistic bend
    [(originLat + selectedShelter.coordinates[0]) / 2 + 0.005, (originLon + selectedShelter.coordinates[1]) / 2 - 0.005],
    selectedShelter.coordinates
  ] : [];

  const handleSavePlan = async () => {
    if (!selectedShelter) return;
    setSaving(true);
    try {
      const newPlan = await API.saveEvacuationPlan({
        name: `Emergency Route to ${selectedShelter.name}`,
        origin: originName,
        originCoordinates: [originLat, originLon],
        destinationShelterId: selectedShelter.id,
        destinationName: selectedShelter.name,
        destinationCoordinates: selectedShelter.coordinates,
        evacuationMode,
        distanceKm,
        estimatedTimeMin: estimatedMinutes,
        notes: planNotes
      });
      setSavedPlans([newPlan, ...savedPlans]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
              Civil Protection Routing
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">Contingency Wayfinding</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <RouteIcon className="w-6 h-6 text-sky-400" />
            Evacuation Corridor & Safe Route Planner
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate departure corridors from hazard zones to registered shelters with transit time estimates and hazard alerts.
          </p>
        </div>
      </div>

      {/* Safety Warning Banner */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-amber-300">Mandatory Evacuation Warning:</strong> Computer-simulated routes provide general orientation only. In actual flooding or cyclonic conditions, bridges may be closed and flash waters may submerge roadways. Always follow active physical police checkpoints and official local disaster sirens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
            Route Waypoint Configuration
          </h2>

          {/* Origin */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Evacuation Origin</span>
            </label>
            <input
              type="text"
              value={originName}
              onChange={(e) => setOriginName(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Ref: [{originLat.toFixed(3)}°, {originLon.toFixed(3)}°]
            </div>
          </div>

          {/* Destination Shelter */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-sky-400" />
              <span>Destination Safe Shelter</span>
            </label>
            <select
              value={selectedShelterId}
              onChange={(e) => setSelectedShelterId(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {shelters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status} - {s.capacity - s.occupancy} vacancies)
                </option>
              ))}
            </select>
          </div>

          {/* Mode of Evacuation */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Evacuation Transit Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEvacuationMode('Vehicle')}
                className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  evacuationMode === 'Vehicle' 
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' 
                    : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Private Vehicle</span>
              </button>

              <button
                type="button"
                onClick={() => setEvacuationMode('Walking')}
                className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  evacuationMode === 'Walking' 
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' 
                    : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>On Foot / Walking</span>
              </button>

              <button
                type="button"
                onClick={() => setEvacuationMode('Emergency Transit')}
                className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  evacuationMode === 'Emergency Transit' 
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' 
                    : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bus className="w-4 h-4" />
                <span>Public Convoy</span>
              </button>
            </div>
          </div>

          {/* Metrics Preview */}
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Distance</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{distanceKm} km</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Est. Transit Time</div>
              <div className="text-xl font-black text-sky-400 font-mono mt-0.5">~{estimatedMinutes} min</div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Personal Contingency Checklist / Family Notes
            </label>
            <textarea
              rows={2}
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={handleSavePlan}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xs transition-all shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span>Saving Plan...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Plan Saved to Dashboard!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Proposed Evacuation Plan</span>
              </>
            )}
          </button>
        </div>

        {/* Right Map: 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-sky-400" />
                Calculated Evacuation Vector (Dashed Blue Path)
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedShelter?.name}
              </span>
            </div>

            <MapComponent
              center={[originLat, originLon]}
              zoom={11}
              shelters={shelters}
              selectedLocationName={originName}
              routeCoordinates={routeCoordinates}
              height="380px"
            />
          </div>

          {/* Saved Evacuation Plans List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              Saved Household & Ward Evacuation Plans ({savedPlans.length})
            </h3>

            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {savedPlans.map((plan) => (
                <div key={plan.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold text-slate-100">{plan.name}</div>
                    <div className="text-[11px] text-slate-400">
                      From: {plan.origin} → {plan.destinationName} ({plan.distanceKm} km, ~{plan.estimatedTimeMin} min via {plan.evacuationMode})
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
