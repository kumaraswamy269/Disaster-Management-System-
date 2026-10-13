import React, { useState } from 'react';
import { 
  Home, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Users, 
  CheckCircle2, 
  Accessibility, 
  ShieldCheck, 
  ExternalLink,
  Edit2,
  Save,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ShelterItem, UserRole } from '../types';
import { API } from '../services/api';

interface SheltersPageProps {
  shelters: ShelterItem[];
  currentUserRole: UserRole;
  onRefreshShelters: () => void;
  onNavigateTab: (tab: any) => void;
}

export const SheltersPage: React.FC<SheltersPageProps> = ({
  shelters,
  currentUserRole,
  onRefreshShelters,
  onNavigateTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterAccessibleOnly, setFilterAccessibleOnly] = useState<boolean>(false);

  // Edit Occupancy State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOccupancy, setNewOccupancy] = useState<number>(0);

  // Create Shelter Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [capacity, setCapacity] = useState(500);
  const [facilitiesText, setFacilitiesText] = useState('Drinking Water, Backup Power, Medical First Aid');
  const [accessibility, setAccessibility] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canManage = currentUserRole === 'Administrator' || currentUserRole === 'Disaster Manager';

  const filteredShelters = shelters.filter(s => {
    if (filterStatus !== 'All' && s.status !== filterStatus) return false;
    if (filterAccessibleOnly && !s.accessibility) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    }
    return true;
  });

  const handleStartEdit = (s: ShelterItem) => {
    setEditingId(s.id);
    setNewOccupancy(s.occupancy);
  };

  const handleSaveOccupancy = async (id: string) => {
    try {
      await API.updateShelterOccupancy(id, newOccupancy);
      setEditingId(null);
      onRefreshShelters();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    setSubmitting(true);
    try {
      await API.createShelter({
        name: name.trim(),
        address: address.trim(),
        contact: contact.trim() || '+1 (555) 019-9000',
        capacity: Number(capacity) || 500,
        facilities: facilitiesText.split(',').map(f => f.trim()).filter(Boolean),
        accessibility,
        coordinates: [20.5937, 78.9629]
      });
      setShowAddModal(false);
      setName('');
      setAddress('');
      setContact('');
      onRefreshShelters();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
              Emergency Logistics Network
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">Disaster Shelter Registry</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Home className="w-6 h-6 text-sky-400" />
            Designated Safe Evacuation Shelters Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time capacity tracking, facility inventories, and accessibility metrics for community refuge centers.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xs transition-all shadow-lg shadow-sky-950/40 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Safe Shelter</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search shelters by name, landmark, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Operational / Open</option>
            <option value="Full">At Capacity / Full</option>
            <option value="Standby">Standby</option>
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-850 border border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={filterAccessibleOnly}
              onChange={(e) => setFilterAccessibleOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <Accessibility className="w-3.5 h-3.5 text-sky-400" />
              Wheelchair Accessible
            </span>
          </label>
        </div>
      </div>

      {/* Shelter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShelters.map((shelter) => {
          const occupancyRate = Math.round((shelter.occupancy / shelter.capacity) * 100);
          const isFull = shelter.status === 'Full' || occupancyRate >= 100;

          return (
            <div
              key={shelter.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-3 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      isFull 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {shelter.status === 'Open' ? 'OPERATIONAL' : shelter.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{shelter.id}</span>
                    {shelter.accessibility && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                        <Accessibility className="w-3 h-3" />
                        Accessible
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{shelter.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{shelter.address}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('evacuation')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Plan Evacuation Route to this Shelter"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Route</span>
                </button>
              </div>

              {/* Occupancy Progress Gauge */}
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Occupancy Load:</span>
                    <strong className="text-white font-mono">{shelter.occupancy} / {shelter.capacity}</strong>
                  </div>
                  <span className={`font-mono font-bold text-xs ${
                    occupancyRate >= 90 ? 'text-rose-400' :
                    occupancyRate >= 60 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {occupancyRate}%
                  </span>
                </div>

                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occupancyRate >= 90 ? 'bg-rose-500' :
                      occupancyRate >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, occupancyRate)}%` }}
                  />
                </div>

                {/* Edit Occupancy for Manager */}
                {canManage && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    {editingId === shelter.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="number"
                          min="0"
                          max={shelter.capacity * 2}
                          value={newOccupancy}
                          onChange={(e) => setNewOccupancy(Number(e.target.value))}
                          className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                        />
                        <button
                          onClick={() => handleSaveOccupancy(shelter.id)}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-slate-400 hover:text-white text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(shelter)}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Update Current Occupancy Count</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Facilities Chips */}
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Available Facilities & Logistics
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {shelter.facilities.map((fac, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact & Verification Footer */}
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3 h-3 text-sky-400" />
                  <span>{shelter.contact}</span>
                </div>
                <div>Verified: {new Date(shelter.lastVerified).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Shelter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Register Safe Refuge Shelter</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShelter} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Shelter Facility Name</label>
                <input
                  type="text"
                  placeholder="e.g. Government Higher Secondary Relief Camp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Physical Address / Sector Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 12, Station Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Evacuee Capacity</label>
                  <input
                    type="number"
                    min="50"
                    max="10000"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Desk Contact</label>
                  <input
                    type="text"
                    placeholder="+91 6752 222100"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Facilities Available (Comma Separated)</label>
                <input
                  type="text"
                  value={facilitiesText}
                  onChange={(e) => setFacilitiesText(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={accessibility}
                  onChange={(e) => setAccessibility(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0"
                />
                <span>Wheelchair ramps and accessible sanitation verified</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Registering...' : 'Add Shelter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
