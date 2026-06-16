import { useEffect, useState } from 'react'
import { Plus, BookOpen, X } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import type { Course } from '../types'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showModal, setShowModal] = useState(false)

  const load = () => window.api.courses.list().then(setCourses)
  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">{courses.length} courses configured</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Course
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {courses.length === 0 ? (
          <div className="col-span-3 card flex flex-col items-center py-16 text-gray-400">
            <BookOpen size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No courses yet</p>
            <p className="text-xs mt-1">Add your first course to get started</p>
          </div>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen size={18} className="text-primary" />
                </div>
              </div>
              <h3 className="font-bold text-navy text-base mb-1">{c.name}</h3>
              {c.description && <p className="text-xs text-gray-500 mb-3">{c.description}</p>}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: 'Monthly', value: c.fee_monthly },
                  { label: 'Quarterly', value: c.fee_quarterly },
                  { label: 'Yearly', value: c.fee_yearly }
                ].map((f) => (
                  <div key={f.label} className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">{f.label}</p>
                    <p className="font-semibold text-sm text-navy">{formatCurrency(f.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <CourseModal onClose={() => setShowModal(false)} onSaved={() => { load(); setShowModal(false) }} />
      )}
    </div>
  )
}

function CourseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', fee_monthly: '0', fee_quarterly: '0', fee_yearly: '0' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await window.api.courses.create({ ...form, fee_monthly: Number(form.fee_monthly), fee_quarterly: Number(form.fee_quarterly), fee_yearly: Number(form.fee_yearly) })
    onSaved()
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="font-semibold text-navy">New Course</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Course Name *</label>
              <input className="form-input" placeholder="e.g. Mathematics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="form-group">
                <label className="form-label">Monthly Fee (₹)</label>
                <input className="form-input" type="number" min="0" value={form.fee_monthly} onChange={(e) => setForm({ ...form, fee_monthly: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Quarterly (₹)</label>
                <input className="form-input" type="number" min="0" value={form.fee_quarterly} onChange={(e) => setForm({ ...form, fee_quarterly: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Yearly (₹)</label>
                <input className="form-input" type="number" min="0" value={form.fee_yearly} onChange={(e) => setForm({ ...form, fee_yearly: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Course'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
