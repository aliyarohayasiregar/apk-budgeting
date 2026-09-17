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
  const [amountDisplay, setAmountDisplay] = useState('') // "12.000"
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',           // raw numeric string for DB
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
    let query = supabase
      .from('transactions')
      .select('*, categories(*)')
      .order('transaction_date', { ascending: false })
    if (filterType !== 'all') query = query.eq('type', filterType)
    const { data, error } = await query
    if (error) console.error('Error fetching transactions:', error)
    else setTransactions(data || [])
    setLoading(false)
  }

  async function fetchCategories() {
    const supabase = createClient()
    const { data, error } = await supabase.from('categories').select('*')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaksi 💳</h1>
            <p className="text-gray-500 text-sm mt-1">Catat semua pemasukan & pengeluaran</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 self-start sm:self-auto"
          >
            ➕ Tambah Transaksi
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-5 animate-fade-in">
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl shrink-0">📈</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Masuk</p>
              <p className="font-bold text-green-600 text-sm sm:text-base">+Rp {totalIncome.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl shrink-0">📉</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Keluar</p>
              <p className="font-bold text-red-600 text-sm sm:text-base">-Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
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
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in">
            <div className="text-5xl mb-3 animate-float inline-block">📝</div>
            <p className="font-semibold text-gray-700 mb-1">Belum ada transaksi</p>
            <p className="text-gray-400 text-sm mb-4">Mulai catat keuangan Anda sekarang</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md active:scale-95"
            >
              ➕ Tambah Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 animate-fade-in">
            {transactions.map((t, i) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                  t.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {t.categories?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{t.description || t.categories?.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.categories?.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(t.transaction_date), 'EEEE, dd MMMM yyyy', { locale: id })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-bold text-sm sm:text-base ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}Rp {Number(t.amount).toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => setDeleteConfirm(t.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition flex items-center justify-center opacity-0 group-hover:opacity-100 text-sm"
                    title="Hapus"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="font-bold text-gray-900 mb-2">Hapus Transaksi?</h3>
            <p className="text-gray-500 text-sm mb-5">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tambah Transaksi</h2>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Type Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipe Transaksi</label>
                <div className="flex gap-2">
                  {(['income', 'expense'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: t, category_id: '' }))}
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

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah</label>
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

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition text-sm bg-gray-50 focus:bg-white"
                >
                  <option value="">Pilih kategori...</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi <span className="text-gray-400 font-normal">(opsional)</span></label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Catatan singkat..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition text-sm bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition text-sm bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
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
                  ) : '✅ Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
