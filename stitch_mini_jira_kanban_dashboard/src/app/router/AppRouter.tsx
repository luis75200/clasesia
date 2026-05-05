import { Navigate, Route, Routes } from 'react-router-dom'
import { BoardPage } from '../../pages/BoardPage'
import { DashboardPage } from '../../pages/DashboardPage'
import { LoginPage } from '../../pages/LoginPage'
import { ProjectsPage } from '../../pages/ProjectsPage'
import type { PropsWithChildren } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSession } from '../../lib/api'

function RequireAuth({ children }: PropsWithChildren) {
  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => getSession(),
    retry: false,
  })

  if (sessionQuery.isLoading) {
    return (
      <main className="min-h-screen bg-surface p-8 text-inverse_surface">
        <p className="text-sm text-outline_variant">Validando sesion...</p>
      </main>
    )
  }

  if (sessionQuery.isError) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/board"
        element={(
          <RequireAuth>
            <BoardPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/projects"
        element={(
          <RequireAuth>
            <ProjectsPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
