import { BrowserRouter, Route, Routes } from 'react-router-dom'
import TopNav from './layout/TopNav'
import HomePage from './pages/Home'
import ConnectionsPage from './pages/Connections'
import ActionsPage from './pages/Actions'
import KafkaAdminPage from './pages/KafkaAdmin'
import WorkflowsPage from './pages/Workflows'
import ResultsPage from './pages/Results'
import SettingsPage from './pages/Settings'
import { StoreProvider } from './state/store'

function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <div className="app-shell">
          <TopNav />
          <main className="page-shell">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/actions" element={<ActionsPage />} />
              <Route path="/kafka-admin" element={<KafkaAdminPage />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </StoreProvider>
    </BrowserRouter>
  )
}

export default App
