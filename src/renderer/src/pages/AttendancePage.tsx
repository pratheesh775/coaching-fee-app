import { useEffect, useState, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Download, CalendarDays,
  Star, CheckCircle2, XCircle, Clock, Users,
  Plus, Trash2, X, AlertCircle, ChevronDown
} from 'lucide-react'
import { exportToCsv, today } from '../lib/utils'
import type { Batch, AttendanceWeek, Holiday } from '../types'

type Status = 'present' | 'absent' | 'leave'

const STATUS_CONFIG = {
  present: { label: 'P', full: 'Present', bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300', icon: <CheckCircle2 size={11} /> },
  absent:  { label: 'A', full: 'Absent',  bg: 'bg-red-100',     text: 'text-red-600',     ring: 'ring-red-300',     icon: <XCircle size={11} /> },
  leave:   { label: 'L', full: 'Leave',   bg: 'bg-amber-100',   text: 'text-amber-700',   ring: 'ring-amber-300',   icon: <Clock size={11} /> },
}

function getMondayOf(d: Date): string {
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1
  const mon = new Date(d); mon.setDate(d.getDate() - day)
  return `${mon.getFullYear()}-${String(mon.getMonth()+1).padStart(2,'0')}-${String(mon.getDate()).padStart(2,'0')}`
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtDayHeader(dateStr: string) {
  const d = new Date(dateStr)
  return {
    day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    num: d.getDate(),
    month: d.toLocaleDateString('en-IN', { month: 'short' })
  }
}

export default function AttendancePage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchId, setBatchId] = useState<number | null>(null)
  const [weekStart, setWeekStart] = useState(getMondayOf(new Date()))
  const [weekData, setWeekData] = useState<AttendanceWeek | null>(null)
  const [loading, setLoading] = useState(false)
  const [editTarget, setEditTarget] = useState<{ student_id: number; name: string; date: string; currentStatus: string } | null>(null)
  const [showHolidays, setShowHolidays] = useState(false)
  const [holidays, setHolidays] = useState<Holiday[]>([])

  useEffect(() => {
    window.api.batches.list(false).then(setBatches)
  }, [])

  const loadWeek = useCallback(async () => {
    if (!batchId) return
    setLoading(true)
    const data = await window.api.attendance.getWeek(batchId, weekStart)
    setWeekData(data as AttendanceWeek)
    setLoading(false)
  }, [batchId, weekStart])

  useEffect(() => { loadWeek() }, [loadWeek])

  const loadHolidays = () => {
    window.api.holidays.list().then((h) => setHolidays(h as Holiday[]))
  }

  const prevWeek = () => setWeekStart(addDays(weekStart, -7))
  const nextWeek = () => setWeekStart(addDays(weekStart, 7))
  const thisWeek = () => setWeekStart(getMondayOf(new Date()))

  const handleCellClick = async (studentId: number, studentName: string, date: string, currentStatus: string | undefined, holidayDates: Set<string>) => {
    if (holidayDates.has(date)) return
    const future = date > today()
    if (future) return

    if (!currentStatus) {
      // First time marking — directly mark present
      await window.api.attendance.mark({ student_id: studentId, batch_id: batchId, date, status: 'present' })
      loadWeek()
    } else {
      // Already marked — require comment to change
      setEditTarget({ student_id: studentId, name: studentName, date, currentStatus })
    }
  }

  const handleMarkAll = async (date: string, holidayDates: Set<string>) => {
    if (holidayDates.has(date) || date > today() || !batchId) return
    await window.api.attendance.markAll(batchId, date, 'present')
    loadWeek()
  }

  const handleExportCSV = async () => {
    if (!batchId || !weekData) return
    const weekEnd = addDays(weekStart, 6)
    const rows = await window.api.attendance.report(batchId, weekStart, weekEnd)
    const batch = batches.find((b) => b.id === batchId)
    exportToCsv(`attendance_${batch?.name || 'batch'}_${weekStart}.csv`, rows as Record<string, unknown>[])
  }

  const holidayDates = new Set(weekData?.holidays.map((h) => h.date) || [])
  const todayStr = today()

  // Summary counts for the week
  let totalPresent = 0, totalAbsent = 0, totalLeave = 0, totalHoliday = 0
  if (weekData) {
    weekData.students.forEach((s) => {
      weekData.dates.forEach((d) => {
        if (holidayDates.has(d)) { totalHoliday++ }
        else {
          const st = weekData.records[s.id]?.[d]
          if (st === 'present') totalPresent++
          else if (st === 'absent') totalAbsent++
          else if (st === 'leave') totalLeave++
        }
      })
    })
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Weekly batch-wise attendance tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowHolidays(true); loadHolidays() }}
            className="btn-secondary">
            <Star size={15} /> Holidays
          </button>
          <button onClick={handleExportCSV} disabled={!batchId || !weekData}
            className="btn-secondary disabled:opacity-40">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Controls Row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Batch Selector */}
          <div className="relative min-w-[220px]">
            <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select className="form-select pl-9 pr-8 appearance-none"
              value={batchId || ''} onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Select Batch</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.timing ? ` · ${b.timing}` : ''}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={prevWeek} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={thisWeek} className="px-3 py-1.5 text-xs font-semibold text-primary bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              This Week
            </button>
            <div className="text-center min-w-[160px]">
              <span className="text-sm font-semibold text-navy">
                {new Date(weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {' – '}
                {new Date(addDays(weekStart, 6)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <button onClick={nextWeek} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      {weekData && weekData.students.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Present', count: totalPresent, color: 'emerald', icon: <CheckCircle2 size={16} /> },
            { label: 'Absent',  count: totalAbsent,  color: 'red',     icon: <XCircle size={16} /> },
            { label: 'Leave',   count: totalLeave,   color: 'amber',   icon: <Clock size={16} /> },
            { label: 'Holiday', count: totalHoliday, color: 'gray',    icon: <Star size={16} /> }
          ].map((s) => (
            <div key={s.label} className={`bg-${s.color}-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-${s.color}-100`}>
              <span className={`text-${s.color}-600`}>{s.icon}</span>
              <div>
                <p className={`text-xl font-bold text-${s.color}-700`}>{s.count}</p>
                <p className={`text-xs text-${s.color}-600`}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Grid */}
      {!batchId ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center py-20 text-gray-400">
          <CalendarDays size={48} className="mb-3 opacity-20" />
          <p className="font-semibold text-base">Select a batch to view attendance</p>
          <p className="text-sm mt-1">Choose from the dropdown above</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : weekData && weekData.students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center py-20 text-gray-400">
          <Users size={48} className="mb-3 opacity-20" />
          <p className="font-semibold">No active students in this batch</p>
        </div>
      ) : weekData ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="sticky left-0 bg-navy px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider min-w-[180px] z-10">
                    Student
                  </th>
                  {weekData.dates.map((d) => {
                    const hdr = fmtDayHeader(d)
                    const isHoliday = holidayDates.has(d)
                    const isToday = d === todayStr
                    const holiday = weekData.holidays.find((h) => h.date === d)
                    return (
                      <th key={d} className={`px-3 py-3.5 text-center min-w-[90px] ${isToday ? 'bg-primary/80' : isHoliday ? 'bg-white/10' : ''}`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-white' : 'text-white/60'}`}>
                            {hdr.day}
                          </span>
                          <span className={`text-lg font-bold ${isToday ? 'text-white' : isHoliday ? 'text-white/40' : 'text-white'}`}>
                            {hdr.num}
                          </span>
                          {isHoliday && (
                            <span className="text-[9px] text-white/50 truncate max-w-[80px] px-1">
                              🎉 {holiday?.name}
                            </span>
                          )}
                          {!isHoliday && !isToday && (
                            <button
                              onClick={() => handleMarkAll(d, holidayDates)}
                              className="text-[9px] text-white/40 hover:text-white/80 transition-colors mt-0.5"
                              title="Mark all present"
                            >
                              Mark All
                            </button>
                          )}
                        </div>
                      </th>
                    )
                  })}
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-white/60 min-w-[80px]">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {weekData.students.map((student, idx) => {
                  let sPresent = 0, sTotal = 0
                  weekData.dates.forEach((d) => {
                    if (!holidayDates.has(d) && d <= todayStr) {
                      sTotal++
                      if (weekData.records[student.id]?.[d] === 'present') sPresent++
                    }
                  })
                  const pct = sTotal > 0 ? Math.round(sPresent / sTotal * 100) : null

                  return (
                    <tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                      <td className={`sticky left-0 px-5 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-xs font-bold">{student.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy leading-tight">{student.name}</p>
                            <p className="text-[11px] text-gray-400">{student.student_id}</p>
                          </div>
                        </div>
                      </td>
                      {weekData.dates.map((d) => {
                        const status = weekData.records[student.id]?.[d] as Status | undefined
                        const isHoliday = holidayDates.has(d)
                        const isFuture = d > todayStr
                        const cfg = status ? STATUS_CONFIG[status] : null

                        return (
                          <td key={d} className="px-2 py-2 text-center border-b border-gray-100">
                            {isHoliday ? (
                              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-400" title="Holiday">
                                <Star size={13} />
                              </div>
                            ) : isFuture ? (
                              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                                <span className="text-[10px] text-gray-300">—</span>
                              </div>
                            ) : cfg ? (
                              <button
                                onClick={() => handleCellClick(student.id, student.name, d, status, holidayDates)}
                                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${cfg.bg} ${cfg.text} font-bold text-sm hover:ring-2 ${cfg.ring} transition-all hover:scale-110`}
                                title={`${cfg.full} — click to edit`}
                              >
                                {cfg.label}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCellClick(student.id, student.name, d, undefined, holidayDates)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-dashed border-gray-300 text-gray-300 hover:border-primary hover:text-primary hover:bg-blue-50 transition-all hover:scale-110"
                                title="Click to mark present"
                              >
                                <Plus size={13} />
                              </button>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-center border-b border-gray-100">
                        {pct != null ? (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${pct >= 75 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                            {pct}%
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-400 font-medium">Legend:</span>
            {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
              <span key={cfg.label} className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
                <span className={`w-5 h-5 rounded ${cfg.bg} flex items-center justify-center font-bold text-xs ${cfg.text}`}>{cfg.label}</span>
                {cfg.full}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                <Star size={10} />
              </span>
              Holiday
            </span>
            <span className="text-xs text-gray-400 ml-auto">Click empty cell → mark Present · Click marked → edit (comment required)</span>
          </div>
        </div>
      ) : null}

      {/* Edit Attendance Modal */}
      {editTarget && (
        <EditModal
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); loadWeek() }}
          batchId={batchId!}
        />
      )}

      {/* Holidays Panel */}
      {showHolidays && (
        <HolidaysModal
          holidays={holidays}
          onClose={() => setShowHolidays(false)}
          onChanged={() => { loadHolidays(); loadWeek() }}
        />
      )}
    </div>
  )
}

// ─── Edit Attendance Modal ──────────────────────────────────────────────────
interface EditProps {
  target: { student_id: number; name: string; date: string; currentStatus: string }
  batchId: number
  onClose: () => void
  onSaved: () => void
}

function EditModal({ target, batchId, onClose, onSaved }: EditProps) {
  const [newStatus, setNewStatus] = useState<Status>(target.currentStatus as Status)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) { setErr('Comment is required to edit attendance.'); return }
    setSaving(true)
    await window.api.attendance.mark({
      student_id: target.student_id, batch_id: batchId,
      date: target.date, status: newStatus, comment: comment.trim()
    })
    onSaved()
  }

  const dateDisplay = new Date(target.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-md">
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-navy">Edit Attendance</h3>
            <p className="text-xs text-gray-500 mt-0.5">{target.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body space-y-4">
            {/* Date */}
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <CalendarDays size={15} />
              <span>{dateDisplay}</span>
            </div>

            {/* Current → New Status */}
            <div>
              <label className="form-label mb-2">Change Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['present', 'absent', 'leave'] as Status[]).map((s) => {
                  const cfg = STATUS_CONFIG[s]
                  return (
                    <button type="button" key={s}
                      onClick={() => setNewStatus(s)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${newStatus === s ? `border-current ${cfg.bg} ${cfg.text}` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      <span className={`w-8 h-8 rounded-lg ${newStatus === s ? cfg.bg : 'bg-gray-100'} ${newStatus === s ? cfg.text : 'text-gray-400'} flex items-center justify-center font-bold text-sm`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs font-semibold">{cfg.full}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mandatory Comment */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1">
                Reason / Comment
                <span className="text-red-500">*</span>
                <span className="text-gray-400 text-[10px] font-normal normal-case tracking-normal">(required to edit)</span>
              </label>
              <textarea className="form-input resize-none" rows={3}
                placeholder="Enter reason for change (e.g. Correcting data entry mistake, Medical leave confirmed...)"
                value={comment} onChange={(e) => { setComment(e.target.value); setErr('') }} />
              {err && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> {err}
                </p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Holidays Modal ──────────────────────────────────────────────────────────
interface HolidaysProps {
  holidays: Holiday[]
  onClose: () => void
  onChanged: () => void
}

function HolidaysModal({ holidays, onClose, onChanged }: HolidaysProps) {
  const [date, setDate] = useState(today())
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await window.api.holidays.add(date, name.trim())
    setName('')
    setSaving(false)
    onChanged()
  }

  const handleDelete = async (d: string) => {
    await window.api.holidays.delete(d)
    onChanged()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-md">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            <h3 className="font-bold text-navy">Manage Holidays</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body space-y-4">
          {/* Add Holiday */}
          <form onSubmit={handleAdd} className="bg-amber-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-800">Add Holiday</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Holiday Name</label>
                <input className="form-input" placeholder="e.g. Diwali" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              <Plus size={14} /> {saving ? 'Adding...' : 'Add Holiday'}
            </button>
          </form>

          {/* Holiday List */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              All Holidays ({holidays.length})
            </p>
            {holidays.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No holidays added yet</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {holidays.map((h) => (
                  <div key={h.date} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-navy">{h.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(h.date)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
