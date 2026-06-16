import { useEffect, useState, useRef } from 'react'
import {
  Plus, Search, UserX, Eye, X, IndianRupee,
  MessageCircle, Download, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react'
import { formatDate, formatCurrency, exportToCsv, openWhatsApp, today } from '../lib/utils'
import type { Student, Course, Batch, Subject, StudentSubject } from '../types'

const PAGE_SIZE = 20

interface Props {
  onCollectFee: (studentId: number) => void
}

export default function StudentsPage({ onCollectFee }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [dues, setDues] = useState<Record<number, number>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const loadStudents = (q = search, p = page, inactive = showInactive) => {
    window.api.students.list({
      search: q,
      course_id: filterCourse ? Number(filterCourse) : undefined,
      batch_id: filterBatch ? Number(filterBatch) : undefined,
      show_inactive: inactive
    }).then((all) => {
      setTotal(all.length)
      setStudents(all.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE))
      // Load dues for visible students
      all.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE).forEach((s) => {
        window.api.students.getDue(s.id).then((d) => {
          if (d.due_amount > 0) setDues((prev) => ({ ...prev, [s.id]: d.due_amount }))
        })
      })
    })
  }

  useEffect(() => {
    window.api.courses.list().then(setCourses)
    window.api.batches.list(true).then(setBatches)
  }, [])

  useEffect(() => { loadStudents(search, page) }, [page, filterCourse, filterBatch, showInactive])

  const handleSearch = (v: string) => {
    setSearch(v); setPage(1)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadStudents(v, 1), 300)
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('Remove this student from active list?')) return
    await window.api.students.deactivate(id)
    loadStudents()
  }

  const handleExport = async () => {
    const all = await window.api.students.list({ search, show_inactive: showInactive })
    exportToCsv(`students_${today()}.csv`, all.map((s) => ({
      'Student ID': s.student_id, 'Name': s.name, 'Phone': s.phone || '',
      'Parent Name': s.parent_name || '', 'Parent Phone': s.parent_phone || '',
      'Email': s.email || '', 'Course': s.course_name || '', 'Batch': s.batch_name || '',
      'Fee Type': s.fee_type, 'Fee Amount': s.fee_amount, 'Discount': s.discount,
      'Join Date': s.join_date || '', 'Status': s.is_active ? 'Active' : 'Inactive'
    })))
  }

  const whatsappStudent = (s: Student) => {
    const phone = s.parent_phone || s.phone || ''
    if (!phone) { alert('No phone number found for this student.'); return }
    const due = dues[s.id] || 0
    const msg = due > 0
      ? `Dear ${s.parent_name || s.name}, this is a reminder that *${s.name}*'s fee of *₹${due}* is due. Please pay at the earliest. Thank you!`
      : `Dear ${s.parent_name || s.name}, thank you for being a valued student at our institute. For any queries, please contact us.`
    openWhatsApp(phone, msg)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{total} students{showInactive ? '' : ' active'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={15} />
            Export CSV
          </button>
          <button className="btn-primary" onClick={() => { setSelectedStudent(null); setShowModal(true) }}>
            <Plus size={16} /> New Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="search-input" placeholder="Search name, ID, phone..."
              value={search} onChange={(e) => handleSearch(e.target.value)} />
          </div>
          <select className="form-select w-40" value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setPage(1) }}>
            <option value="">All Courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-select w-40" value={filterBatch}
            onChange={(e) => { setFilterBatch(e.target.value); setPage(1) }}>
            <option value="">All Batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.status === 'completed' ? ' ✓' : ''}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" className="rounded" checked={showInactive}
              onChange={(e) => { setShowInactive(e.target.checked); setPage(1) }} />
            Show inactive
          </label>
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
                <th>Fee / Due</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <p className="font-medium">No students found</p>
                  </td>
                </tr>
              ) : (
                students.map((s, i) => {
                  const due = dues[s.id] || 0
                  return (
                    <tr key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                      <td className="text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td>
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                          {s.student_id}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-xs font-bold">{s.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-navy text-sm">{s.name}</p>
                            {s.parent_name && <p className="text-xs text-gray-400">{s.parent_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{s.phone || '—'}</td>
                      <td>
                        <div>
                          <p className="text-sm font-medium">{s.course_name || '—'}</p>
                          {s.batch_name && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              {s.batch_name}
                              {s.batch_status === 'completed' && (
                                <span className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded">Completed</span>
                              )}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-semibold text-sm">{formatCurrency(s.fee_amount)}</p>
                          <p className="text-xs text-gray-400 capitalize">{s.fee_structure === 'subject_wise' ? 'Subject-wise' : s.fee_type}</p>
                          {due > 0 && (
                            <p className="text-xs text-orange-600 font-semibold flex items-center gap-0.5 mt-0.5">
                              <AlertTriangle size={11} />
                              Due: {formatCurrency(due)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-sm text-gray-500">{formatDate(s.join_date || s.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors"
                            onClick={() => { setSelectedStudent(s); setShowModal(true) }} title="View / Edit">
                            <Eye size={14} />
                          </button>
                          {s.is_active && (
                            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-success hover:bg-green-50 transition-colors"
                              onClick={() => onCollectFee(s.id)} title="Collect Fee">
                              <IndianRupee size={14} />
                            </button>
                          )}
                          {(s.phone || s.parent_phone) && (
                            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-green-500 hover:bg-green-50 transition-colors"
                              onClick={() => whatsappStudent(s)} title="WhatsApp">
                              <MessageCircle size={14} />
                            </button>
                          )}
                          {s.is_active && (
                            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                              onClick={() => handleDeactivate(s.id)} title="Remove">
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pg === page ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {pg}
                  </button>
                )
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <StudentModal
          student={selectedStudent}
          courses={courses}
          batches={batches}
          onClose={() => setShowModal(false)}
          onSaved={() => { loadStudents(); setShowModal(false) }}
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
  address: '', batch_id: '', course_id: '', fee_type: 'monthly' as const,
  fee_structure: 'flat' as const, fee_amount: '', discount: '0',
  due_date_type: 'joining_date' as const, due_date_day: '1',
  join_date: today()
}

function StudentModal({ student, courses, batches, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState(
    student
      ? {
          ...student,
          batch_id: String(student.batch_id || ''), course_id: String(student.course_id || ''),
          fee_amount: String(student.fee_amount), discount: String(student.discount),
          due_date_day: String(student.due_date_day || 1)
        }
      : EMPTY
  )
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [studentSubjects, setStudentSubjects] = useState<StudentSubject[]>([])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
  const [subjectOverrides, setSubjectOverrides] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'fee' | 'subjects'>('basic')

  useEffect(() => {
    window.api.subjects.list().then(setSubjects)
    if (student) {
      window.api.studentSubjects.get(student.id).then((ss) => {
        setStudentSubjects(ss)
        setSelectedSubjectIds(ss.map((s) => s.subject_id))
        const overrides: Record<number, string> = {}
        ss.forEach((s) => { if (s.fee_override) overrides[s.subject_id] = String(s.fee_override) })
        setSubjectOverrides(overrides)
      })
    }
  }, [student])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const toggleSubject = (id: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const subjectTotal = subjects
    .filter((s) => selectedSubjectIds.includes(s.id))
    .reduce((sum, s) => sum + Number(subjectOverrides[s.id] || s.fee_monthly), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      batch_id: form.batch_id ? Number(form.batch_id) : null,
      course_id: form.course_id ? Number(form.course_id) : null,
      fee_amount: form.fee_structure === 'subject_wise' ? subjectTotal : Number(form.fee_amount),
      discount: Number(form.discount),
      due_date_day: Number(form.due_date_day) || 1
    }
    let savedId = student?.id
    if (student) {
      await window.api.students.update(student.id, payload)
    } else {
      const res = await window.api.students.create(payload)
      savedId = res.id
    }
    // Save subjects if subject_wise
    if (form.fee_structure === 'subject_wise' && savedId) {
      await window.api.studentSubjects.set(
        savedId,
        selectedSubjectIds.map((id) => ({
          subject_id: id,
          fee_override: subjectOverrides[id] ? Number(subjectOverrides[id]) : undefined
        }))
      )
    }
    onSaved()
  }

  const activeBatches = batches.filter((b) => b.status !== 'completed')

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-2xl">
        <div className="modal-header">
          <h3 className="font-semibold text-navy">{student ? 'Edit Student' : 'New Student Registration'}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {(['basic', 'fee', 'subjects'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'fee' ? 'Fee Config' : tab === 'subjects' ? 'Subjects' : 'Basic Info'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group col-span-2">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Student full name" value={form.name}
                    onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="Mobile number" value={form.phone}
                    onChange={(e) => set('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="Email address" value={form.email}
                    onChange={(e) => set('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent / Guardian Name</label>
                  <input className="form-input" placeholder="Parent name" value={form.parent_name}
                    onChange={(e) => set('parent_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Phone</label>
                  <input className="form-input" placeholder="Parent mobile" value={form.parent_phone}
                    onChange={(e) => set('parent_phone', e.target.value)} />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label">Address</label>
                  <textarea className="form-input resize-none" rows={2} placeholder="Home address"
                    value={form.address} onChange={(e) => set('address', e.target.value)} />
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
                    {activeBatches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.timing ? `(${b.timing})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date</label>
                  <input className="form-input" type="date" value={form.join_date}
                    onChange={(e) => set('join_date', e.target.value)} />
                </div>
              </div>
            )}

            {/* Fee Config Tab */}
            {activeTab === 'fee' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Fee Structure</label>
                    <select className="form-select" value={form.fee_structure}
                      onChange={(e) => set('fee_structure', e.target.value)}>
                      <option value="flat">Flat Fee</option>
                      <option value="subject_wise">Subject-wise</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fee Frequency</label>
                    <select className="form-select" value={form.fee_type}
                      onChange={(e) => set('fee_type', e.target.value)}>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {form.fee_structure === 'flat' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Fee Amount (₹)</label>
                      <input className="form-input" type="number" min="0" value={form.fee_amount}
                        onChange={(e) => set('fee_amount', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Discount (₹)</label>
                      <input className="form-input" type="number" min="0" value={form.discount}
                        onChange={(e) => set('discount', e.target.value)} />
                    </div>
                  </div>
                )}

                {form.fee_structure === 'subject_wise' && (
                  <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                    Go to <strong>Subjects tab</strong> to assign subjects and their fees.
                    Total: <strong>{formatCurrency(subjectTotal)}</strong>
                    {Number(form.discount) > 0 && <> (after discount: {formatCurrency(subjectTotal - Number(form.discount))})</>}
                    <div className="mt-2">
                      <label className="form-label text-blue-700">Discount (₹)</label>
                      <input className="form-input mt-1" type="number" min="0" value={form.discount}
                        onChange={(e) => set('discount', e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-navy mb-3">Due Date Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Due Date Type</label>
                      <select className="form-select" value={form.due_date_type}
                        onChange={(e) => set('due_date_type', e.target.value)}>
                        <option value="joining_date">Same day as joining (e.g., joined 15th → due 15th each month)</option>
                        <option value="specific_date">Specific date every month</option>
                      </select>
                    </div>
                    {form.due_date_type === 'specific_date' && (
                      <div className="form-group">
                        <label className="form-label">Due Day (1–28)</label>
                        <input className="form-input" type="number" min="1" max="28"
                          value={form.due_date_day} onChange={(e) => set('due_date_day', e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Subjects Tab */}
            {activeTab === 'subjects' && (
              <div className="flex flex-col gap-3">
                {subjects.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No subjects configured. Add subjects from the Subjects page first.</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">Select subjects for this student. Optionally override the fee per subject.</p>
                    {subjects.map((sub) => {
                      const checked = selectedSubjectIds.includes(sub.id)
                      return (
                        <div key={sub.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${checked ? 'border-primary bg-blue-50' : 'border-gray-200'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleSubject(sub.id)}
                            className="w-4 h-4 rounded text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-navy">{sub.name}</p>
                            <p className="text-xs text-gray-400">Default: {formatCurrency(sub.fee_monthly)}/month</p>
                          </div>
                          {checked && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Override ₹</span>
                              <input type="number" min="0" placeholder={String(sub.fee_monthly)}
                                className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm"
                                value={subjectOverrides[sub.id] || ''}
                                onChange={(e) => setSubjectOverrides((prev) => ({ ...prev, [sub.id]: e.target.value }))} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {selectedSubjectIds.length > 0 && (
                      <div className="bg-green-50 rounded-xl p-3 text-sm font-semibold text-green-800 text-right">
                        Total: {formatCurrency(subjectTotal)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
