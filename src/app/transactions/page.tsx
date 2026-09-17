'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/Header'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatInputCurrency, parseInputCurrency } from '@/lib/formatCurrency'

interface Category {
  id: string
  name: string
  type: string
  icon: string
  color: string
}

interface Transaction {
  id: string
  amount: number
  description: string
  transaction_date: string
  type: 'income' | 'expense'
  categories: Category
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories]     = useState<Category[]>([])
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [filterType, setFilterType]     = useState<'all' | 'income' | 'expense'>('all')
  const [userId, setUserId]             = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [amountDisplay, setAmountDisplay] = useState('') 
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',           
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense'
  })

  useEffect(() => {
    fetchUser()
    fetchTransactions()
    fetchCategories()
  }, [filterType])

  async function fetchUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }

  async function fetchTransactions() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let query = supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
    if (filterType !== 'all') query = query.eq('type', filterType)
    const { data, error } = await query
    if (error) console.error('Error fetching transactions:', error)
    else setTransactions(data || [])
    setLoading(false)
  }

  async function fetchCategories() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('categories').select('*').eq('user_id', user.id)
    if (error) console.error('Error fetching categories:', error)
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
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      category_id: formData.category_id,
      amount: parseInputCurrency(amountDisplay),
      description: formData.description,
      transaction_date: formData.transaction_date,
      type: formData.type
    })

    setSaving(false)
    if (error) {
      alert('Gagal menambah transaksi: ' + error.message)
    } else {
      setShowModal(false)
      resetForm()
      fetchTransactions()
    }
  }

  function resetForm() {
    setFormData({
      category_id: '',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      type: 'expense'
    })
    setAmountDisplay('')
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) alert('Gagal menghapus: ' + error.message)
    else { setDeleteConfirm(null); fetchTransactions() }
  }

  const filteredCategories = categories.filter(c => c.type === formData.type)
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Transaksi</h1>
            <p className="text-stone-500 text-sm mt-1 font-medium">Catat semua arus kas Anda</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-semibold text-sm shadow-sm active:scale-95 self-start sm:self-auto"
          >
            + Tambah Transaksi
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-5 animate-fade-in">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xl shrink-0 border border-emerald-100">↑</div>
            <div>
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide">Masuk</p>
              <p className="font-bold text-slate-800 text-sm sm:text-base">+Rp {totalIncome.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center text-xl shrink-0 border border-rose-100">↓</div>
            <div>
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide">Keluar</p>
              <p className="font-bold text-slate-800 text-sm sm:text-base">-Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
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
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center animate-fade-in">
            <div className="text-4xl mb-3 opacity-30 inline-block">📝</div>
            <p className="font-semibold text-slate-700 mb-1">Belum ada transaksi</p>
            <p className="text-stone-400 text-sm mb-4">Mulai catat keuangan Anda sekarang</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold text-sm shadow-sm active:scale-95"
            >
              Tambah Transaksi
            </button>
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in bg-white rounded-xl shadow-sm border border-stone-200 p-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-4 group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${
                  t.type === 'income' ? 'bg-emerald-50/50 border border-emerald-100/50' : 'bg-stone-100 border border-stone-200'
                }`}>
                  {t.categories?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800 text-sm">{t.description || t.categories?.name}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                      {t.categories?.name}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {format(new Date(t.transaction_date), 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-semibold text-sm ${
                    t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}Rp {Number(t.amount).toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => setDeleteConfirm(t.id)}
                    className="w-8 h-8 rounded-md bg-white border border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100 text-sm shadow-sm"
                    title="Hapus"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Tambah Transaksi</h2>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="w-8 h-8 rounded-md hover:bg-stone-100 text-stone-400 transition flex items-center justify-center text-lg"
              >×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Toggle */}
              <div className="flex bg-stone-100 rounded-lg p-1">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: t, category_id: '' }))}
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
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Keterangan</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opsional..."
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition text-sm bg-stone-50 focus:bg-white text-slate-800"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition text-sm bg-stone-50 focus:bg-white text-slate-800"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
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
      
      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl animate-slide-up text-center">
            <h3 className="font-bold text-slate-800 mb-2">Hapus Transaksi?</h3>
            <p className="text-stone-500 text-xs mb-5">Data ini tidak dapat dikembalikan.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 font-semibold text-sm">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
