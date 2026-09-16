'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        
        // Insert kategori default untuk user baru
        if (data.user) {
          console.log('User ID:', data.user.id)
          const defaultCategories = [
            { name: 'Gaji', type: 'income', color: '#10b981', icon: '💰' },
            { name: 'Bonus', type: 'income', color: '#06b6d4', icon: '🎁' },
            { name: 'Investasi', type: 'income', color: '#8b5cf6', icon: '📈' },
            { name: 'Makanan', type: 'expense', color: '#ef4444', icon: '🍽️' },
            { name: 'Transportasi', type: 'expense', color: '#f59e0b', icon: '🚗' },
            { name: 'Belanja', type: 'expense', color: '#ec4899', icon: '🛒' },
            { name: 'Tagihan', type: 'expense', color: '#6366f1', icon: '📄' },
            { name: 'Hiburan', type: 'expense', color: '#14b8a6', icon: '🎮' },
            { name: 'Kesehatan', type: 'expense', color: '#f97316', icon: '🏥' },
            { name: 'Lainnya', type: 'expense', color: '#6b7280', icon: '📦' },
          ]

          const { error: insertError } = await supabase
            .from('categories')
            .insert(defaultCategories.map(cat => ({
              user_id: data.user.id,
              ...cat
            })))

          if (insertError) {
            console.error('Error inserting default categories:', insertError)
            alert('Gagal membuat kategori default: ' + insertError.message)
          } else {
            console.log('Default categories inserted successfully')
          }
        }
        
        alert('Registrasi berhasil! Silakan login.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="text-5xl sm:text-6xl mb-4">💰</div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {isSignUp ? 'Daftar Akun' : 'Masuk'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Kelola keuangan bulanan Anda dengan mudah
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm sm:text-base"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm sm:text-base"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            {loading ? 'Memproses...' : isSignUp ? 'Daftar' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm sm:text-base"
          >
            {isSignUp
              ? 'Sudah punya akun? Masuk'
              : 'Belum punya akun? Daftar'}
          </button>
        </div>
      </div>
    </div>
  )
}
