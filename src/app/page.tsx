import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Header />
      <Dashboard userId={user.id} />
    </div>
  )
}

async function Dashboard({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear  = now.getFullYear()
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate()

  const [{ data: budgets }, { data: transactions }] = await Promise.all([
    supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('month', currentMonth)
      .eq('year', currentYear),
    supabase
      .from('transactions')
      .select('*, categories(*)')
      .gte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .lte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`)
      .order('transaction_date', { ascending: false }),
  ])

  const totalBudget    = budgets?.reduce((s, b) => s + Number(b.amount), 0) || 0
  const totalExpense   = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0
  const totalIncome    = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0
  const remainingBudget = totalBudget - totalExpense
  const budgetUsedPct  = totalBudget > 0 ? Math.min((totalExpense / totalBudget) * 100, 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Page header */}
      <header className="mb-6 sm:mb-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">
              {now.toLocaleDateString('id-ID', { weekday: 'long' })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard Keuangan 📊
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/transactions"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition text-sm font-semibold shadow-md hover:shadow-lg active:scale-95"
            >
              ➕ Transaksi
            </a>
            <a
              href="/budgets"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition text-sm font-semibold shadow-sm hover:shadow"
            >
              📋 Budget
            </a>
          </div>
        </div>
      </header>

      {/* Budget overall progress bar */}
      {totalBudget > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Progress Budget Bulan Ini</span>
            <span className={`text-sm font-bold ${budgetUsedPct >= 100 ? 'text-red-600' : budgetUsedPct >= 80 ? 'text-orange-500' : 'text-green-600'}`}>
              {budgetUsedPct.toFixed(0)}% terpakai
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                budgetUsedPct >= 100 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                budgetUsedPct >= 80  ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Rp {totalExpense.toLocaleString('id-ID')} dari Rp {totalBudget.toLocaleString('id-ID')}
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="Total Budget"  value={totalBudget}    type="budget"    icon="💵" gradient="from-blue-500 to-indigo-600" />
        <StatCard title="Pengeluaran"   value={totalExpense}   type="expense"   icon="📉" gradient="from-red-500 to-pink-600" />
        <StatCard title="Pemasukan"     value={totalIncome}    type="income"    icon="📈" gradient="from-green-500 to-emerald-600" />
        <StatCard title="Sisa Budget"   value={remainingBudget} type="remaining" icon="💎"
          gradient={remainingBudget >= 0 ? 'from-purple-500 to-indigo-600' : 'from-red-500 to-orange-500'} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">💳</span>
              Transaksi Terbaru
            </h2>
            <a href="/transactions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">
              Lihat Semua →
            </a>
          </div>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-2.5">
              {transactions.slice(0, 6).map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-gray-100 hover:bg-gray-50/80 transition-all"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      t.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {t.categories?.icon || '📦'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">
                        {t.description || t.categories?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ml-2 shrink-0 ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}Rp {Number(t.amount).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📝"
              title="Belum ada transaksi"
              desc="Mulai catat pemasukan dan pengeluaran Anda"
              href="/transactions"
              btnLabel="Tambah Transaksi"
            />
          )}
        </div>

        {/* Budget per Category */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm">📊</span>
              Budget per Kategori
            </h2>
            <a href="/budgets" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">
              Kelola →
            </a>
          </div>
          {budgets && budgets.length > 0 ? (
            <div className="space-y-3.5">
              {budgets.map((budget) => {
                const spent = transactions
                  ?.filter(t => t.category_id === budget.category_id && t.type === 'expense')
                  .reduce((s, t) => s + Number(t.amount), 0) || 0
                const pct = budget.amount > 0 ? (spent / Number(budget.amount)) * 100 : 0
                const isOver = pct > 100

                return (
                  <div key={budget.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{budget.categories?.icon}</span>
                        <span className="font-semibold text-gray-800 text-sm">{budget.categories?.name}</span>
                        {isOver && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Over!</span>}
                      </div>
                      <span className={`text-xs font-bold ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isOver ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          pct > 80 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">Rp {spent.toLocaleString('id-ID')}</span>
                      <span className="text-xs text-gray-400">Rp {Number(budget.amount).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              emoji="📊"
              title="Belum ada budget"
              desc="Buat budget bulanan untuk kontrol pengeluaran"
              href="/budgets"
              btnLabel="Buat Budget"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, type, icon, gradient
}: {
  title: string; value: number; type: string; icon: string; gradient: string
}) {
  const isNegative = type === 'remaining' && value < 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-all group animate-fade-in">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-gray-500 mb-0.5 uppercase tracking-wide">{title}</p>
      <p className={`text-base sm:text-xl font-bold leading-tight ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
        Rp {Math.abs(value).toLocaleString('id-ID')}
      </p>
      {isNegative && <p className="text-xs text-red-500 mt-0.5">⚠️ Melebihi budget</p>}
    </div>
  )
}

function EmptyState({
  emoji, title, desc, href, btnLabel
}: {
  emoji: string; title: string; desc: string; href: string; btnLabel: string
}) {
  return (
    <div className="text-center py-10">
      <div className="text-5xl mb-3 animate-float inline-block">{emoji}</div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-gray-400 text-sm mb-4">{desc}</p>
      <a
        href={href}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition text-sm font-semibold shadow-md active:scale-95"
      >
        ➕ {btnLabel}
      </a>
    </div>
  )
}
