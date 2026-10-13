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

import { WeatherData, AlertItem, ShelterItem, UserRole } from './types';
import { API } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [currentLocation, setCurrentLocation] = useState(PRESET_LOCATIONS[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Disaster Manager');
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

  useEffect(() => {
    fetchWeatherData(currentLocation);
  }, [currentLocation.lat, currentLocation.lon]);

  useEffect(() => {
    fetchAlertsData();
    fetchSheltersData();
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
        onRoleChange={setCurrentUserRole}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSelectAlert={handleSelectAlert}
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
        />

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardPage
              weather={weather}
              alerts={alerts}
              shelters={shelters}
              currentLocation={currentLocation}
              onNavigateTab={setCurrentTab}
              onSelectAlert={handleSelectAlert}
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
            />
          )}

          {currentTab === 'map' && (
            <RiskMapPage
              currentLocation={currentLocation}
              alerts={alerts}
              shelters={shelters}
              onSelectAlert={handleSelectAlert}
              onSelectShelter={() => setCurrentTab('shelters')}
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
