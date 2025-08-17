import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { AppProvider, useApp } from './context/AppContext'

function AppContent() {
  const { state, actions } = useApp();

  if (!state.isAuthenticated) {
    return <Login onLogin={actions.login} />
  }

  return <Dashboard onLogout={actions.logout} />
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
