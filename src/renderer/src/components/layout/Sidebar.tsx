import {
  LayoutDashboard, Users, IndianRupee, BarChart3,
  BookOpen, Clock, Settings, GraduationCap, Layers
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { PageKey } from './AppShell'

interface NavItem {
  key: PageKey
  label: string
  icon: React.ReactNode
  section?: string
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, section: 'MAIN' },
  { key: 'students', label: 'Students', icon: <Users size={18} /> },
  { key: 'fees', label: 'Fee Collection', icon: <IndianRupee size={18} /> },
  { key: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, section: 'MANAGEMENT' },
  { key: 'courses', label: 'Courses', icon: <BookOpen size={18} /> },
  { key: 'batches', label: 'Batches', icon: <Clock size={18} /> },
  { key: 'subjects', label: 'Subjects', icon: <Layers size={18} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={18} />, section: 'SYSTEM' }
]

interface Props {
  activePage: PageKey
  onNavigate: (p: PageKey) => void
  collapsed: boolean
}

export default function Sidebar({ activePage, onNavigate, collapsed }: Props) {
  let currentSection = ''

  return (
    <aside className={cn('flex flex-col bg-navy transition-all duration-200 flex-shrink-0', collapsed ? 'w-16' : 'w-56')}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">Fee Manager</p>
            <p className="text-white/40 text-xs">Coaching Institute</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((item) => {
          const showSection = item.section && item.section !== currentSection
          if (item.section) currentSection = item.section
          return (
            <div key={item.key}>
              {showSection && !collapsed && (
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-5 pt-4 pb-1.5">
                  {item.section}
                </p>
              )}
              <button
                onClick={() => onNavigate(item.key)}
                className={cn(
                  'nav-item w-full text-left',
                  activePage === item.key && 'active',
                  collapsed && 'justify-center px-0 mx-0 w-full rounded-none'
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-white/30 text-xs">v1.0.0 · TechBySoul</p>
          <p className="text-white/20 text-[10px]">techbysoul.com</p>
        </div>
      )}
    </aside>
  )
}
