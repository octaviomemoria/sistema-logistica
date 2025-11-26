import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Products from './pages/Products'
import Contracts from './pages/Contracts'
import './styles.css'

export default function App(){
  return (
    <BrowserRouter>
      <div className="app-root">
        <nav className="navbar">
          <div className="brand">Locadora</div>
          <div className="links">
            <NavLink to="/" end className={({isActive}: {isActive: boolean})=> isActive? 'active' : undefined}>Dashboard</NavLink>
            <NavLink to="/clients" className={({isActive}: {isActive: boolean})=> isActive? 'active' : undefined}>Clientes</NavLink>
            <NavLink to="/products" className={({isActive}: {isActive: boolean})=> isActive? 'active' : undefined}>Produtos</NavLink>
            <NavLink to="/contracts" className={({isActive}: {isActive: boolean})=> isActive? 'active' : undefined}>Contratos</NavLink>
          </div>
        </nav>
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard/>} />
            <Route path="/clients" element={<Clients/>} />
            <Route path="/products" element={<Products/>} />
            <Route path="/contracts" element={<Contracts/>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
 
