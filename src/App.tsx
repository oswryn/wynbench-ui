import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './layout/Sidebar'
import ConnectionsPage from './pages/Connections'
import ActionsPage from './pages/Actions'
import WorkflowsPage from './pages/Workflows'
import ResultsPage from './pages/Results'
import { StoreProvider } from './state/store'

function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <div className="app-shell">
          <Sidebar />
          <main className="page-shell">
            <Routes>
              <Route path="/" element={<Navigate to="/connections" replace />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/actions" element={<ActionsPage />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/results" element={<ResultsPage />} />
            </Routes>
          </main>
        </div>
      </StoreProvider>
    </BrowserRouter>
  )
}

export default App
