import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import { DonutChart, TrendChart, CategorySlice, DailyPoint } from '@/components/DashboardCharts'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-stone-50">
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
  
  const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
  const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`

  const [{ data: budgets }, { data: transactions }] = await Promise.all([
    supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('month', currentMonth)
      .eq('year', currentYear),
    supabase
      .from('transactions')
      .select('*, categories(*)')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true }), // Ascending for trend chart
  ])

  const totalBudget    = budgets?.reduce((s, b) => s + Number(b.amount), 0) || 0
  const totalExpense   = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0
  const totalIncome    = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0
  const remainingBudget = totalBudget - totalExpense
  const budgetUsedPct  = totalBudget > 0 ? Math.min((totalExpense / totalBudget) * 100, 100) : 0

  // --- Prepare Chart Data ---
  
  // 1. Donut Chart Data (Expenses by Category)
  const expenseByCategory: Record<string, CategorySlice> = {}
  transactions?.filter(t => t.type === 'expense').forEach(t => {
    const catId = t.category_id
    if (!expenseByCategory[catId]) {
      expenseByCategory[catId] = {
        name: t.categories?.name || 'Uncategorized',
        value: 0,
        color: t.categories?.color || '#78716c',
        icon: t.categories?.icon || '📦'
      }
    }
    expenseByCategory[catId].value += Number(t.amount)
  })
  const donutData = Object.values(expenseByCategory).sort((a, b) => b.value - a.value)

  // 2. Trend Chart Data (Income vs Expense by Day)
  const dailyData: Record<string, DailyPoint> = {}
  // Initialize all days of the month up to today (or end of month)
  const maxDay = now.getMonth() + 1 === currentMonth ? now.getDate() : lastDayOfMonth
  for (let i = 1; i <= maxDay; i++) {
    const dayStr = String(i).padStart(2, '0')
    dailyData[dayStr] = { label: dayStr, income: 0, expense: 0 }
  }
  
  transactions?.forEach(t => {
    const dayStr = t.transaction_date.substring(8, 10)
    if (dailyData[dayStr]) {
      if (t.type === 'income') dailyData[dayStr].income += Number(t.amount)
      else dailyData[dayStr].expense += Number(t.amount)
    }
  })
  const trendData = Object.values(dailyData)

  // Sort transactions descending for the recent list
  const recentTransactions = transactions ? [...transactions].sort((a, b) => 
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  ) : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Page header */}
      <header className="mb-6 sm:mb-8 animate-fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            Ringkasan 
          </h1>
          <p className="text-stone-500 mt-1 text-sm sm:text-base font-medium">
            {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/transactions"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition text-sm font-semibold shadow-sm active:scale-95"
          >
            + Transaksi
          </a>
          <a
            href="/budgets"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-700 border border-stone-200 rounded-lg hover:bg-stone-50 hover:border-stone-300 transition text-sm font-semibold shadow-sm"
          >
            Budget
          </a>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard title="Pemasukan"     value={totalIncome}    type="income"    icon="↑" />
        <StatCard title="Pengeluaran"   value={totalExpense}   type="expense"   icon="↓" />
        <StatCard title="Total Budget"  value={totalBudget}    type="budget"    icon="◫" />
        <StatCard title="Sisa Budget"   value={remainingBudget} type="remaining" icon="=" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Trend Area Chart (spans 2 cols) */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 lg:col-span-2 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Arus Kas (Bulan Ini)</h2>
          </div>
          <TrendChart data={trendData} />
        </div>

        {/* Donut Chart (spans 1 col) */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-slate-800">Pengeluaran</h2>
          </div>
          <DonutChart data={donutData} />
        </div>
      </div>

      {/* Bottom Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-800">Transaksi Terbaru</h2>
            <a href="/transactions" className="text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-md hover:bg-teal-100 transition">
              Semua
            </a>
          </div>
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 bg-stone-50 border border-stone-100">
                      {t.categories?.icon || '📦'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {t.description || t.categories?.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ml-2 shrink-0 ${
                    t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}Rp {Number(t.amount).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState emoji="📝" title="Belum ada transaksi" href="/transactions" btnLabel="Tambah" />
          )}
        </div>

        {/* Budget Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-800">Status Budget</h2>
            <a href="/budgets" className="text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-md hover:bg-teal-100 transition">
              Kelola
            </a>
          </div>
          
          {totalBudget > 0 && (
            <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Keseluruhan</span>
                <span className={`text-xs font-bold ${budgetUsedPct >= 100 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {budgetUsedPct.toFixed(0)}% terpakai
                </span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    budgetUsedPct >= 100 ? 'bg-rose-500' :
                    budgetUsedPct >= 80  ? 'bg-amber-500' :
                    'bg-teal-500'
                  }`}
                  style={{ width: `${budgetUsedPct}%` }}
                />
              </div>
            </div>
          )}

          {budgets && budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.slice(0,4).map((budget) => {
                const spent = transactions
                  ?.filter(t => t.category_id === budget.category_id && t.type === 'expense')
                  .reduce((s, t) => s + Number(t.amount), 0) || 0
                const pct = budget.amount > 0 ? (spent / Number(budget.amount)) * 100 : 0
                const isOver = pct > 100

                return (
                  <div key={budget.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{budget.categories?.icon}</span>
                        <span className="font-medium text-slate-700 text-sm">{budget.categories?.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${isOver ? 'text-rose-600' : 'text-stone-500'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState emoji="◫" title="Belum ada budget" href="/budgets" btnLabel="Buat" />
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, type, icon
}: {
  title: string; value: number; type: string; icon: string;
}) {
  const isNegative = type === 'remaining' && value < 0
  let colorClass = "text-slate-900"
  let iconClass = "bg-stone-100 text-stone-600"
  
  if (type === 'income') iconClass = "bg-emerald-50 text-emerald-600 border border-emerald-100"
  if (type === 'expense') iconClass = "bg-rose-50 text-rose-600 border border-rose-100"
  if (isNegative) colorClass = "text-rose-600"

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 hover:shadow-md transition-all group animate-fade-in flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{title}</p>
        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm ${iconClass}`}>
          {icon}
        </div>
      </div>
      <p className={`text-lg sm:text-2xl font-bold tracking-tight ${colorClass}`}>
        Rp {Math.abs(value).toLocaleString('id-ID')}
      </p>
    </div>
  )
}

function EmptyState({
  emoji, title, href, btnLabel
}: {
  emoji: string; title: string; href: string; btnLabel: string
}) {
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-2 opacity-50">{emoji}</div>
      <p className="font-medium text-stone-600 mb-3 text-sm">{title}</p>
      <a
        href={href}
        className="inline-flex items-center px-4 py-2 bg-white border border-stone-200 text-slate-700 rounded-lg hover:bg-stone-50 transition text-xs font-semibold shadow-sm"
      >
        {btnLabel}
      </a>
    </div>
  )
}
