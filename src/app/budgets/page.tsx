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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
    if (error) console.error(error)
    else setBudgets(data || [])
    setLoading(false)
  }

  async function fetchCategories() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'expense')
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
    <div className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Budget</h1>
            <p className="text-stone-500 text-sm mt-1 font-medium">Alokasi dana bulanan</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-semibold text-sm shadow-sm active:scale-95 self-start sm:self-auto"
          >
            + Tambah Budget
          </button>
        </div>

        {/* Month/Year Selector */}
        <div className="flex gap-2 mb-6 animate-fade-in">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="pl-4 pr-10 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white text-sm font-semibold text-slate-700 shadow-sm outline-none"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="pl-4 pr-10 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white text-sm font-semibold text-slate-700 shadow-sm outline-none"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Total Budget Card */}
        {budgets.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-5 mb-5 text-white shadow-sm animate-fade-in flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-700">
            <div>
              <p className="text-stone-300 text-xs font-semibold uppercase tracking-wide">Total Budget</p>
              <p className="text-2xl font-bold mt-0.5">Rp {totalBudget.toLocaleString('id-ID')}</p>
            </div>
            <div className="text-right">
              <p className="text-stone-300 text-xs font-semibold uppercase tracking-wide">Kategori</p>
              <p className="text-xl font-bold mt-0.5">{budgets.length}</p>
            </div>
          </div>
        )}

        {/* Budget List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center animate-fade-in">
            <div className="text-4xl mb-3 opacity-30 inline-block">◫</div>
            <p className="font-semibold text-slate-700 mb-1">Belum ada budget</p>
            <p className="text-stone-400 text-sm mb-4">Buat budget untuk mengontrol pengeluaran</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold text-sm shadow-sm active:scale-95"
            >
              Buat Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-4 group hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: (budget.categories?.color || '#0f766e') + '15', color: budget.categories?.color }}
                >
                  {budget.categories?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{budget.categories?.name}</p>
                  <p className="text-sm text-stone-500 font-medium">
                    Rp {Number(budget.amount).toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(budget.id)}
                  className="w-8 h-8 rounded-md text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
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
            <h3 className="font-bold text-slate-800 mb-2">Hapus Budget?</h3>
            <p className="text-stone-500 text-xs mb-5">Data ini tidak dapat dikembalikan.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 font-semibold text-sm">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl animate-slide-up">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Tambah Budget</h2>
              <button
                onClick={() => { setShowModal(false); setAmountDisplay(''); setFormData({ category_id: '', amount: '' }) }}
                className="w-8 h-8 rounded-md hover:bg-stone-100 text-stone-400 transition flex items-center justify-center text-lg"
              >×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Kategori</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition text-sm bg-stone-50 focus:bg-white text-slate-800"
                >
                  <option value="">Pilih kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Jumlah</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-medium text-sm">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    required
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition text-sm bg-stone-50 focus:bg-white font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-stone-100 rounded-lg p-3 text-xs font-medium text-stone-600 flex items-center justify-center gap-1.5">
                Target: {months[selectedMonth - 1]} {selectedYear}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setAmountDisplay(''); setFormData({ category_id: '', amount: '' }) }}
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
