import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  CloudRain, 
  Wind, 
  Bell, 
  User, 
  Menu, 
  X, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { WeatherData, AlertItem, UserRole } from '../types';

interface HeaderProps {
  currentLocationName: string;
  onLocationChange: (loc: { name: string; lat: number; lon: number }) => void;
  weather: WeatherData | null;
  alerts: AlertItem[];
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onSelectAlert?: (alert: AlertItem) => void;
  onNavigateSensors?: () => void;
}

export const PRESET_LOCATIONS = [
  { name: 'Brahmaputra Floodplain, Assam', lat: 26.2006, lon: 92.9376, hazard: 'Flood Risk' },
  { name: 'Puri Coastal Zone, Odisha', lat: 19.8135, lon: 85.8312, hazard: 'Cyclone Risk' },
  { name: 'Ahmedabad Urban Corridor, Gujarat', lat: 23.0225, lon: 72.5714, hazard: 'Heatwave' },
  { name: 'Pine Ridge Reserve, California', lat: 37.7749, lon: -122.4194, hazard: 'Wildfire Risk' },
  { name: 'Shimla Ridge, Himachal Pradesh', lat: 31.1048, lon: 77.1734, hazard: 'Landslide Risk' },
  { name: 'Tokyo Bay Coastal Area, Japan', lat: 35.6762, lon: 139.6503, hazard: 'Storm Surge' }
];

export const Header: React.FC<HeaderProps> = ({
  currentLocationName,
  onLocationChange,
  weather,
  alerts,
  currentUserRole,
  onRoleChange,
  mobileMenuOpen,
  setMobileMenuOpen,
  onSelectAlert,
  onNavigateSensors
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const activeAlerts = alerts.filter(a => a.status === 'Active');
  const criticalCount = activeAlerts.filter(a => a.severity === 'Extreme' || a.severity === 'High').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left: Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center">
                  Disaster<span className="text-rose-400">Guard</span>
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    AI
                  </span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SDG 13 Climate Action
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                Intelligent Disaster Prediction, Monitoring & Emergency Response
              </p>
            </div>
          </div>
        </div>

        {/* Center: Location Quick-Selector */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 transition-colors shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium max-w-[200px] truncate">{currentLocationName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showLocationDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Operations Zone
              </div>
              <div className="space-y-1 mt-1">
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      onLocationChange(loc);
                      setShowLocationDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      currentLocationName === loc.name 
                        ? 'bg-rose-500/15 text-rose-300 font-medium border border-rose-500/30' 
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-100">{loc.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {loc.hazard}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Weather Summary, Notifications, Role Profile */}
        <div className="flex items-center gap-2.5">
          {/* Live Weather Capsule */}
          {weather && (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/80 text-xs">
              <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span>{weather.temperature}°C</span>
              </div>
              <div className="h-3 w-[1px] bg-slate-700" />
              <div className="flex items-center gap-1 text-slate-300">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>{weather.windSpeed} km/h</span>
              </div>
            </div>
          )}

          {/* Live IoT Sensor Telemetry Pulse Capsule */}
          <button
            onClick={onNavigateSensors}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 hover:bg-rose-900/40 transition-colors cursor-pointer"
            title="Real-Time IoT Disaster Sensors Stream"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono font-bold text-[11px]">IoT Sensors: ⚡ LIVE</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="View Emergency Notifications"
            >
              <Bell className="w-4 h-4" />
              {activeAlerts.length > 0 && (
                <span className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900 ${
                  criticalCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                }`}>
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-rose-400" />
                    <span>Emergency Alerts Log ({activeAlerts.length} Active)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 mt-2 divide-y divide-slate-800/50">
                  {activeAlerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1 opacity-70" />
                      No active emergency alerts currently recorded.
                    </div>
                  ) : (
                    activeAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        onClick={() => {
                          if (onSelectAlert) onSelectAlert(alert);
                          setShowNotifications(false);
                        }}
                        className="pt-2 pb-1 text-xs cursor-pointer hover:bg-slate-800/50 p-1.5 rounded transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            alert.severity === 'Extreme' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            alert.severity === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {alert.severity} • {alert.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{alert.id}</span>
                        </div>
                        <p className="font-semibold text-slate-100 text-xs line-clamp-1">{alert.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{alert.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-[11px] text-white">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-semibold text-slate-200 text-[11px] leading-tight">Duty Officer</div>
                <div className="text-[9px] text-rose-400 font-mono uppercase">{currentUserRole}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
                <div className="pb-2 border-b border-slate-800">
                  <div className="text-xs font-semibold text-white">Emergency Officer Profile</div>
                  <div className="text-[11px] text-slate-400">ops@disasterguard.un.org</div>
                  <div className="mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono inline-block">
                    Demo Persistence Mode Active
                  </div>
                </div>

                <div className="py-2">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Switch Access Role
                  </div>
                  <div className="space-y-1">
                    {(['Administrator', 'Disaster Manager', 'General User'] as UserRole[]).map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          onRoleChange(role);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                          currentUserRole === role 
                            ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30' 
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{role}</span>
                        {currentUserRole === role && <span className="text-[10px] text-rose-400">Active</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <p className="leading-snug">
                    Administrator can edit, acknowledge, and resolve alerts, shelters, and system parameters.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
