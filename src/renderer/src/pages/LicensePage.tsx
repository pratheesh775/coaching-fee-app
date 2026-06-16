import { useState, useRef } from 'react'
import { KeyRound, ShieldCheck, AlertCircle, Loader2, GraduationCap } from 'lucide-react'

interface Props {
  onActivated: () => void
}

// Segments: [4-char, 3-char "HGA", 2-char "AS"]
const SEG_LENGTHS = [4, 3, 2]
const TOTAL_CHARS = 9 // 4+3+2

function parseRaw(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, TOTAL_CHARS)
}

function formatKey(raw: string): string {
  const clean = parseRaw(raw)
  let out = ''
  let pos = 0
  for (let s = 0; s < SEG_LENGTHS.length; s++) {
    if (pos > 0 && pos < clean.length) out += '-'
    out += clean.slice(pos, pos + SEG_LENGTHS[s])
    pos += SEG_LENGTHS[s]
  }
  return out
}

function isComplete(raw: string): boolean {
  return parseRaw(raw).length === TOTAL_CHARS
}

export default function LicensePage({ onActivated }: Props) {
  const [rawInput, setRawInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = formatKey(rawInput)
  const filled = isComplete(rawInput)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prev = parseRaw(rawInput)
    const next = parseRaw(e.target.value)

    // Allow backspace past dashes naturally
    if (next.length <= TOTAL_CHARS) {
      setRawInput(next)
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Let backspace remove the raw char before the dash position
    if (e.key === 'Backspace') {
      const clean = parseRaw(rawInput)
      if (clean.length > 0) {
        setRawInput(clean.slice(0, -1))
        e.preventDefault()
      }
    }
  }

  const handleActivate = async () => {
    const key = formatKey(rawInput)
    if (!filled) { setError('Please enter the complete license key.'); return }
    setLoading(true)
    setError('')
    const res = await window.api.license.activate(key)
    if (res.ok) {
      setSuccess(true)
      setTimeout(onActivated, 1200)
    } else {
      setError(res.error || 'Activation failed.')
    }
    setLoading(false)
  }

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-navy via-[#1a2d5a] to-[#0d1b3e]">
      {/* Subtle background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-blue-400 to-primary" />

          <div className="px-8 py-8">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
                {success
                  ? <ShieldCheck size={28} className="text-white" />
                  : <KeyRound size={28} className="text-white" />
                }
              </div>
              <h1 className="text-xl font-bold text-navy">
                {success ? 'Activation Successful!' : 'Activate Your License'}
              </h1>
              <p className="text-sm text-gray-500 mt-1 text-center">
                {success
                  ? 'Your software is now fully activated. Launching...'
                  : 'Enter the license key to unlock Fee Manager Pro'}
              </p>
            </div>

            {!success && (
              <>
                {/* Key Input */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    License Key
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={displayValue}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      placeholder="XXXX-HGA-AS"
                      spellCheck={false}
                      autoComplete="off"
                      className={`w-full text-center text-2xl font-mono font-bold tracking-[0.25em] py-4 px-4 rounded-xl border-2 transition-all outline-none uppercase
                        ${error
                          ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-400'
                          : filled
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-gray-50 text-navy focus:border-primary focus:bg-white'
                        }`}
                    />
                    {/* Segment dividers hint */}
                    {!rawInput && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <span className="text-gray-300 text-2xl font-mono tracking-[0.25em] select-none">
                          _ _ _ _ – H G A – A S
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Visual segment guide */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {SEG_LENGTHS.map((len, si) => {
                      const start = SEG_LENGTHS.slice(0, si).reduce((a, b) => a + b, 0)
                      const clean = parseRaw(rawInput)
                      const filled_count = Math.min(Math.max(0, clean.length - start), len)
                      return (
                        <div key={si} className="flex gap-1">
                          {si > 0 && <span className="text-gray-300 text-xs font-bold leading-4">–</span>}
                          {Array.from({ length: len }).map((_, i) => (
                            <div key={i} className={`w-5 h-1.5 rounded-full transition-colors ${i < filled_count ? 'bg-primary' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  {error && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2 font-medium">
                      <AlertCircle size={13} /> {error}
                    </p>
                  )}
                </div>

                {/* Activate Button */}
                <button
                  onClick={handleActivate}
                  disabled={loading || !filled}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                    ${filled && !loading
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.01]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                    : <><KeyRound size={16} /> Activate Software</>
                  }
                </button>
              </>
            )}

            {success && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck size={32} className="text-emerald-500" />
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <GraduationCap size={14} />
              <span className="text-xs font-medium">Fee Manager Pro</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Need a key?</p>
              <p className="text-xs font-semibold text-primary">techbysoul.com</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-4">
          © 2026 TechBySoul · v1.0.0
        </p>
      </div>
    </div>
  )
}
