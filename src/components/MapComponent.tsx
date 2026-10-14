import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  AlertItem, 
  ShelterItem, 
  RealWorldDisasterItem, 
  DistressBeaconItem, 
  MapBaseLayer, 
  SensorItem 
} from '../types';
import { Globe, Radio, Maximize2, CloudRain, Activity } from 'lucide-react';

interface ImpactCircle {
  center: [number, number];
  radiusKm: number;
  color: string;
  fillColor?: string;
  label?: string;
}

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  alerts?: AlertItem[];
  shelters?: ShelterItem[];
  realWorldDisasters?: RealWorldDisasterItem[];
  distressBeacons?: DistressBeaconItem[];
  sensors?: SensorItem[];
  impactCircles?: ImpactCircle[];
  selectedLocationName?: string;
  routeCoordinates?: [number, number][]; // origin to destination
  filterCategory?: string;
  filterSeverity?: string;
  showShelters?: boolean;
  showAlerts?: boolean;
  showRealWorld?: boolean;
  showDistress?: boolean;
  showSensors?: boolean;
  showImpactRadius?: boolean;
  showLiveRadar?: boolean;
  defaultBaseLayer?: MapBaseLayer;
  onSelectAlert?: (alert: AlertItem) => void;
  onSelectShelter?: (shelter: ShelterItem) => void;
  onSelectRealWorld?: (disaster: RealWorldDisasterItem) => void;
  onSelectBeacon?: (beacon: DistressBeaconItem) => void;
  onSelectSensor?: (sensor: SensorItem) => void;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
}

