import { useEffect, useState } from 'react'
import {
  Users, IndianRupee, TrendingUp, AlertCircle,
  BookOpen, Clock, Layers, CalendarCheck, ArrowUpRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { formatCurrency, formatDate, today } from '../lib/utils'
import type { ReportSummary, FeePayment } from '../types'
import type { PageKey } from '../components/layout/AppShell'

interface Props {
  onNavigate: (page: PageKey) => void
}

interface ExtSummary extends ReportSummary {
  total_batches: number
  total_courses: number
  total_subjects: number
  week_total: number
}

export default function Dashboard({ onNavigate }: Props) {
  const [summary, setSummary] = useState<ExtSummary | null>(null)
  const [todayPayments, setTodayPayments] = useState<FeePayment[]>([])
  const [duesCount, setDuesCount] = useState<number | null>(null)
  const [trend, setTrend] = useState<{ date: string; total: number; label: string }[]>([])

  useEffect(() => {
    window.api.reports.summary().then((s) => setSummary(s as ExtSummary))
    window.api.reports.daily(today()).then(setTodayPayments)
    window.api.students.getDuesList().then((l) => setDuesCount(l.length))
    window.api.app.weeklyTrend().then(setTrend)
  }, [])

  const primaryStats = [
    {
      label: 'Total Students', value: summary?.total_students ?? '—',
      sub: 'active enrollments', icon: <Users size={22} />,
      color: 'blue', onClick: () => onNavigate('students')
    },
    {
      label: "Today's Collection", value: summary ? formatCurrency(summary.today_total) : '—',
      sub: `${todayPayments.length} payment${todayPayments.length !== 1 ? 's' : ''}`,
      icon: <IndianRupee size={22} />, color: 'green', onClick: () => onNavigate('fees')
    },
    {
      label: 'Monthly Revenue', value: summary ? formatCurrency(summary.month_total) : '—',
      sub: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      icon: <TrendingUp size={22} />, color: 'purple', onClick: () => onNavigate('reports')
    },
    {
      label: 'Pending Dues', value: duesCount != null ? duesCount : '—',
      sub: duesCount === 0 ? 'All fees cleared!' : 'students with dues',
      icon: <AlertCircle size={22} />, color: 'orange', onClick: () => onNavigate('fees')
    }
  ]

  const secondaryStats = [
    { label: 'Active Batches', value: summary?.total_batches ?? '—', icon: <Clock size={16} />, onClick: () => onNavigate('batches') },
    { label: 'Courses', value: summary?.total_courses ?? '—', icon: <BookOpen size={16} />, onClick: () => onNavigate('courses') },
    { label: 'Subjects', value: summary?.total_subjects ?? '—', icon: <Layers size={16} />, onClick: () => onNavigate('subjects') },
    { label: 'This Week', value: summary ? formatCurrency(summary.week_total) : '—', icon: <CalendarCheck size={16} />, onClick: () => onNavigate('reports') }
  ]

  const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
    blue:   { bg: 'bg-gradient-to-br from-blue-500 to-blue-600',   icon: 'text-white', badge: 'bg-blue-100 text-blue-700' },
    green:  { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', icon: 'text-white', badge: 'bg-emerald-100 text-emerald-700' },
    purple: { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', icon: 'text-white', badge: 'bg-violet-100 text-violet-700' },
    orange: { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', icon: 'text-white', badge: 'bg-orange-100 text-orange-700' }
  }

  return (
    <div className="space-y-5">
      {/* Primary Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {primaryStats.map((s) => {
          const c = colorMap[s.color]
          return (
            <button key={s.label} onClick={s.onClick}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-all hover:-translate-y-0.5 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center ${c.icon} shadow-sm`}>
                  {s.icon}
                </div>
                <ArrowUpRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-navy tracking-tight">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </button>
          )
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-3">
        {secondaryStats.map((s) => (
          <button key={s.label} onClick={s.onClick}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-left flex items-center gap-3 hover:shadow-md transition-all hover:border-primary/20 group">
            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors flex-shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-base font-bold text-navy">{s.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Chart + Today table */}
      <div className="grid grid-cols-5 gap-4">
        {/* 7-day Revenue Chart */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-navy text-sm">7-Day Revenue Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily fee collections</p>
            </div>
            <span className="text-xs font-semibold text-primary bg-blue-50 px-2.5 py-1 rounded-full">
              Last 7 Days
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Collection']}
                labelStyle={{ color: '#111D3A', fontWeight: 600 }}
                contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="total" fill="#4285F4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats Panel */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-navy text-sm mb-4">Quick Overview</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Today's collection</span>
              <span className="font-bold text-emerald-600">{summary ? formatCurrency(summary.today_total) : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">This week</span>
              <span className="font-semibold text-navy">{summary ? formatCurrency(summary.week_total) : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">This month</span>
              <span className="font-semibold text-navy">{summary ? formatCurrency(summary.month_total) : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Active students</span>
              <span className="font-semibold text-navy">{summary?.total_students ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-500">Students with dues</span>
              <span className={`font-bold ${duesCount && duesCount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {duesCount ?? '—'}
              </span>
            </div>
          </div>
          <button onClick={() => onNavigate('fees')}
            className="mt-4 w-full text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1">
            View Dues <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {/* Today's Payments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h2 className="font-bold text-navy text-sm">Today's Fee Collections</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-primary px-2.5 py-1 rounded-full">
            {todayPayments.length} records
          </span>
        </div>

        {todayPayments.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-400">
            <IndianRupee size={32} className="mb-2 opacity-20" />
            <p className="text-sm font-medium">No collections today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No</th><th>Student</th><th>Amount</th>
                  <th>Mode</th><th>Period</th><th>Time</th>
                </tr>
              </thead>
              <tbody>
                {todayPayments.map((p) => (
                  <tr key={p.id}>
                    <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{p.receipt_no}</span></td>
                    <td>
                      <p className="font-medium text-navy text-sm">{p.student_name}</p>
                      <p className="text-xs text-gray-400">{p.sid}</p>
                    </td>
                    <td><span className="font-bold text-emerald-600">{formatCurrency(p.total_paid)}</span></td>
                    <td><span className="badge badge-info capitalize">{p.payment_mode}</span></td>
                    <td className="text-xs text-gray-500">
                      {p.period_from ? `${formatDate(p.period_from)} – ${formatDate(p.period_to ?? '')}` : '—'}
                    </td>
                    <td className="text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
