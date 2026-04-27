import { Navigate, Route, Routes } from 'react-router-dom'
import { BoardPage } from '../../pages/BoardPage'
import { DashboardPage } from '../../pages/DashboardPage'
import { LoginPage } from '../../pages/LoginPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/board" replace />} />
    </Routes>
  )
}
