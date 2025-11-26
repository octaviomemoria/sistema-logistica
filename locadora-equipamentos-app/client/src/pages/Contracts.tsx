import React, { useEffect, useState } from 'react'
import { get, post } from '../api'

type Contract = { id:number; productId:number; clientId:number; startDate?:string; endDate?:string }

export default function Contracts(){
  const [contracts, setContracts] = useState<Contract[]>([])

  async function load(){
    try{ const data = await get<Contract[]>('/api/contracts'); setContracts(data) }catch(e){console.warn(e)}
  }

  useEffect(()=>{ load() }, [])

  async function createDummy(){
    try{ await post('/api/contracts', { productId:1, clientId:1 }); await load() }catch(e){alert('Erro')}
  }

  return (
    <div>
      <h2>Contratos</h2>
      <div className="controls"><button onClick={createDummy}>Criar contrato de exemplo</button></div>
      <div className="list">
        {contracts.map(c=> (
          <div key={c.id} className="card">
            <div>Contrato #{c.id}</div>
            <div>Produto: {c.productId} | Cliente: {c.clientId}</div>
            <div>Período: {c.startDate ?? '-'} → {c.endDate ?? '-'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
