'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/Header'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [userId, setUserId]         = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: '#0f766e',
    icon: '📦'
  })

  useEffect(() => { fetchUser(); fetchCategories() }, [])

  async function fetchUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }

  async function fetchCategories() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('categories').select('*').eq('user_id', user.id).order('type').order('name')
    if (error) console.error(error)
    else setCategories(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from('categories').insert({ ...formData, user_id: userId })

    setSaving(false)
    if (error) {
      alert('Gagal menambah kategori: ' + error.message)
    } else {
      setShowModal(false)
      setFormData({ name: '', type: 'expense', color: '#0f766e', icon: '📦' })
      fetchCategories()
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) alert('Gagal menghapus: ' + error.message)
    else { setDeleteConfirm(null); fetchCategories() }
  }

  const icons  = ['💰','🎁','📈','🍽️','🚗','🛒','📄','🎮','🏥','📦','🏠','📱','💼','🎓','✈️','🍕','☕','🎬','📚','🎨','🎵','🐕','💊','🌿','⚡']
  const colors = ['#0f766e','#059669','#e11d48','#ea580c','#d97706','#475569','#0284c7','#7c3aed','#78716c','#57534e']

  const filtered = categories.filter(c => filterType === 'all' || c.type === filterType)

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Kategori</h1>
            <p className="text-stone-500 text-sm mt-1 font-medium">Kelompokkan jenis transaksi Anda</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-semibold text-sm shadow-sm active:scale-95 self-start sm:self-auto"
          >
            + Tambah Kategori
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-1 mb-5 p-1 bg-stone-200/50 rounded-lg border border-stone-200 w-fit animate-fade-in">
          {[
            { key: 'all',     label: 'Semua' },
            { key: 'income',  label: 'Pemasukan' },
            { key: 'expense', label: 'Pengeluaran' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterType(key as typeof filterType)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                filterType === key
                  ? 'bg-white text-slate-800 shadow-sm border border-stone-200/50'
                  : 'text-stone-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center animate-fade-in">
            <div className="text-4xl mb-3 opacity-30 inline-block">⊹</div>
            <p className="font-semibold text-slate-700 mb-1">Belum ada kategori</p>
            <p className="text-stone-400 text-sm mb-4">Buat kategori baru untuk mulai mencatat</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold text-sm shadow-sm active:scale-95"
            >
              Buat Kategori
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in">
            {filtered.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow p-3 flex items-center gap-3 group relative overflow-hidden"
              >
                {/* Thin color bar accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: cat.color }} />
                
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: cat.color + '15' }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate text-sm">{cat.name}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400 truncate">
                    {cat.type === 'income' ? 'Masuk' : 'Keluar'}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(cat.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-white border border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-xs shadow-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl animate-slide-up text-center">
            <h3 className="font-bold text-slate-800 mb-2">Hapus Kategori?</h3>
            <p className="text-stone-500 text-xs mb-5">Transaksi dengan kategori ini mungkin terdampak.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 font-semibold text-sm">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Tambah Kategori</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-md hover:bg-stone-100 text-stone-400 transition flex items-center justify-center text-lg"
              >×</button>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl mb-5 border border-stone-200">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm bg-white"
                style={{ border: `2px solid ${formData.color}` }}
              >
                {formData.icon}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{formData.name || 'Nama Kategori'}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  {formData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div className="flex bg-stone-100 rounded-lg p-1">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                    className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                      formData.type === t
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-stone-500 hover:text-slate-700'
                    }`}
                  >
                    {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </button>
                ))}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Contoh: Belanja Bulanan"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition text-sm bg-stone-50 focus:bg-white text-slate-800"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Ikon</label>
                <div className="flex flex-wrap gap-1.5">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        formData.icon === icon
                          ? 'bg-white border-2 border-slate-400 shadow-sm'
                          : 'bg-stone-50 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Warna</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 font-semibold text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold text-sm transition shadow-sm disabled:opacity-60 active:scale-95"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
