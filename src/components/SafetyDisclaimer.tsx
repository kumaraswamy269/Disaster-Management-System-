import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, PhoneCall, ExternalLink } from 'lucide-react';

export const SafetyDisclaimer: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Emergency Decision Support Notice" className="border-b border-amber-500/30 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 text-amber-200 text-xs px-4 py-2 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
          <p className="font-medium text-amber-100">
            <span className="font-semibold uppercase tracking-wider text-amber-400 mr-1.5">Official Safety Notice:</span>
            Decision-support & educational tool. In active emergencies, follow official local authorities and dial emergency dispatch (112 / 911).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-amber-300">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-xs underline underline-offset-2"
          >
            <span>{expanded ? 'Hide Details' : 'View Safety Protocols & Limitations'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <span className="text-amber-500/40">|</span>
          <div className="flex items-center gap-1 text-rose-300 font-mono font-semibold">
            <PhoneCall className="w-3 h-3 text-rose-400" />
            <span>Emergency: 112 / 911</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 leading-relaxed text-xs animate-in fade-in slide-in-from-top-1">
          <div className="bg-slate-900/80 p-2.5 rounded border border-amber-500/20">
            <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Decision-Support Scope
            </div>
            <p className="text-slate-400">
              Predictions, risk models, and weather forecasts represent statistical approximations. They do not constitute official evacuation mandates or guarantee complete safety.
            </p>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-amber-500/20">
            <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              No Auto-Dispatch Service
            </div>
            <p className="text-slate-400">
              This application does not automatically contact first responders, fire departments, or national coast guards. Always place a direct voice call to designated emergency helplines.
            </p>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-amber-500/20">
            <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              Verified Official Channels
            </div>
            <p className="text-slate-400">
              Cross-check alerts with your National Disaster Management Authority (NDMA), National Weather Service (NWS), or World Meteorological Organization (WMO) regional hubs.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
