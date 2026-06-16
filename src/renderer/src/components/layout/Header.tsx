import { useState, useEffect, useRef } from 'react'
import { Menu, AlertCircle, LogOut, Settings, User } from 'lucide-react'
import type { PageKey } from './AppShell'

const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: 'Dashboard', students: 'Students', fees: 'Fee Collection',
  reports: 'Reports', courses: 'Courses', batches: 'Batches',
  subjects: 'Subjects', attendance: 'Attendance', settings: 'Settings'
}

interface Props {
  page: PageKey
  onToggleSidebar: () => void
  currentUser: string
  onNavigate: (page: PageKey) => void
  onLogout: () => void
}

export default function Header({ page, onToggleSidebar, currentUser, onNavigate, onLogout }: Props) {
  const [dueCount, setDueCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.students.getDuesList().then((list) => setDueCount(list.length))
  }, [page])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 flex-shrink-0 shadow-sm">
      <button onClick={onToggleSidebar}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
        <Menu size={18} />
      </button>

      <div className="flex-1">
        <h1 className="font-semibold text-navy text-sm">{PAGE_LABELS[page]}</h1>
        <p className="text-xs text-gray-400">{dateStr}</p>
      </div>

      <div className="flex items-center gap-2">
        {dueCount > 0 && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-xs font-medium">
            <AlertCircle size={14} />
            {dueCount} dues pending
          </button>
        )}

        {/* User Avatar + Dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-all ${menuOpen ? 'bg-primary/10 ring-2 ring-primary/20' : 'hover:bg-gray-100'}`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">{currentUser.charAt(0).toUpperCase() || 'A'}</span>
            </div>
            <span className="text-xs font-semibold text-navy max-w-[80px] truncate">{currentUser}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
              {/* User info */}
              <div className="px-4 py-2.5 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{currentUser.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{currentUser}</p>
                    <p className="text-[11px] text-gray-400">Administrator</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <button
                onClick={() => { setMenuOpen(false); onNavigate('settings') }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Settings size={15} className="text-gray-400" />
                Settings
              </button>

              <button
                onClick={() => { setMenuOpen(false); onNavigate('settings') }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <User size={15} className="text-gray-400" />
                Change Password
              </button>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => { setMenuOpen(false); onLogout() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut size={15} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
