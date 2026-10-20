import { useState, useEffect } from 'react';
import { routeAPI } from '../api';
import { Plus, Edit2, Trash2, X, Save, Search, Route, CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react';

const EMPTY_FORM = { nameBn: '', nameEn: '' };

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRoute, setEditRoute] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // The backend answers conflicts (duplicate names, still-in-use deletes) with
  // a message worth showing; anything else falls back to a generic line.
  const reportError = (err, fallback) =>
    setError(err?.response?.data?.message || fallback);

  const load = () => {
    routeAPI.getAll()
      .then(res => setRoutes(res.data))
      .catch(err => setError(
        `Could not load the routes from the server${err?.response?.status
          ? ` (HTTP ${err.response.status})`
          : ''}`
      ))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editRoute) {
        await routeAPI.update(editRoute.id, form);
      } else {
        await routeAPI.create(form);
      }
      closeForm();
      load();
    } catch (err) {
      reportError(err, 'Could not save the route');
    }
  };

  const handleEdit = (route) => {
    setEditRoute(route);
    setForm({ nameBn: route.nameBn, nameEn: route.nameEn });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditRoute(null);
    setForm(EMPTY_FORM);
  };

  const handleToggle = async (id) => {
    setError('');
    try { await routeAPI.toggle(id); load(); }
    catch (err) { reportError(err, 'Could not update the route'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This is only allowed when no bus uses it — otherwise deactivate it instead.`)) return;
    setError('');
    try { await routeAPI.delete(id); load(); }
    catch (err) { reportError(err, 'Could not delete the route'); }
  };

  const q = search.toLowerCase();
  const filtered = routes.filter(r =>
    [r.nameBn, r.nameEn].some(v => v && v.toLowerCase().includes(q))
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-200 border-t-emerald-600" /></div>;

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-500 mt-1">
            {routes.length} routes ({routes.filter(r => r.isActive).length} active, {routes.filter(r => !r.isActive).length} retired)
          </p>
        </div>
        <button onClick={() => { closeForm(); setError(''); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search routes..."
            className="input-field pl-10" />
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{editRoute ? 'Edit Route' : 'Add New Route'}</h3>
              <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Route Name (Bangla) *</label>
                <input value={form.nameBn} onChange={e => setForm({ ...form, nameBn: e.target.value })} required
                  className="input-field" placeholder="যেমন: কান্দিরপাড় → ক্যাম্পাস" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Route Name (English) *</label>
                <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} required
                  className="input-field" placeholder="e.g. Kandirpar → Campus" />
                <p className="text-xs text-gray-400 mt-1">Use "→" between stops, e.g. Kandirpar → Policeline → Campus</p>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editRoute ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['Route (Bangla)', 'Route (English)', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(route => (
                <tr key={route.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="font-semibold text-gray-900">{route.nameBn}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{route.nameEn}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${route.isActive ? 'badge-green' : 'badge-red'}`}>
                      {route.isActive ? 'Active' : 'Retired'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(route)} className="btn-icon hover:bg-teal-50 text-emerald-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleToggle(route.id)}
                        className={`btn-icon ${route.isActive ? 'hover:bg-green-50 text-green-600' : 'hover:bg-red-50 text-red-600'}`}
                        title={route.isActive ? 'Deactivate (hide from bus assignment)' : 'Re-activate'}>
                        {route.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(route.id, route.nameEn)} className="btn-icon hover:bg-red-50 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No routes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
