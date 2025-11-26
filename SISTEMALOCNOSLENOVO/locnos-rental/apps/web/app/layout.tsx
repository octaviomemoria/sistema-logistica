import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Locnos Admin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen">
        <div className="mx-auto max-w-6xl p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Locnos Admin</h1>
            <nav className="text-sm text-gray-600">
              <a className="mr-4" href="/">Dashboard</a>
              <a className="mr-4" href="/equipment">Equipamentos</a>
              <a className="mr-4" href="/customers">Clientes</a>
              <a href="/login">Login</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
