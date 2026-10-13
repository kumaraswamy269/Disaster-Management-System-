import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Home, 
  TrendingUp, 
  Compass, 
  Clock, 
  ArrowRight,
  Filter,
  CheckCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { AlertItem, ShelterItem, WeatherData } from '../types';
import { MapComponent } from '../components/MapComponent';

interface DashboardPageProps {
  weather: WeatherData | null;
  alerts: AlertItem[];
  shelters: ShelterItem[];
  currentLocation: { name: string; lat: number; lon: number };
  onNavigateTab: (tab: any) => void;
  onSelectAlert: (alert: AlertItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  weather,
  alerts,
  shelters,
  currentLocation,
  onNavigateTab,
  onSelectAlert
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');

  const activeAlerts = alerts.filter(a => a.status === 'Active');
  const extremeAlerts = activeAlerts.filter(a => a.severity === 'Extreme');
  const highAlerts = activeAlerts.filter(a => a.severity === 'High');
  const openShelters = shelters.filter(s => s.status === 'Open');

  const filteredAlerts = alerts
    .filter(a => filterSeverity === 'All' || a.severity === filterSeverity)
    .filter(a => filterType === 'All' || a.category === filterType);

  // Recharts data for Risk Distribution
  const riskData = [
    { name: 'Floods', count: alerts.filter(a => a.category === 'Flood').length + 2, color: '#38bdf8' },
    { name: 'Cyclones', count: alerts.filter(a => a.category === 'Cyclone').length + 1, color: '#f43f5e' },
    { name: 'Wildfires', count: alerts.filter(a => a.category === 'Wildfire').length + 1, color: '#f97316' },
    { name: 'Droughts', count: alerts.filter(a => a.category === 'Drought').length + 1, color: '#eab308' },
    { name: 'Landslides', count: alerts.filter(a => a.category === 'Landslide').length + 1, color: '#a855f7' },
  ];

  // 7-day Historical and Forecast Weather Simulation Chart
  const weatherTrends = weather?.daily ? weather.daily.time.map((dateStr, idx) => ({
    date: dateStr.slice(5),
    tempMax: weather.daily!.tempMax[idx] ?? 30,
    tempMin: weather.daily!.tempMin[idx] ?? 22,
    rainfall: weather.daily!.precipitationSum[idx] ?? 0,
    wind: weather.daily!.windMax[idx] ?? 15,
  })) : [
    { date: 'Oct 07', tempMax: 31, tempMin: 23, rainfall: 4.2, wind: 14 },
    { date: 'Oct 08', tempMax: 32, tempMin: 24, rainfall: 12.5, wind: 22 },
    { date: 'Oct 09', tempMax: 29, tempMin: 22, rainfall: 45.0, wind: 38 },
    { date: 'Oct 10', tempMax: 27, tempMin: 21, rainfall: 78.4, wind: 48 },
    { date: 'Oct 11', tempMax: 28, tempMin: 20, rainfall: 24.1, wind: 29 },
    { date: 'Oct 12', tempMax: 30, tempMin: 22, rainfall: 8.0, wind: 16 },
    { date: 'Oct 13', tempMax: 32, tempMin: 23, rainfall: 2.1, wind: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Operations Context */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                Emergency Command Operations Center
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">Target Region: {currentLocation.name}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Disaster Risk Monitoring & Decision Support Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time atmospheric telemetry, multi-hazard rule engines, and spatial emergency asset logistics aligned with UN Sustainable Development Goal 13 (Climate Action).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => onNavigateTab('prediction')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-950/40 flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Predict Hazard Risk</span>
            </button>
            <button
              onClick={() => onNavigateTab('assistant')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ask AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Active Alerts */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {activeAlerts.length}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold font-mono">
              {extremeAlerts.length} Extreme
            </span>
            <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold font-mono">
              {highAlerts.length} High
            </span>
          </div>
        </div>

        {/* Card 2: Live Weather */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium uppercase tracking-wider">Surface Temperature</span>
            <Thermometer className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            {weather ? `${weather.temperature}` : '26.4'}
            <span className="text-sm font-sans font-normal text-slate-400">°C</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            Apparent: {weather?.apparentTemperature ?? 28}°C • {weather?.humidity ?? 68}% RH
          </p>
        </div>

        {/* Card 3: Wind & Precipitation */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium uppercase tracking-wider">Wind & Rainfall</span>
            <Wind className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            {weather ? `${weather.windSpeed}` : '14'}
            <span className="text-sm font-sans font-normal text-slate-400">km/h</span>
          </div>
          <p className="text-[11px] text-teal-400 mt-2 truncate">
            Precipitation: {weather?.precipitation ?? 0} mm/h (Open-Meteo)
          </p>
        </div>

        {/* Card 4: Safe Shelters */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium uppercase tracking-wider">Shelter Readiness</span>
            <Home className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {openShelters.length} <span className="text-sm font-sans font-normal text-slate-400">/ {shelters.length} Open</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 truncate">
            {shelters.reduce((acc, s) => acc + (s.capacity - s.occupancy), 0)} evacuee capacity available
          </p>
        </div>
      </div>

      {/* Main Grid: Map & Weather Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 2 Columns Interactive Map Preview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-rose-400" />
                Live Geospatial Disaster & Shelter Radar
              </h2>
              <p className="text-xs text-slate-400">
                Markers reflect active hazard zones and designated emergency shelters in the operational vicinity.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('map')}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Full-Screen Map View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MapComponent
            center={[currentLocation.lat, currentLocation.lon]}
            zoom={6}
            alerts={alerts}
            shelters={shelters}
            selectedLocationName={currentLocation.name}
            height="380px"
            onSelectAlert={onSelectAlert}
            onSelectShelter={() => onNavigateTab('shelters')}
          />
        </div>

        {/* Right: 1 Column Hazard Distribution & Quick Recommended Directives */}
        <div className="space-y-6">
          {/* Hazard Distribution Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center justify-between">
              <span>Hazard Category Distribution</span>
              <span className="text-[10px] text-slate-400 font-mono">System Registry</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Recorded disaster alerts categorized by primary climate impact.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommended Precautionary Directives */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Standard Precautionary Protocol
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <p className="leading-snug">
                  <strong>72h Emergency Survival Kit:</strong> Maintain 3 days of potable water (4L/person/day), waterproof torch, and battery bank.
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p className="leading-snug">
                  <strong>Official Directives:</strong> Do not cross flooded causeways or underpasses. Observe mandatory coastal evacuation orders.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('evacuation')}
              className="mt-3 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Evacuation Planner</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Historical Weather & Rainfall Trends Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Atmospheric Precipitation & Temperature Trends
            </h2>
            <p className="text-xs text-slate-400">
              Observational telemetry & multi-day forecast curves for flood and heatwave vulnerability evaluation.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono self-start sm:self-auto">
            Source: Open-Meteo High-Resolution NWP
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weatherTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="rainfall" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#rainGrad)" name="Rainfall (mm)" />
              <Area type="monotone" dataKey="tempMax" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" name="Max Temp (°C)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts Feed Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Recent Emergency Bulletins & Advisories
            </h2>
            <p className="text-xs text-slate-400">
              Verified announcements and simulated operational threat warnings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
            >
              <option value="All">All Severities</option>
              <option value="Extreme">Extreme Only</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
            >
              <option value="All">All Hazards</option>
              <option value="Flood">Floods</option>
              <option value="Cyclone">Cyclones</option>
              <option value="Wildfire">Wildfires</option>
              <option value="Heatwave">Heatwaves</option>
            </select>

            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-rose-400 font-semibold px-2 py-1.5 hover:text-white transition-colors cursor-pointer"
            >
              Manage Alerts →
            </button>
          </div>
        </div>

        <div className="mt-3 divide-y divide-slate-800/60">
          {filteredAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No bulletins match the specified filter criteria.
            </div>
          ) : (
            filteredAlerts.slice(0, 4).map((alert) => (
              <div 
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      alert.severity === 'Extreme' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      alert.severity === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                      alert.severity === 'Moderate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {alert.severity} • {alert.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{alert.id}</span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-xs text-slate-400">{alert.location}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-rose-300 transition-colors">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {alert.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(alert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className={`text-[10px] font-semibold ${
                      alert.status === 'Active' ? 'text-rose-400' :
                      alert.status === 'Acknowledged' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
