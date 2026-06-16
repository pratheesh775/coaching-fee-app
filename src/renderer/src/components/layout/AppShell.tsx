import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Dashboard from '../../pages/Dashboard'
import StudentsPage from '../../pages/StudentsPage'
import FeeCollectionPage from '../../pages/FeeCollectionPage'
import ReportsPage from '../../pages/ReportsPage'
import CoursesPage from '../../pages/CoursesPage'
import BatchesPage from '../../pages/BatchesPage'
import SubjectsPage from '../../pages/SubjectsPage'
import SettingsPage from '../../pages/SettingsPage'

export type PageKey =
  | 'dashboard' | 'students' | 'fees' | 'reports'
  | 'courses' | 'batches' | 'subjects' | 'settings'

interface Props {
  currentUser: string
}

export default function AppShell({ currentUser }: Props) {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [collectForStudent, setCollectForStudent] = useState<number | null>(null)

  const navigateToFees = (studentId: number) => {
    setCollectForStudent(studentId)
    setPage('fees')
  }

  return (
    <div className="h-full flex bg-body">
      <Sidebar activePage={page} onNavigate={(p) => { setPage(p); setCollectForStudent(null) }} collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header page={page} onToggleSidebar={() => setCollapsed((c) => !c)} currentUser={currentUser} />
        <main className="flex-1 overflow-y-auto p-6">
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page === 'students' && <StudentsPage onCollectFee={navigateToFees} />}
          {page === 'fees' && <FeeCollectionPage initialStudentId={collectForStudent} />}
          {page === 'reports' && <ReportsPage />}
          {page === 'courses' && <CoursesPage />}
          {page === 'batches' && <BatchesPage />}
          {page === 'subjects' && <SubjectsPage />}
          {page === 'settings' && <SettingsPage currentUser={currentUser} />}
        </main>
      </div>
    </div>
  )
}
