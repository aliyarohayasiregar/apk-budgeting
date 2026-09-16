'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/Header'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category_id: '',
    amount: ''
  })

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  useEffect(() => {
    if (supabase) {
      fetchUser()
      fetchBudgets()
      fetchCategories()
    }
  }, [selectedMonth, selectedYear, supabase])

  async function fetchUser() {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }

  async function fetchBudgets() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
    
    if (error) console.error('Error fetching budgets:', error)
    else setBudgets(data || [])
    setLoading(false)
  }

  async function fetchCategories() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'expense')
    
    if (error) console.error('Error fetching categories:', error)
    else setCategories(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!userId || !supabase) {
      alert('User tidak terautentikasi')
      return
    }

    const { data, error } = await supabase!.from('budgets').insert({
      user_id: userId,
      category_id: formData.category_id,
      amount: parseFloat(formData.amount),
      month: selectedMonth,
      year: selectedYear
    }).select()

    if (error) {
      console.error('Error inserting budget:', error)
      alert('Gagal menambah budget: ' + error.message)
    } else {
      console.log('Budget inserted successfully:', data)
      alert('Budget berhasil ditambahkan!')
      setShowModal(false)
      setFormData({ category_id: '', amount: '' })
      fetchBudgets()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus budget ini?')) return
    if (!supabase) return
    
    const { error } = await supabase!.from('budgets').delete().eq('id', id)
    
    if (error) {
      alert('Gagal menghapus budget: ' + error.message)
    } else {
      fetchBudgets()
    }
  }

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Budget</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            + Tambah Budget
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">Memuat...</p>
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">Belum ada budget untuk periode ini</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{budget.categories?.icon}</span>
                        <span className="font-medium text-gray-900">{budget.categories?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      Rp {Number(budget.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Tambah Budget</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (Rp)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