// Distance helper (Haversine formula in km)
function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom = 6,
  alerts = [],
  shelters = [],
  realWorldDisasters = [],
  distressBeacons = [],
  sensors = [],
  impactCircles = [],
  selectedLocationName,
  routeCoordinates,
  filterCategory = 'All',
  filterSeverity = 'All',
  showShelters = true,
  showAlerts = true,
  showRealWorld = true,
  showDistress = true,
  showSensors = true,
  showImpactRadius = true,
  showLiveRadar = false,
  defaultBaseLayer = 'satellite',
  onSelectAlert,
  onSelectShelter,
  onSelectRealWorld,
  onSelectBeacon,
  onSelectSensor,
  onMapClick,
  height = '500px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [currentBaseLayer, setCurrentBaseLayer] = useState<MapBaseLayer>(defaultBaseLayer);

  // Define Tile Providers
  const tileProviders = {
    satellite: {
      name: 'Real Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    },
    dark: {
      name: 'Tactical Dark',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19
    },
    streets: {
      name: 'Street Map',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    },
    topo: {
      name: 'Topographic Relief',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap contributors',
      maxZoom: 17
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false
      });

      // Base tile layer
      const provider = tileProviders[currentBaseLayer];
      const tileLayer = L.tileLayer(provider.url, {
        maxZoom: provider.maxZoom,
        attribution: provider.attribution
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Attribution
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('DisasterGuard AI Real-World GIS Engine')
        .addTo(map);

      // Layer group for dynamic markers
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Map click handler
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Base Layer Switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const provider = tileProviders[currentBaseLayer];
    const newTileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [currentBaseLayer]);

  // Handle Live RainViewer Weather Radar Overlay Toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (showLiveRadar) {
      if (!radarLayerRef.current) {
        // Fetch latest available RainViewer timestamp or fallback to recent epoch
        fetch('https://api.rainviewer.com/public/weather-maps.json')
          .then(res => res.json())
          .then(data => {
            const radarFrames = data?.radar?.past || [];
            const latestFrame = radarFrames[radarFrames.length - 1];
            const ts = latestFrame?.time || Math.floor(Date.now() / 600000) * 600;
            if (mapInstanceRef.current && showLiveRadar) {
              const radarTile = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`, {
                opacity: 0.70,
                maxZoom: 18,
                zIndex: 400
              }).addTo(mapInstanceRef.current);
              radarLayerRef.current = radarTile;
            }
          })
          .catch(() => {
            // Fallback generic radar overlay
            const ts = Math.floor(Date.now() / 600000) * 600;
            if (mapInstanceRef.current) {
              const radarTile = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`, {
                opacity: 0.65,
                maxZoom: 18,
                zIndex: 400
              }).addTo(mapInstanceRef.current);
              radarLayerRef.current = radarTile;
            }
          });
      }
    } else {
      if (radarLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
    }
  }, [showLiveRadar]);

  // Center pan update
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom]);

  // Render Markers and Features
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const lg = layerGroupRef.current;
    lg.clearLayers();

    // 1. Current selected operations base marker
    const userLocationIcon = L.divIcon({
      className: 'custom-user-icon',
      html: `
        <div style="position: relative; width: 30px; height: 30px;">
          <div style="position: absolute; inset: 0; background: rgba(56, 189, 248, 0.45); border-radius: 9999px; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; background: #0284c7; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 16px rgba(2,132,199,0.95); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">🎯</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const userMarker = L.marker(center, { icon: userLocationIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
          <strong style="color: #0369a1; font-size: 13px;">Selected Operations Post:</strong><br/>
          <span style="font-weight: 700; font-size: 13px;">${selectedLocationName || 'Active Station Target'}</span><br/>
          <span style="font-size: 10px; color: #64748b; font-family: monospace;">[${center[0].toFixed(4)}°N, ${center[1].toFixed(4)}°E]</span>
        </div>
      `);
    lg.addLayer(userMarker);

    // 2. Real-World Live Disasters (USGS Earthquakes, Tropical Cyclones, Wildfires, Volcanic Hazards)
    if (showRealWorld) {
      realWorldDisasters.forEach((disaster) => {
        const isQuake = disaster.type === 'Earthquake';
        const isCyclone = disaster.type === 'Cyclone';
        const isWildfire = disaster.type === 'Wildfire';
        const isVolcano = disaster.type === 'Volcano';

        const mag = disaster.magnitude ?? (isCyclone ? 4.5 : isWildfire ? 4.0 : 3.5);
        const color = 
          disaster.severity === 'Extreme' ? '#dc2626' :
          disaster.severity === 'High' ? '#ea580c' :
          disaster.severity === 'Moderate' ? '#d97706' : '#16a34a';

        const iconSymbol = isQuake ? '⚡' : isCyclone ? '🌀' : isWildfire ? '🔥' : isVolcano ? '🌋' : '⚠️';

        // Draw impact radius circle if enabled
        if (showImpactRadius && disaster.radiusKm) {
          const impactCircle = L.circle(disaster.coordinates, {
            radius: disaster.radiusKm * 1000,
            color,
            weight: 1.5,
            dashArray: '4, 4',
            fillColor: color,
            fillOpacity: 0.12
          });
          lg.addLayer(impactCircle);
        }

        const rwIcon = L.divIcon({
          className: 'custom-rw-icon',
          html: `
            <div style="position: relative; width: 34px; height: 34px;">
              ${disaster.severity === 'Extreme' ? `
                <div style="position: absolute; inset: -4px; border-radius: 50%; background: ${color}; opacity: 0.4; animation: ping 1.2s infinite;"></div>
              ` : ''}
              <div style="
                position: absolute; inset: 0; border-radius: 50%;
                background: ${color}; border: 2.5px solid #ffffff;
                box-shadow: 0 0 14px ${color};
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                color: white; font-weight: 900; font-size: 11px;
                line-height: 1;
              ">
                <span>${iconSymbol}</span>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker(disaster.coordinates, { icon: rwIcon });

        // Calculate distance from user's current operations center
        const distKm = calcDistanceKm(center[0], center[1], disaster.coordinates[0], disaster.coordinates[1]);
        const pWaveSec = Math.round(distKm / 6.0);
        const sWaveSec = Math.round(distKm / 3.5);

        const popup = `
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; max-width: 280px; padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">
                REAL-WORLD ${disaster.type.toUpperCase()}
              </span>
              <span style="font-size: 10px; font-weight: 900; color: ${color}; font-family: monospace;">
                ${isQuake ? `MAG ${mag}` : disaster.severity.toUpperCase()}
              </span>
            </div>
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${disaster.title}</strong>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              <strong>Location:</strong> ${disaster.location}<br/>
              ${isQuake ? `<strong>Depth:</strong> ${disaster.depthKm ?? 10} km | ` : ''}
              <strong>Impact Buffer:</strong> ~${disaster.radiusKm} km
            </div>
            <div style="background: #f1f5f9; padding: 6px; border-radius: 6px; margin-bottom: 6px; font-size: 10px; color: #334155;">
              <div style="font-weight: 700; color: #0284c7;">📏 Distance to Current Station: ~${distKm} km</div>
              ${isQuake ? `
                <div style="color: #64748b; margin-top: 2px;">
                  Estimated Wave Arrival: P-Wave: ~${pWaveSec}s | S-Wave: ~${sWaveSec}s
                </div>
              ` : `
                <div style="color: #64748b; margin-top: 2px;">
                  Live Sensor Network active in regional quadrant.
                </div>
              `}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
              Source: ${disaster.source}
            </div>
            ${disaster.url ? `
              <a href="${disaster.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-size: 10px; color: #2563eb; font-weight: 600; text-decoration: underline;">
                View Official Geological/Met Feed &rarr;
              </a>
            ` : ''}
          </div>
        `;

        marker.bindPopup(popup);
        if (onSelectRealWorld) {
          marker.on('click', () => onSelectRealWorld(disaster));
        }
        lg.addLayer(marker);
      });
    }

    // 3. IoT Real-Time Sensors Network Layer
    if (showSensors && sensors.length > 0) {
      sensors.forEach(sensor => {
        const isCritical = sensor.status === 'Critical';
        const isWarning = sensor.status === 'Warning';
        const sensorColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

        // Sensor Type Icon
        let sensorIconEmoji = '📡';
        if (sensor.type === 'River Level Gauge') sensorIconEmoji = '🌊';
        else if (sensor.type === 'Seismic Accelerometer' || sensor.type === 'Borehole Strainmeter') sensorIconEmoji = '⚡';
        else if (sensor.type === 'Thermal Wildfire Optical') sensorIconEmoji = '🔥';
        else if (sensor.type === 'Coastal Tide Buoy') sensorIconEmoji = '⚓';
        else if (sensor.type === 'Rainfall Radar Gauge') sensorIconEmoji = '🌧️';
        else if (sensor.type === 'Slope Inclinometer') sensorIconEmoji = '⛰️';
        else if (sensor.type === 'Volcanic Infrasound') sensorIconEmoji = '🌋';

        const sensorDivIcon = L.divIcon({
          className: 'custom-sensor-icon',
          html: `
            <div style="position: relative; width: 36px; height: 36px;">
              ${isCritical ? `
                <div style="position: absolute; inset: -4px; border-radius: 50%; background: #ef4444; opacity: 0.45; animation: ping 1s infinite;"></div>
              ` : ''}
              <div style="
                position: absolute; inset: 0; border-radius: 50%;
                background: #0f172a; border: 2.5px solid ${sensorColor};
                box-shadow: 0 0 12px ${sensorColor};
                display: flex; align-items: center; justify-content: center;
                color: white; font-size: 14px;
              ">
                ${sensorIconEmoji}
              </div>
              <div style="
                position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
                background: ${sensorColor}; color: white; padding: 1px 4px;
                border-radius: 4px; font-size: 8px; font-weight: 800; font-family: monospace;
                white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.4);
              ">
                ${sensor.currentValue}${sensor.unit.split(' ')[0]}
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const sensorMarker = L.marker(sensor.coordinates, { icon: sensorDivIcon });

        const sensorPopup = `
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; max-width: 270px; padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="background: ${sensorColor}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">
                IOT SENSOR • ${sensor.status.toUpperCase()}
              </span>
              <span style="font-size: 10px; font-weight: bold; color: #64748b; font-family: monospace;">${sensor.id}</span>
            </div>
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${sensor.name}</strong>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              <strong>Location:</strong> ${sensor.location}<br/>
              <strong>Telemetry Type:</strong> ${sensor.type}
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 11px; color: #475569;">Live Reading:</span>
                <span style="font-size: 16px; font-weight: 900; color: ${sensorColor}; font-family: monospace;">
                  ${sensor.currentValue} ${sensor.unit}
                </span>
              </div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px; display: flex; justify-content: space-between;">
                <span>Warn: ${sensor.warningThreshold} | Crit: ${sensor.criticalThreshold}</span>
                <span style="font-weight: 700; color: ${sensor.rateOfChange && sensor.rateOfChange > 0 ? '#dc2626' : '#16a34a'};">
                  ${sensor.rateOfChange && sensor.rateOfChange > 0 ? `+${sensor.rateOfChange}` : sensor.rateOfChange || '0.00'} ${sensor.rateOfChangeUnit || ''}
                </span>
              </div>
            </div>
            <div style="font-size: 10px; color: #64748b; display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Latency: ${sensor.latencyMs}ms</span>
              <span>Signal: ${sensor.signalQuality}</span>
              <span>Battery: ${sensor.batteryLevel}%</span>
            </div>
            <button id="btn-sensor-${sensor.id}" style="
              width: 100%; background: #0284c7; color: white; border: none;
              padding: 5px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;
              cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;
            ">
              📊 Open Live Telemetry & Waveform
            </button>
          </div>
        `;

        sensorMarker.bindPopup(sensorPopup);

        sensorMarker.on('popupopen', () => {
          const btn = document.getElementById(`btn-sensor-${sensor.id}`);
          if (btn && onSelectSensor) {
            btn.onclick = () => onSelectSensor(sensor);
          }
        });

        if (onSelectSensor) {
          sensorMarker.on('click', () => onSelectSensor(sensor));
        }

        lg.addLayer(sensorMarker);
      });
    }

    // 4. Regional Emergency Alerts
    if (showAlerts) {
      alerts
        .filter(a => filterCategory === 'All' || a.category === filterCategory)
        .filter(a => filterSeverity === 'All' || a.severity === filterSeverity)
        .forEach(alert => {
          const color = 
            alert.severity === 'Extreme' ? '#dc2626' :
            alert.severity === 'High' ? '#ea580c' :
            alert.severity === 'Moderate' ? '#d97706' : '#16a34a';

          // Impact buffer
          if (showImpactRadius) {
            const bufferRadius = alert.severity === 'Extreme' ? 45000 : alert.severity === 'High' ? 25000 : 12000;
            const buffer = L.circle(alert.coordinates, {
              radius: bufferRadius,
              color,
              weight: 1.5,
              dashArray: '3, 3',
              fillColor: color,
              fillOpacity: 0.15
            });
            lg.addLayer(buffer);
          }

          const alertIcon = L.divIcon({
            className: 'custom-alert-icon',
            html: `
              <div style="
                width: 32px; height: 32px; border-radius: 50%;
                background: ${color}; border: 2.5px solid #ffffff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.6);
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: bold; font-size: 14px;
              ">
                ⚠️
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker(alert.coordinates, { icon: alertIcon });

          const popupContent = `
            <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; max-width: 250px; padding: 2px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">
                  ${alert.severity} • ${alert.category}
                </span>
                <span style="font-size: 9px; color: #64748b; font-family: monospace;">${alert.id}</span>
              </div>
              <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${alert.title}</strong>
              <div style="font-size: 11px; color: #334155; margin-bottom: 6px;">${alert.description}</div>
              <div style="font-size: 10px; color: #475569; background: #f1f5f9; padding: 4px; border-radius: 4px; margin-bottom: 4px;">
                <strong>Required Action:</strong> ${alert.recommendedActions[0] || 'Observe local advisories.'}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          if (onSelectAlert) {
            marker.on('click', () => onSelectAlert(alert));
          }
          lg.addLayer(marker);
        });
    }

    // 5. Safe Shelters
    if (showShelters) {
      shelters.forEach(shelter => {
        const isFull = shelter.status === 'Full';
        const shelterColor = isFull ? '#64748b' : '#0284c7';

        const shelterIcon = L.divIcon({
          className: 'custom-shelter-icon',
          html: `
            <div style="
              width: 30px; height: 30px; border-radius: 8px;
              background: ${shelterColor}; border: 2px solid #ffffff;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
              display: flex; align-items: center; justify-content: center;
              color: white; font-size: 15px;
            ">
              🏠
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const shelterMarker = L.marker(shelter.coordinates, { icon: shelterIcon });
        const occupancyPercent = Math.round((shelter.occupancy / shelter.capacity) * 100);

        const shelterPopup = `
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; max-width: 250px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="background: ${shelterColor}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">
                ${shelter.status === 'Open' ? 'SAFE SHELTER OPEN' : 'AT CAPACITY'}
              </span>
              <span style="font-size: 11px; font-weight: bold; color: #0369a1;">${occupancyPercent}% Load</span>
            </div>
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${shelter.name}</strong>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">${shelter.address}</div>
            <div style="font-size: 10px; color: #334155; margin-bottom: 4px;">
              <strong>Capacity:</strong> ${shelter.occupancy} / ${shelter.capacity} evacuees | <strong>Tel:</strong> ${shelter.contact}
            </div>
            <div style="font-size: 9px; color: #64748b;">
              Facilities: ${shelter.facilities.slice(0, 3).join(', ')}
            </div>
          </div>
        `;

        shelterMarker.bindPopup(shelterPopup);
        if (onSelectShelter) {
          shelterMarker.on('click', () => onSelectShelter(shelter));
        }
        lg.addLayer(shelterMarker);
      });
    }

    // 6. Civilian Distress Beacons (SOS)
    if (showDistress) {
      distressBeacons.forEach(beacon => {
        const isDispatched = beacon.status === 'Team Dispatched';
        const isResolved = beacon.status === 'Resolved / Rescued';
        const beaconColor = isResolved ? '#10b981' : isDispatched ? '#f59e0b' : '#ef4444';

        const sosIcon = L.divIcon({
          className: 'custom-sos-icon',
          html: `
            <div style="position: relative; width: 34px; height: 34px;">
              ${!isResolved ? `
                <div style="position: absolute; inset: 0; background: ${beaconColor}; opacity: 0.4; border-radius: 9999px; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              ` : ''}
              <div style="
                position: absolute; inset: 2px; border-radius: 9999px;
                background: ${beaconColor}; border: 2.5px solid #ffffff;
                box-shadow: 0 0 14px ${beaconColor};
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: 900; font-size: 9px; font-family: monospace;
              ">
                SOS
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const sosMarker = L.marker(beacon.coordinates, { icon: sosIcon });

        const sosPopup = `
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; max-width: 260px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="background: ${beaconColor}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">
                ${beacon.urgency.toUpperCase()}
              </span>
              <span style="font-size: 10px; font-weight: bold; color: #475569;">${beacon.status}</span>
            </div>
            <strong style="font-size: 13px; color: #991b1b; display: block; margin-bottom: 2px;">
              DISTRESS BEACON: ${beacon.emergencyType}
            </strong>
            <div style="font-size: 11px; color: #334155; margin-bottom: 4px;">
              <strong>Caller / Group:</strong> ${beacon.senderName} (${beacon.peopleCount} People)<br/>
              <strong>Location:</strong> ${beacon.locationName}<br/>
              <strong>Contact:</strong> ${beacon.contact}
            </div>
            <div style="font-size: 10px; color: #475569; background: #fee2e2; padding: 4px; border-radius: 4px; margin-bottom: 4px;">
              "${beacon.notes}"
            </div>
            <div style="font-size: 9px; color: #64748b;">
              Logged: ${new Date(beacon.timestamp).toLocaleTimeString()}
            </div>
          </div>
        `;

        sosMarker.bindPopup(sosPopup);
        if (onSelectBeacon) {
          sosMarker.on('click', () => onSelectBeacon(beacon));
        }
        lg.addLayer(sosMarker);
      });
    }

    // 7. Impact Circles (e.g. from What-If Simulator)
    if (impactCircles.length > 0) {
      impactCircles.forEach(ic => {
        const circle = L.circle(ic.center, {
          radius: ic.radiusKm * 1000,
          color: ic.color,
          weight: 2,
          dashArray: '6, 6',
          fillColor: ic.fillColor || ic.color,
          fillOpacity: 0.18
        });
        if (ic.label) {
          circle.bindTooltip(ic.label, { permanent: true, direction: 'center', className: 'tactical-tooltip' });
        }
        lg.addLayer(circle);
      });
    }

    // 8. Evacuation Route Polyline
    if (routeCoordinates && routeCoordinates.length >= 2) {
      if (routePolylineRef.current) {
        mapInstanceRef.current.removeLayer(routePolylineRef.current);
      }
      const poly = L.polyline(routeCoordinates, {
        color: '#38bdf8',
        weight: 5,
        dashArray: '8, 8',
        opacity: 0.95
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = poly;
      mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [50, 50] });
    } else if (routePolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

  }, [
    alerts,
    shelters,
    realWorldDisasters,
    distressBeacons,
    sensors,
    impactCircles,
    showShelters,
    showAlerts,
    showRealWorld,
    showDistress,
    showSensors,
    showImpactRadius,
    filterCategory,
    filterSeverity,
    routeCoordinates,
    center[0],
    center[1]
  ]);

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(center, 4);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950" style={{ height }}>
      {/* Top Map Floating Layer Selector */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-700/80 p-1.5 rounded-xl shadow-2xl text-xs pointer-events-auto">
        <span className="text-[10px] font-mono text-slate-400 uppercase px-2 font-bold flex items-center gap-1">
          <Globe className="w-3 h-3 text-cyan-400" />
          Map Style:
        </span>
        <button
          onClick={() => setCurrentBaseLayer('satellite')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentBaseLayer === 'satellite'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          🛰️ Real Satellite
        </button>
        <button
          onClick={() => setCurrentBaseLayer('dark')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentBaseLayer === 'dark'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          🌑 Tactical Dark
        </button>
        <button
          onClick={() => setCurrentBaseLayer('streets')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentBaseLayer === 'streets'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          🗺️ Street Map
        </button>
        <button
          onClick={() => setCurrentBaseLayer('topo')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            currentBaseLayer === 'topo'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          ⛰️ Topo Relief
        </button>
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
        {showLiveRadar && (
          <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 backdrop-blur border border-emerald-500/50 text-emerald-300 text-xs shadow-xl flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span className="font-mono text-[10px] font-bold">RainViewer Radar ON</span>
          </div>
        )}
        <button
          onClick={handleFitAll}
          className="p-2 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs shadow-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Zoom to Global Scope"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono text-[11px]">Global Scope</span>
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs max-w-sm pointer-events-auto">
        <div className="font-bold text-[11px] text-white uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            Live Geospatial Radar Legend
          </span>
          <span className="text-[9px] text-emerald-400 font-mono font-bold">Real-World Feeds</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[8px] text-white font-mono font-bold">⚡</span>
            <span className="text-slate-200">USGS Quake / Seismic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[8px] text-white font-mono font-bold">🌀</span>
            <span className="text-slate-200">Tropical Cyclone Track</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-white flex items-center justify-center text-[8px] text-white font-mono font-bold">🔥</span>
            <span className="text-slate-200">NASA FIRMS Wildfire</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-[8px] text-white font-mono">📡</span>
            <span className="text-emerald-400 font-semibold">IoT Sensor Network</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-sky-600 text-[8px] flex items-center justify-center text-white border border-white">🏠</span>
            <span className="text-sky-300">Safe Refuge Shelter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-[7px] font-mono font-black flex items-center justify-center text-white border border-white animate-pulse">SOS</span>
            <span className="text-rose-400 font-semibold">Civilian Distress Beacon</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>Dashed Rings = Impact Radius</span>
          <span>Esri &bull; USGS &bull; RainViewer</span>
        </div>
      </div>
    </div>
  );
};
