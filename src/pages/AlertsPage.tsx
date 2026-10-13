import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  Check, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  FileText,
  Search
} from 'lucide-react';
import { AlertItem, DisasterCategory, SeverityLevel, UserRole } from '../types';
import { API } from '../services/api';

interface AlertsPageProps {
  alerts: AlertItem[];
  currentUserRole: UserRole;
  onRefreshAlerts: () => void;
  selectedAlert?: AlertItem | null;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  currentUserRole,
  onRefreshAlerts,
  selectedAlert
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for New Alert
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DisasterCategory>('Flood');
  const [newSeverity, setNewSeverity] = useState<SeverityLevel>('High');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActions, setNewActions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active view modal
  const [viewingAlert, setViewingAlert] = useState<AlertItem | null>(selectedAlert || null);

  const canManageAlerts = currentUserRole === 'Administrator' || currentUserRole === 'Disaster Manager';

  // Filter Alerts
  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'All' && a.severity !== filterSeverity) return false;
    if (filterCategory !== 'All' && a.category !== filterCategory) return false;
    if (filterStatus !== 'All' && a.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.location.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLocation.trim()) return;

    setSubmitting(true);
    try {
      await API.createAlert({
        title: newTitle.trim(),
        category: newCategory,
        severity: newSeverity,
        location: newLocation.trim(),
        description: newDescription.trim() || 'Urgent civil protection advisory.',
        coordinates: [20.5937, 78.9629],
        source: `${currentUserRole} Operational Notice`,
        recommendedActions: newActions.split('\n').filter(a => a.trim().length > 0)
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewLocation('');
      setNewDescription('');
      setNewActions('');
      onRefreshAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await API.acknowledgeAlert(id);
      onRefreshAlerts();
      if (viewingAlert && viewingAlert.id === id) {
        setViewingAlert({ ...viewingAlert, status: 'Acknowledged' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await API.resolveAlert(id);
      onRefreshAlerts();
      if (viewingAlert && viewingAlert.id === id) {
        setViewingAlert({ ...viewingAlert, status: 'Resolved' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (currentUserRole !== 'Administrator') return;
    try {
      await API.deleteAlert(id);
      onRefreshAlerts();
      if (viewingAlert && viewingAlert.id === id) {
        setViewingAlert(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
              Emergency Operations Center
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">Incident Dispatch Protocol</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            Emergency Alert Management & Distribution
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Issuance, acknowledgement, and lifecycle resolution of high-priority climate risk bulletins.
          </p>
        </div>

        {canManageAlerts && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs transition-all shadow-lg shadow-rose-950/40 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast New Alert</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by title, region, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Severities</option>
            <option value="Extreme">Extreme</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Hazards</option>
            <option value="Flood">Flood</option>
            <option value="Cyclone">Cyclone</option>
            <option value="Wildfire">Wildfire</option>
            <option value="Drought">Drought</option>
            <option value="Heatwave">Heatwave</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500/50 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No Emergency Alerts Matching Filter</h3>
            <p className="text-xs text-slate-400 mt-1">
              All regional monitoring stations are operating within standard parameters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all ${
                alert.status === 'Active' 
                  ? 'border-slate-800 hover:border-slate-700' 
                  : 'border-slate-850 opacity-80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      alert.severity === 'Extreme' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      alert.severity === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                      alert.severity === 'Moderate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {alert.severity} • {alert.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{alert.id}</span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {alert.location}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      alert.status === 'Active' ? 'bg-rose-950/40 text-rose-400 border-rose-500/30' :
                      alert.status === 'Acknowledged' ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' :
                      'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    }`}>
                      Status: {alert.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {alert.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {alert.description}
                  </p>

                  {/* Recommended Action Pill */}
                  {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/60 text-xs text-slate-200">
                      <span className="font-semibold text-amber-400 uppercase text-[10px] block mb-0.5">
                        Immediate Action Directive:
                      </span>
                      <span>{alert.recommendedActions[0]}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 font-mono flex flex-wrap gap-x-4 gap-y-1 pt-1">
                    <span>Issued: {new Date(alert.issuedAt).toLocaleString()}</span>
                    <span>Source: {alert.source}</span>
                    <span>Record Type: {alert.isSimulated ? 'Demonstration Notice' : 'Verified Incident'}</span>
                  </div>
                </div>

                {/* Action Buttons for Incident Control */}
                {canManageAlerts && (
                  <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                    {alert.status === 'Active' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Mark alert as acknowledged by command"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {alert.status !== 'Resolved' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Mark emergency hazard as resolved"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve Alert</span>
                      </button>
                    )}

                    {currentUserRole === 'Administrator' && (
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Archive and purge record (Administrator Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-white">Issue Emergency Incident Bulletin</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Alert Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Flash Flood Inundation Warning"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Disaster Hazard</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DisasterCategory)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Flood">Flood</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Wildfire">Wildfire</option>
                    <option value="Drought">Drought</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Heatwave">Heatwave</option>
                    <option value="Severe Storm">Severe Storm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Severity Classification</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as SeverityLevel)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Extreme">Extreme Risk (Level 4)</option>
                    <option value="High">High Risk (Level 3)</option>
                    <option value="Moderate">Moderate (Level 2)</option>
                    <option value="Low">Low Precaution (Level 1)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Location / Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Guwahati District Lowlands, Assam"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Situation Narrative</label>
                <textarea
                  rows={3}
                  placeholder="Describe observed conditions, river levels, wind gust speeds..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recommended Citizen Actions (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="Move to elevated shelter&#10;Switch off main electrical panel"
                  value={newActions}
                  onChange={(e) => setNewActions(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Publishing...' : 'Dispatch Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
