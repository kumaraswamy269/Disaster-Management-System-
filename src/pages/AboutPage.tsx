import React from 'react';
import { 
  Info, 
  ShieldAlert, 
  Globe, 
  GraduationCap, 
  Cpu, 
  Database, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  BookOpen,
  Code
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            UN Sustainable Development Goals Alignment
          </span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          About DisasterGuard AI & UN SDG 13: Climate Action
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          An intelligent full-stack disaster prediction, continuous atmospheric monitoring, and emergency operations management system engineered to advance climate resilience and disaster risk reduction.
        </p>
      </div>

      {/* Academic Context & Project Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Specification & Capstone Profile</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Project Title:</span>
              <span className="font-semibold text-white">AI-Based Disaster Management System</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Program / Degree:</span>
              <span className="font-semibold text-white">BTech Computer Science and Engineering</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Specialization:</span>
              <span className="font-semibold text-white">Artificial Intelligence & Machine Learning (AI/ML)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Primary Objective:</span>
              <span className="font-semibold text-emerald-400">Decision-Support & Spatial Wayfinding</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Globe className="w-4 h-4" />
            <span>United Nations SDG 13 Alignment</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This platform specifically targets:
          </p>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li>
              <strong>Target 13.1:</strong> Strengthen resilience and adaptive capacity to climate-related hazards and natural disasters across vulnerable human settlements.
            </li>
            <li>
              <strong>Target 13.3:</strong> Improve education, awareness-raising, and human and institutional capacity on climate change mitigation, adaptation, and early warning.
            </li>
          </ul>
        </div>
      </div>

      {/* System Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <Cpu className="w-4 h-4 text-sky-400" />
          Technical Architecture & Data Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-sky-400 uppercase font-mono text-[10px]">1. Ingestion Tier</div>
            <div className="font-semibold text-white">Atmospheric Telemetry</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Open-Meteo REST service provides live surface observations, relative humidity, pressure, wind gusts, and 7-day NWP precipitation forecasts.
            </p>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-rose-400 uppercase font-mono text-[10px]">2. Analytical Tier</div>
            <div className="font-semibold text-white">Multi-Hazard Risk Engine</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Domain physics formulas evaluate flash floods, cyclonic storm surges, fire weather indices, and landslide soil saturation thresholds.
            </p>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-teal-400 uppercase font-mono text-[10px]">3. Intelligence Tier</div>
            <div className="font-semibold text-white">Google Gemini API</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Server-side Gemini 3.8-Flash model generates contextual disaster preparedness recommendations and conversational go-bag checklists.
            </p>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400 uppercase font-mono text-[10px]">4. Spatial Tier</div>
            <div className="font-semibold text-white">GIS & Leaflet Engine</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              OpenStreetMap and CartoDB vector layers visualize hazard radiuses, safe shelters, and evacuation corridor routing vectors.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations & Physics Scoring */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Hazard Risk Scoring Formulations
        </h2>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <div className="font-semibold text-white mb-1">Flood Risk Formulation (Hydrological Index):</div>
            <div className="font-mono text-[11px] text-sky-300 bg-slate-900 p-2 rounded border border-slate-800 mb-1">
              R_flood = 0.40 × (P_obs / 120mm) + 0.30 × (P_fcst / 80mm) + 0.20 × (S_moisture / 100%) + 0.10 × H_recurrence
            </div>
            <p className="text-[11px] text-slate-400">
              Reflects Antecedent Precipitation Index (API), runoff coefficients, and soil infiltration capacity.
            </p>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <div className="font-semibold text-white mb-1">Cyclone Severity Formula (Vorticity & Convection):</div>
            <div className="font-mono text-[11px] text-rose-300 bg-slate-900 p-2 rounded border border-slate-800 mb-1">
              R_cyclone = 0.50 × (V_wind / 160km/h) + 0.25 × (P_precip / 100mm) + 0.15 × (RH / 100%) + 0.10 × H_recurrence
            </div>
            <p className="text-[11px] text-slate-400">
              Scales sustained wind speeds and cyclonic barometric pressure drops into standardized 0–100 index values.
            </p>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <div className="font-semibold text-white mb-1">Wildfire Threat (Fire Weather Index Approximation):</div>
            <div className="font-mono text-[11px] text-orange-300 bg-slate-900 p-2 rounded border border-slate-800 mb-1">
              R_fire = 0.30 × ((T - 20°C) / 25°C) + 0.25 × (V_wind / 60km/h) + 0.25 × ((60% - RH) / 50%) + 0.20 × F_dryness
            </div>
            <p className="text-[11px] text-slate-400">
              Assesses fine fuel moisture depletion, ambient thermal stress, and atmospheric vapor pressure deficits.
            </p>
          </div>
        </div>
      </div>

      {/* Ethical Boundaries & Decision-Support Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>Ethical Principles & Decision-Support Boundaries</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In compliance with ethical AI principles and international humanitarian software standards:
        </p>
        <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
          <li><strong>Zero Fabrication:</strong> Demonstration records are explicitly marked as simulations; real meteorological observations are fetched live without falsification.</li>
          <li><strong>No Automated 911/112 Dispatch:</strong> The system acts as decision-support intelligence and cannot automatically dispatch emergency services.</li>
          <li><strong>Human-in-the-Loop:</strong> Emergency managers and civil defense personnel verify all official alerts before broad distribution.</li>
          <li><strong>API Privacy & Protection:</strong> All external API keys and secrets reside strictly server-side, protected from client-side interception.</li>
        </ul>
      </div>
    </div>
  );
};
