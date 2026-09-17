'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/Header'
import { formatInputCurrency, parseInputCurrency } from '@/lib/formatCurrency'

interface Category {
  id: string
  name: string
  type: string
  icon: string
  color: string
}

interface Budget {
  id: string
  amount: number
  month: number
  year: number
  categories: Category
}

export default function BudgetsPage() {
  const [budgets, setBudgets]       = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear())
  const [userId, setUserId]         = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [amountDisplay, setAmountDisplay] = useState('')
  const [formData, setFormData] = useState({ category_id: '', amount: '' })

  useEffect(() => {
    fetchUser()
    fetchBudgets()
    fetchCategories()
  }, [selectedMonth, selectedYear])

  async function fetchUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }

  async function fetchBudgets() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
    if (error) console.error(error)
    else setBudgets(data || [])
    setLoading(false)
  }

  async function fetchCategories() {
    const supabase = createClient()
    const { data, error } = await supabase.from('categories').select('*').eq('type', 'expense')
    if (error) console.error(error)
    else setCategories(data || [])
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatInputCurrency(e.target.value)
    setAmountDisplay(formatted)
    setFormData(prev => ({ ...prev, amount: formatted.replace(/\./g, '') }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from('budgets').insert({
      user_id: userId,
      category_id: formData.category_id,
      amount: parseInputCurrency(amountDisplay),
      month: selectedMonth,
      year: selectedYear
    })

    setSaving(false)
    if (error) {
      alert('Gagal menambah budget: ' + error.message)
    } else {
      setShowModal(false)
      setFormData({ category_id: '', amount: '' })
      setAmountDisplay('')
      fetchBudgets()
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) alert('Gagal menghapus: ' + error.message)
    else { setDeleteConfirm(null); fetchBudgets() }
  }

  const months = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ]

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Budget 💵</h1>
            <p className="text-gray-500 text-sm mt-1">Atur pengeluaran bulanan Anda</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 self-start sm:self-auto"
          >
            ➕ Tambah Budget
          </button>
        </div>

        {/* Month/Year Selector */}
        <div className="flex gap-3 mb-6 animate-fade-in">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-sm font-medium text-gray-700 cursor-pointer shadow-sm"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</span>
          </div>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-sm font-medium text-gray-700 cursor-pointer shadow-sm"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        {/* Total Budget Card */}
        {budgets.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 mb-5 text-white shadow-lg animate-fade-in">
            <p className="text-indigo-100 text-sm font-medium">Total Budget {months[selectedMonth - 1]} {selectedYear}</p>
            <p className="text-3xl font-bold mt-1">Rp {totalBudget.toLocaleString('id-ID')}</p>
            <p className="text-indigo-200 text-xs mt-1">{budgets.length} kategori</p>
          </div>
        )}

        {/* Budget List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in">
            <div className="text-5xl mb-3 animate-float inline-block">📊</div>
            <p className="font-semibold text-gray-700 mb-1">Belum ada budget</p>
            <p className="text-gray-400 text-sm mb-4">Buat budget untuk {months[selectedMonth - 1]} {selectedYear}</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md active:scale-95"
            >
              ➕ Buat Budget Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: (budget.categories?.color || '#6366f1') + '20' }}
                    >
                      {budget.categories?.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{budget.categories?.name}</p>
                      <p className="text-sm text-indigo-600 font-semibold">
                        Rp {Number(budget.amount).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(budget.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition flex items-center justify-center opacity-0 group-hover:opacity-100 text-sm"
                    title="Hapus budget"
                  >
                    🗑️
                  </button>
                </div>
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
            <h3 className="font-bold text-gray-900 mb-2">Hapus Budget?</h3>
            <p className="text-gray-500 text-sm mb-5">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl animate-slide-up">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tambah Budget</h2>
              <button
                onClick={() => { setShowModal(false); setAmountDisplay(''); setFormData({ category_id: '', amount: '' }) }}
                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition flex items-center justify-center"
              >✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori Pengeluaran</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition text-sm bg-gray-50 focus:bg-white"
                >
                  <option value="">Pilih kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Budget</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    required
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition text-sm bg-gray-50 focus:bg-white font-semibold text-gray-800"
                  />
                </div>
                {amountDisplay && (
                  <p className="text-xs text-indigo-500 mt-1.5 ml-1">
                    = Rp {parseInputCurrency(amountDisplay).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              {/* Period info */}
              <div className="bg-indigo-50 rounded-xl p-3 text-sm text-indigo-700 font-medium flex items-center gap-2">
                📅 Periode: {months[selectedMonth - 1]} {selectedYear}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setAmountDisplay(''); setFormData({ category_id: '', amount: '' }) }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold text-sm transition shadow-md disabled:opacity-60 active:scale-95"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Menyimpan...
                    </span>
                  ) : '✅ Simpan Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
