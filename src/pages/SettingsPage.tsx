import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  User, 
  Key, 
  Database, 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Lock,
  Server
} from 'lucide-react';
import { UserRole, AuditLogItem, AuthUser } from '../types';
import { API } from '../services/api';

interface SettingsPageProps {
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onReloadDemoData: () => void;
  authUser?: AuthUser | null;
  onNavigateLogin?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUserRole,
  onRoleChange,
  onReloadDemoData,
  authUser,
  onNavigateLogin
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    API.getAuditLogs().then(setAuditLogs).catch(console.error);
    API.getStatus().then(setSystemStatus).catch(console.error);
  }, []);

  const handleResetData = async () => {
    setReloading(true);
    await onReloadDemoData();
    const updated = await API.getAuditLogs();
    setAuditLogs(updated);
    setTimeout(() => setReloading(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              System Administration
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-emerald-400 font-mono">Role-Based Access Control (RBAC)</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            System Configuration, Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Identity governance, API connection diagnostics, local demonstration database controls, and audit trails.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 6 Cols - RBAC & System Architecture */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Profile & Role Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <User className="w-4 h-4 text-rose-400" />
              Active Operator Profile & Access Control Role
            </h2>

            <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{authUser ? authUser.name : 'Guest Emergency Officer'}</span>
                  {authUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">{authUser ? authUser.email : 'Unauthenticated'}</div>
                {authUser && (
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Badge: {authUser.badgeId} • Station: {authUser.dutyStation}
                  </div>
                )}
              </div>
              <div className="text-right space-y-1">
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30 inline-block">
                  {currentUserRole}
                </span>
                {onNavigateLogin && (
                  <div>
                    <button
                      onClick={onNavigateLogin}
                      className="text-[10px] text-sky-400 hover:text-sky-300 underline font-semibold block ml-auto cursor-pointer"
                    >
                      {authUser ? 'Manage Account / Switch User →' : 'Sign in to Live Server →'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Simulate Operator Role:
              </label>
              <div className="space-y-2">
                {(['Administrator', 'Disaster Manager', 'General User'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => onRoleChange(role)}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      currentUserRole === role
                        ? 'bg-rose-500/15 border-rose-500 text-rose-200 font-bold'
                        : 'bg-slate-850 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-100">{role}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {role === 'Administrator' && 'Full permissions: broadcast/delete alerts, edit shelters, manage logs.'}
                        {role === 'Disaster Manager' && 'Operational permissions: broadcast alerts, update shelter occupancy.'}
                        {role === 'General User' && 'Citizen view: browse alerts, map, run assessments, plan evacuations.'}
                      </div>
                    </div>
                    {currentUserRole === role && (
                      <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Database & Storage Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Database className="w-4 h-4 text-sky-400" />
              Database Persistence State
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-850 rounded-xl border border-slate-800">
                <span className="text-slate-300">Persistence Mode</span>
                <span className="font-mono text-emerald-400 font-semibold">Local High-Availability Express Engine</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-850 rounded-xl border border-slate-800">
                <span className="text-slate-300">Firebase Firestore Integration</span>
                <span className="font-mono text-amber-400">Configured in Demo Mode</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-850 rounded-xl border border-slate-800">
                <span className="text-slate-300">UN SDG 13 Metric Target</span>
                <span className="font-mono text-white">Target 13.1 (Resilience & Capacity)</span>
              </div>
            </div>

            <button
              onClick={handleResetData}
              disabled={reloading}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
              <span>Reload Initial Demonstration Records</span>
            </button>
          </div>
        </div>

        {/* Right: 6 Cols - Diagnostics & Audit Logs */}
        <div className="lg:col-span-6 space-y-6">
          {/* API Diagnostics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Server className="w-4 h-4 text-teal-400" />
              Integrated Services Diagnostics
            </h2>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Open-Meteo Weather API</div>
                  <div className="text-[11px] text-slate-400">Direct NWP observations & hourly forecasts</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                  Connected
                </span>
              </div>

              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Google Gemini API (Assistant & Risk)</div>
                  <div className="text-[11px] text-slate-400">Model: gemini-3.8-flash (Server-Side Proxy)</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                  Active / Fallback Ready
                </span>
              </div>

              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">OpenStreetMap & Nominatim</div>
                  <div className="text-[11px] text-slate-400">CartoDB Dark Tiles & User-Agent Geocoding</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <FileText className="w-4 h-4 text-amber-400" />
              Administrative Audit Log Trail
            </h2>

            <div className="divide-y divide-slate-800/70 max-h-56 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-400 text-[10px]">
                      {log.action}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-snug">{log.details}</div>
                  <div className="text-[10px] text-slate-500 font-mono">By: {log.user}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
