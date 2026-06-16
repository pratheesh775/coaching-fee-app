import { useEffect, useState } from 'react'
import { Building2, Save, FolderOpen, CheckCircle2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import type { Institute } from '../types'

interface Props {
  currentUser: string
}

export default function SettingsPage({ currentUser }: Props) {
  const [institute, setInstitute] = useState<Partial<Institute>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dataPath, setDataPath] = useState('')

  // Password change
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (pwdForm.newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setPwdSaving(true)
    const res = await window.api.auth.changePassword(currentUser, pwdForm.current, pwdForm.newPwd)
    setPwdSaving(false)
    if (res.ok) {
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' })
      setPwdForm({ current: '', newPwd: '', confirm: '' })
      setTimeout(() => setPwdMsg(null), 3000)
    } else {
      setPwdMsg({ type: 'error', text: res.error || 'Failed to change password' })
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Institute details and account settings</p>
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
            <input className="form-input" value={institute.name || ''}
              onChange={(e) => setInstitute({ ...institute, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-input resize-none" rows={2} value={institute.address || ''}
              onChange={(e) => setInstitute({ ...institute, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={institute.phone || ''}
                onChange={(e) => setInstitute({ ...institute, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={institute.email || ''}
                onChange={(e) => setInstitute({ ...institute, email: e.target.value })} />
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

      {/* Change Password */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-primary" />
          <div>
            <h2 className="font-semibold text-navy">Change Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">Logged in as: <strong>{currentUser}</strong></p>
          </div>
          <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(!showPwd)}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {pwdMsg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4 ${pwdMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {pwdMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {pwdMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Enter current password"
              value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Minimum 6 characters"
                value={pwdForm.newPwd} onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Re-enter new password"
                value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} required />
            </div>
          </div>
          <div>
            <button type="submit" className="btn-primary" disabled={pwdSaving}>
              <Lock size={15} />
              {pwdSaving ? 'Updating...' : 'Update Password'}
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
            <p className="text-xs text-blue-600 mb-3">Auto-backup to Google Drive — coming in v1.1</p>
            <button className="btn-outline btn-sm opacity-50 cursor-not-allowed" disabled>
              Connect Google Drive
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Your data is stored securely on this PC. To backup manually, copy the database file from the location above.
          </p>
        </div>
      </div>

      {/* Powered by */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-300">
          Powered by <a href="https://techbysoul.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">TechBySoul</a>
          {' '}· techbysoul.com
        </p>
      </div>
    </div>
  )
}
