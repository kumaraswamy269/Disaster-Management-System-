import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AlertItem, ShelterItem } from '../types';

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  alerts?: AlertItem[];
  shelters?: ShelterItem[];
  selectedLocationName?: string;
  routeCoordinates?: [number, number][]; // origin to destination
  filterCategory?: string;
  filterSeverity?: string;
  showShelters?: boolean;
  showAlerts?: boolean;
  onSelectAlert?: (alert: AlertItem) => void;
  onSelectShelter?: (shelter: ShelterItem) => void;
  height?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom = 6,
  alerts = [],
  shelters = [],
  selectedLocationName,
  routeCoordinates,
  filterCategory = 'All',
  filterSeverity = 'All',
  showShelters = true,
  showAlerts = true,
  onSelectAlert,
  onSelectShelter,
  height = '500px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

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

      // Dark tactical OpenStreetMap tiles using CartoDB Dark Matter / OSM
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('Map &copy; <a href="https://openstreetmap.org" target="_blank">OSM</a> | DisasterGuard AI')
        .addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Pan to center when updated
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom]);

  // Update Markers & Layers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const lg = layerGroupRef.current;
    lg.clearLayers();

    // 1. Current selected location radar marker
    const userLocationIcon = L.divIcon({
      className: 'custom-user-icon',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; inset: 0; background: rgba(59, 130, 246, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; background: #2563eb; border: 2px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 10px rgba(37,99,235,0.8);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const userMarker = L.marker(center, { icon: userLocationIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
          <strong style="color: #1e3a8a;">Selected Operations Focus:</strong><br/>
          <span>${selectedLocationName || 'Active Coordinates'}</span><br/>
          <span style="font-size: 10px; color: #64748b; font-family: monospace;">[${center[0].toFixed(4)}, ${center[1].toFixed(4)}]</span>
        </div>
      `);
    lg.addLayer(userMarker);

    // 2. Alert Markers
    if (showAlerts) {
      alerts
        .filter(a => filterCategory === 'All' || a.category === filterCategory)
        .filter(a => filterSeverity === 'All' || a.severity === filterSeverity)
        .forEach(alert => {
          const color = 
            alert.severity === 'Extreme' ? '#dc2626' :
            alert.severity === 'High' ? '#ea580c' :
            alert.severity === 'Moderate' ? '#d97706' : '#16a34a';

          const iconSvg = `
            <div style="
              width: 30px; height: 30px; border-radius: 50%;
              background: ${color}; border: 2px solid #ffffff;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
              display: flex; align-items: center; justify-content: center;
              color: white; font-weight: bold; font-size: 11px;
            ">
              !
            </div>
          `;

          const alertIcon = L.divIcon({
            className: 'custom-alert-icon',
            html: iconSvg,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const marker = L.marker(alert.coordinates, { icon: alertIcon });

          const popupContent = `
            <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; max-width: 240px; padding: 2px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase;">
                  ${alert.severity} • ${alert.category}
                </span>
                <span style="font-size: 9px; color: #64748b; font-family: monospace;">${alert.id}</span>
              </div>
              <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${alert.title}</strong>
              <div style="font-size: 11px; color: #334155; margin-bottom: 6px;">${alert.description}</div>
              <div style="font-size: 10px; color: #475569; background: #f1f5f9; padding: 4px; border-radius: 4px; margin-bottom: 4px;">
                <strong>Primary Action:</strong> ${alert.recommendedActions[0] || 'Follow official instructions.'}
              </div>
              <div style="font-size: 9px; color: #94a3b8; font-style: italic;">
                Source: ${alert.source} (${alert.isSimulated ? 'Demonstration Record' : 'Verified'})
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

    // 3. Shelter Markers
    if (showShelters) {
      shelters.forEach(shelter => {
        const isFull = shelter.status === 'Full';
        const shelterColor = isFull ? '#64748b' : '#0284c7';

        const shelterSvg = `
          <div style="
            width: 28px; height: 28px; border-radius: 8px;
            background: ${shelterColor}; border: 2px solid #ffffff;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 14px;
          ">
            🏠
          </div>
        `;

        const shelterIcon = L.divIcon({
          className: 'custom-shelter-icon',
          html: shelterSvg,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const shelterMarker = L.marker(shelter.coordinates, { icon: shelterIcon });

        const occupancyPercent = Math.round((shelter.occupancy / shelter.capacity) * 100);

        const shelterPopup = `
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; max-width: 240px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="background: ${shelterColor}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">
                ${shelter.status === 'Open' ? 'SAFE SHELTER OPEN' : 'SHELTER AT CAPACITY'}
              </span>
              <span style="font-size: 10px; font-weight: bold; color: #0369a1;">${occupancyPercent}% Occupied</span>
            </div>
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${shelter.name}</strong>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">${shelter.address}</div>
            <div style="font-size: 10px; color: #334155;">
              <strong>Capacity:</strong> ${shelter.occupancy} / ${shelter.capacity} evacuees
            </div>
            <div style="font-size: 10px; color: #334155; margin-bottom: 4px;">
              <strong>Contact:</strong> ${shelter.contact}
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

    // 4. Route Polyline (if provided)
    if (routeCoordinates && routeCoordinates.length >= 2) {
      if (routePolylineRef.current) {
        mapInstanceRef.current.removeLayer(routePolylineRef.current);
      }
      const poly = L.polyline(routeCoordinates, {
        color: '#38bdf8',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = poly;
      mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [50, 50] });
    } else if (routePolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

  }, [alerts, shelters, showShelters, showAlerts, filterCategory, filterSeverity, routeCoordinates, center[0], center[1]]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700 shadow-xl bg-slate-900" style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs max-w-xs pointer-events-auto">
        <div className="font-semibold text-[11px] text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Hazard Risk Legend</span>
          <span className="text-[9px] text-slate-500 font-mono">OpenStreetMap</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white/50" />
            <span className="text-slate-300">Extreme Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white/50" />
            <span className="text-slate-300">High Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white/50" />
            <span className="text-slate-300">Moderate Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white/50" />
            <span className="text-slate-300">Low Risk</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-slate-800">
            <span className="w-2.5 h-2.5 rounded bg-sky-500 border border-white/50 text-[8px] flex items-center justify-center text-white">🏠</span>
            <span className="text-sky-300">Designated Safe Shelter</span>
          </div>
        </div>
      </div>
    </div>
  );
};
