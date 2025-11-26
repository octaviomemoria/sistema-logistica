import React, { useEffect, useState } from 'react'
import { get, post, del } from '../api'

type Product = { id:number; name:string; available?:boolean }

export default function Products(){
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')

  async function load(){
    try{ const data = await get<Product[]>('/api/products'); setProducts(data) }catch(e){console.warn(e)}
  }

  useEffect(()=>{ load() }, [])

  async function create(){
    try{ await post('/api/products', { name }); setName(''); await load() }catch(e){alert('Erro')}
  }

  async function remove(id:number){ if(!confirm('Remover produto?')) return; try{ await del(`/api/products/${id}`); await load() }catch(e){alert('Erro')} }

  return (
    <div>
      <h2>Produtos</h2>
      <div className="form-row">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do produto" />
        <button onClick={create}>Criar</button>
      </div>
      <div className="list">
        {products.map(p=> (
          <div key={p.id} className="card">
            <strong>{p.name}</strong>
            <div>Disponível: {p.available ? 'sim' : 'não'}</div>
            <div className="actions"><button onClick={()=>remove(p.id)}>Remover</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}
