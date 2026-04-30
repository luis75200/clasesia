import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getSession, login } from '../lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const loginMutation = useMutation({
    mutationFn: () =>
      login({
        email: email.trim(),
        name: name.trim() || undefined,
      }),
    onSuccess: () => {
      navigate('/projects')
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) return
    loginMutation.mutate()
  }

  useEffect(() => {
    getSession()
      .then(() => navigate('/projects', { replace: true }))
      .catch(() => undefined)
  }, [navigate])

  return (
    <main className="min-h-screen bg-surface p-8 text-inverse_surface flex items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-surface_container_low p-6 shadow-air space-y-4"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mini Jira Login</h1>
          <p className="mt-2 text-sm text-outline_variant">Login de prueba conectado al backend.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-outline_variant">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu-correo@empresa.com"
            className="w-full rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-outline_variant">Nombre (opcional)</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre Apellido"
            className="w-full rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
          />
        </div>

        {loginMutation.error instanceof Error ? (
          <p className="rounded-xl bg-error_container px-3 py-2 text-sm text-on_error_container">
            {loginMutation.error.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loginMutation.isPending || !email.trim()}
          className="w-full rounded-xl bg-gradient-to-br from-primary to-primary_dim px-4 py-2 text-sm font-semibold text-surface_container_lowest disabled:opacity-50"
        >
          {loginMutation.isPending ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </main>
  )
}
