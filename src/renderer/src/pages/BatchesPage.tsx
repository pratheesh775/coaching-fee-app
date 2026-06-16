import { useEffect, useState } from 'react'
import { Plus, Clock, Users, X, CheckCircle2, RotateCcw } from 'lucide-react'
import { formatDate } from '../lib/utils'
import type { Batch, Course } from '../types'

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const load = () => {
    window.api.batches.list(showCompleted).then(setBatches)
    window.api.courses.list().then(setCourses)
  }

  useEffect(() => { load() }, [showCompleted])

  const handleComplete = async (id: number, name: string) => {
    if (!confirm(`Mark batch "${name}" as completed? All students in this batch will be deactivated.`)) return
    await window.api.batches.complete(id)
    load()
  }

  const handleReactivate = async (id: number, name: string) => {
    if (!confirm(`Reactivate batch "${name}"? Students in this batch will be reactivated.`)) return
    await window.api.batches.reactivate(id)
    load()
  }

  const active = batches.filter((b) => b.status !== 'completed')
  const completed = batches.filter((b) => b.status === 'completed')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">{active.length} active · {completed.length} completed</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" className="rounded" checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)} />
            Show completed
          </label>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Batch
          </button>
        </div>
      </div>

      {/* Active Batches */}
      {active.length > 0 && (
        <>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Active Batches</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {active.map((b) => (
              <BatchCard key={b.id} batch={b}
                onComplete={() => handleComplete(b.id, b.name)}
                onReactivate={() => handleReactivate(b.id, b.name)} />
            ))}
          </div>
        </>
      )}

      {/* Completed Batches */}
      {showCompleted && completed.length > 0 && (
        <>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Completed Batches</p>
          <div className="grid grid-cols-3 gap-4">
            {completed.map((b) => (
              <BatchCard key={b.id} batch={b}
                onComplete={() => handleComplete(b.id, b.name)}
                onReactivate={() => handleReactivate(b.id, b.name)} />
            ))}
          </div>
        </>
      )}

      {batches.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-gray-400">
          <Clock size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No batches yet</p>
          <p className="text-xs mt-1">Create batches for your courses</p>
        </div>
      )}

      {showModal && (
        <BatchModal courses={courses} onClose={() => setShowModal(false)} onSaved={() => { load(); setShowModal(false) }} />
      )}
    </div>
  )
}

function BatchCard({ batch: b, onComplete, onReactivate }: { batch: Batch; onComplete: () => void; onReactivate: () => void }) {
  const isCompleted = b.status === 'completed'
  return (
    <div className={`card ${isCompleted ? 'opacity-70 border-dashed' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-gray-100' : 'bg-purple-50'}`}>
          {isCompleted
            ? <CheckCircle2 size={18} className="text-gray-400" />
            : <Clock size={18} className="text-purple-500" />}
        </div>
        <div>
          <h3 className="font-bold text-navy text-sm">{b.name}</h3>
          <p className="text-xs text-gray-400">{b.course_name || '—'}</p>
        </div>
        {isCompleted && (
          <span className="ml-auto text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">Completed</span>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm mb-3">
        {b.timing && (
          <div className="flex items-center gap-1 text-gray-600">
            <Clock size={13} className="text-gray-400" />
            {b.timing}
          </div>
        )}
        <div className="flex items-center gap-1 text-gray-600">
          <Users size={13} className="text-gray-400" />
          {b.capacity} seats
        </div>
      </div>
      {b.teacher && <p className="text-xs text-gray-400 mb-3">Teacher: {b.teacher}</p>}
      {isCompleted && b.completed_date && (
        <p className="text-xs text-gray-400 mb-3">Completed on: {formatDate(b.completed_date)}</p>
      )}
      <div className="border-t border-gray-100 pt-3">
        {!isCompleted ? (
          <button onClick={onComplete}
            className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium">
            <CheckCircle2 size={13} /> Mark as Completed
          </button>
        ) : (
          <button onClick={onReactivate}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
            <RotateCcw size={13} /> Reactivate Batch
          </button>
        )}
      </div>
    </div>
  )
}

function BatchModal({ courses, onClose, onSaved }: { courses: Course[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', course_id: '', timing: '', teacher: '', capacity: '30' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await window.api.batches.create({ ...form, course_id: form.course_id ? Number(form.course_id) : undefined, capacity: Number(form.capacity) })
    onSaved()
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="font-semibold text-navy">New Batch</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Batch Name *</label>
              <input className="form-input" placeholder="e.g. Morning Batch A" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Course</label>
              <select className="form-select" value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Timing</label>
                <input className="form-input" placeholder="e.g. 8:00 AM – 10:00 AM" value={form.timing}
                  onChange={(e) => setForm({ ...form, timing: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input className="form-input" type="number" min="1" value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Teacher</label>
              <input className="form-input" placeholder="Teacher name" value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Batch'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
