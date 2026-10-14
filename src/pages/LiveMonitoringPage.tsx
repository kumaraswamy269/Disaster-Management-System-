import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Search, 
  RefreshCw, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Sun, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Compass, 
  CheckCircle2, 
  Calendar,
  Navigation,
  Activity,
  Zap,
  Terminal,
  Download,
  Copy,
  Eye,
  CloudFog,
  CloudLightning,
  CloudSnow,
  Cloud,
  ShieldAlert,
  Play,
  Pause,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Video,
  Camera,
  Volume2,
  VolumeX,
  AlertOctagon,
  Maximize2,
  Minimize2,
  Sliders,
  Bell,
  Send,
  Check
} from 'lucide-react';
import { WeatherData, LiveWeatherStreamTick, AlertItem, SeverityLevel } from '../types';
import { API } from '../services/api';

interface LiveMonitoringPageProps {
  currentLocation: { name: string; lat: number; lon: number };
  weather: WeatherData | null;
  onLocationChange: (loc: { name: string; lat: number; lon: number }) => void;
  onRefreshWeather: () => void;
  onNavigateTab?: (tab: string) => void;
  alerts?: AlertItem[];
  onRefreshAlerts?: () => void;
}

// Convert wind direction degrees to cardinal heading
const getCardinalDirection = (deg: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index] || 'N';
};

// Interpret WMO Weather Code
const interpretWeatherCode = (code: number): { label: string; icon: React.FC<{ className?: string }>; severity: 'clear' | 'moderate' | 'severe' } => {
  switch (code) {
    case 0:
      return { label: 'Clear Sky / Sunny', icon: Sun, severity: 'clear' };
    case 1:
      return { label: 'Mainly Clear', icon: Sun, severity: 'clear' };
    case 2:
      return { label: 'Partly Cloudy', icon: Cloud, severity: 'clear' };
    case 3:
      return { label: 'Overcast Skies', icon: Cloud, severity: 'moderate' };
    case 45:
    case 48:
      return { label: 'Dense Fog & Mist', icon: CloudFog, severity: 'moderate' };
    case 51:
    case 53:
    case 55:
      return { label: 'Drizzle Precipitation', icon: CloudRain, severity: 'moderate' };
    case 61:
    case 63:
      return { label: 'Moderate Rainshowers', icon: CloudRain, severity: 'moderate' };
    case 65:
      return { label: 'Heavy Torrential Rain', icon: CloudRain, severity: 'severe' };
    case 71:
    case 73:
    case 75:
      return { label: 'Snowfall Accumulation', icon: CloudSnow, severity: 'moderate' };
    case 80:
    case 81:
    case 82:
      return { label: 'Violent Rain Squall', icon: CloudRain, severity: 'severe' };
    case 95:
      return { label: 'Active Thunderstorm', icon: CloudLightning, severity: 'severe' };
    case 96:
    case 99:
      return { label: 'Severe Thunderstorm & Hail', icon: CloudLightning, severity: 'severe' };
    default:
      return { label: 'Surface Observations', icon: Sun, severity: 'clear' };
  }
};

