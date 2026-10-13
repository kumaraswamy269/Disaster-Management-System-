import React from 'react';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Radio, 
  Map, 
  AlertOctagon, 
  Home, 
  Route, 
  Bot, 
  BarChart3, 
  Settings, 
  Info,
  ExternalLink
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'prediction'
  | 'monitoring'
  | 'map'
  | 'alerts'
  | 'shelters'
  | 'evacuation'
  | 'assistant'
  | 'reports'
  | 'settings'
  | 'about';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeAlertsCount: number;
  openSheltersCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeAlertsCount,
  openSheltersCount,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prediction', label: 'Disaster Prediction', icon: BrainCircuit, badge: 'AI/ML' },
    { id: 'monitoring', label: 'Live Monitoring', icon: Radio, pulse: true },
    { id: 'map', label: 'Disaster Risk Map', icon: Map },
    { id: 'alerts', label: 'Emergency Alerts', icon: AlertOctagon, count: activeAlertsCount, countColor: 'bg-rose-500' },
    { id: 'shelters', label: 'Safe Shelters', icon: Home, count: openSheltersCount, countColor: 'bg-emerald-600' },
    { id: 'evacuation', label: 'Evacuation Planner', icon: Route },
    { id: 'assistant', label: 'AI Disaster Assistant', icon: Bot, badge: 'Gemini' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Security', icon: Settings },
    { id: 'about', label: 'About & SDG 13', icon: Info },
  ];

  const handleNavClick = (id: NavTab) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-16 md:top-20 z-40 md:z-10
        w-64 h-[calc(100vh-4rem)] md:h-[calc(100vh-5.5rem)]
        bg-slate-900 border-r border-slate-800 flex flex-col justify-between
        transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Navigation list */}
        <div className="p-3 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Emergency Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as NavTab)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left group
                  ${isActive 
                    ? 'bg-rose-600/15 text-rose-300 font-semibold border border-rose-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.pulse && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  )}
                  {item.badge && (
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white font-mono ${item.countColor || 'bg-rose-500'}`}>
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom SDG 13 Callout */}
        <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>UN SDG 13 Target 13.1</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Strengthen resilience & adaptive capacity to climate-related hazards and natural disasters.
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>BTech CSE AI/ML</span>
            <span className="text-emerald-400">Ver 1.2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
