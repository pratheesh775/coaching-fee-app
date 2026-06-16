import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Dashboard from '../../pages/Dashboard'
import StudentsPage from '../../pages/StudentsPage'
import FeeCollectionPage from '../../pages/FeeCollectionPage'
import ReportsPage from '../../pages/ReportsPage'
import CoursesPage from '../../pages/CoursesPage'
import BatchesPage from '../../pages/BatchesPage'
import SettingsPage from '../../pages/SettingsPage'

export type PageKey =
  | 'dashboard'
  | 'students'
  | 'fees'
  | 'reports'
  | 'courses'
  | 'batches'
  | 'settings'

const PAGES: Record<PageKey, React.ReactNode> = {
  dashboard: <Dashboard />,
  students: <StudentsPage />,
  fees: <FeeCollectionPage />,
  reports: <ReportsPage />,
  courses: <CoursesPage />,
  batches: <BatchesPage />,
  settings: <SettingsPage />
}

export default function AppShell() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="h-full flex bg-body">
      <Sidebar activePage={page} onNavigate={setPage} collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          page={page}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto p-6">{PAGES[page]}</main>
      </div>
    </div>
  )
}
