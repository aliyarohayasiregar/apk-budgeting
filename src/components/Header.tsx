'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Header() {
  const router   = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut]         = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const navItems = [
    { href: '/',             label: 'Dashboard', icon: '⊞' },
    { href: '/budgets',      label: 'Budget',    icon: '◫' },
    { href: '/transactions', label: 'Transaksi', icon: '↕' },
    { href: '/categories',   label: 'Kategori',  icon: '⊹' },
  ]

  return (
    <header className="sticky top-0 z-50">
      {/* Thin accent bar */}
      <div className="h-[2px] bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-500" />

      <div className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm shadow-sm group-hover:bg-slate-700 transition-colors">
                <span className="text-teal-400 font-bold text-base">₿</span>
              </div>
              <span className="text-base font-bold text-slate-800 tracking-tight">BudgetKu</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-stone-500 hover:text-slate-800 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />}
                  </Link>
                )
              })}

              <div className="w-px h-5 bg-stone-200 mx-2" />

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
              >
                {loggingOut ? 'Keluar...' : 'Logout'}
              </button>
            </nav>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-lg hover:bg-stone-100 transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-2 pb-3 border-t border-stone-100 pt-3 animate-fade-in">
              <div className="flex flex-col gap-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                        isActive ? 'bg-slate-100 text-slate-900' : 'text-stone-600 hover:bg-stone-50 hover:text-slate-800'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-teal-500" />}
                    </Link>
                  )
                })}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition mt-1"
                >
                  Logout
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
