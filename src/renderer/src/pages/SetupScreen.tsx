import { useState } from 'react'
import { GraduationCap, Building2, Phone, Mail, MapPin, ArrowRight } from 'lucide-react'

interface Props {
  onComplete: () => void
}

export default function SetupScreen({ onComplete }: Props) {
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Institute name is required')
      return
    }
    setSaving(true)
    await window.api.institute.save(form)
    onComplete()
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-navy to-navy-light">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col justify-center px-16 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Fee Manager</p>
            <p className="text-white/50 text-xs">Coaching Institute System</p>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white leading-tight mb-4">
          Smart Fee Management
          <br />
          <span className="text-primary">for Your Institute</span>
        </h1>
        <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm">
          Manage student registrations, collect fees, generate receipts, and track dues — all
          offline, on your PC.
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {[
            'Student Registration',
            'Fee Collection',
            'Receipt Printing',
            'Due Tracking',
            'Monthly Reports',
            'Google Drive Backup'
          ].map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-white/70 text-xs">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Setup Form */}
      <div className="w-[420px] bg-white flex flex-col justify-center px-10 py-12">
        <h2 className="text-xl font-bold text-navy mb-1">Setup Your Institute</h2>
        <p className="text-gray-500 text-sm mb-8">Enter your institute details to get started.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Institute Name *</label>
            <div className="relative">
              <Building2
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="form-input pl-9"
                placeholder="e.g. Bright Future Academy"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <div className="relative">
              <MapPin
                size={15}
                className="absolute left-3.5 top-3.5 text-gray-400"
              />
              <textarea
                className="form-input pl-9 resize-none"
                rows={2}
                placeholder="Institute address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="form-input pl-9"
                  placeholder="Mobile number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="form-input pl-9"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary justify-center py-3 mt-2">
            {saving ? 'Setting up...' : 'Get Started'}
            {!saving && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-gray-400 text-xs text-center mt-6">
          © 2026 TravanSoft Solutions • v1.0.0
        </p>
      </div>
    </div>
  )
}
