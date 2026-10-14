import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  User, 
  Building, 
  MapPin, 
  BadgeCheck, 
  Radio, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Users, 
  Server, 
  Cpu, 
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { AuthUser, AuthSession, UserRole } from '../types';
import { API } from '../services/api';

interface LoginPageProps {
  authUser: AuthUser | null;
  authSession: AuthSession | null;
  onLoginSuccess: (user: AuthUser, session: AuthSession) => void;
  onLogout: () => void;
  onNavigateTab: (tab: any) => void;
  onRoleChange: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  authUser,
  authSession,
  onLoginSuccess,
  onLogout,
  onNavigateTab,
  onRoleChange
}) => {
  const [activeView, setActiveView] = useState<'login' | 'register' | 'sessions'>(authUser ? 'sessions' : 'login');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Disaster Manager');
  const [regDepartment, setRegDepartment] = useState('UN OCHA Regional Taskforce');
  const [regDutyStation, setRegDutyStation] = useState('Guwahati Command Hub');
  const [regBadgeId, setRegBadgeId] = useState(`NDOC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Live Server Status & Active Sessions
  const [activeSessionsList, setActiveSessionsList] = useState<any[]>([]);
  const [operatorsList, setOperatorsList] = useState<AuthUser[]>([]);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [refreshingSessions, setRefreshingSessions] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Fetch live server sessions and operators
  const fetchServerAuthData = async () => {
    setRefreshingSessions(true);
    try {
      const [sessRes, opsRes, statusRes] = await Promise.allSettled([
        API.getSessions(),
        API.getOperators(),
        API.getStatus()
      ]);

      if (sessRes.status === 'fulfilled') {
        setActiveSessionsList(sessRes.value.sessions || []);
      }
      if (opsRes.status === 'fulfilled') {
        setOperatorsList(opsRes.value.operators || []);
      }
      if (statusRes.status === 'fulfilled') {
        setServerStatus(statusRes.value);
      }
    } catch (e) {
      console.warn('Failed to fetch auth data:', e);
    } finally {
      setRefreshingSessions(false);
    }
  };

  useEffect(() => {
    fetchServerAuthData();
  }, [authUser]);

  // Handle preset quick logins
  const handleQuickLogin = async (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await API.login(email, pass);
      setLoginSuccessMessage(res.message || 'Login successful!');
      onLoginSuccess(res.user, res.session);
      onRoleChange(res.user.role);
      setTimeout(() => {
        setLoginSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setLoginError(err.message || 'Quick login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Submit manual login
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await API.login(loginEmail, loginPassword);
      setLoginSuccessMessage(res.message || 'Authenticated successfully.');
      onLoginSuccess(res.user, res.session);
      onRoleChange(res.user.role);
      setTimeout(() => {
        setLoginSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Submit registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setRegError('Please fill out all required fields.');
      return;
    }

    setRegLoading(true);
    setRegError(null);

    try {
      const res = await API.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        department: regDepartment,
        dutyStation: regDutyStation,
        badgeId: regBadgeId
      });
      setLoginSuccessMessage(res.message || 'Account registered and logged in!');
      onLoginSuccess(res.user, res.session);
      onRoleChange(res.user.role);
      setActiveView('sessions');
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  // Role Switch via server
  const handleSwitchRoleOnServer = async (newRole: UserRole) => {
    try {
      const res = await API.switchRole(newRole, 'Operator console manual role change');
      onRoleChange(newRole);
      onLoginSuccess(res.user, authSession ? { ...authSession, user: res.user } : res.session);
    } catch (err) {
      console.error('Failed to switch role on server', err);
    }
  };

  const copyToken = () => {
    if (authSession?.token) {
      navigator.clipboard.writeText(authSession.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Live Server Header Capsule */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SERVER AUTHENTICATION GATEWAY
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">REST / Bearer Token Security</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Lock className="w-7 h-7 text-rose-500" />
              <span>Operator Command & Access Deck</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Authenticate into the live Node.js disaster operations server. Access mission-critical hazard dispatch, live weather SSE telemetry, IoT trigger simulations, and verified shelter registries.
            </p>
          </div>

          {/* Server Connection Matrix */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400">Live Gateway</div>
                <div className="text-xs font-mono font-bold text-emerald-400">Node.js Express / TS</div>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400">Active Operators</div>
              <div className="text-xs font-mono font-bold text-sky-400">
                {activeSessionsList.length || 1} Connected
              </div>
            </div>
            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />
            <button
              onClick={fetchServerAuthData}
              disabled={refreshingSessions}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Live Sessions & Status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingSessions ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveView('login')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'login'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Operator Sign In</span>
          </button>

          <button
            onClick={() => setActiveView('register')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'register'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Register New Account</span>
          </button>

          <button
            onClick={() => setActiveView('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'sessions'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Operators ({activeSessionsList.length})</span>
          </button>

          {authUser && (
            <div className="ml-auto flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              <BadgeCheck className="w-4 h-4" />
              <span>Signed in as: <strong className="text-white">{authUser.name}</strong> ({authUser.role})</span>
            </div>
          )}
        </div>
      </div>

      {/* Authenticated User Dossier Card (if already signed in) */}
      {authUser && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${authUser.avatarBg || 'from-rose-600 to-amber-600'} flex items-center justify-center text-white text-xl font-black shadow-lg shadow-rose-950/50`}>
                {authUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white">{authUser.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {authUser.role}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Session Active" />
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 font-mono text-slate-300">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {authUser.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    {authUser.department}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-amber-400">
                    <MapPin className="w-3 h-3" />
                    {authUser.dutyStation}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Role Switch */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
              >
                <span>Enter Operations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Cryptographic Token Details */}
          {authSession && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-500">SERVER TOKEN:</span>
                <span className="text-emerald-400 truncate max-w-xs">{authSession.token}</span>
                <button
                  onClick={copyToken}
                  className="p-1 hover:text-white rounded transition-colors text-slate-400"
                  title="Copy session token"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-3 text-slate-400">
                <span>BADGE: <strong className="text-slate-200">{authUser.badgeId}</strong></span>
                <span>•</span>
                <span>CLEARANCE: <strong className="text-amber-400">{authUser.clearanceLevel}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: SIGN IN */}
      {activeView === 'login' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Login Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-500" />
                  <span>Authorized Operator Sign-In</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your credentials to establish a secure authenticated live server session.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-slate-800 text-sky-400 border border-slate-700">
                Port 3000 Active
              </span>
            </div>

            {loginError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccessMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{loginSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Operational Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. admin@disasterguard.org"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Emergency Passcode
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Min 4 characters</span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter operator passcode"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying with Live Server...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Establish Live Server Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Don't have an operator account?</span>
              <button
                type="button"
                onClick={() => setActiveView('register')}
                className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Register Duty Profile →
              </button>
            </div>
          </div>

          {/* Quick-Access 1-Click Operational Presets */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  1-Click Operator Quick Login
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Instantly connect to the live server using pre-provisioned command roles. Each role exhibits customized permissions and emergency dispatch capabilities:
              </p>

              <div className="space-y-2.5">
                {/* 1. Commander Admin */}
                <button
                  onClick={() => handleQuickLogin('admin@disasterguard.org', 'admin123')}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-500/60 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-xs text-white group-hover:text-rose-400 transition-colors flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Commander Sarah Vance</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                      ADMINISTRATOR
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">UN OCHA & National Disaster Operations Center</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>admin@disasterguard.org</span>
                    <span className="text-emerald-400 font-bold group-hover:underline">Login As Admin →</span>
                  </div>
                </button>

                {/* 2. Operations Manager */}
                <button
                  onClick={() => handleQuickLogin('manager@disasterguard.org', 'manager123')}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Capt. Rajiv Sharma</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      DISASTER MANAGER
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Brahmaputra Basin Flood & Cyclone Taskforce</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>manager@disasterguard.org</span>
                    <span className="text-emerald-400 font-bold group-hover:underline">Login As Manager →</span>
                  </div>
                </button>

                {/* 3. Field Responder / General User */}
                <button
                  onClick={() => handleQuickLogin('responder@disasterguard.org', 'user123')}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-sky-500/30 hover:border-sky-500/60 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-xs text-white group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>Officer Elena Chen</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                      GENERAL USER / FIRST RESPONDER
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">NDRF Rapid Response Tactical Unit #9</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>responder@disasterguard.org</span>
                    <span className="text-emerald-400 font-bold group-hover:underline">Login As Responder →</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Live Security Specifications */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-300 text-xs">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Live Server Security Protocols</span>
              </div>
              <ul className="space-y-1 list-disc list-inside text-slate-400">
                <li>Bearer tokens cryptographically generated by Node.js backend.</li>
                <li>Session tokens stored safely in browser storage and synchronized.</li>
                <li>Audit trail automatically recorded in live server memory.</li>
                <li>Compatible with UN SDG 13 humanitarian response standards.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: REGISTER NEW ACCOUNT */}
      {activeView === 'register' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
          <div className="pb-4 border-b border-slate-800 mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-rose-500" />
              <span>Register Operator On Live Server</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create an operational profile to gain personalized dispatch rights and telemetry access.
            </p>
          </div>

          {regError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name & Rank
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Lt. David Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. david.kumar@disasterguard.org"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Create Passcode
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assigned Operational Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Administrator">Administrator (Level 5 - Full Dispatch & System Control)</option>
                  <option value="Disaster Manager">Disaster Manager (Level 4 - Regional Field Lead)</option>
                  <option value="General User">General User / First Responder (Level 2 - Rescue & Public)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Organization / Agency
                </label>
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  placeholder="e.g. State Disaster Management Authority"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Duty Station / Sector
                </label>
                <input
                  type="text"
                  value={regDutyStation}
                  onChange={(e) => setRegDutyStation(e.target.value)}
                  placeholder="e.g. Coastal Emergency Operations Center"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {regLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering with Live Server...</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    <span>Complete Registration & Establish Live Session</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Already have an account?</span>
            <button
              type="button"
              onClick={() => setActiveView('login')}
              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Back to Sign In →
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: LIVE ACTIVE SESSIONS & CONNECTED OPERATORS */}
      {activeView === 'sessions' && (
        <div className="space-y-6">
          {/* Active Sessions Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>Live Server Active Sessions ({activeSessionsList.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time monitor of duty officers currently connected to the live disaster operations node.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchServerAuthData}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingSessions ? 'animate-spin' : ''}`} />
                  <span>Refresh Sessions</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessionsList.map((sess, idx) => {
                const isCurrent = sess.token === authSession?.token;
                return (
                  <div
                    key={sess.token || idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/20'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-xs text-white">{sess.userName}</span>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        sess.userRole === 'Administrator' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        sess.userRole === 'Disaster Manager' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}>
                        {sess.userRole}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-2 truncate">
                      {sess.department}
                    </div>

                    <div className="space-y-1 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span>SESSION ID:</span>
                        <span className="text-slate-300">{sess.token ? `${sess.token.slice(0, 14)}...` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>HOST IP:</span>
                        <span className="text-slate-300">{sess.ipAddress || '127.0.0.1'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>LOGGED IN:</span>
                        <span className="text-emerald-400 font-bold">
                          {new Date(sess.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="mt-3 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
                          ★ CURRENT LOCAL SESSION
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Operators Roster */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Official Registered Operators Directory ({operatorsList.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                    <th className="pb-2.5 font-semibold">Operator</th>
                    <th className="pb-2.5 font-semibold">Role</th>
                    <th className="pb-2.5 font-semibold">Clearance</th>
                    <th className="pb-2.5 font-semibold">Badge ID</th>
                    <th className="pb-2.5 font-semibold">Duty Station</th>
                    <th className="pb-2.5 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {operatorsList.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5">
                        <div className="font-bold text-white font-sans">{op.name}</div>
                        <div className="text-[10px] text-slate-400">{op.email}</div>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          op.role === 'Administrator' ? 'bg-rose-500/20 text-rose-300' :
                          op.role === 'Disaster Manager' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-sky-500/20 text-sky-300'
                        }`}>
                          {op.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300">{op.clearanceLevel}</td>
                      <td className="py-2.5 text-slate-400">{op.badgeId}</td>
                      <td className="py-2.5 text-slate-300 font-sans">{op.dutyStation}</td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
