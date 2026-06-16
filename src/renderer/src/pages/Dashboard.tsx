import { useEffect, useState } from 'react'
import { Users, IndianRupee, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatDate, today } from '../lib/utils'
import type { ReportSummary, FeePayment } from '../types'

export default function Dashboard() {
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [todayPayments, setTodayPayments] = useState<FeePayment[]>([])

  useEffect(() => {
    window.api.reports.summary().then(setSummary)
    window.api.reports.daily(today()).then(setTodayPayments)
  }, [])

  const stats = [
    {
      label: 'Total Students',
      value: summary?.total_students ?? '—',
      icon: <Users size={20} className="text-blue-500" />,
      bg: 'bg-blue-50',
      trend: 'Active enrollments'
    },
    {
      label: "Today's Collection",
      value: summary ? formatCurrency(summary.today_total) : '—',
      icon: <IndianRupee size={20} className="text-green-500" />,
      bg: 'bg-green-50',
      trend: `${todayPayments.length} payments`
    },
    {
      label: 'Monthly Collection',
      value: summary ? formatCurrency(summary.month_total) : '—',
      icon: <TrendingUp size={20} className="text-purple-500" />,
      bg: 'bg-purple-50',
      trend: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    },
    {
      label: 'Pending Dues',
      value: '—',
      icon: <AlertCircle size={20} className="text-orange-500" />,
      bg: 'bg-orange-50',
      trend: 'Check reports'
    }
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview of your coaching institute — {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.bg}`}>{s.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-xl font-bold text-navy mt-0.5">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Payments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy text-sm">Today's Fee Collections</h2>
          <span className="badge badge-info">{todayPayments.length} records</span>
        </div>

        {todayPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <IndianRupee size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No collections today</p>
            <p className="text-xs mt-1">Collected fees will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Period</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {todayPayments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {p.receipt_no}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-navy">{p.student_name}</p>
                        <p className="text-xs text-gray-400">{p.sid}</p>
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-success">{formatCurrency(p.total_paid)}</span>
                    </td>
                    <td>
                      <span className="badge badge-info capitalize">{p.payment_mode}</span>
                    </td>
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
