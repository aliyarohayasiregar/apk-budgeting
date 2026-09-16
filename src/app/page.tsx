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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Dashboard userId={user.id} />
    </div>
  )
}

async function Dashboard({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  // Get last day of current month
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate()

  const [{ data: budgets }, { data: transactions }, { data: categories }] = await Promise.all([
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
    supabase
      .from('categories')
      .select('*')
  ])

  const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0
  const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const remainingBudget = totalBudget - totalExpense

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              💰 Dashboard Keuangan
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/transactions"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-md hover:shadow-lg"
            >
              + Transaksi
            </a>
            <a
              href="/budgets"
              className="px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm font-medium"
            >
              + Budget
            </a>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Budget"
          value={totalBudget}
          type="budget"
          icon="💵"
        />
        <StatCard
          title="Pengeluaran"
          value={totalExpense}
          type="expense"
          icon="📉"
        />
        <StatCard
          title="Pemasukan"
          value={totalIncome}
          type="income"
          icon="📈"
        />
        <StatCard
          title="Sisa Budget"
          value={remainingBudget}
          type="remaining"
          icon="💎"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Transaksi Terbaru
            </h2>
            <a
              href="/transactions"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Lihat Semua
            </a>
          </div>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl bg-gradient-to-br from-indigo-100 to-purple-100">
                      {transaction.categories?.icon || '📦'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {transaction.description || transaction.categories?.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      transaction.type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    Rp {Number(transaction.amount).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-5xl mb-3">📝</div>
              <p className="text-gray-500 text-sm sm:text-base">
                Belum ada transaksi bulan ini
              </p>
              <a
                href="/transactions"
                className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
              >
                Tambah Transaksi
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Budget Bulanan
            </h2>
            <a
              href="/budgets"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Kelola
            </a>
          </div>
          {budgets && budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const spent = transactions
                  ?.filter(t => t.category_id === budget.category_id && t.type === 'expense')
                  .reduce((sum, t) => sum + Number(t.amount), 0) || 0
                const percentage = (spent / Number(budget.amount)) * 100
                const isOverBudget = percentage > 100

                return (
                  <div key={budget.id} className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl">{budget.categories?.icon}</span>
                        <span className="font-medium text-gray-900 text-sm sm:text-base">
                          {budget.categories?.name}
                        </span>
                      </div>
                      <span className={`text-xs sm:text-sm font-medium ${
                        isOverBudget ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        Rp {spent.toLocaleString('id-ID')} / Rp {Number(budget.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                      <div
                        className={`h-2 sm:h-3 rounded-full transition-all ${
                          isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                          percentage > 80 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                          'bg-gradient-to-r from-green-500 to-emerald-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {percentage.toFixed(0)}% terpakai
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-5xl mb-3">📊</div>
              <p className="text-gray-500 text-sm sm:text-base">
                Belum ada budget bulan ini
              </p>
              <a
                href="/budgets"
                className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
              >
                Buat Budget
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, type, icon }: { title: string; value: number; type: string; icon: string }) {
  const gradients = {
    budget: 'from-blue-500 to-indigo-600',
    expense: 'from-red-500 to-pink-600',
    income: 'from-green-500 to-emerald-600',
    remaining: value >= 0 ? 'from-purple-500 to-indigo-600' : 'from-red-500 to-orange-600'
  }

  const textColors = {
    budget: 'text-blue-600',
    expense: 'text-red-600',
    income: 'text-green-600',
    remaining: value >= 0 ? 'text-purple-600' : 'text-red-600'
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl sm:text-2xl">{icon}</span>
        <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
      </div>
      <p className={`text-lg sm:text-2xl font-bold ${textColors[type as keyof typeof textColors]}`}>
        Rp {value.toLocaleString('id-ID')}
      </p>
    </div>
  )
}
