import { useState, useEffect } from 'react'
import AppShell from './components/layout/AppShell'
import SetupScreen from './pages/SetupScreen'

export default function App() {
  const [ready, setReady] = useState(false)
  const [hasInstitute, setHasInstitute] = useState(false)

  useEffect(() => {
    window.api.institute.get().then((data) => {
      setHasInstitute(!!data?.name)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center bg-body">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">C</span>
          </div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasInstitute) {
    return <SetupScreen onComplete={() => setHasInstitute(true)} />
  }

  return <AppShell />
}
