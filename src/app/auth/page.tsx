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
            { name: 'Gaji',         type: 'income',  color: '#059669', icon: '💰' },
            { name: 'Bonus',        type: 'income',  color: '#0d9488', icon: '🎁' },
            { name: 'Investasi',    type: 'income',  color: '#0284c7', icon: '📈' },
            { name: 'Makanan',      type: 'expense', color: '#e11d48', icon: '🍽️' },
            { name: 'Transportasi', type: 'expense', color: '#d97706', icon: '🚗' },
            { name: 'Belanja',      type: 'expense', color: '#7c3aed', icon: '🛒' },
            { name: 'Tagihan',      type: 'expense', color: '#475569', icon: '📄' },
            { name: 'Hiburan',      type: 'expense', color: '#0f766e', icon: '🎮' },
            { name: 'Kesehatan',    type: 'expense', color: '#ea580c', icon: '🏥' },
            { name: 'Lainnya',      type: 'expense', color: '#78716c', icon: '📦' },
          ]
          await supabase.from('categories').insert(
            defaultCategories.map(cat => ({ user_id: data.user!.id, ...cat }))
          )
        }
        setSuccess('Akun berhasil dibuat! Silakan masuk.')
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-slate-900">

      {/* Subtle animated blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-10 blur-3xl animate-blob bg-teal-400" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-10 blur-3xl animate-blob bg-emerald-400"
        style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5 blur-2xl animate-blob bg-teal-300"
        style={{ animationDelay: '1.5s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-sm w-full animate-slide-up relative z-10">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-teal-500 items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
            <span className="text-white font-black text-2xl">₿</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BudgetKu</h1>
          <p className="text-slate-400 text-sm mt-1">Kelola keuangan dengan cerdas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-7 border border-stone-100">

          {/* Tab toggle */}
          <div className="flex bg-stone-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                !isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-3 rounded-xl mb-5 text-sm animate-fade-in">
              <span className="shrink-0 mt-0.5">⚠</span> {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-3 rounded-xl mb-5 text-sm animate-fade-in">
              <span className="shrink-0 mt-0.5">✓</span> {success}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@email.com"
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-slate-800 placeholder-stone-400 bg-stone-50 focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 border border-stone-200 rounded-xl text-sm text-slate-800 placeholder-stone-400 bg-stone-50 focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition text-xs font-medium"
                  tabIndex={-1}
                >
                  {showPass ? 'hide' : 'show'}
                </button>
              </div>
              {isSignUp && <p className="text-xs text-stone-400 mt-1.5">Minimal 6 karakter</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Memproses...
                </span>
              ) : isSignUp ? 'Buat Akun →' : 'Masuk →'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          Data Anda aman & terenkripsi 🔒
        </p>
      </div>
    </div>
  )
}
