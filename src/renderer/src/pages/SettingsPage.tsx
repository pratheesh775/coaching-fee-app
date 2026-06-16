import { useEffect, useState } from 'react'
import { Building2, Save, FolderOpen, CheckCircle2 } from 'lucide-react'
import type { Institute } from '../types'

export default function SettingsPage() {
  const [institute, setInstitute] = useState<Partial<Institute>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dataPath, setDataPath] = useState('')

  useEffect(() => {
    window.api.institute.get().then((d) => d && setInstitute(d))
    window.api.app.dataPath().then(setDataPath)
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await window.api.institute.save(institute)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Institute details and app configuration</p>
        </div>
      </div>

      {/* Institute Details */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={18} className="text-primary" />
          <h2 className="font-semibold text-navy">Institute Details</h2>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Institute Name *</label>
            <input className="form-input" value={institute.name || ''} onChange={(e) => setInstitute({ ...institute, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-input resize-none" rows={2} value={institute.address || ''} onChange={(e) => setInstitute({ ...institute, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={institute.phone || ''} onChange={(e) => setInstitute({ ...institute, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={institute.email || ''} onChange={(e) => setInstitute({ ...institute, email: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Data & Backup */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <FolderOpen size={18} className="text-primary" />
          <h2 className="font-semibold text-navy">Data & Backup</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Database Location</p>
            <p className="text-sm font-mono text-gray-700 break-all">{dataPath}/coaching.db</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm font-semibold text-blue-800 mb-1">Google Drive Backup</p>
            <p className="text-xs text-blue-600 mb-3">Connect your Google Drive to automatically backup your data. Coming in v1.1</p>
            <button className="btn-outline btn-sm opacity-50 cursor-not-allowed" disabled>
              Connect Google Drive
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Your data is stored securely on this PC. To backup manually, copy the database file from the location above.
          </p>
        </div>
      </div>
    </div>
  )
}
