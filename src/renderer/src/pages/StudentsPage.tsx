import { useEffect, useState, useRef } from 'react'
import { Plus, Search, UserCheck, UserX, Eye, ChevronDown, X } from 'lucide-react'
import { formatDate, formatCurrency } from '../lib/utils'
import type { Student, Course, Batch } from '../types'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const debounceRef = useRef<NodeJS.Timeout>()

  const loadStudents = (q = '') => {
    window.api.students.list(q).then(setStudents)
  }

  useEffect(() => {
    loadStudents()
    window.api.courses.list().then(setCourses)
    window.api.batches.list().then(setBatches)
  }, [])

  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadStudents(v), 300)
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('Remove this student?')) return
    await window.api.students.deactivate(id)
    loadStudents(search)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} active students</p>
        </div>
        <button className="btn-primary" onClick={() => { setSelectedStudent(null); setShowModal(true) }}>
          <Plus size={16} />
          New Student
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card mb-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="search-input"
              placeholder="Search name, ID, phone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <select className="form-select w-40">
            <option value="">All Courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-select w-40">
            <option value="">All Batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Course / Batch</th>
                <th>Fee</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No students found</p>
                    <p className="text-xs mt-1">Add your first student to get started</p>
                  </td>
                </tr>
              ) : (
                students.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-gray-400 text-xs">{i + 1}</td>
                    <td>
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                        {s.student_id}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-navy text-sm">{s.name}</p>
                          {s.parent_name && (
                            <p className="text-xs text-gray-400">{s.parent_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{s.phone || '—'}</td>
                    <td>
                      <div>
                        <p className="text-sm font-medium">{s.course_name || '—'}</p>
                        {s.batch_name && (
                          <p className="text-xs text-gray-400">{s.batch_name}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-sm">{formatCurrency(s.fee_amount)}</p>
                        <p className="text-xs text-gray-400 capitalize">{s.fee_type}</p>
                      </div>
                    </td>
                    <td className="text-sm text-gray-500">{formatDate(s.join_date || s.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors"
                          onClick={() => { setSelectedStudent(s); setShowModal(true) }}
                          title="View / Edit"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                          onClick={() => handleDeactivate(s.id)}
                          title="Remove"
                        >
                          <UserX size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <StudentModal
          student={selectedStudent}
          courses={courses}
          batches={batches}
          onClose={() => setShowModal(false)}
          onSaved={() => { loadStudents(search); setShowModal(false) }}
        />
      )}
    </div>
  )
}

// ─── Student Modal ────────────────────────────────────────────────────────────
interface ModalProps {
  student: Student | null
  courses: Course[]
  batches: Batch[]
  onClose: () => void
  onSaved: () => void
}

const EMPTY = {
  name: '', phone: '', parent_name: '', parent_phone: '', email: '',
  address: '', batch_id: '', course_id: '', fee_type: 'monthly',
  fee_amount: '', discount: '0', join_date: new Date().toISOString().split('T')[0]
}

function StudentModal({ student, courses, batches, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState(
    student
      ? { ...student, batch_id: String(student.batch_id || ''), course_id: String(student.course_id || ''), fee_amount: String(student.fee_amount), discount: String(student.discount) }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      batch_id: form.batch_id ? Number(form.batch_id) : null,
      course_id: form.course_id ? Number(form.course_id) : null,
      fee_amount: Number(form.fee_amount),
      discount: Number(form.discount)
    }
    if (student) {
      await window.api.students.update(student.id, payload)
    } else {
      await window.api.students.create(payload)
    }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-2xl">
        <div className="modal-header">
          <h3 className="font-semibold text-navy">{student ? 'Edit Student' : 'New Student Registration'}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Student full name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="Mobile number" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="Email address" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Parent / Guardian Name</label>
              <input className="form-input" placeholder="Parent name" value={form.parent_name} onChange={(e) => set('parent_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Phone</label>
              <input className="form-input" placeholder="Parent mobile" value={form.parent_phone} onChange={(e) => set('parent_phone', e.target.value)} />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Address</label>
              <textarea className="form-input resize-none" rows={2} placeholder="Home address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Course</label>
              <select className="form-select" value={form.course_id} onChange={(e) => set('course_id', e.target.value)}>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Batch</label>
              <select className="form-select" value={form.batch_id} onChange={(e) => set('batch_id', e.target.value)}>
                <option value="">Select batch</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.timing ? `(${b.timing})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fee Type</label>
              <select className="form-select" value={form.fee_type} onChange={(e) => set('fee_type', e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fee Amount (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={form.fee_amount} onChange={(e) => set('fee_amount', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Discount (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={form.discount} onChange={(e) => set('discount', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Join Date</label>
              <input className="form-input" type="date" value={form.join_date} onChange={(e) => set('join_date', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : student ? 'Update Student' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
