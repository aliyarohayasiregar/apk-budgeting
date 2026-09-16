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

  const [{ data: budgets }, { data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear),
    supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', userId)
      .gte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .lte('transaction_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`)
      .order('transaction_date', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
  ])

  const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0
  const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const remainingBudget = totalBudget - totalExpense

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Keuangan
        </h1>
        <p className="text-gray-600 mt-1">
          {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Budget"
          value={totalBudget}
          type="budget"
        />
        <StatCard
          title="Pengeluaran"
          value={totalExpense}
          type="expense"
        />
        <StatCard
          title="Pemasukan"
          value={totalIncome}
          type="income"
        />
        <StatCard
          title="Sisa Budget"
          value={remainingBudget}
          type="remaining"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Transaksi Terbaru
          </h2>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {transaction.categories?.icon || '📦'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description || transaction.categories?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
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
            <p className="text-gray-500 text-center py-8">
              Belum ada transaksi bulan ini
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Budget Bulanan
          </h2>
          {budgets && budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const spent = transactions
                  ?.filter(t => t.category_id === budget.category_id && t.type === 'expense')
                  .reduce((sum, t) => sum + Number(t.amount), 0) || 0
                const percentage = (spent / Number(budget.amount)) * 100
                const isOverBudget = percentage > 100

                return (
                  <div key={budget.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span>{budget.categories?.icon}</span>
                        <span className="font-medium text-gray-900">
                          {budget.categories?.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        Rp {spent.toLocaleString('id-ID')} / Rp {Number(budget.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Belum ada budget bulan ini
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, type }: { title: string; value: number; type: string }) {
  const colors = {
    budget: 'bg-blue-500',
    expense: 'bg-red-500',
    income: 'bg-green-500',
    remaining: value >= 0 ? 'bg-purple-500' : 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
      <p className={`text-2xl font-bold ${
        type === 'expense' ? 'text-red-600' :
        type === 'income' ? 'text-green-600' :
        type === 'remaining' && value < 0 ? 'text-red-600' :
        'text-gray-900'
      }`}>
        Rp {value.toLocaleString('id-ID')}
      </p>
    </div>
  )
}
