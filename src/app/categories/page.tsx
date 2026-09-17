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
    color: '#6366f1',
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
    const { data, error } = await supabase.from('categories').select('*').order('type').order('name')
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
      setFormData({ name: '', type: 'expense', color: '#6366f1', icon: '📦' })
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
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#14b8a6','#f97316','#6b7280','#84cc16','#e11d48']

  const filtered = categories.filter(c => filterType === 'all' || c.type === filterType)
  const incomeCount  = categories.filter(c => c.type === 'income').length
  const expenseCount = categories.filter(c => c.type === 'expense').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kategori 📁</h1>
            <p className="text-gray-500 text-sm mt-1">{incomeCount} pemasukan · {expenseCount} pengeluaran</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 self-start sm:self-auto"
          >
            ➕ Tambah Kategori
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 w-fit animate-fade-in">
          {[
            { key: 'all',     label: 'Semua',      emoji: '📋' },
            { key: 'income',  label: 'Pemasukan',  emoji: '📈' },
            { key: 'expense', label: 'Pengeluaran',emoji: '📉' },
          ].map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setFilterType(key as typeof filterType)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filterType === key
                  ? key === 'income'  ? 'bg-green-500 text-white shadow-sm'
                  : key === 'expense' ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in">
            <div className="text-5xl mb-3 animate-float inline-block">📁</div>
            <p className="font-semibold text-gray-700 mb-1">Belum ada kategori</p>
            <p className="text-gray-400 text-sm mb-4">Tambah kategori untuk mengorganisir keuangan</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md active:scale-95"
            >
              ➕ Tambah Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
            {filtered.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-4 group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm"
                  style={{ backgroundColor: cat.color + '20', border: `2px solid ${cat.color}30` }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{cat.name}</p>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5"
                    style={{ backgroundColor: cat.color + '20', color: cat.color }}
                  >
                    {cat.type === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteConfirm(cat.id)}
                  className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition flex items-center justify-center opacity-0 group-hover:opacity-100 text-sm shrink-0"
                  title="Hapus"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="font-bold text-gray-900 mb-2">Hapus Kategori?</h3>
            <p className="text-gray-500 text-sm mb-5">Tindakan ini tidak dapat dibatalkan dan mungkin mempengaruhi transaksi terkait.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tambah Kategori</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition flex items-center justify-center"
              >✕</button>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl mb-5 border border-gray-100">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                style={{ backgroundColor: formData.color + '30' }}
              >
                {formData.icon}
              </div>
              <div>
                <p className="font-bold text-gray-900">{formData.name || 'Nama Kategori'}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: formData.color + '20', color: formData.color }}>
                  {formData.type === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipe</label>
                <div className="flex gap-2">
                  {(['income', 'expense'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        formData.type === t
                          ? t === 'income'
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-red-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Kategori</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="cth: Makan Siang, Transportasi..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition text-sm bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all ${
                        formData.icon === icon
                          ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110 shadow-sm'
                          : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Warna</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        formData.color === color ? 'ring-3 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold text-sm transition shadow-md disabled:opacity-60 active:scale-95"
                >
                  {saving ? 'Menyimpan...' : '✅ Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
