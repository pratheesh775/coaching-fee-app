import { Menu, Bell, HelpCircle } from 'lucide-react'
import type { PageKey } from './AppShell'

const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  fees: 'Fee Collection',
  reports: 'Reports',
  courses: 'Courses',
  batches: 'Batches',
  settings: 'Settings'
}

interface Props {
  page: PageKey
  onToggleSidebar: () => void
}

export default function Header({ page, onToggleSidebar }: Props) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 flex-shrink-0 shadow-sm">
      <button
        onClick={onToggleSidebar}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1">
        <h1 className="font-semibold text-navy text-sm">{PAGE_LABELS[page]}</h1>
        <p className="text-xs text-gray-400">{today}</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors relative">
          <Bell size={16} />
        </button>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <HelpCircle size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      </div>
    </header>
  )
}
