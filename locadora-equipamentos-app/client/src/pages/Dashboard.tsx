import React from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard(){
  return (
    <div className="home">
      <section className="hero">
        <h1>Locadora de Equipamentos</h1>
        <p>Gerencie clientes, produtos e contratos de forma simples.</p>
      </section>

      <section className="grid">
        <Link to="/clients" className="tile">
          <div className="icon" aria-hidden>👤</div>
          <h3>Clientes</h3>
          <p>Cadastre e gerencie seus clientes.</p>
        </Link>

        <Link to="/products" className="tile">
          <div className="icon" aria-hidden>📦</div>
          <h3>Produtos</h3>
          <p>Controle o catálogo e disponibilidade.</p>
        </Link>

        <Link to="/contracts" className="tile">
          <div className="icon" aria-hidden>📃</div>
          <h3>Contratos</h3>
          <p>Crie e acompanhe os contratos ativos.</p>
        </Link>
      </section>
    </div>
  )
}
