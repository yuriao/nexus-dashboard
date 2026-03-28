import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import Feed from './pages/Feed'
import './index.css'

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/nexus-dashboard">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><AppLayout><Dashboard /></AppLayout></Protected>} />
        <Route path="/companies" element={<Protected><AppLayout><Companies /></AppLayout></Protected>} />
        <Route path="/companies/:id" element={<Protected><AppLayout><Companies /></AppLayout></Protected>} />
        <Route path="/reports" element={<Protected><AppLayout><Reports /></AppLayout></Protected>} />
        <Route path="/reports/:id" element={<Protected><AppLayout><ReportDetail /></AppLayout></Protected>} />
        <Route path="/feed" element={<Protected><AppLayout><Feed /></AppLayout></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
