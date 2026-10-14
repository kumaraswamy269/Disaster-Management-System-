import React, { useState, useEffect } from 'react';
import { SafetyDisclaimer } from './components/SafetyDisclaimer';
import { Header, PRESET_LOCATIONS } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PredictionPage } from './pages/PredictionPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { RiskMapPage } from './pages/RiskMapPage';
import { AlertsPage } from './pages/AlertsPage';
import { SheltersPage } from './pages/SheltersPage';
import { EvacuationPlannerPage } from './pages/EvacuationPlannerPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { SensorsPage } from './pages/SensorsPage';
import { LoginPage } from './pages/LoginPage';

import { WeatherData, AlertItem, ShelterItem, UserRole, RealWorldDisasterItem, DistressBeaconItem, SensorItem, AuthUser, AuthSession } from './types';
import { API } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [currentLocation, setCurrentLocation] = useState(PRESET_LOCATIONS[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [realWorldDisasters, setRealWorldDisasters] = useState<RealWorldDisasterItem[]>([]);
  const [distressBeacons, setDistressBeacons] = useState<DistressBeaconItem[]>([]);
  const [sensors, setSensors] = useState<SensorItem[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Administrator');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertItem | null>(null);

  // Load weather when location changes
  const fetchWeatherData = async (loc = currentLocation) => {
    try {
      const data = await API.getWeather(loc.lat, loc.lon);
      setWeather(data);
    } catch (err) {
      console.warn('Weather fetch warning:', err);
    }
  };

  // Load alerts
  const fetchAlertsData = async () => {
    try {
      const data = await API.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.warn('Alerts fetch warning:', err);
    }
  };

  // Load shelters
  const fetchSheltersData = async () => {
    try {
      const data = await API.getShelters();
      setShelters(data);
    } catch (err) {
      console.warn('Shelters fetch warning:', err);
    }
  };

  // Load real-world disasters
  const fetchRealWorldData = async () => {
    try {
      const res = await API.getRealWorldDisasters(2.5);
      setRealWorldDisasters(res.disasters);
    } catch (err) {
      console.warn('Real world fetch warning:', err);
    }
  };

  // Load distress beacons
  const fetchDistressData = async () => {
    try {
      const beacons = await API.getDistressBeacons();
      setDistressBeacons(beacons);
    } catch (err) {
      console.warn('Distress beacons fetch warning:', err);
    }
  };

  // Load sensors
  const fetchSensorsData = async () => {
    try {
      const res = await API.getSensors();
      setSensors(res.sensors || []);
    } catch (err) {
      console.warn('Sensors fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchWeatherData(currentLocation);
  }, [currentLocation.lat, currentLocation.lon]);

  // Check live server authentication on boot
  const checkLiveAuth = async () => {
    try {
      const res = await API.getMe();
      if (res.authenticated && res.user && res.session) {
        setAuthUser(res.user);
        setAuthSession(res.session);
        setCurrentUserRole(res.user.role);
      } else {
        // Auto-login default duty officer for instant live interactive operations
        if (!API.getToken()) {
          try {
            const loginRes = await API.login('admin@disasterguard.org', 'admin123');
            setAuthUser(loginRes.user);
            setAuthSession(loginRes.session);
            setCurrentUserRole(loginRes.user.role);
          } catch (e) {
            console.warn('Initial live server login note:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Live server auth verification warning:', err);
    }
  };

  const handleLoginSuccess = (user: AuthUser, session: AuthSession) => {
    setAuthUser(user);
    setAuthSession(session);
    setCurrentUserRole(user.role);
  };

  const handleLogout = async () => {
    await API.logout();
    setAuthUser(null);
    setAuthSession(null);
    setCurrentUserRole('General User');
  };

  useEffect(() => {
    checkLiveAuth();
    fetchAlertsData();
    fetchSheltersData();
    fetchRealWorldData();
    fetchDistressData();
    fetchSensorsData();
  }, []);

  const handleLocationChange = (newLoc: { name: string; lat: number; lon: number }) => {
    setCurrentLocation({
      name: newLoc.name,
      lat: newLoc.lat,
      lon: newLoc.lon,
      hazard: 'Regional Hazard Focus'
    });
  };

  const handleSelectAlert = (alert: AlertItem) => {
    setSelectedAlertForModal(alert);
    setCurrentTab('alerts');
  };

  const handleReloadDemoData = async () => {
    await fetchAlertsData();
    await fetchSheltersData();
    await fetchWeatherData();
    await checkLiveAuth();
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'Active').length;
  const openSheltersCount = shelters.filter(s => s.status === 'Open').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. Persistent UN & Emergency Disclaimer Banner */}
      <SafetyDisclaimer />

      {/* 2. Command Header */}
      <Header
        currentLocationName={currentLocation.name}
        onLocationChange={handleLocationChange}
        weather={weather}
        alerts={alerts}
        currentUserRole={currentUserRole}
        onRoleChange={(role) => {
          setCurrentUserRole(role);
          if (authUser) {
            API.switchRole(role).then(res => {
              setAuthUser(res.user);
            }).catch(console.warn);
          }
        }}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSelectAlert={handleSelectAlert}
        onNavigateSensors={() => setCurrentTab('sensors')}
        onNavigateWeather={() => setCurrentTab('monitoring')}
        authUser={authUser}
        onNavigateLogin={() => setCurrentTab('login')}
        onLogout={handleLogout}
      />

      {/* 3. Main Workspace Shell */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeAlertsCount={activeAlertsCount}
          openSheltersCount={openSheltersCount}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          authUser={authUser}
        />

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardPage
              weather={weather}
              alerts={alerts}
              shelters={shelters}
              realWorldDisasters={realWorldDisasters}
              distressBeacons={distressBeacons}
              sensors={sensors}
              currentLocation={currentLocation}
              onNavigateTab={setCurrentTab}
              onSelectAlert={handleSelectAlert}
              onSelectRealWorld={(disaster) => {
                setCurrentLocation({
                  name: disaster.location,
                  lat: disaster.coordinates[0],
                  lon: disaster.coordinates[1],
                  hazard: disaster.magnitude ? `${disaster.type} M${disaster.magnitude}` : `${disaster.type} - ${disaster.title}`
                });
                setCurrentTab('map');
              }}
            />
          )}

          {currentTab === 'login' && (
            <LoginPage
              authUser={authUser}
              authSession={authSession}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
              onNavigateTab={setCurrentTab}
              onRoleChange={setCurrentUserRole}
            />
          )}

          {currentTab === 'sensors' && (
            <SensorsPage
              currentLocation={currentLocation}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'prediction' && (
            <PredictionPage
              currentLocation={currentLocation}
              weather={weather}
            />
          )}

          {currentTab === 'monitoring' && (
            <LiveMonitoringPage
              currentLocation={currentLocation}
              weather={weather}
              onLocationChange={handleLocationChange}
              onRefreshWeather={() => fetchWeatherData(currentLocation)}
              onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
              alerts={alerts}
              onRefreshAlerts={fetchAlertsData}
            />
          )}

          {currentTab === 'map' && (
            <RiskMapPage
              currentLocation={currentLocation}
              alerts={alerts}
              shelters={shelters}
              onSelectAlert={handleSelectAlert}
              onSelectShelter={() => setCurrentTab('shelters')}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              currentUserRole={currentUserRole}
              onRefreshAlerts={fetchAlertsData}
              selectedAlert={selectedAlertForModal}
            />
          )}

          {currentTab === 'shelters' && (
            <SheltersPage
              shelters={shelters}
              currentUserRole={currentUserRole}
              onRefreshShelters={fetchSheltersData}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'evacuation' && (
            <EvacuationPlannerPage
              shelters={shelters}
              currentLocation={currentLocation}
            />
          )}

          {currentTab === 'assistant' && (
            <AIAssistantPage />
          )}

          {currentTab === 'reports' && (
            <ReportsPage
              alerts={alerts}
              shelters={shelters}
              weather={weather}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              currentUserRole={currentUserRole}
              onRoleChange={setCurrentUserRole}
              onReloadDemoData={handleReloadDemoData}
              authUser={authUser}
              onNavigateLogin={() => setCurrentTab('login')}
            />
          )}

          {currentTab === 'about' && (
            <AboutPage />
          )}
        </main>
      </div>
    </div>
  );
}
