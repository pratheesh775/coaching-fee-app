import { useEffect, useState } from 'react'
import { BarChart3, Calendar, Download } from 'lucide-react'
import { formatCurrency, formatDate, today, thisMonth } from '../lib/utils'
import type { FeePayment } from '../types'

type Tab = 'daily' | 'monthly' | 'due'

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('daily')
  const [date, setDate] = useState(today())
  const [month, setMonth] = useState(thisMonth())
  const [data, setData] = useState<FeePayment[]>([])
  const [dueList, setDueList] = useState<any[]>([])

  useEffect(() => {
    if (tab === 'daily') {
      window.api.reports.daily(date).then(setData)
    } else if (tab === 'monthly') {
      window.api.reports.monthly(month.year, month.month).then(setData)
    } else {
      window.api.reports.dueList().then(setDueList)
    }
  }, [tab, date, month])

  const total = data.reduce((s, p) => s + p.total_paid, 0)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'daily', label: 'Daily Collection' },
    { key: 'monthly', label: 'Monthly Collection' },
    { key: 'due', label: 'Due List' }
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Collection and dues analysis</p>
        </div>
        <button className="btn-outline">
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab === 'daily' && (
        <div className="card mb-4 py-3 flex items-center gap-4">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input w-40" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="mt-4 px-4 py-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Total Collected</p>
            <p className="font-bold text-navy">{formatCurrency(total)}</p>
          </div>
        </div>
      )}

      {tab === 'monthly' && (
        <div className="card mb-4 py-3 flex items-center gap-4">
          <div className="form-group">
            <label className="form-label">Month</label>
            <input
              className="form-input w-36"
              type="month"
              value={`${month.year}-${String(month.month).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-')
                setMonth({ year: Number(y), month: Number(m) })
              }}
            />
          </div>
          <div className="mt-4 px-4 py-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Total Collected</p>
            <p className="font-bold text-navy">{formatCurrency(total)}</p>
          </div>
          <div className="mt-4 px-4 py-2 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600">Total Payments</p>
            <p className="font-bold text-navy">{data.length}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      {tab !== 'due' && (
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Receipt No</th>
                <th>Student</th>
                <th>Date</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No records for this period</p>
                  </td>
                </tr>
              ) : (
                data.map((p, i) => (
                  <tr key={p.id}>
                    <td className="text-gray-400 text-xs">{i + 1}</td>
                    <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{p.receipt_no}</span></td>
                    <td>
                      <p className="font-medium text-navy">{p.student_name}</p>
                      <p className="text-xs text-gray-400">{p.sid}</p>
                    </td>
                    <td>{formatDate(p.payment_date)}</td>
                    <td className="text-xs text-gray-500">
                      {p.period_from ? `${formatDate(p.period_from)} – ${formatDate(p.period_to ?? '')}` : '—'}
                    </td>
                    <td><span className="font-bold text-success">{formatCurrency(p.total_paid)}</span></td>
                    <td><span className="badge badge-info capitalize">{p.payment_mode}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Due List */}
      {tab === 'due' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">Students sorted by last payment date (oldest first)</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Course / Batch</th>
                <th>Fee</th>
                <th>Last Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dueList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">No data</td>
                </tr>
              ) : (
                dueList.map((s, i) => {
                  const neverPaid = !s.last_paid
                  const daysAgo = s.last_paid
                    ? Math.floor((Date.now() - new Date(s.last_paid).getTime()) / 86400000)
                    : null
                  const overdue = daysAgo === null || daysAgo > 35

                  return (
                    <tr key={s.id}>
                      <td className="text-gray-400 text-xs">{i + 1}</td>
                      <td>
                        <p className="font-medium text-navy">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.student_id}</p>
                      </td>
                      <td>
                        <p className="text-sm">{s.course_name || '—'}</p>
                        <p className="text-xs text-gray-400">{s.batch_name || ''}</p>
                      </td>
                      <td><span className="font-semibold">{formatCurrency(s.fee_amount)}</span></td>
                      <td className="text-sm">
                        {neverPaid ? <span className="text-red-500 font-medium">Never paid</span> : formatDate(s.last_paid)}
                      </td>
                      <td>
                        {overdue ? (
                          <span className="badge badge-danger">Overdue</span>
                        ) : (
                          <span className="badge badge-success">Up to date</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
