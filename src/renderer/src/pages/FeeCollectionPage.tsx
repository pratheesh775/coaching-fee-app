import { useEffect, useState, useRef } from 'react'
import { Search, IndianRupee, Printer, CheckCircle2, X, Receipt } from 'lucide-react'
import { formatCurrency, formatDate, today } from '../lib/utils'
import type { Student, FeePayment } from '../types'

export default function FeeCollectionPage() {
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<Student | null>(null)
  const [history, setHistory] = useState<FeePayment[]>([])
  const [showCollect, setShowCollect] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  const doSearch = (q: string) => {
    setSearch(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (q.trim()) {
        window.api.students.list(q).then(setStudents)
      } else {
        setStudents([])
      }
    }, 300)
  }

  const selectStudent = (s: Student) => {
    setSelected(s)
    setStudents([])
    setSearch('')
    window.api.fees.history(s.id).then(setHistory)
  }

  const handleCollected = async (receiptNo: string) => {
    setLastReceipt(receiptNo)
    setShowCollect(false)
    if (selected) {
      window.api.fees.history(selected.id).then(setHistory)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Collection</h1>
          <p className="page-subtitle">Search student and collect fee</p>
        </div>
        {selected && (
          <button className="btn-success" onClick={() => setShowCollect(true)}>
            <IndianRupee size={16} />
            Collect Fee
          </button>
        )}
      </div>

      {/* Student Search */}
      <div className="card mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="form-input pl-9 max-w-sm"
            placeholder="Search student by name, ID or phone..."
            value={search}
            onChange={(e) => doSearch(e.target.value)}
          />
          {students.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {students.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors border-b border-gray-50 last:border-0"
                  onClick={() => selectStudent(s)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xs font-bold">{s.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.student_id} • {s.phone}</p>
                  </div>
                  <span className="text-xs text-gray-400">{s.course_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Student Info */}
      {selected && (
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-lg font-bold">{selected.name.charAt(0)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-navy text-base">{selected.name}</h2>
                  <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{selected.student_id}</span>
                </div>
                <p className="text-sm text-gray-500">{selected.course_name} • {selected.batch_name || 'No batch'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Parent: {selected.parent_name || '—'} • Phone: {selected.phone || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-xs text-gray-500">Fee ({selected.fee_type})</p>
                <p className="font-bold text-navy">{formatCurrency(selected.fee_amount)}</p>
                {selected.discount > 0 && (
                  <p className="text-xs text-green-600">−{formatCurrency(selected.discount)} discount</p>
                )}
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last Receipt Success */}
      {lastReceipt && (
        <div className="card mb-4 border-l-4 border-success bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-success" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Fee collected successfully!</p>
                <p className="text-xs text-green-700">Receipt No: <span className="font-mono font-bold">{lastReceipt}</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" onClick={() => window.print()}>
                <Printer size={13} />
                Print Receipt
              </button>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setLastReceipt(null)}>
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {selected && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-navy text-sm">Payment History</h3>
            <span className="badge badge-gray">{history.length} payments</span>
          </div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Receipt size={36} className="mb-3 opacity-30" />
              <p className="text-sm">No payments recorded yet</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Discount</th>
                  <th>Total Paid</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{h.receipt_no}</span></td>
                    <td>{formatDate(h.payment_date)}</td>
                    <td className="text-xs text-gray-500">
                      {h.period_from ? `${formatDate(h.period_from)} – ${formatDate(h.period_to ?? '')}` : '—'}
                    </td>
                    <td>{formatCurrency(h.amount)}</td>
                    <td>{h.discount > 0 ? <span className="text-green-600">−{formatCurrency(h.discount)}</span> : '—'}</td>
                    <td><span className="font-bold text-success">{formatCurrency(h.total_paid)}</span></td>
                    <td><span className="badge badge-info capitalize">{h.payment_mode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!selected && (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <IndianRupee size={48} className="mb-4 opacity-20" />
          <p className="font-medium">Search for a student to begin</p>
          <p className="text-xs mt-1">Type student name, ID or phone number above</p>
        </div>
      )}

      {showCollect && selected && (
        <CollectModal
          student={selected}
          onClose={() => setShowCollect(false)}
          onCollected={handleCollected}
        />
      )}
    </div>
  )
}

// ─── Collect Fee Modal ────────────────────────────────────────────────────────
interface CollectProps {
  student: Student
  onClose: () => void
  onCollected: (receiptNo: string) => void
}

function CollectModal({ student, onClose, onCollected }: CollectProps) {
  const effectiveFee = student.fee_amount - student.discount
  const [form, setForm] = useState({
    amount: String(student.fee_amount),
    discount: String(student.discount),
    payment_mode: 'cash',
    payment_date: today(),
    period_from: today(),
    period_to: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  const totalPaid = Math.max(0, Number(form.amount) - Number(form.discount))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await window.api.fees.collect({
      student_id: student.id,
      amount: Number(form.amount),
      discount: Number(form.discount),
      total_paid: totalPaid,
      payment_date: form.payment_date,
      period_from: form.period_from || null,
      period_to: form.period_to || null,
      payment_mode: form.payment_mode,
      notes: form.notes
    })
    onCollected(result.receipt_no)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 className="font-semibold text-navy">Collect Fee</h3>
            <p className="text-xs text-gray-500 mt-0.5">{student.name} — {student.student_id}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            {/* Amount summary */}
            <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Standard Fee ({student.fee_type})</p>
                <p className="text-2xl font-bold text-navy">{formatCurrency(student.fee_amount)}</p>
              </div>
              {student.discount > 0 && (
                <div className="text-right">
                  <p className="text-xs text-green-600">Discount</p>
                  <p className="font-bold text-green-700">−{formatCurrency(student.discount)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Fee Amount (₹)</label>
                <input className="form-input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Discount (₹)</label>
                <input className="form-input" type="number" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-select" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input className="form-input" type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Period From</label>
                <input className="form-input" type="date" value={form.period_from} onChange={(e) => setForm({ ...form, period_from: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Period To</label>
                <input className="form-input" type="date" value={form.period_to} onChange={(e) => setForm({ ...form, period_to: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" placeholder="Any remarks" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            {/* Total */}
            <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
              <p className="font-semibold text-green-800">Total Payable</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-success" disabled={saving}>
              {saving ? 'Processing...' : `Collect ${formatCurrency(totalPaid)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
