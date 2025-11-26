'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@locnos.com')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) {
      setMessage('Falha no login')
      return
    }
    const data = await res.json()
    localStorage.setItem('token', data.token)
    setMessage('Login efetuado')
  }

  return (
    <main className="max-w-sm">
      <h2 className="mb-4 text-lg font-semibold">Login</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">Entrar</button>
      </form>
      {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
    </main>
  )
}
