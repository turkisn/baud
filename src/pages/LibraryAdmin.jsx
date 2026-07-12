import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, BadgeCheck, Eye, Download, Pencil,
  Trash2, Filter, ChevronDown, X, ToggleLeft, ToggleRight, Home
} from 'lucide-react';
import { libraryModels, libraryCategories } from '../data/mockData';
import { fadeInUp, viewport } from '../utils/animations';

const FORMAT_COLOR = {
  RVT: '#0696D7', SKP: '#D73A0A', MAX: '#00A3E0',
  FBX: '#5A8A2A', OBJ: '#7B5EA7', DWG: '#C4302B',
};

function Badge({ label, color }) {
  return (
    <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded font-mono"
      style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

export default function LibraryAdmin() {
  const [models, setModels]   = useState(libraryModels);
  const [search, setSearch]   = useState('');
  const [catFilter, setCat]   = useState('all');
  const [sort, setSort]       = useState('dateAdded');
  const [editModal, setEdit]  = useState(null);
  const [deleteId, setDelId]  = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newModel, setNewM]   = useState({ nameEn: '', nameAr: '', category: 'furniture', format: 'RVT', isFree: true, verified: false });

  const stats = useMemo(() => ({
    total:    models.length,
    verified: models.filter(m => m.verified).length,
    free:     models.filter(m => m.isFree).length,
    views:    models.reduce((s, m) => s + m.views, 0),
    downloads:models.reduce((s, m) => s + m.downloads, 0),
  }), [models]);

  const filtered = useMemo(() => {
    let list = [...models];
    if (catFilter !== 'all') list = list.filter(m => m.category === catFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.nameEn.toLowerCase().includes(q) ||
        m.nameAr.includes(q) ||
        m.category.includes(q) ||
        m.format.toLowerCase().includes(q)
      );
    }
    if (sort === 'dateAdded')  list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    if (sort === 'views')      list.sort((a, b) => b.views - a.views);
    if (sort === 'downloads')  list.sort((a, b) => b.downloads - a.downloads);
    if (sort === 'name')       list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    return list;
  }, [models, catFilter, search, sort]);

  const toggleVerified = (id) =>
    setModels(prev => prev.map(m => m.id === id ? { ...m, verified: !m.verified } : m));
  const toggleFree = (id) =>
    setModels(prev => prev.map(m => m.id === id ? { ...m, isFree: !m.isFree } : m));
  const deleteModel = (id) => {
    setModels(prev => prev.filter(m => m.id !== id));
    setDelId(null);
  };

  const handleAdd = () => {
    if (!newModel.nameEn.trim()) return;
    const id = 'admin-' + Date.now();
    setModels(prev => [{
      ...newModel,
      id,
      descriptionEn: 'New model added via admin panel.',
      descriptionAr: 'موديل جديد أُضيف من لوحة الإدارة.',
      subCategory: '',
      formats: [newModel.format],
      softwareVersion: '2024',
      fileSize: '—',
      designer: 'BUAD Admin',
      keywords: [],
      views: 0,
      downloads: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      license: 'CC BY 4.0',
      licenseCommercial: true,
      licenseRedistribution: false,
      source: 'BUAD',
      colorHex: '#B68D57',
      availableFiles: [],
    }, ...prev]);
    setNewM({ nameEn: '', nameAr: '', category: 'furniture', format: 'RVT', isFree: true, verified: false });
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#1A1008' }}>

      {/* Top bar */}
      <div className="border-b" style={{ borderColor: '#3A2A18', background: '#2B1B0E' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition" style={{ color: '#B68D57' }}>
              <Home size={15} /> BUAD
            </Link>
            <span style={{ color: '#4A3A28' }}>/</span>
            <span className="text-white font-bold">Library Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/library" className="text-xs px-4 py-2 rounded-lg font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: '#3A2A18', color: '#B68D57' }}>
              View Library
            </Link>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-bold transition-all hover:opacity-90"
              style={{ background: '#B68D57', color: '#1A1008' }}>
              <Plus size={14} /> Add Model
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Models', value: stats.total },
            { label: 'Verified', value: stats.verified, color: '#B68D57' },
            { label: 'Free', value: stats.free, color: '#22c55e' },
            { label: 'Total Views', value: stats.views.toLocaleString() },
            { label: 'Downloads', value: stats.downloads.toLocaleString() },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4 border" style={{ background: '#2B1B0E', borderColor: '#3A2A18' }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#6A5A48' }}>{s.label}</div>
              <div className="text-2xl font-black" style={{ color: s.color || 'white' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 left-3" style={{ color: '#6A5A48' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:border-gold/40"
              style={{ background: '#2B1B0E', borderColor: '#3A2A18', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
          </div>

          <div className="relative">
            <select value={catFilter} onChange={e => setCat(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium border outline-none cursor-pointer"
              style={{ background: '#2B1B0E', borderColor: '#3A2A18', color: '#C4A882' }}>
              {libraryCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.labelEn}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" style={{ color: '#6A5A48' }} />
          </div>

          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium border outline-none cursor-pointer"
              style={{ background: '#2B1B0E', borderColor: '#3A2A18', color: '#C4A882' }}>
              <option value="dateAdded">Sort: Newest</option>
              <option value="views">Sort: Most Viewed</option>
              <option value="downloads">Sort: Most Downloaded</option>
              <option value="name">Sort: Name A–Z</option>
            </select>
            <ChevronDown size={12} className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" style={{ color: '#6A5A48' }} />
          </div>

          <span className="text-xs" style={{ color: '#6A5A48' }}>{filtered.length} models</span>
        </div>

        {/* Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#3A2A18' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#2B1B0E' }}>
                  {['Model', 'Category', 'Format', 'Views', 'Downloads', 'Free', 'Verified', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold" style={{ color: '#6A5A48' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const cat = libraryCategories.find(c => c.id === m.category);
                  const fc = FORMAT_COLOR[m.format] || '#888';
                  return (
                    <motion.tr key={m.id} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}
                      className="border-t transition-colors hover:opacity-80"
                      style={{ borderColor: '#3A2A18', background: i % 2 === 0 ? '#1A1008' : '#211408' }}>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-sm">{m.nameEn}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#8A7A68', fontFamily: 'Cairo, sans-serif' }}>{m.nameAr}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: '#C4A882' }}>{cat?.icon} {cat?.labelEn}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={m.format} color={fc} />
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#8A7A68' }}>
                        <span className="flex items-center gap-1"><Eye size={11} />{m.views.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#8A7A68' }}>
                        <span className="flex items-center gap-1"><Download size={11} />{m.downloads.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleFree(m.id)} title="Toggle free">
                          {m.isFree
                            ? <ToggleRight size={20} style={{ color: '#22c55e' }} />
                            : <ToggleLeft size={20} style={{ color: '#4A3A28' }} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleVerified(m.id)} title="Toggle verified">
                          {m.verified
                            ? <ToggleRight size={20} style={{ color: '#B68D57' }} />
                            : <ToggleLeft size={20} style={{ color: '#4A3A28' }} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6A5A48' }}>{m.dateAdded}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/library/${m.id}`} target="_blank"
                            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: '#3A2A18', color: '#C4A882' }}>
                            <Eye size={13} />
                          </Link>
                          <button onClick={() => setEdit(m)}
                            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: '#3A2A18', color: '#C4A882' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDelId(m.id)}
                            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: '#3A1008', color: '#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* License notice */}
        <div className="mt-6 rounded-xl p-4 border text-xs" style={{ background: '#2B1B0E', borderColor: '#B68D5730', color: '#8A7A68' }}>
          <span style={{ color: '#B68D57', fontWeight: 600 }}>License Notice: </span>
          All models listed here are either original BUAD assets or licensed for redistribution. Ensure license
          fields (commercial use, redistribution) are accurate before publishing. BUAD is not responsible for
          misuse of third-party models.
        </div>
      </div>

      {/* ── Add Model Modal ───────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl p-6 border"
            style={{ background: '#2B1B0E', borderColor: '#3A2A18' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Add New Model</h3>
              <button onClick={() => setShowAdd(false)} style={{ color: '#6A5A48' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Name (English)', key: 'nameEn', placeholder: 'e.g. Modern Sofa Set' },
                { label: 'Name (Arabic)', key: 'nameAr', placeholder: 'مثال: طقم أريكة حديث' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] uppercase tracking-widest mb-1.5 block" style={{ color: '#6A5A48' }}>{f.label}</label>
                  <input value={newModel[f.key]} onChange={e => setNewM(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
                    style={{ background: '#1A1008', borderColor: '#3A2A18', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest mb-1.5 block" style={{ color: '#6A5A48' }}>Category</label>
                  <select value={newModel.category} onChange={e => setNewM(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
                    style={{ background: '#1A1008', borderColor: '#3A2A18', color: '#C4A882' }}>
                    {libraryCategories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.labelEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest mb-1.5 block" style={{ color: '#6A5A48' }}>Format</label>
                  <select value={newModel.format} onChange={e => setNewM(p => ({ ...p, format: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
                    style={{ background: '#1A1008', borderColor: '#3A2A18', color: '#C4A882' }}>
                    {Object.keys(FORMAT_COLOR).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {[{ key: 'isFree', label: 'Free Download' }, { key: 'verified', label: 'Verified' }].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newModel[key]} onChange={e => setNewM(p => ({ ...p, [key]: e.target.checked }))}
                      className="accent-gold" />
                    <span className="text-sm" style={{ color: '#C4A882' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: '#3A2A18', color: '#6A5A48' }}>
                Cancel
              </button>
              <button onClick={handleAdd}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#B68D57', color: '#1A1008' }}>
                Add Model
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl p-6 border"
            style={{ background: '#2B1B0E', borderColor: '#ef444430' }}>
            <h3 className="font-bold text-white text-lg mb-2">Delete Model?</h3>
            <p className="text-sm mb-6" style={{ color: '#8A7A68' }}>
              This action cannot be undone. The model will be permanently removed from the library.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: '#3A2A18', color: '#6A5A48' }}>
                Cancel
              </button>
              <button onClick={() => deleteModel(deleteId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#ef4444', color: 'white' }}>
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Edit notice (placeholder) ─ */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl p-6 border text-center"
            style={{ background: '#2B1B0E', borderColor: '#3A2A18' }}>
            <Pencil size={32} style={{ color: '#B68D57' }} className="mx-auto mb-3" />
            <h3 className="font-bold text-white text-lg mb-1">Edit: {editModal.nameEn}</h3>
            <p className="text-sm mb-5" style={{ color: '#8A7A68' }}>
              Full edit form coming in the next release. For now, toggle verified/free directly from the table.
            </p>
            <button onClick={() => setEdit(null)}
              className="px-8 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: '#B68D57', color: '#1A1008' }}>
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
