'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts'

/* ── Types ──────────────────────────────────────────── */
export interface CategorySlice {
  name: string
  value: number
  color: string
  icon: string
}

export interface DailyPoint {
  label: string   // "01", "02", …  or "Sen", "Sel"
  income: number
  expense: number
}

/* ── Donut Chart — Pengeluaran per kategori ─────────── */
export function DonutChart({ data }: { data: CategorySlice[] }) {
  if (!data.length) return (
    <div className="flex flex-col items-center justify-center h-48 text-stone-400">
      <span className="text-4xl mb-2 animate-float inline-block">🍩</span>
      <p className="text-sm">Belum ada pengeluaran</p>
    </div>
  )

  const total = data.reduce((s, d) => s + d.value, 0)

  const renderCustomLabel = ({ cx, cy }: { cx: number; cy: number }) => (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.6em" className="text-xs" fill="#78716c" fontSize={11}>Total</tspan>
      <tspan x={cx} dy="1.4em" fill="#1c1917" fontSize={13} fontWeight="700">
        {total >= 1_000_000
          ? `${(total / 1_000_000).toFixed(1)}jt`
          : total >= 1_000
          ? `${(total / 1_000).toFixed(0)}rb`
          : total}
      </tspan>
    </text>
  )

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, '']}
            contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-1 space-y-1.5 max-h-36 overflow-y-auto pr-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-stone-600 truncate">{d.icon} {d.name}</span>
            </div>
            <span className="text-xs font-semibold text-slate-700 shrink-0">
              Rp {d.value >= 1_000_000
                ? `${(d.value / 1_000_000).toFixed(1)}jt`
                : d.value.toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Area Chart — Trend income vs expense ───────────── */
const fmt = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt`
  : v >= 1_000   ? `${(v / 1_000).toFixed(0)}rb`
  : `${v}`

export function TrendChart({ data }: { data: DailyPoint[] }) {
  if (!data.length) return (
    <div className="flex flex-col items-center justify-center h-48 text-stone-400">
      <span className="text-4xl mb-2 animate-float inline-block">📈</span>
      <p className="text-sm">Belum ada data transaksi</p>
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#059669" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#e11d48" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#a8a29e' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 10, fill: '#a8a29e' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, '']}
          contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }}
          labelStyle={{ color: '#44403c', fontWeight: 600 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ color: '#78716c', fontSize: 11 }}>
              {value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </span>
          )}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#059669"
          strokeWidth={2}
          fill="url(#incomeGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#059669' }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#e11d48"
          strokeWidth={2}
          fill="url(#expenseGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#e11d48' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
