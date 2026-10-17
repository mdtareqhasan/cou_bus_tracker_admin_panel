import { useState, useEffect } from 'react';
import { teacherAPI } from '../api';
import { CheckCircle, X, XCircle, Search, Users, Eye, Trash2 } from 'lucide-react';
import IdCardThumb from '../components/IdCardThumb';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewCard, setViewCard] = useState(null);

  const load = () => {
    teacherAPI.getAll().then(res => setTeachers(res.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Verification is no longer an admin action: it follows automatically from
  // department/employee ID/designation being filled in during registration.
  const handleToggle = async (id) => { await teacherAPI.toggleActive(id); load(); };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"? This will permanently remove their account and ID card image.`)) return;
    await teacherAPI.delete(id);
    load();
  };

  const filtered = (filter === 'pending' ? teachers.filter(t => !t.isVerified)
    : filter === 'verified' ? teachers.filter(t => t.isVerified)
    : teachers
  ).filter(t => {
    const q = search.toLowerCase();
    // Every field is optional until registration completes, so guard them all.
    return [t.name, t.email, t.teacherId, t.designation, t.department]
      .some(value => value && value.toLowerCase().includes(q));
  });

  const filters = [
    { key: 'all', label: 'All', count: teachers.length },
    { key: 'pending', label: 'Pending', count: teachers.filter(t => !t.isVerified).length },
    { key: 'verified', label: 'Verified', count: teachers.filter(t => t.isVerified).length },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-200 border-t-emerald-600" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
        <p className="text-gray-500 mt-1">{teachers.length} registered teachers</p>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          {filters.map(({ key, label, count }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`filter-btn flex items-center gap-2 ${filter === key ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
              {label}
              <span className={`px-1.5 py-0.5 rounded-md text-xs ${filter === key ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..."
            className="input-field pl-10 max-w-xs" />
        </div>
      </div>

      {viewCard && <div className="modal-overlay" onClick={() => setViewCard(null)}><div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between p-6 border-b border-gray-100"><h3 className="text-xl font-bold text-gray-900">Teacher ID Card — {viewCard.name}</h3><button onClick={() => setViewCard(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button></div><div className="p-6">{viewCard.idCardImageUrl ? <img src={viewCard.idCardImageUrl} alt="Teacher ID Card" className="w-full rounded-xl border border-gray-100 shadow-sm" /> : <p className="text-center py-12 text-gray-400">No ID card uploaded</p>}</div></div></div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['Teacher', 'Email', 'Employee ID', 'Designation', 'Department', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(teacher => (
                <tr key={teacher.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <IdCardThumb
                        url={teacher.idCardImageUrl}
                        name={teacher.name}
                        onOpen={() => setViewCard(teacher)}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{teacher.name}</p>
                        <p className="text-xs text-gray-400 truncate">{teacher.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{teacher.email || '-'}</td>
                  <td className="px-6 py-4 font-mono text-gray-700">{teacher.teacherId || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{teacher.designation || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{teacher.department || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${teacher.isVerified ? 'badge-green' : 'badge-yellow'}`}>
                      {teacher.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    {!teacher.isVerified && (
                      <span className="block mt-1 text-xs text-orange-500">Registration incomplete</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {teacher.idCardImageUrl && <button onClick={() => setViewCard(teacher)} className="btn-icon hover:bg-teal-50 text-emerald-600" title="View ID Card"><Eye className="w-4 h-4" /></button>}
                      <button onClick={() => handleToggle(teacher.id)} className={`btn-icon ${teacher.isActive ? 'hover:bg-green-50 text-green-600' : 'hover:bg-red-50 text-red-600'}`}>
                        {teacher.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(teacher.id, teacher.name)} className="btn-icon hover:bg-red-50 text-red-600" title="Delete teacher">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400 font-medium">No teachers found</p></div>
        )}
      </div>
    </div>
  );
}
