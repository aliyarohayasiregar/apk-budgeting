'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const supabase = createClient()

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        if (data.user) {
          const defaultCategories = [
            { name: 'Gaji',         type: 'income',  color: '#10b981', icon: '💰' },
            { name: 'Bonus',        type: 'income',  color: '#06b6d4', icon: '🎁' },
            { name: 'Investasi',    type: 'income',  color: '#8b5cf6', icon: '📈' },
            { name: 'Makanan',      type: 'expense', color: '#ef4444', icon: '🍽️' },
            { name: 'Transportasi', type: 'expense', color: '#f59e0b', icon: '🚗' },
            { name: 'Belanja',      type: 'expense', color: '#ec4899', icon: '🛒' },
            { name: 'Tagihan',      type: 'expense', color: '#6366f1', icon: '📄' },
            { name: 'Hiburan',      type: 'expense', color: '#14b8a6', icon: '🎮' },
            { name: 'Kesehatan',    type: 'expense', color: '#f97316', icon: '🏥' },
            { name: 'Lainnya',      type: 'expense', color: '#6b7280', icon: '📦' },
          ]
          await supabase.from('categories').insert(
            defaultCategories.map(cat => ({ user_id: data.user!.id, ...cat }))
          )
        }
        setSuccess('Registrasi berhasil! Silakan login dengan akun Anda.')
        setIsSignUp(false)
        setEmail('')
        setPassword('')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>

      {/* Floating decorative blobs */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full opacity-10 blur-2xl animate-float"
        style={{ background: 'radial-gradient(circle, #fbbf24, transparent)', animationDelay: '0.8s' }} />

      <div className="max-w-md w-full animate-slide-up relative z-10">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-7 sm:p-10 border border-white/50">

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl mb-4 animate-pulse-ring text-4xl">
              💰
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
              BudgetKu
            </h1>
            <p className="text-gray-500 text-sm">
              {isSignUp ? 'Buat akun baru gratis' : 'Kelola keuangan Anda dengan cerdas'}
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-7">
            <button
              onClick={() => { setIsSignUp(false); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !isSignUp ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isSignUp ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm animate-fade-in">
              <span className="text-base shrink-0">⚠️</span>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-5 text-sm animate-fade-in">
              <span className="text-base shrink-0">✅</span>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition text-sm bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition text-sm bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-sm"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-400 mt-1.5 ml-1">Minimal 6 karakter</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Memproses...
                </span>
              ) : isSignUp ? '🚀 Buat Akun' : '✨ Masuk Sekarang'}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            {isSignUp
              ? 'Dengan mendaftar, Anda setuju dengan syarat layanan kami'
              : 'Lupa password? Hubungi admin'}
          </p>
        </div>

        {/* Tagline below card */}
        <p className="text-center text-white/70 text-xs mt-5">
          🔒 Data Anda aman & terenkripsi
        </p>
      </div>
    </div>
  )
}
