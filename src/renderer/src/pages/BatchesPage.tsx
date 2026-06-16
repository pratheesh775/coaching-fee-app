import { useEffect, useState } from 'react'
import { Plus, Clock, Users, X } from 'lucide-react'
import type { Batch, Course } from '../types'

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    window.api.batches.list().then(setBatches)
    window.api.courses.list().then(setCourses)
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">{batches.length} batches configured</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Batch
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {batches.length === 0 ? (
          <div className="col-span-3 card flex flex-col items-center py-16 text-gray-400">
            <Clock size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No batches yet</p>
            <p className="text-xs mt-1">Create batches for your courses</p>
          </div>
        ) : (
          batches.map((b) => (
            <div key={b.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Clock size={18} className="text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-sm">{b.name}</h3>
                  <p className="text-xs text-gray-400">{b.course_name || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
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
              {b.teacher && <p className="text-xs text-gray-400 mt-2">Teacher: {b.teacher}</p>}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <BatchModal courses={courses} onClose={() => setShowModal(false)} onSaved={() => { load(); setShowModal(false) }} />
      )}
    </div>
  )
}

function BatchModal({ courses, onClose, onSaved }: { courses: Course[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', course_id: '', timing: '', teacher: '', capacity: '30' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await window.api.batches.create({ ...form, course_id: form.course_id ? Number(form.course_id) : null, capacity: Number(form.capacity) })
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
              <input className="form-input" placeholder="e.g. Morning Batch A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Course</label>
              <select className="form-select" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Timing</label>
                <input className="form-input" placeholder="e.g. 8:00 AM – 10:00 AM" value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input className="form-input" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Teacher</label>
              <input className="form-input" placeholder="Teacher name" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
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
