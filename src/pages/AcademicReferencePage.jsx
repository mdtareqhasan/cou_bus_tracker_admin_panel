import { useState, useEffect } from 'react';
import { academicAPI } from '../api';
import {
  Plus, Edit2, Trash2, X, Save, Search, Building2, CalendarRange,
  CheckCircle, XCircle, AlertCircle, GraduationCap,
} from 'lucide-react';

// Unit types match the backend vocabulary (DEPARTMENT / OFFICE).
const TYPE_BADGE = {
  DEPARTMENT: { label: 'Department', className: 'badge-blue' },
  OFFICE: { label: 'Office', className: 'badge-purple' },
};

const EMPTY_UNIT_FORM = { unitType: 'DEPARTMENT', nameBn: '', nameEn: '', sortOrder: 1 };
const EMPTY_SESSION_FORM = { nameBn: '', nameEn: '', sortOrder: 1 };

export default function AcademicReferencePage() {
  const [units, setUnits] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('units');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [unitForm, setUnitForm] = useState(EMPTY_UNIT_FORM);
  const [editUnit, setEditUnit] = useState(null);
  const [showUnitForm, setShowUnitForm] = useState(false);

  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION_FORM);
  const [editSession, setEditSession] = useState(null);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const [error, setError] = useState('');

  // The backend answers conflicts (duplicate names, still-in-use deletes) with a
  // message worth showing; anything else falls back to a generic line.
  const reportError = (err, fallback) =>
    setError(err?.response?.data?.message || fallback);

  const load = () => {
    Promise.all([academicAPI.getAllUnits(), academicAPI.getAllSessions()])
      .then(([u, s]) => { setUnits(u.data); setSessions(s.data); })
      // Never fail silently: an empty table with no explanation reads as
      // "there is no data" when the real problem is a failed request.
      .catch(err => setError(
        `Could not load the academic options from the server${err?.response?.status
          ? ` (HTTP ${err.response.status})`
          : ''}`
      ))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // ---- Units (departments / offices) ---------------------------------------

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editUnit) {
        await academicAPI.updateUnit(editUnit.id, unitForm);
      } else {
        await academicAPI.createUnit(unitForm);
      }
      closeUnitForm();
      load();
    } catch (err) {
      reportError(err, 'Could not save the option');
    }
  };

  const handleUnitEdit = (unit) => {
    setEditUnit(unit);
    setUnitForm({
      unitType: unit.type,
      nameBn: unit.labelBn,
      nameEn: unit.labelEn,
      sortOrder: unit.sortOrder,
    });
    setError('');
    setShowUnitForm(true);
  };

  const closeUnitForm = () => {
    setShowUnitForm(false);
    setEditUnit(null);
    setUnitForm(EMPTY_UNIT_FORM);
  };

  const handleUnitToggle = async (id) => {
    setError('');
    try { await academicAPI.toggleUnit(id); load(); }
    catch (err) { reportError(err, 'Could not update the option'); }
  };

  const handleUnitDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This is only allowed when no student or teacher uses it — otherwise deactivate it instead.`)) return;
    setError('');
    try { await academicAPI.deleteUnit(id); load(); }
    catch (err) { reportError(err, 'Could not delete the option'); }
  };

  // ---- Sessions -------------------------------------------------------------

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editSession) {
        await academicAPI.updateSession(editSession.id, sessionForm);
      } else {
        await academicAPI.createSession(sessionForm);
      }
      closeSessionForm();
      load();
    } catch (err) {
      reportError(err, 'Could not save the session');
    }
  };

  const handleSessionEdit = (session) => {
    setEditSession(session);
    setSessionForm({
      nameBn: session.labelBn,
      nameEn: session.labelEn,
      sortOrder: session.sortOrder,
    });
    setError('');
    setShowSessionForm(true);
  };

  const closeSessionForm = () => {
    setShowSessionForm(false);
    setEditSession(null);
    setSessionForm(EMPTY_SESSION_FORM);
  };

  const handleSessionToggle = async (id) => {
    setError('');
    try { await academicAPI.toggleSession(id); load(); }
    catch (err) { reportError(err, 'Could not update the session'); }
  };

  const handleSessionDelete = async (id, name) => {
    if (!confirm(`Delete session "${name}"? This is only allowed when no student uses it — otherwise deactivate it instead.`)) return;
    setError('');
    try { await academicAPI.deleteSession(id); load(); }
    catch (err) { reportError(err, 'Could not delete the session'); }
  };

  // ---- Filtering ------------------------------------------------------------

  const q = search.toLowerCase();
  const filteredUnits = units
    .filter(u => typeFilter === 'all' || u.type === typeFilter)
    .filter(u => [u.labelBn, u.labelEn].some(v => v && v.toLowerCase().includes(q)));
  const filteredSessions = sessions
    .filter(s => [s.labelBn, s.labelEn].some(v => v && v.toLowerCase().includes(q)));

  const unitFilters = [
    { key: 'all', label: 'All', count: units.length },
    { key: 'DEPARTMENT', label: 'Departments', count: units.filter(u => u.type === 'DEPARTMENT').length },
    { key: 'OFFICE', label: 'Offices', count: units.filter(u => u.type === 'OFFICE').length },
  ];

  const tabs = [
    { key: 'units', label: 'Departments & Offices', count: units.length },
    { key: 'sessions', label: 'Sessions', count: sessions.length },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-200 border-t-emerald-600" /></div>;

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Department, Offices and Sessions</h1>
          <p className="text-gray-500 mt-1">
            Dropdown options for registration — {units.filter(u => u.type === 'DEPARTMENT').length} departments,{' '}
            {units.filter(u => u.type === 'OFFICE').length} offices, {sessions.length} sessions
          </p>
        </div>
        {tab === 'units' ? (
          <button onClick={() => { closeUnitForm(); setError(''); setShowUnitForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Option
          </button>
        ) : (
          <button onClick={() => { closeSessionForm(); setError(''); setShowSessionForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Session
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`filter-btn flex items-center gap-2 ${tab === key ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
            {label}
            <span className={`px-1.5 py-0.5 rounded-md text-xs ${tab === key ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search & type filter */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        {tab === 'units' && (
          <div className="flex gap-2 flex-wrap">
            {unitFilters.map(({ key, label, count }) => (
              <button key={key} onClick={() => setTypeFilter(key)}
                className={`filter-btn flex items-center gap-2 ${typeFilter === key ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
                {label}
                <span className={`px-1.5 py-0.5 rounded-md text-xs ${typeFilter === key ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'units' ? 'Search options...' : 'Search sessions...'}
            className="input-field pl-10 max-w-xs" />
        </div>
      </div>

      {/* Unit modal form */}
      {showUnitForm && (
        <div className="modal-overlay" onClick={closeUnitForm}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{editUnit ? 'Edit Option' : 'Add Department or Office'}</h3>
              <button onClick={closeUnitForm} className="p-2 rounded-xl hover:bg-gray-100 transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleUnitSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                <select value={unitForm.unitType} onChange={e => setUnitForm({ ...unitForm, unitType: e.target.value })} className="select-field">
                  <option value="DEPARTMENT">Department (students + teachers)</option>
                  <option value="OFFICE">Office (teachers only)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name (Bangla) *</label>
                <input value={unitForm.nameBn} onChange={e => setUnitForm({ ...unitForm, nameBn: e.target.value })} required
                  className="input-field" placeholder="যেমন: গণিত" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name (English) *</label>
                <input value={unitForm.nameEn} onChange={e => setUnitForm({ ...unitForm, nameEn: e.target.value })} required
                  className="input-field" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order *</label>
                <input type="number" min="0" value={unitForm.sortOrder}
                  onChange={e => setUnitForm({ ...unitForm, sortOrder: parseInt(e.target.value || '0', 10) })}
                  required className="input-field" />
                <p className="text-xs text-gray-400 mt-1">Position in the registration dropdown (lower shows first)</p>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={closeUnitForm} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editUnit ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session modal form */}
      {showSessionForm && (
        <div className="modal-overlay" onClick={closeSessionForm}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{editSession ? 'Edit Session' : 'Add Session'}</h3>
              <button onClick={closeSessionForm} className="p-2 rounded-xl hover:bg-gray-100 transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSessionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Session (English) *</label>
                <input value={sessionForm.nameEn} onChange={e => setSessionForm({ ...sessionForm, nameEn: e.target.value })} required
                  className="input-field" placeholder="e.g. 2026-2027" />
                <p className="text-xs text-gray-400 mt-1">The canonical value stored on student records</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Session (Bangla) *</label>
                <input value={sessionForm.nameBn} onChange={e => setSessionForm({ ...sessionForm, nameBn: e.target.value })} required
                  className="input-field" placeholder="যেমন: ২০২৬-২০২৭" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order *</label>
                <input type="number" min="0" value={sessionForm.sortOrder}
                  onChange={e => setSessionForm({ ...sessionForm, sortOrder: parseInt(e.target.value || '0', 10) })}
                  required className="input-field" />
                <p className="text-xs text-gray-400 mt-1">Position in the registration dropdown (lower shows first)</p>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={closeSessionForm} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editSession ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Units table */}
      {tab === 'units' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  {['Option', 'Type', 'Order', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUnits.map(unit => (
                  <tr key={unit.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{unit.labelBn}</p>
                          <p className="text-xs text-gray-500">{unit.labelEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${TYPE_BADGE[unit.type]?.className || 'badge-blue'}`}>
                        {TYPE_BADGE[unit.type]?.label || unit.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{unit.sortOrder}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${unit.active ? 'badge-green' : 'badge-red'}`}>
                        {unit.active ? 'Active' : 'Retired'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleUnitEdit(unit)} className="btn-icon hover:bg-teal-50 text-emerald-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleUnitToggle(unit.id)}
                          className={`btn-icon ${unit.active ? 'hover:bg-green-50 text-green-600' : 'hover:bg-red-50 text-red-600'}`}
                          title={unit.active ? 'Deactivate (hide from registration)' : 'Re-activate'}>
                          {unit.active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleUnitDelete(unit.id, unit.labelEn)} className="btn-icon hover:bg-red-50 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUnits.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No options found</p>
            </div>
          )}
        </div>
      )}

      {/* Sessions table */}
      {tab === 'sessions' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  {['Session', 'Order', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSessions.map(session => (
                  <tr key={session.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                          <CalendarRange className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{session.labelEn}</p>
                          <p className="text-xs text-gray-500">{session.labelBn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{session.sortOrder}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${session.active ? 'badge-green' : 'badge-red'}`}>
                        {session.active ? 'Active' : 'Retired'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSessionEdit(session)} className="btn-icon hover:bg-teal-50 text-emerald-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleSessionToggle(session.id)}
                          className={`btn-icon ${session.active ? 'hover:bg-green-50 text-green-600' : 'hover:bg-red-50 text-red-600'}`}
                          title={session.active ? 'Deactivate (hide from registration)' : 'Re-activate'}>
                          {session.active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleSessionDelete(session.id, session.labelEn)} className="btn-icon hover:bg-red-50 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No sessions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
