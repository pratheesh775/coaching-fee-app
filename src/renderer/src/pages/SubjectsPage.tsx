import { useEffect, useState } from 'react'
import { Plus, Layers, Pencil, Trash2, X, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import type { Subject } from '../types'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)

  const load = () => window.api.subjects.list().then(setSubjects)
  useEffect(() => { load() }, [])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove subject "${name}"?`)) return
    await window.api.subjects.delete(id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-subtitle">{subjects.length} subjects configured</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus size={16} /> New Subject
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {subjects.length === 0 ? (
          <div className="col-span-3 card flex flex-col items-center py-16 text-gray-400">
            <Layers size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No subjects yet</p>
            <p className="text-xs mt-1">Add subjects to enable subject-wise fee configuration for students</p>
          </div>
        ) : (
          subjects.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Layers size={18} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy text-sm">{s.name}</h3>
                  {s.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Monthly Fee</p>
                  <p className="font-bold text-navy">{formatCurrency(s.fee_monthly)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50"
                    onClick={() => { setEditing(s); setShowModal(true) }} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50"
                    onClick={() => handleDelete(s.id, s.name)} title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <SubjectModal
          subject={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { load(); setShowModal(false) }}
        />
      )}
    </div>
  )
}

function SubjectModal({ subject, onClose, onSaved }: { subject: Subject | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: subject?.name || '',
    description: subject?.description || '',
    fee_monthly: String(subject?.fee_monthly || '')
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = { name: form.name, description: form.description, fee_monthly: Number(form.fee_monthly) }
    if (subject) {
      await window.api.subjects.update(subject.id, data)
    } else {
      await window.api.subjects.create(data)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(onSaved, 500)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="font-semibold text-navy">{subject ? 'Edit Subject' : 'New Subject'}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input className="form-input" placeholder="e.g. Mathematics, Physics, English" autoFocus
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="Optional description"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Fee (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="0"
                value={form.fee_monthly} onChange={(e) => setForm({ ...form, fee_monthly: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saved ? <><CheckCircle2 size={15} /> Saved!</> : saving ? 'Saving...' : subject ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
