'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const navItems = [
    { href: '/',             label: 'Dashboard', icon: '🏠' },
    { href: '/budgets',      label: 'Budget',    icon: '💵' },
    { href: '/transactions', label: 'Transaksi', icon: '💳' },
    { href: '/categories',   label: 'Kategori',  icon: '📁' },
  ]

  return (
    <header className="sticky top-0 z-50">
      {/* Gradient line at top */}
      <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-md group-hover:shadow-lg transition-shadow">
                💰
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BudgetKu
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5" />
                    )}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 ml-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium text-sm disabled:opacity-50"
              >
                {loggingOut ? '⏳' : '🚪'}
                {loggingOut ? 'Keluar...' : 'Logout'}
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-xl hover:bg-gray-100 transition flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-3 pb-3 border-t border-gray-100 pt-3 animate-fade-in">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                      {isActive && <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500" />}
                    </Link>
                  )
                })}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition font-medium mt-1"
                >
                  <span className="text-xl">🚪</span>
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
