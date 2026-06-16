import { useState, useEffect } from 'react'
import AppShell from './components/layout/AppShell'
import SetupScreen from './pages/SetupScreen'
import AuthPage from './pages/AuthPage'

type AppState = 'loading' | 'auth' | 'setup' | 'app'

export default function App() {
  const [state, setState] = useState<AppState>('loading')
  const [isFirstRun, setIsFirstRun] = useState(false)
  const [currentUser, setCurrentUser] = useState('')

  useEffect(() => {
    window.api.auth.hasUsers().then((has) => {
      if (!has) {
        setIsFirstRun(true)
        setState('auth')
      } else {
        setState('auth')
      }
    })
  }, [])

  const handleAuthenticated = async (username: string) => {
    setCurrentUser(username)
    const institute = await window.api.institute.get()
    setState(institute?.name ? 'app' : 'setup')
  }

  const handleSetupComplete = () => setState('app')

  if (state === 'loading') {
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

  if (state === 'auth') {
    return <AuthPage isFirstRun={isFirstRun} onAuthenticated={handleAuthenticated} />
  }

  if (state === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} />
  }

  return <AppShell currentUser={currentUser} />
}