type MonitoringMode = 'telemetry' | 'radar' | 'surveillance' | 'siren' | 'matrix';

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  currentLocation,
  weather,
  onLocationChange,
  onRefreshWeather,
  onNavigateTab,
  alerts = [],
  onRefreshAlerts
}) => {
  // Active View Mode
  const [activeMode, setActiveMode] = useState<MonitoringMode>('telemetry');

  // Search & Navigation State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Live Server Stream State
  const [isStreamActive, setIsStreamActive] = useState(true);
  const [serverConnected, setServerConnected] = useState(true);
  const [packetsReceived, setPacketsReceived] = useState(0);
  const [streamLatency, setStreamLatency] = useState(16);
  const [streamPackets, setStreamPackets] = useState<Array<{ id: number; time: string; text: string; ping: number }>>([]);
  const [copiedTelemetry, setCopiedTelemetry] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);

  // ---------------------------------------------------------
  // 1. RADAR SIMULATION & CANVAS STATE
  // ---------------------------------------------------------
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [radarPlaying, setRadarPlaying] = useState(true);
  const [radarLayer, setRadarLayer] = useState<'composite' | 'reflectivity' | 'velocity'>('composite');
  const [radarZoom, setRadarZoom] = useState(1);
  const [radarTimeIndex, setRadarTimeIndex] = useState(5); // 0 to 5 (past 50 min to now)
  const radarAngleRef = useRef(0);

  // ---------------------------------------------------------
  // 2. SURVEILLANCE & CCTV CAMERA STATE
  // ---------------------------------------------------------
  const [nightVision, setNightVision] = useState(false);
  const [selectedCam, setSelectedCam] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(148);
  const [camSnapshotFlash, setCamSnapshotFlash] = useState(false);
  const [camPtzAngles, setCamPtzAngles] = useState({ pan: 0, tilt: 0, zoom: 1.0 });

  // ---------------------------------------------------------
  // 3. CIVIL DEFENSE AUDIO SIREN & SYNTHESIZER
  // ---------------------------------------------------------
  const [audioActive, setAudioActive] = useState(false);
  const [sirenType, setSirenType] = useState<'eas' | 'airraid' | 'chime' | null>(null);
  const [sirenVolume, setSirenVolume] = useState(0.5);
  const [speechSpeaking, setSpeechSpeaking] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioVisualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ---------------------------------------------------------
  // 4. RAPID DISPATCH BROADCAST MODAL
  // ---------------------------------------------------------
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchType, setDispatchType] = useState('Severe Meteorological Alert');
  const [dispatchSeverity, setDispatchSeverity] = useState<SeverityLevel>('High');
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Initialize Audio Context on user gesture
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const stopAllAudio = () => {
    oscNodesRef.current.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch { /* ignore */ }
    });
    oscNodesRef.current = [];
    if (gainNodeRef.current) {
      try { gainNodeRef.current.disconnect(); } catch { /* ignore */ }
      gainNodeRef.current = null;
    }
    setAudioActive(false);
    setSirenType(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeechSpeaking(false);
    }
  };

  // Play EAS Dual Warning Tone (853 Hz + 960 Hz)
  const playEASTone = () => {
    initAudio();
    stopAllAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(sirenVolume * 0.3, ctx.currentTime);
    gain.connect(ctx.destination);
    gainNodeRef.current = gain;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(853, ctx.currentTime);
    osc2.frequency.setValueAtTime(960, ctx.currentTime);

    osc1.connect(gain);
    osc2.connect(gain);
    osc1.start();
    osc2.start();

    oscNodesRef.current = [osc1, osc2];
    setAudioActive(true);
    setSirenType('eas');
  };

  // Play Civil Defense Rising-Falling Air Raid Siren
  const playAirRaidSiren = () => {
    initAudio();
    stopAllAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(sirenVolume * 0.4, ctx.currentTime);
    gain.connect(ctx.destination);
    gainNodeRef.current = gain;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(400, now);

    // Continuous rising and falling pitch modulation
    for (let i = 0; i < 30; i++) {
      const cycleStart = now + i * 4;
      osc.frequency.linearRampToValueAtTime(800, cycleStart + 2);
      osc.frequency.linearRampToValueAtTime(400, cycleStart + 4);
    }

    osc.connect(gain);
    osc.start();
    oscNodesRef.current = [osc];
    setAudioActive(true);
    setSirenType('airraid');
  };

  // Text to Speech Civil Defense Announcement
  const speakAnnouncement = (textToSpeak?: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in this browser environment.');
      return;
    }
    window.speechSynthesis.cancel();
    const announcement = textToSpeak || `Attention all personnel. Live monitoring station at ${currentLocation.name} reports atmospheric conditions at ${weather?.temperature ?? 26} degrees Celsius with wind gusts of ${weather?.windSpeed ?? 18} kilometers per hour. Continue active civil defense vigilance.`;
    const utterance = new SpeechSynthesisUtterance(announcement);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    utterance.volume = sirenVolume;
    utterance.onstart = () => setSpeechSpeaking(true);
    utterance.onend = () => setSpeechSpeaking(false);
    utterance.onerror = () => setSpeechSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Audio Oscilloscope Visualizer loop
  useEffect(() => {
    if (!audioVisualizerCanvasRef.current || !audioActive) return;
    const canvas = audioVisualizerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const renderVisualizer = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = sirenType === 'eas' ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 2.5;

      const sliceWidth = canvas.width / 60;
      let x = 0;

      for (let i = 0; i < 60; i++) {
        const v = Math.sin(phase + i * 0.25) * Math.cos(phase * 0.7 + i * 0.1) * (canvas.height / 3);
        const y = canvas.height / 2 + v;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      phase += 0.15;
      animFrameRef.current = requestAnimationFrame(renderVisualizer);
    };

    animFrameRef.current = requestAnimationFrame(renderVisualizer);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioActive, sirenType]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch { /* ignore */ }
      }
    };
  }, []);

  // CCTV Recording Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Connect to Live Weather SSE Stream on location change
  useEffect(() => {
    if (!isStreamActive) return;

    let cleanupStream: (() => void) | null = null;
    try {
      cleanupStream = API.connectWeatherStream(
        currentLocation.lat,
        currentLocation.lon,
        (packet: LiveWeatherStreamTick) => {
          setServerConnected(true);
          setPacketsReceived((prev) => prev + 1);
          if (packet.pingMs) setStreamLatency(packet.pingMs);

          const timeStr = new Date().toLocaleTimeString();
          const packetMsg = packet.message 
            ? `[HANDSHAKE] ${packet.message} (Prot: ${packet.serverStatus})` 
            : `[TELEMETRY] Pkt #${packet.packetId || '1'} | Lat: ${packet.lat.toFixed(2)}° Lon: ${packet.lon.toFixed(2)}° | Ping: ${packet.pingMs || 15}ms | Health: ${packet.health || 'OK'}`;

          setStreamPackets((prev) => [
            {
              id: Date.now() + Math.random(),
              time: timeStr,
              text: packetMsg,
              ping: packet.pingMs || 15
            },
            ...prev.slice(0, 49) // Keep last 50 packets
          ]);
        },
        (status: boolean) => {
          setServerConnected(status);
        }
      );
    } catch (err) {
      console.warn('Weather stream connect error:', err);
    }

    return () => {
      if (cleanupStream) cleanupStream();
    };
  }, [currentLocation.lat, currentLocation.lon, isStreamActive]);

  // ---------------------------------------------------------
  // RADAR CANVAS ANIMATION LOOP
  // ---------------------------------------------------------
  useEffect(() => {
    if (activeMode !== 'radar') return;
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const renderRadar = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      // Dark background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Concentric range rings (50km, 100km, 150km, 200km)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();

        // Ring label
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(`${r * 50} km`, centerX + 6, centerY - (radius / 4) * r + 12);
      }

      // Crosshairs
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Cardinal direction letters
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('N (0°)', centerX - 14, centerY - radius + 15);
      ctx.fillText('S (180°)', centerX - 20, centerY + radius - 5);
      ctx.fillText('E (90°)', centerX + radius - 45, centerY - 5);
      ctx.fillText('W (270°)', centerX - radius + 6, centerY - 5);

      // Simulated Storm Cells (Echo Clusters)
      const stormCells = [
        { x: centerX + 45 * radarZoom, y: centerY - 65 * radarZoom, r: 35, dbz: 55, color: 'rgba(239, 68, 68, 0.65)' },
        { x: centerX + 55 * radarZoom, y: centerY - 55 * radarZoom, r: 20, dbz: 62, color: 'rgba(234, 179, 8, 0.75)' },
        { x: centerX - 80 * radarZoom, y: centerY + 30 * radarZoom, r: 45, dbz: 40, color: 'rgba(56, 189, 248, 0.55)' },
        { x: centerX - 30 * radarZoom, y: centerY - 90 * radarZoom, r: 25, dbz: 32, color: 'rgba(74, 222, 128, 0.45)' }
      ];

      stormCells.forEach(cell => {
        const grad = ctx.createRadialGradient(cell.x, cell.y, 2, cell.x, cell.y, cell.r);
        grad.addColorStop(0, cell.color);
        grad.addColorStop(0.6, cell.color.replace('0.65', '0.35').replace('0.75', '0.45').replace('0.55', '0.25').replace('0.45', '0.2'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rotating Doppler Sweep Beam
      if (radarPlaying) {
        radarAngleRef.current = (radarAngleRef.current + 0.035) % (Math.PI * 2);
      }
      const angle = radarAngleRef.current;

      const beamGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      beamGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle - 0.35, angle);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // Sharp sweep line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.stroke();
      ctx.restore();

      // Center station beacon
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
      ctx.stroke();

      animationId = requestAnimationFrame(renderRadar);
    };

    renderRadar();

    return () => cancelAnimationFrame(animationId);
  }, [activeMode, radarPlaying, radarZoom]);

  // Handle Geocoding Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await API.geocode(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (item: { display_name: string; lat: string; lon: string }) => {
    onLocationChange({
      name: item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  // Live GPS Geolocation Hook
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: { 'User-Agent': 'DisasterGuard-AI-SDG13-App/1.0' }
          });
          if (res.ok) {
            const data = await res.json();
            const place = data.address?.city || data.address?.town || data.address?.county || data.display_name?.split(',')[0] || 'My GPS Location';
            onLocationChange({ name: `${place} (Live GPS)`, lat, lon });
          } else {
            onLocationChange({ name: `Live GPS Device (${lat}°, ${lon}°)`, lat, lon });
          }
        } catch {
          onLocationChange({ name: `Live GPS Device (${lat}°, ${lon}°)`, lat, lon });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGeoError(err.message || 'Unable to retrieve GPS device coordinates.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Manual Refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefreshWeather();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Copy Telemetry JSON
  const handleCopyTelemetry = () => {
    if (!weather) return;
    navigator.clipboard.writeText(JSON.stringify({ location: currentLocation, weather }, null, 2));
    setCopiedTelemetry(true);
    setTimeout(() => setCopiedTelemetry(false), 2000);
  };

  // Export CSV Log
  const handleExportCSV = () => {
    if (!weather) return;
    let csv = 'Timestamp,Location,Latitude,Longitude,Temperature(C),ApparentTemp(C),Humidity(%),WindSpeed(km/h),WindDirection(deg),Pressure(hPa),Rain(mm),AQI,UVIndex\n';
    csv += `"${weather.retrievedAt}","${currentLocation.name}",${currentLocation.lat},${currentLocation.lon},${weather.temperature},${weather.apparentTemperature},${weather.humidity},${weather.windSpeed},${weather.windDirection},${weather.surfacePressure},${weather.precipitation},${weather.airQuality?.aqi ?? 'N/A'},${weather.uvIndex ?? 'N/A'}\n\n`;

    if (weather.hourly?.time) {
      csv += 'Hourly Forecast Time,Temperature(C),Rain(mm),WindSpeed(km/h),PrecipProbability(%)\n';
      weather.hourly.time.forEach((t, i) => {
        csv += `"${t}",${weather.hourly?.temperature[i] ?? 0},${weather.hourly?.precipitation[i] ?? 0},${weather.hourly?.windSpeed[i] ?? 0},${weather.hourly?.precipitationProbability?.[i] ?? 0}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Live_Weather_Telemetry_${currentLocation.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Camera Snapshot Trigger
  const handleCamSnapshot = () => {
    setCamSnapshotFlash(true);
    setTimeout(() => setCamSnapshotFlash(false), 300);
  };

  // Dispatch Emergency Alert directly from Live Monitoring Hub
  const handleDispatchAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchMessage.trim()) return;
    setDispatching(true);

    try {
      await API.createAlert({
        title: `${dispatchType}: ${currentLocation.name}`,
        category: 'Flood',
        severity: dispatchSeverity,
        location: currentLocation.name,
        coordinates: [currentLocation.lat, currentLocation.lon],
        description: dispatchMessage,
        status: 'Active',
        source: 'Live Monitoring Command Operations',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        isSimulated: false,
        recommendedActions: ['Adhere to local civil defense alerts', 'Evacuate vulnerable areas if directed']
      });

      if (onRefreshAlerts) onRefreshAlerts();
      setDispatchSuccess(true);
      setTimeout(() => {
        setDispatchSuccess(false);
        setShowDispatchModal(false);
        setDispatchMessage('');
      }, 1500);
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setDispatching(false);
    }
  };

  // Severe Weather Anomaly Analysis
  const anomalyWarnings: Array<{ title: string; desc: string; severity: 'high' | 'extreme' | 'moderate' }> = [];
  if (weather) {
    if (weather.temperature >= 40) {
      anomalyWarnings.push({
        title: 'Severe Heatwave Stress Warning',
        desc: `Ambient air temperature has reached ${weather.temperature}°C (Feels like ${weather.apparentTemperature}°C). High danger of heat exhaustion and severe infrastructure thermal strain.`,
        severity: 'extreme'
      });
    }
    if (weather.windSpeed >= 50 || (weather.windGusts && weather.windGusts >= 65)) {
      anomalyWarnings.push({
        title: 'Gale-Force Atmospheric Wind Advisory',
        desc: `Sustained wind speed at ${weather.windSpeed} km/h with gusts clocking ${weather.windGusts ?? (weather.windSpeed * 1.35).toFixed(1)} km/h. Danger of roof damage, marine surge, and flying debris.`,
        severity: 'high'
      });
    }
    if (weather.precipitation >= 12) {
      anomalyWarnings.push({
        title: 'High Hydrological Runoff / Cloudburst Potential',
        desc: `Intense downpour at ${weather.precipitation} mm/h. Rapid overland inundation and flash flood risk in local low-lying catchments.`,
        severity: 'high'
      });
    }
    if (weather.pressureTrend === 'Falling' && weather.surfacePressure < 1005) {
      anomalyWarnings.push({
        title: 'Rapid Barometric Pressure Depression',
        desc: `Surface pressure is ${weather.surfacePressure} hPa and dropping rapidly, indicating rapid atmospheric destabilization and cyclonic convective updrafts.`,
        severity: 'moderate'
      });
    }
    if (weather.humidity <= 20 && weather.temperature >= 32) {
      anomalyWarnings.push({
        title: 'Critical Fire Weather Atmospheric Index',
        desc: `Extremely dry relative humidity (${weather.humidity}%) combined with high heat (${weather.temperature}°C) sharply elevates vegetative ignition velocity.`,
        severity: 'high'
      });
    }
    if (weather.airQuality && weather.airQuality.aqi > 150) {
      anomalyWarnings.push({
        title: `Degraded Air Quality Index (AQI: ${weather.airQuality.aqi})`,
        desc: `High particulate matter concentration (${weather.airQuality.pm25} µg/m³ PM2.5). Vulnerable populations should limit outdoor exposure and wear N95 filtration.`,
        severity: 'moderate'
      });
    }
  }

  const weatherCodeInfo = interpretWeatherCode(weather?.weatherCode ?? 0);
  const WeatherIconComponent = weatherCodeInfo.icon;
  const windCardinal = getCardinalDirection(weather?.windDirection ?? 180);

  // Simulated Surveillance Cameras list
  const cameraFeeds = [
    {
      id: 1,
      tag: 'CAM-01 [HYDRO-RIVER]',
      location: 'Brahmaputra Flood Plain Catchment',
      status: 'ONLINE • 1080p60',
      type: 'Water Level Inundation Gauge',
      metric: 'Stage: 48.2m (+1.8m surge)',
      danger: true,
      color: 'from-sky-950 via-slate-900 to-indigo-950'
    },
    {
      id: 2,
      tag: 'CAM-02 [SEISMO-FAULT]',
      location: 'Himalayan Thrust Slip Station',
      status: 'ONLINE • 1080p60',
      type: 'Tectonic Rupture & Displacement',
      metric: 'PGA: 0.04g • Stable',
      danger: false,
      color: 'from-amber-950 via-slate-900 to-stone-900'
    },
    {
      id: 3,
      tag: 'CAM-03 [THERMAL-FOREST]',
      location: 'Ridge Canopy Watchtower',
      status: 'ONLINE • IR FLIR THERMAL',
      type: 'Infrared Wildfire Hotspot Scan',
      metric: 'Peak Canopy Heat: 42.1°C',
      danger: false,
      color: 'from-emerald-950 via-slate-900 to-teal-950'
    },
    {
      id: 4,
      tag: 'CAM-04 [COASTAL-BUOY]',
      location: 'Odisha Offshore Storm Surge Barrier',
      status: 'ONLINE • TELEMETRIC BUOY',
      type: 'Marine Wave & Tidal Pressure',
      metric: 'Significant Wave Ht: 3.4m',
      danger: true,
      color: 'from-cyan-950 via-slate-900 to-blue-950'
    }
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP LIVE MONITORING CONTROL DECK & STATUS              */}
      {/* ========================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <span className={`w-2 h-2 rounded-full ${serverConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                {serverConnected ? 'LIVE SERVER CONNECTED' : 'SERVER RECONNECTING'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-sky-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Latency: {streamLatency}ms
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">
                Packets: <span className="text-slate-200 font-bold">{packetsReceived}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-emerald-400/90">
                Protocol: HTTP/2 SSE Stream
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Radio className="w-7 h-7 text-emerald-400 animate-pulse" />
              Live Monitoring Operations Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Real-time multi-hazard operations center streaming live meteorological telemetry, Doppler precipitation echoes, drone surveillance video feeds, and synthetic civil defense audio siren systems.
            </p>
          </div>

          {/* Action Buttons: GPS, Stream Toggle, Manual Sync, Broadcast */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowDispatchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Broadcast Emergency Warning Alert directly from Live Monitoring"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Broadcast Alert</span>
            </button>

            <button
              onClick={handleUseGps}
              disabled={gpsLoading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-950/40 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Detect and bind live weather to your device's exact GPS coordinates"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'Acquiring GPS...' : 'Use My Live GPS'}</span>
            </button>

            <button
              onClick={() => setIsStreamActive(!isStreamActive)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isStreamActive 
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border-rose-500/40'
              }`}
              title={isStreamActive ? 'Pause live stream listener' : 'Resume live SSE stream'}
            >
              {isStreamActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreamActive ? 'Stream: Active' : 'Stream: Paused'}</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Force full refresh from Open-Meteo & Air Quality APIs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Geolocation feedback error banner */}
        {geoError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{geoError}</span>
            </span>
            <button onClick={() => setGeoError(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-NAVIGATION MODE TABS                                 */}
        {/* ========================================================= */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveMode('telemetry')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeMode === 'telemetry'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Atmospheric Telemetry</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            onClick={() => setActiveMode('radar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeMode === 'radar'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Doppler Storm Radar</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">Echo</span>
          </button>

          <button
            onClick={() => setActiveMode('surveillance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeMode === 'surveillance'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Live CCTV & Drone Surveillance</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">4 CAM</span>
          </button>

          <button
            onClick={() => setActiveMode('siren')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeMode === 'siren'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Civil Defense Siren & Voice EAS</span>
            {audioActive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          </button>

          <button
            onClick={() => setActiveMode('matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeMode === 'matrix'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Incident Command Matrix</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">Unified</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. GLOBAL GEOCODING & PRESET STATIONS                     */}
      {/* ========================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search any global city, coordinate, or emergency zone (e.g., Guwahati, Mumbai, Miami, Tokyo, London)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search Station</span>
            </button>
          </form>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-slate-500 text-[11px] font-mono whitespace-nowrap">Presets:</span>
            {[
              { name: 'Assam Valley', lat: 26.2006, lon: 92.9376 },
              { name: 'Puri Coast', lat: 19.8135, lon: 85.8312 },
              { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
              { name: 'Tokyo Bay', lat: 35.6762, lon: 139.6503 },
              { name: 'California Ridge', lat: 37.7749, lon: -122.4194 }
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => onLocationChange(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                  currentLocation.name.includes(preset.name.split(' ')[0])
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Autocomplete Results */}
        {searchResults.length > 0 && (
          <div className="p-2 bg-slate-850 rounded-xl border border-slate-700 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono px-2 py-1 flex items-center justify-between">
              <span>Select Meteorological Station Node</span>
              <span>{searchResults.length} matches</span>
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(item)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-700/60 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="truncate max-w-lg font-medium">{item.display_name}</span>
                <span className="text-[11px] font-mono text-emerald-400 shrink-0 ml-2">
                  {parseFloat(item.lat).toFixed(3)}°N, {parseFloat(item.lon).toFixed(3)}°E
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. ATMOSPHERIC ANOMALY EARLY WARNING BANNER               */}
      {/* ========================================================= */}
      {anomalyWarnings.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-amber-950/40 border border-rose-500/40 text-slate-200 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
              <span>Atmospheric Anomaly Early Warning Triggered ({anomalyWarnings.length} Active Vectors)</span>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs px-3 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View Emergency Alerts Center</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {anomalyWarnings.map((warn, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  warn.severity === 'extreme' 
                    ? 'bg-rose-900/30 border-rose-500/40 text-rose-100' 
                    : warn.severity === 'high'
                    ? 'bg-amber-900/25 border-amber-500/40 text-amber-100'
                    : 'bg-slate-800/60 border-slate-700 text-slate-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{warn.title}</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">{warn.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: ATMOSPHERIC TELEMETRY VIEW                        */}
      {/* ========================================================= */}
      {activeMode === 'telemetry' && (
        <div className="space-y-6">
          {/* Real-Time Meteorological HUD Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shadow-inner relative group">
                  <WeatherIconComponent className={`w-12 h-12 ${
                    weatherCodeInfo.severity === 'severe' 
                      ? 'text-rose-400 animate-pulse' 
                      : weatherCodeInfo.severity === 'moderate' 
                      ? 'text-sky-400' 
                      : 'text-amber-400'
                  }`} />
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-emerald-400 border border-slate-700">
                    WMO {weather?.weatherCode ?? 0}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-black text-white font-mono tracking-tight">
                      {weather ? `${weather.temperature.toFixed(1)}` : '26.4'}°C
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      Feels like {weather?.apparentTemperature ? `${weather.apparentTemperature.toFixed(1)}°C` : '28.0°C'}
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-200 mt-1 flex items-center gap-2">
                    <span>{weatherCodeInfo.label}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-mono text-emerald-400 font-normal">
                      Dew Point: {weather?.dewPoint ?? 21.0}°C
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    Station: <span className="text-white font-semibold">{currentLocation.name}</span> ({currentLocation.lat.toFixed(3)}°N, {currentLocation.lon.toFixed(3)}°E)
                  </div>
                </div>
              </div>

              {/* Quick HUD Telemetry Badges */}
              <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Last Observation: {weather?.retrievedAt ? new Date(weather.retrievedAt).toLocaleTimeString() : 'Current'}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Model: ECMWF IFS & GFS 0.25° Mesh</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyTelemetry}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy raw telemetry JSON"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>{copiedTelemetry ? 'Copied!' : 'Copy Telemetry'}</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Download CSV report"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 8 Detailed Live Atmospheric Telemetry Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
              {/* 1. Barometric Pressure */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="font-semibold text-slate-300">Surface Pressure</span>
                  <Gauge className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {weather?.surfacePressure ? Math.round(weather.surfacePressure) : 1012}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">hPa</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Tendency:</span>
                  <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold ${
                    weather?.pressureTrend === 'Rising' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : weather?.pressureTrend === 'Falling'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-750 text-slate-300'
                  }`}>
                    {weather?.pressureTrend === 'Rising' && <TrendingUp className="w-3 h-3" />}
                    {weather?.pressureTrend === 'Falling' && <TrendingDown className="w-3 h-3" />}
                    {weather?.pressureTrend === 'Steady' && <Minus className="w-3 h-3" />}
                    <span>{weather?.pressureTrend || 'Steady'}</span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {weather?.surfacePressure && weather.surfacePressure < 1000 ? '⚠️ Low depression (Storm alert)' : 'Normal barometric range'}
                </div>
              </div>

              {/* 2. Wind Dynamics */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="font-semibold text-slate-300">Wind & Gusts</span>
                  <Wind className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {weather?.windSpeed ?? 14}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">km/h</span>
                  <span className="text-[11px] text-teal-400 font-mono ml-auto">
                    Gust: {weather?.windGusts ?? ((weather?.windSpeed ?? 14) * 1.35).toFixed(1)} km/h
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Heading:</span>
                  <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                    <Compass 
                      className="w-3.5 h-3.5 text-teal-400 transition-transform duration-500"
                      style={{ transform: `rotate(${weather?.windDirection ?? 180}deg)` }}
                    />
                    <span>{weather?.windDirection ?? 180}° ({windCardinal})</span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Beaufort Force: {weather?.windSpeed ? Math.min(12, Math.floor(weather.windSpeed / 5)) : 3}
                </div>
              </div>

              {/* 3. Relative Humidity */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="font-semibold text-slate-300">Relative Humidity</span>
                  <Droplets className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {weather?.humidity ?? 68}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono ml-auto">
                    Dew Pt: {weather?.dewPoint ?? 21.0}°C
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Saturation:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    (weather?.humidity ?? 68) > 85 
                      ? 'bg-sky-500/20 text-sky-400' 
                      : (weather?.humidity ?? 68) < 25 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {(weather?.humidity ?? 68) > 85 ? 'Saturated' : (weather?.humidity ?? 68) < 25 ? 'Arid Dry' : 'Optimal'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Atmospheric vapor density index
                </div>
              </div>

              {/* 4. Precipitation */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="font-semibold text-slate-300">Precipitation Rate</span>
                  <CloudRain className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-sky-400 font-mono">
                    {weather?.precipitation ?? 0}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">mm/h</span>
                  <span className="text-[11px] text-slate-400 font-mono ml-auto">
                    24h Sum: {weather?.daily?.precipitationSum?.[0] ?? 0} mm
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Rain Prob:</span>
                  <span className="text-sky-300 font-bold">
                    {weather?.hourly?.precipitationProbability?.[0] ?? 15}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {weather?.precipitation && weather.precipitation > 5 ? 'Active downpour event' : 'No active ground runoff'}
                </div>
              </div>

              {/* 5. Air Quality Index */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="font-semibold text-slate-300">Air Quality (AQI)</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {weather?.airQuality?.aqi ?? 45}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">US AQI</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ml-auto ${
                    (weather?.airQuality?.aqi ?? 45) <= 50 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : (weather?.airQuality?.aqi ?? 45) <= 100 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {weather?.airQuality?.category ?? 'Good'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">PM2.5:</span>
                  <span className="text-slate-200 font-bold">{weather?.airQuality?.pm25 ?? 11.2} µg/m³</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  PM10: {weather?.airQuality?.pm10 ?? 22.0} µg/m³ • Clean air
                </div>
              </div>

              {/* 6. UV Index */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="font-semibold text-slate-300">UV Index & Solar</span>
                  <Sun className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {weather?.uvIndex ?? 5.2}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Index</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold ml-auto">
                    {(weather?.uvIndex ?? 5.2) >= 8 ? 'Very High' : (weather?.uvIndex ?? 5.2) >= 6 ? 'High' : (weather?.uvIndex ?? 5.2) >= 3 ? 'Moderate' : 'Low'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Peak Today:</span>
                  <span className="text-slate-200 font-bold">{weather?.daily?.uvIndexMax?.[0] ?? 7.5} Max</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Sun protection recommended midday
                </div>
              </div>

              {/* 7. Cloud Cover & Visibility */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="font-semibold text-slate-300">Cloud Ceiling & Vis</span>
                  <Eye className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {weather?.cloudCover ?? 35}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Cover</span>
                  <span className="text-[11px] text-indigo-400 font-mono ml-auto">
                    Vis: {weather?.visibilityKm ?? 10.0} km
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Horizon:</span>
                  <span className="text-slate-200 font-bold">{(weather?.visibilityKm ?? 10) >= 10 ? 'Unobstructed' : 'Hazy / Restricted'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Aviation standard VFR visibility
                </div>
              </div>

              {/* 8. Daylight & Astrometric Cycle */}
              <div className="bg-slate-850/80 border border-slate-750 rounded-2xl p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="font-semibold text-slate-300">Sun & Solar Cycle</span>
                  <Sun className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold text-white font-mono">
                    {weather?.daily?.sunrise?.[0] ? new Date(weather.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '05:48 AM'}
                  </span>
                  <span className="text-xs text-slate-500">Sunrise</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Sunset:</span>
                  <span className="text-slate-200 font-bold">
                    {weather?.daily?.sunset?.[0] ? new Date(weather.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:15 PM'}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                  {weather?.isDay ? '☀️ Solar Elevation (Day)' : '🌙 Night Phase'}
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Live Hourly Forecast Slider */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">24-Hour Live Hourly Meteorological Trend</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Model: Open-Meteo High-Resolution Hourly Projection
              </span>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
              <div className="flex gap-2.5 min-w-[800px]">
                {weather?.hourly?.time ? (
                  weather.hourly.time.slice(0, 24).map((timeStr, idx) => {
                    const hourDate = new Date(timeStr);
                    const hourFormatted = hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const temp = weather.hourly?.temperature[idx] ?? 24;
                    const rain = weather.hourly?.precipitation[idx] ?? 0;
                    const rainProb = weather.hourly?.precipitationProbability?.[idx] ?? 0;
                    const wind = weather.hourly?.windSpeed[idx] ?? 12;

                    return (
                      <div 
                        key={timeStr} 
                        className="flex-1 min-w-[70px] bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-between text-center hover:border-slate-700 transition-colors"
                      >
                        <div className="text-[11px] font-mono text-slate-400 font-semibold">{hourFormatted}</div>
                        <div className="my-2">
                          <div className="text-sm font-bold text-white font-mono">{Math.round(temp)}°</div>
                        </div>
                        <div className="space-y-1 w-full text-[10px] font-mono">
                          <div className="text-sky-400 flex items-center justify-center gap-0.5">
                            <CloudRain className="w-2.5 h-2.5" />
                            <span>{rain > 0 ? `${rain}mm` : `${rainProb}%`}</span>
                          </div>
                          <div className="text-slate-400">
                            {Math.round(wind)} <span className="text-[9px]">km/h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-400 py-6 text-center w-full">
                    Hourly telemetry stream initializing...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 7-Day Extended Weather Outlook */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">7-Day Extended Weather Outlook</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Location: {currentLocation.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weather?.daily?.time ? (
                weather.daily.time.map((day, idx) => {
                  const dayCode = weather.daily!.weatherCode[idx] ?? 0;
                  const dayInfo = interpretWeatherCode(dayCode);
                  const DayIcon = dayInfo.icon;

                  return (
                    <div key={day} className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex flex-col justify-between text-center hover:border-slate-700 transition-colors">
                      <div className="text-xs font-semibold text-slate-300 font-mono">
                        {new Date(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>

                      <div className="my-2.5 flex flex-col items-center">
                        <DayIcon className="w-6 h-6 text-amber-400 mb-1" />
                        <div className="text-base font-black text-white font-mono">
                          {Math.round(weather.daily!.tempMax[idx])}°
                          <span className="text-xs text-slate-400 font-normal ml-1">
                            {Math.round(weather.daily!.tempMin[idx])}°
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-sky-400 flex items-center justify-center gap-1 font-mono">
                        <CloudRain className="w-3 h-3" />
                        <span>{weather.daily!.precipitationSum[idx]} mm</span>
                      </div>

                      <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center justify-between">
                        <span>Wind:</span>
                        <span className="text-slate-200">{Math.round(weather.daily!.windMax[idx])} km/h</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                [...Array(7)].map((_, i) => (
                  <div key={i} className="bg-slate-850 p-3 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                    Day {i + 1}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Server Telemetry Terminal (SSE Stream Inspector) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live Weather Server Stream Terminal (SSE Stream Inspector)
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStreamPackets([])}
                  className="text-[10px] text-slate-400 hover:text-white font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Clear Log
                </button>
                <button
                  onClick={() => setShowTerminal(!showTerminal)}
                  className="text-[10px] text-slate-400 hover:text-white font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
                </button>
              </div>
            </div>

            {showTerminal && (
              <div className="p-4 bg-slate-950 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                {streamPackets.length === 0 ? (
                  <div className="text-slate-500 italic py-2">
                    Awaiting incoming SSE frames from /api/weather/stream...
                  </div>
                ) : (
                  streamPackets.map((pkt) => (
                    <div key={pkt.id} className="flex items-start gap-2 hover:bg-slate-900/60 px-1 py-0.5 rounded">
                      <span className="text-slate-500 shrink-0">[{pkt.time}]</span>
                      <span className={pkt.text.includes('HANDSHAKE') ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {pkt.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: DOPPLER STORM RADAR                               */}
      {/* ========================================================= */}
      {activeMode === 'radar' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
                  <h2 className="text-lg font-bold text-white">Doppler Weather Radar & Storm Reflectivity</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    S-Band Doppler (250 km Range)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  High-frequency animated precipitation scan centering on {currentLocation.name} ({currentLocation.lat.toFixed(2)}°N, {currentLocation.lon.toFixed(2)}°E).
                </p>
              </div>

              {/* Radar Layer & Zoom Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
                  <button
                    onClick={() => setRadarLayer('composite')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${radarLayer === 'composite' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    Composite
                  </button>
                  <button
                    onClick={() => setRadarLayer('reflectivity')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${radarLayer === 'reflectivity' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    Base dBZ
                  </button>
                  <button
                    onClick={() => setRadarLayer('velocity')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${radarLayer === 'velocity' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    Wind Velocity
                  </button>
                </div>

                <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
                  <button
                    onClick={() => setRadarZoom(Math.max(0.6, radarZoom - 0.2))}
                    className="px-2 py-1 hover:text-white text-slate-300"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono text-[11px] text-slate-300">{radarZoom.toFixed(1)}x</span>
                  <button
                    onClick={() => setRadarZoom(Math.min(2.0, radarZoom + 0.2))}
                    className="px-2 py-1 hover:text-white text-slate-300"
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => setRadarPlaying(!radarPlaying)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    radarPlaying ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {radarPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{radarPlaying ? 'Live Sweep' : 'Paused'}</span>
                </button>
              </div>
            </div>

            {/* Main Radar Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
              {/* Radar Canvas (3 cols) */}
              <div className="lg:col-span-3 bg-slate-950 rounded-2xl border border-slate-800 p-3 relative flex items-center justify-center overflow-hidden">
                <canvas 
                  ref={radarCanvasRef}
                  width={640}
                  height={420}
                  className="w-full max-w-full h-auto aspect-[16/10] rounded-xl"
                />

                {/* Radar HUD overlay */}
                <div className="absolute top-6 left-6 text-xs font-mono text-emerald-400 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>NEXRAD DOPPLER STREAM</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Tilt: 0.5° Elevation • PRF: 1200 Hz</div>
                  <div className="text-[10px] text-sky-400">Station ID: DG-RAD-92N</div>
                </div>

                {/* dBZ Color Bar Legend */}
                <div className="absolute bottom-6 right-6 bg-slate-950/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1">
                  <div className="text-slate-400 font-semibold mb-1">Reflectivity (dBZ)</div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-blue-400" />
                    <span className="w-3 h-3 rounded bg-green-400" />
                    <span className="w-3 h-3 rounded bg-yellow-400" />
                    <span className="w-3 h-3 rounded bg-orange-500" />
                    <span className="w-3 h-3 rounded bg-red-600" />
                    <span className="w-3 h-3 rounded bg-purple-600" />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>10 (Light)</span>
                    <span>40 (Heavy)</span>
                    <span>65+ (Hail)</span>
                  </div>
                </div>
              </div>

              {/* Storm Cells Tracking Column */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Detected Storm Cells</span>
                </h3>

                <div className="bg-slate-850 p-3 rounded-xl border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                    <span>Cell #A1 (Severe Convective)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">62 dBZ</span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                    <div>Bearing: 045° (NE) @ 38 km</div>
                    <div>Movement: ENE at 28 km/h</div>
                    <div>Hail Probability: 75% • Severe</div>
                    <div>ETA to Sector: ~35 mins</div>
                  </div>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>Cell #B4 (Squall Line)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">48 dBZ</span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                    <div>Bearing: 220° (SW) @ 65 km</div>
                    <div>Movement: E at 32 km/h</div>
                    <div>Rain Intensity: 18 mm/h</div>
                  </div>
                </div>

                {/* Radar Playback Loop Slider */}
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                    <span>Radar Sweep Loop</span>
                    <span className="text-emerald-400">-{ (5 - radarTimeIndex) * 10 } min</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={radarTimeIndex}
                    onChange={(e) => setRadarTimeIndex(parseInt(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>-50m</span>
                    <span>-30m</span>
                    <span>NOW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: LIVE CCTV & DRONE VIDEO SURVEILLANCE              */}
      {/* ========================================================= */}
      {activeMode === 'surveillance' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <h2 className="text-lg font-bold text-white">Live Disaster Reconnaissance & CCTV Surveillance</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    REC {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Active low-latency IP streams from regional river flood barriers, seismic slip fault cameras, wildfire thermal towers, and coastal buoys.
                </p>
              </div>

              {/* Master Feed Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNightVision(!nightVision)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    nightVision 
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Toggle FLIR Night Vision / Thermal False-Color filter"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{nightVision ? 'Night Vision: ON' : 'IR Night Vision'}</span>
                </button>

                <button
                  onClick={handleCamSnapshot}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Capture snapshot frame from active camera feeds"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snapshot</span>
                </button>
              </div>
            </div>

            {/* Flash Effect on Snapshot */}
            {camSnapshotFlash && (
              <div className="fixed inset-0 bg-white/40 pointer-events-none z-50 transition-opacity duration-200" />
            )}

            {/* 4-Up Camera Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {cameraFeeds.map((cam) => (
                <div 
                  key={cam.id}
                  className={`rounded-2xl border transition-all overflow-hidden relative group bg-gradient-to-br ${cam.color} ${
                    selectedCam === cam.id ? 'border-sky-500 ring-2 ring-sky-500/40' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Night Vision Filter Overlay */}
                  {nightVision && (
                    <div className="absolute inset-0 bg-emerald-500/15 mix-blend-overlay pointer-events-none z-10" />
                  )}

                  {/* Camera Top HUD Header */}
                  <div className="p-3 bg-slate-950/70 backdrop-blur border-b border-slate-800/80 flex items-center justify-between text-xs font-mono relative z-20">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="font-bold text-white">{cam.tag}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-emerald-400">{cam.status}</span>
                      <button
                        onClick={() => setSelectedCam(selectedCam === cam.id ? null : cam.id)}
                        className="text-slate-400 hover:text-white"
                        title="Maximize / focus camera"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Simulated Camera Video Viewport */}
                  <div className="h-52 relative flex items-center justify-center overflow-hidden">
                    {/* Simulated Camera Background Art */}
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* Pan-tilt offset display */}
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center p-4 transition-transform duration-300"
                      style={{
                        transform: selectedCam === cam.id 
                          ? `scale(${camPtzAngles.zoom}) translate(${camPtzAngles.pan * 2}px, ${camPtzAngles.tilt * 2}px)`
                          : 'scale(1)'
                      }}
                    >
                      <div className="text-center space-y-1 relative z-20">
                        <div className="text-xs font-mono text-slate-300 font-bold uppercase">{cam.location}</div>
                        <div className="text-[11px] text-slate-400">{cam.type}</div>
                        <div className="text-xs font-mono font-bold text-emerald-400 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700 inline-block mt-2">
                          {cam.metric}
                        </div>
                      </div>

                      {/* Optical Scanning Grid reticle */}
                      <div className="absolute w-28 h-28 border border-white/20 rounded-full flex items-center justify-center pointer-events-none">
                        <div className="w-2 h-2 bg-emerald-400/60 rounded-full" />
                      </div>
                    </div>

                    {/* Scanlines Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />

                    {/* Bottom Camera Telemetry Watermark */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 z-20">
                      <span>BITRATE: 4.8 Mbps • 60.0 FPS</span>
                      <span>{new Date().toLocaleTimeString()} UTC</span>
                    </div>
                  </div>

                  {/* Camera Quick PTZ Controls (when focused) */}
                  {selectedCam === cam.id && (
                    <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono relative z-20">
                      <span className="text-slate-400">PTZ Remote Servo:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCamPtzAngles(p => ({ ...p, pan: p.pan - 5 }))}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          ◄ Pan L
                        </button>
                        <button
                          onClick={() => setCamPtzAngles(p => ({ ...p, pan: p.pan + 5 }))}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          Pan R ►
                        </button>
                        <button
                          onClick={() => setCamPtzAngles(p => ({ ...p, zoom: Math.min(2.5, p.zoom + 0.2) }))}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          Zoom +
                        </button>
                        <button
                          onClick={() => setCamPtzAngles(p => ({ ...p, zoom: Math.max(1.0, p.zoom - 0.2) }))}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          Zoom -
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 4: CIVIL DEFENSE SIREN & SYNTHESIZED EAS BROADCAST   */}
      {/* ========================================================= */}
      {activeMode === 'siren' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-amber-400 animate-bounce" />
                  <h2 className="text-lg font-bold text-white">Civil Defense Siren & Voice EAS Broadcaster</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Web Audio API Synthesis
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Synthesizes official civil defense audio signals, Emergency Alert System (EAS) dual-tone frequencies, and speech voice announcements directly in your browser.
                </p>
              </div>

              {/* Volume Slider & Stop All */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sirenVolume}
                    onChange={(e) => setSirenVolume(parseFloat(e.target.value))}
                    className="w-24 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white">{Math.round(sirenVolume * 100)}%</span>
                </div>

                <button
                  onClick={stopAllAudio}
                  disabled={!audioActive && !speechSpeaking}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  <VolumeX className="w-4 h-4 inline mr-1" />
                  <span>Silence Audio</span>
                </button>
              </div>
            </div>

            {/* Audio Visualizer Canvas */}
            <div className="mt-6 bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col items-center justify-center">
              <canvas
                ref={audioVisualizerCanvasRef}
                width={600}
                height={120}
                className="w-full max-w-2xl h-28 rounded-lg"
              />
              <div className="text-[11px] font-mono text-slate-400 mt-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${audioActive ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                <span>
                  {audioActive 
                    ? `Audio Generator Active • Frequency: ${sirenType === 'eas' ? '853 Hz / 960 Hz EAS' : '400 Hz - 800 Hz Siren Wave'}` 
                    : 'Audio Synthesizer Idle (Click a test trigger below to initiate broadcast)'}
                </span>
              </div>
            </div>

            {/* 3 Interactive Signal Triggers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* 1. EAS Dual Tone */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Emergency Alert Tone (EAS)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">853 + 960 Hz</span>
                </div>
                <p className="text-xs text-slate-400">
                  Standard dual-frequency attention signal mandated by emergency civil defense broadcast systems.
                </p>
                <button
                  onClick={playEASTone}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test EAS Warning Signal</span>
                </button>
              </div>

              {/* 2. Air Raid Rising-Falling Siren */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Civil Defense Warning Siren</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Wailing 400-800 Hz</span>
                </div>
                <p className="text-xs text-slate-400">
                  Oscillating tone used for outdoor tornado, cyclone landfall, and imminent flash flood evacuations.
                </p>
                <button
                  onClick={playAirRaidSiren}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Wailing Siren</span>
                </button>
              </div>

              {/* 3. Text-to-Speech Civil Defense Voice */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Spoken Emergency Advisory</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">TTS Synthesizer</span>
                </div>
                <p className="text-xs text-slate-400">
                  Synthesized civil defense public address message announcing local meteorological parameters.
                </p>
                <button
                  onClick={() => speakAnnouncement()}
                  disabled={speechSpeaking}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-950/40 disabled:opacity-50"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{speechSpeaking ? 'Announcing...' : 'Broadcast Spoken Warning'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 5: UNIFIED MULTI-HAZARD COMMAND MATRIX               */}
      {/* ========================================================= */}
      {activeMode === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-white">Multi-Hazard Incident Command Matrix</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Unified Telemetry Fusion
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Correlating real-time atmospheric data with active emergency vectors across {currentLocation.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Preparedness Index:</span>
                <span className="text-base font-black text-emerald-400 font-mono px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  94.2% READY
                </span>
              </div>
            </div>

            {/* Matrix Vector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Atmospheric Vector */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-white">Atmospheric Threat Vector</span>
                  <CloudRain className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {weather ? `${weather.temperature.toFixed(1)}°C` : '26.4°C'}
                </div>
                <div className="text-xs text-slate-300">
                  Wind: <span className="text-teal-400 font-bold">{weather?.windSpeed ?? 14} km/h</span> • Rain: <span className="text-sky-400 font-bold">{weather?.precipitation ?? 0} mm/h</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">
                  Status: {weather?.precipitation && weather.precipitation > 5 ? 'Elevated Hydrological Risk' : 'Nominal Atmospheric Envelope'}
                </div>
              </div>

              {/* Active Alerts Vector */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-white">Civil Defense Alert Vector</span>
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  {alerts.filter(a => a.status === 'Active').length} Active
                </div>
                <div className="text-xs text-slate-300">
                  Monitoring regional emergency directives and shelters
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Primary Vector: Monsoon runoff & cyclonic buffer
                </div>
              </div>

              {/* Server Stream Health */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-white">Telemetry Stream Health</span>
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {streamLatency} ms
                </div>
                <div className="text-xs text-slate-300">
                  Packets Processed: <span className="text-white font-bold">{packetsReceived}</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">
                  Protocol: HTTP/2 SSE Server-Push Active
                </div>
              </div>
            </div>

            {/* Quick Navigation to Related Disaster Guard Tools */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">Jump to Module:</span>
              {onNavigateTab && (
                <>
                  <button
                    onClick={() => onNavigateTab('sensors')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    IoT Sensor Network →
                  </button>
                  <button
                    onClick={() => onNavigateTab('prediction')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    AI Disaster Prediction →
                  </button>
                  <button
                    onClick={() => onNavigateTab('map')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Risk Map & GIS →
                  </button>
                  <button
                    onClick={() => onNavigateTab('alerts')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Emergency Alerts →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DISPATCH EMERGENCY ALERT MODAL                         */}
      {/* ========================================================= */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <Bell className="w-5 h-5 text-rose-400" />
                <span>Broadcast Emergency Early Warning</span>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleDispatchAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alert Category / Hazard Type
                </label>
                <select
                  value={dispatchType}
                  onChange={(e) => setDispatchType(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Severe Meteorological Alert">Severe Meteorological Alert</option>
                  <option value="Flash Flood Evacuation Notice">Flash Flood Evacuation Notice</option>
                  <option value="Cyclonic Gale & Marine Warning">Cyclonic Gale & Marine Warning</option>
                  <option value="Severe Heatwave Advisory">Severe Heatwave Advisory</option>
                  <option value="Degraded Air Quality Warning">Degraded Air Quality Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Severity Level
                </label>
                <div className="flex gap-2">
                  {(['Moderate', 'High', 'Extreme'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setDispatchSeverity(sev)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        dispatchSeverity === sev
                          ? sev === 'Extreme'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : sev === 'High'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-sky-600 text-white border-sky-500'
                          : 'bg-slate-850 text-slate-400 border-slate-700'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Emergency Broadcast Message
                </label>
                <textarea
                  rows={3}
                  placeholder={`Atmospheric telemetry anomaly detected in ${currentLocation.name}. Mandatory advisory for low-lying catchments...`}
                  value={dispatchMessage}
                  onChange={(e) => setDispatchMessage(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              {dispatchSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2 font-bold">
                  <Check className="w-4 h-4" />
                  <span>Early Warning Broadcast Successfully Published!</span>
                </div>
              ) : (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDispatchModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dispatching || !dispatchMessage.trim()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{dispatching ? 'Publishing...' : 'Dispatch Alert Now'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. OFFICIAL DISASTER AUTHORITIES VERIFICATION PROTOCOL    */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Official Disaster Authority Directives & Verification Protocol</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Meteorological telemetry alone does NOT substantiate an official disaster declaration or mandatory evacuation order. DisasterGuard AI integrates live numerical weather predictions for decision-support and analytical intelligence. For legally binding civil defense directives, consult official emergency portals:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
          <a
            href="https://ndma.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>NDMA (India)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <a
            href="https://www.fema.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>FEMA (United States)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <a
            href="https://worldweather.wmo.int"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>WMO World Weather</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <a
            href="https://emergency.copernicus.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
          >
            <span>Copernicus EMS</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2">
          <span>Telemetry Server Source: {weather?.dataSource || 'Open-Meteo High-Resolution ECMWF/GFS'}</span>
          <span>Live Server Latency: {streamLatency}ms</span>
          <span>Observation Timestamp: {weather?.retrievedAt ? new Date(weather.retrievedAt).toLocaleTimeString() : 'Current'}</span>
        </div>
      </div>
    </div>
  );
};
