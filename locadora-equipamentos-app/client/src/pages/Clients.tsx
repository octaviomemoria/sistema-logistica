import React, { useEffect, useMemo, useRef, useState } from 'react'
import { get, post, put, del } from '../api'

// Enumeramos os dois fluxos possíveis: pessoa física (PF) e jurídica (PJ).
type PersonType = 'PF' | 'PJ'

// Contato complementar exibido na ficha do cliente.
type Contact = { name: string; role?: string; email?: string; phone?: string }
// Estrutura do endereço de faturamento.
type Address = { cep?: string; street?: string; number?: string; complement?: string; neighborhood?: string; city?: string; state?: string; country?: string }

type Client = {
  id?: number
  personType: PersonType
  // PF
  fullName?: string
  cpf?: string
  rg?: string
  birthDate?: string
  // PJ
  corporateName?: string
  tradeName?: string
  cnpj?: string
  ie?: string
  im?: string
  // Contato principal
  primaryPhone?: string
  email?: string
  secondaryPhone?: string
  // Contatos adicionais
  contacts?: Contact[]
  // Endereços
  billingAddress?: Address
}

// Estrutura para feedback visual rápido (toast).
type Feedback = { id: number; tone: 'success' | 'warning' | 'info' | 'error'; message: string }

type LogEntry = { id: number; label: string; timestamp: string }

const mockLogs: Record<number, LogEntry[]> = {}

const GENERIC_ERROR = 'Não foi possível completar esta ação agora. Tente novamente em instantes.'
const CNPJ_DEBOUNCE_MS = 450

// Remove todos os caracteres não numéricos de uma string.
function onlyDigits(v: string){ return v.replace(/\D+/g,'') }
// Aplica máscara clássica de CPF enquanto o usuário digita.
function maskCPF(v: string){
  const d = onlyDigits(v).slice(0,11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}
// Valida os dígitos verificadores do CPF.
function validateCPF(cpf: string){
  const d = onlyDigits(cpf)
  if (d.length !== 11 || /^([0-9])\1{10}$/.test(d)) return false
  let sum = 0
  for (let i=0;i<9;i++) sum += parseInt(d.charAt(i)) * (10 - i)
  let rev = 11 - (sum % 11); if (rev >= 10) rev = 0
  if (rev !== parseInt(d.charAt(9))) return false
  sum = 0
  for (let i=0;i<10;i++) sum += parseInt(d.charAt(i)) * (11 - i)
  rev = 11 - (sum % 11); if (rev >= 10) rev = 0
  return rev === parseInt(d.charAt(10))
}
// Aplica máscara padrão de CNPJ.
function maskCNPJ(v: string){
  const d = onlyDigits(v).slice(0,14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}
// Valida o CNPJ utilizando o algoritmo dos dígitos verificadores.
function validateCNPJ(cnpj: string){
  const d = onlyDigits(cnpj)
  if (d.length !== 14 || /^([0-9])\1{13}$/.test(d)) return false
  const calc = (base:number)=>{
    let size = base - 7
    let numbers = d.substring(0, base)
    let digits = d.substring(base)
    let sum = 0
    let pos = base - 7
    for (let i=base; i>=1; i--) {
      sum += parseInt(numbers.charAt(base - i)) * pos--
      if (pos < 2) pos = 9
    }
    const result = (sum % 11) < 2 ? 0 : 11 - (sum % 11)
    return result === parseInt(digits.charAt(0))
  }
  if(!calc(12)) return false
  // segundo dígito
  let size = 13
  let numbers = d.substring(0, size)
  let sum = 0
  let pos = size - 7
  for (let i=size; i>=1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  const result = (sum % 11) < 2 ? 0 : 11 - (sum % 11)
  return result === parseInt(d.charAt(13))
}
// Formata telefone em padrões (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
function maskPhone(v: string){
  const d = onlyDigits(v).slice(0,11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
}
// Máscara de CEP 00000-000.
function maskCEP(v: string){
  const d = onlyDigits(v).slice(0,8)
  return d.replace(/(\d{5})(\d{0,3})/, '$1-$2').trim()
}
// E-mail simples com presença de @ e domínio.
function isEmail(v?: string){ return !!v && /.+@.+\..+/.test(v) }

export default function Clients(){
  // Estado principal da listagem.
  const [clients, setClients] = useState<Client[]>([])
  // Estado do formulário superior.
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({})
  const [editingId, setEditingId] = useState<number|null>(null)
  const [data, setData] = useState<Client>({ personType:'PF', contacts:[], billingAddress:{} })
  // Estados auxiliares.
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})
  const [inlineDrafts, setInlineDrafts] = useState<Record<number, Partial<Client>>>({})
  const [inlineSaving, setInlineSaving] = useState<Record<number, boolean>>({})
  const [logs, setLogs] = useState<Record<number, LogEntry[]>>(mockLogs)

  // Registra um toast temporário e remove automaticamente após 4 segundos.
  function pushFeedback(message: string, tone: Feedback['tone']='info'){
    setFeedbacks(prev=>{
      const id = Date.now()
      const next = [...prev, { id, tone, message }]
      setTimeout(()=>{
        setFeedbacks(current=>current.filter(item=>item.id!==id))
      }, 4000)
      return next
    })
  }

  async function load(){
    try{
      const list = await get<Client[]>('/api/clients')
      setClients(list)
    } catch {
      pushFeedback('Não foi possível carregar os clientes cadastrados agora.', 'warning')
    }
  }
  // Carrega a primeira versão da lista assim que o componente monta.
  useEffect(()=>{ load() }, [])

  // Consulta ViaCEP toda vez que o CEP atinge 8 dígitos válidos.
  useEffect(()=>{
    const cep = data.billingAddress?.cep ? onlyDigits(data.billingAddress.cep) : ''
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`).then(r=>r.json()).then((j)=>{
        if (j && !j.erro) {
          setData(prev=>({
            ...prev,
            billingAddress:{
              ...prev.billingAddress,
              cep: maskCEP(cep),
              street: j.logradouro ?? prev.billingAddress?.street,
              neighborhood: j.bairro ?? prev.billingAddress?.neighborhood,
              city: j.localidade ?? prev.billingAddress?.city,
              state: j.uf ?? prev.billingAddress?.state,
            }
          }))
        }
      }).catch(()=>{})
    }
  }, [data.billingAddress?.cep])

  function setField(path: (prev:Client)=>Client){ setData(path(data)) }

  async function consultCNPJ(){
    const raw = data.cnpj || ''
    const digits = onlyDigits(raw)
    if (digits.length !== 14) {
      alert('Informe um CNPJ válido (14 dígitos) antes de consultar.')
      return
    }
    if (cnpjLoading) return

          {feedbacks.length > 0 && (
            <div className="toast-container">
              {feedbacks.map(item => (
                <div key={item.id} className={`toast toast-${item.tone}`}>
                  {item.message}
                </div>
              ))}
            </div>
          )}

    if (debounceRef.current) clearTimeout(debounceRef.current)
    setCnpjLoading(true)

    debounceRef.current = setTimeout(async ()=>{
      try{
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
        if(!res.ok) throw new Error('Falha na consulta')
        const payload = await res.json()
        setData(prev=>({
          ...prev,
          corporateName: payload.razao_social || prev.corporateName,
          tradeName: payload.nome_fantasia || prev.tradeName,
          billingAddress: {
            ...prev.billingAddress,
            street: payload.logradouro || prev.billingAddress?.street,
            number: payload.numero || prev.billingAddress?.number,
            neighborhood: payload.bairro || prev.billingAddress?.neighborhood,
            city: payload.municipio || prev.billingAddress?.city,
            state: payload.uf || prev.billingAddress?.state,
            cep: payload.cep ? maskCEP(payload.cep) : prev.billingAddress?.cep
          }
        }))
        pushFeedback('Dados do CNPJ preenchidos automaticamente.', 'success')
      }catch{
        alert('Não foi possível consultar o CNPJ agora.')
      }finally{
        setCnpjLoading(false)
        debounceRef.current = null
      }
    }, CNPJ_DEBOUNCE_MS)
  }

  function validate(){
    const list: string[] = []
    const map: Record<string,string> = {}

    if (data.personType === 'PF') {
      if (!data.fullName) { list.push('Nome completo é obrigatório'); map.fullName = 'Campo obrigatório' }
      if (!data.cpf) { list.push('CPF é obrigatório'); map.cpf = 'Campo obrigatório' }
      else if (!validateCPF(data.cpf)) { list.push('CPF inválido'); map.cpf = 'CPF inválido' }
    } else {
      if (!data.corporateName) { list.push('Razão Social é obrigatória'); map.corporateName = 'Campo obrigatório' }
      if (!data.tradeName) { list.push('Nome Fantasia é obrigatório'); map.tradeName = 'Campo obrigatório' }
      if (!data.cnpj) { list.push('CNPJ é obrigatório'); map.cnpj = 'Campo obrigatório' }
      else if (!validateCNPJ(data.cnpj)) { list.push('CNPJ inválido'); map.cnpj = 'CNPJ inválido' }
    }
    if (!isEmail(data.email)) { list.push('E-mail principal inválido'); map.email = 'Informe um e-mail válido' }
    if (!data.primaryPhone) { list.push('Telefone principal é obrigatório'); map.primaryPhone = 'Campo obrigatório' }

    const ba = data.billingAddress || {}
    if (!ba.cep) { list.push('CEP de faturamento é obrigatório'); map['billingAddress.cep'] = 'Campo obrigatório' }
    if (!ba.street) { list.push('Logradouro (faturamento) é obrigatório'); map['billingAddress.street'] = 'Campo obrigatório' }
    if (!ba.number) { list.push('Número (faturamento) é obrigatório'); map['billingAddress.number'] = 'Campo obrigatório' }
    if (!ba.city) { list.push('Cidade (faturamento) é obrigatória'); map['billingAddress.city'] = 'Campo obrigatório' }
    if (!ba.state) { list.push('UF (faturamento) é obrigatória'); map['billingAddress.state'] = 'Campo obrigatório' }

    return { list, map }
  }

  async function submit(){
    const { list, map } = validate()
    setErrors(list)
    setFieldErrors(map)
    if (list.length) return
    setSaving(true)
    try{
      if (editingId){
        await put(`/api/clients/${editingId}`, data)
      } else {
        await post('/api/clients', data)
      }
      setEditingId(null)
      setData({ personType:'PF', contacts:[], billingAddress:{} })
      await load()
  pushFeedback('Cliente salvo com sucesso!', 'success')
  registerLog(editingId || Date.now(), editingId ? 'Cliente atualizado via formulário principal' : 'Novo cliente cadastrado')
    }catch{
      alert(GENERIC_ERROR)
    }
    finally{ setSaving(false) }
  }

  function addContact(){ setData(prev=>({ ...prev, contacts:[...(prev.contacts||[]), { name:'' }] })) }
  function removeContact(i:number){ setData(prev=>({ ...prev, contacts:(prev.contacts||[]).filter((_,idx)=>idx!==i) })) }

  // --- Edição inline nos cards
  function toggleExpanded(id: number){
    setExpandedCards(prev=>({ ...prev, [id]: !prev[id] }))
  }

  function beginInlineEdit(client: Client){
    if (!client.id) return
    setInlineDrafts(prev=>({
      ...prev,
      [client.id!]: {
        primaryPhone: client.primaryPhone || '',
        email: client.email || '',
        billingAddress: { ...(client.billingAddress || {}) },
        contacts: (client.contacts || []).map(c=>({ ...c }))
      }
    }))
    setExpandedCards(prev=>({ ...prev, [client.id!]: true }))
  }

  function updateInlineDraft(id: number, updater: (draft: Partial<Client>)=>Partial<Client>){
    setInlineDrafts(prev=>{
      const base = prev[id] || { billingAddress:{}, contacts:[] }
      const nextDraft = updater({
        ...base,
        billingAddress:{ ...(base.billingAddress || {}) },
        contacts:[...(((base.contacts as Contact[]) || []))]
      })
      return { ...prev, [id]: nextDraft }
    })
  }

  function cancelInlineEdit(id: number){
    setInlineDrafts(prev=>{
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  function addInlineContact(id: number){
    updateInlineDraft(id, draft=>({
      ...draft,
      contacts: [ ...(draft.contacts as Contact[] || []), { name:'' } ]
    }))
  }

  function removeInlineContact(id: number, index: number){
    updateInlineDraft(id, draft=>({
      ...draft,
      contacts: (draft.contacts as Contact[] || []).filter((_,idx)=>idx!==index)
    }))
  }

  async function saveInline(id: number){
    const draft = inlineDrafts[id]
    if (!draft) return
    setInlineSaving(prev=>({ ...prev, [id]: true }))
    try{
      await put(`/api/clients/${id}`, draft)
      pushFeedback('Cliente atualizado direto na lista.', 'success')
      await load()
      cancelInlineEdit(id)
      registerLog(id, 'Alterações salvas via edição rápida')
    }catch{
      alert(GENERIC_ERROR)
    }finally{
      setInlineSaving(prev=>({ ...prev, [id]: false }))
    }
  }

  const isPF = data.personType === 'PF'

  function getFieldError(key: string){
    return fieldErrors[key]
  }

  function clearFieldError(key: string){
    setFieldErrors(prev=>{
      if (!(key in prev)) return prev
      const { [key]: _omit, ...rest } = prev
      return rest
    })
  }

  function registerLog(id: number, label: string){
    setLogs(prev=>{
      const entries = prev[id] || []
      const next = [{ id: Date.now(), label, timestamp: new Date().toLocaleString() }, ...entries]
      return { ...prev, [id]: next.slice(0, 8) }
    })
    pushFeedback(`Log registrado: ${label}`, 'info')
  }

  return (
    <div>
      <h2>Clientes</h2>
      {errors.length>0 && (
        <div className="card" style={{borderColor:'#e53e3e', background:'#fff5f5'}}>
          <strong>Verifique os campos:</strong>
          <ul style={{marginTop:6}}>
            {errors.map((e,i)=>(<li key={i}>{e}</li>))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="form-grid">
          <label>Tipo de Pessoa</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="ptype"
                checked={isPF}
                onChange={()=>{
                  setFieldErrors({})
                  setData(prev=>({ ...prev, personType:'PF' }))
                }}
              /> Pessoa Física
            </label>
            <label>
              <input
                type="radio"
                name="ptype"
                checked={!isPF}
                onChange={()=>{
                  setFieldErrors({})
                  setData(prev=>({ ...prev, personType:'PJ' }))
                }}
              /> Pessoa Jurídica
            </label>
          </div>

          {/* Identificação - aparece logo após o tipo */}
          {isPF ? (
            <>
              <label>Nome Completo</label>
              <div>
                <input
                  className={getFieldError('fullName') ? 'input-error' : undefined}
                  value={data.fullName||''}
                  onChange={e=>{
                    clearFieldError('fullName')
                    setData(prev=>({ ...prev, fullName:e.target.value }))
                  }}
                  placeholder="Nome completo"
                />
                {getFieldError('fullName') && <span className="field-error">{getFieldError('fullName')}</span>}
              </div>

              <label>CPF</label>
              <div>
                <input
                  className={getFieldError('cpf') ? 'input-error' : undefined}
                  value={data.cpf||''}
                  onChange={e=>{
                    clearFieldError('cpf')
                    setData(prev=>({ ...prev, cpf:maskCPF(e.target.value) }))
                  }}
                  placeholder="000.000.000-00"
                />
                {getFieldError('cpf') && <span className="field-error">{getFieldError('cpf')}</span>}
              </div>

              <label>RG</label>
              <input value={data.rg||''} onChange={e=>setData(prev=>({ ...prev, rg:e.target.value }))} placeholder="RG" />

              <label>Data de Nascimento</label>
              <input type="date" value={data.birthDate||''} onChange={e=>setData(prev=>({ ...prev, birthDate:e.target.value }))} />
            </>
          ) : (
            <>
              <label>Razão Social</label>
              <div>
                <input
                  className={getFieldError('corporateName') ? 'input-error' : undefined}
                  value={data.corporateName||''}
                  onChange={e=>{
                    clearFieldError('corporateName')
                    setData(prev=>({ ...prev, corporateName:e.target.value }))
                  }}
                  placeholder="Razão Social"
                />
                {getFieldError('corporateName') && <span className="field-error">{getFieldError('corporateName')}</span>}
              </div>

              <label>Nome Fantasia</label>
              <div>
                <input
                  className={getFieldError('tradeName') ? 'input-error' : undefined}
                  value={data.tradeName||''}
                  onChange={e=>{
                    clearFieldError('tradeName')
                    setData(prev=>({ ...prev, tradeName:e.target.value }))
                  }}
                  placeholder="Nome Fantasia"
                />
                {getFieldError('tradeName') && <span className="field-error">{getFieldError('tradeName')}</span>}
              </div>

              <label>CNPJ</label>
              <div className="form-row">
                <div style={{flex:1}}>
                  <input
                    className={getFieldError('cnpj') ? 'input-error' : undefined}
                    value={data.cnpj||''}
                    onChange={e=>{
                      clearFieldError('cnpj')
                      setData(prev=>({ ...prev, cnpj:maskCNPJ(e.target.value) }))
                    }}
                    placeholder="00.000.000/0000-00"
                  />
                  {getFieldError('cnpj') && <span className="field-error">{getFieldError('cnpj')}</span>}
                </div>
                <button type="button" onClick={consultCNPJ} disabled={cnpjLoading}>{cnpjLoading ? 'Consultando...' : 'Consultar'}</button>
              </div>

              <label>Inscrição Estadual (IE)</label>
              <input value={data.ie||''} onChange={e=>setData(prev=>({ ...prev, ie:e.target.value }))} placeholder="IE (ou Isento)" />

              <label>Inscrição Municipal (IM)</label>
              <input value={data.im||''} onChange={e=>setData(prev=>({ ...prev, im:e.target.value }))} placeholder="IM" />
            </>
          )}

          <label>Telefone Principal (WhatsApp)</label>
          <div>
            <input
              className={getFieldError('primaryPhone') ? 'input-error' : undefined}
              value={data.primaryPhone||''}
              onChange={e=>{
                clearFieldError('primaryPhone')
                setData(prev=>({ ...prev, primaryPhone:maskPhone(e.target.value) }))
              }}
              placeholder="(00) 00000-0000"
            />
            {getFieldError('primaryPhone') && <span className="field-error">{getFieldError('primaryPhone')}</span>}
          </div>

          <label>E-mail Principal</label>
          <div>
            <input
              className={getFieldError('email') ? 'input-error' : undefined}
              value={data.email||''}
              onChange={e=>{
                clearFieldError('email')
                setData(prev=>({ ...prev, email:e.target.value }))
              }}
              placeholder="email@dominio.com"
            />
            {getFieldError('email') && <span className="field-error">{getFieldError('email')}</span>}
          </div>

          <label>Telefone Secundário</label>
          <input value={data.secondaryPhone||''} onChange={e=>setData(prev=>({ ...prev, secondaryPhone:maskPhone(e.target.value) }))} placeholder="(00) 0000-0000" />
        </div>
      </div>

      <div className="card">
        <h3>Contatos Adicionais</h3>
        <div className="list">
          {(data.contacts||[]).map((c, idx)=> (
            <div key={idx} className="form-grid">
              <label>Nome</label>
              <input value={c.name} onChange={e=> setData(prev=>{ const arr=[...(prev.contacts||[])]; arr[idx] = { ...arr[idx], name:e.target.value }; return { ...prev, contacts:arr } })} />

              <label>Departamento/Cargo</label>
              <input value={c.role||''} onChange={e=> setData(prev=>{ const arr=[...(prev.contacts||[])]; arr[idx] = { ...arr[idx], role:e.target.value }; return { ...prev, contacts:arr } })} />

              <label>E-mail</label>
              <input value={c.email||''} onChange={e=> setData(prev=>{ const arr=[...(prev.contacts||[])]; arr[idx] = { ...arr[idx], email:e.target.value }; return { ...prev, contacts:arr } })} />

              <label>Telefone/Ramal</label>
              <input value={c.phone||''} onChange={e=> setData(prev=>{ const arr=[...(prev.contacts||[])]; arr[idx] = { ...arr[idx], phone:maskPhone(e.target.value) }; return { ...prev, contacts:arr } })} />

              <div></div>
              <div className="actions"><button onClick={()=>removeContact(idx)}>Remover</button></div>
            </div>
          ))}
        </div>
        <button onClick={addContact}>Adicionar Contato</button>
      </div>

      <div className="card">
        <h3>Endereço de Faturamento</h3>
        <div className="form-grid">
          <label>CEP</label>
          <div>
            <input
              className={getFieldError('billingAddress.cep') ? 'input-error' : undefined}
              value={data.billingAddress?.cep||''}
              onChange={e=>{
                clearFieldError('billingAddress.cep')
                setData(prev=>({ ...prev, billingAddress:{ ...prev.billingAddress, cep:maskCEP(e.target.value) } }))
              }}
              placeholder="00000-000"
            />
            {getFieldError('billingAddress.cep') && <span className="field-error">{getFieldError('billingAddress.cep')}</span>}
          </div>

          <label>Logradouro</label>
          <div>
            <input
              className={getFieldError('billingAddress.street') ? 'input-error' : undefined}
              value={data.billingAddress?.street||''}
              onChange={e=>{
                clearFieldError('billingAddress.street')
                setData(prev=>({ ...prev, billingAddress:{ ...prev.billingAddress, street:e.target.value } }))
              }}
            />
            {getFieldError('billingAddress.street') && <span className="field-error">{getFieldError('billingAddress.street')}</span>}
          </div>

          <label>Número</label>
          <div>
            <input
              className={getFieldError('billingAddress.number') ? 'input-error' : undefined}
              value={data.billingAddress?.number||''}
              onChange={e=>{
                clearFieldError('billingAddress.number')
                setData(prev=>({ ...prev, billingAddress:{ ...prev.billingAddress, number:e.target.value } }))
              }}
            />
            {getFieldError('billingAddress.number') && <span className="field-error">{getFieldError('billingAddress.number')}</span>}
          </div>

          <label>Complemento</label>
          <input value={data.billingAddress?.complement||''} onChange={e=> setData(prev=>({ ...prev, billingAddress:{ ...prev.billingAddress, complement:e.target.value } }))} />

          <label>Bairro</label>
          <input value={data.billingAddress?.neighborhood||''} onChange={e=> setData(prev=>({ ...prev, billingAddress:{ ...prev.billingAddress, neighborhood:e.target.value } }))} />

          <label>Cidade</label>
          <div>
            <input
              className={getFieldError('billingAddress.city') ? 'input-error' : undefined}
              value={data.billingAddress?.city||''}
              onChange={e=>{
                clearFieldError('billingAddress.city')
                setData(prev=>({ ...prev, billingAddress:{ ...prev.billingAddress, city:e.target.value } }))
              }}
            />
            {getFieldError('billingAddress.city') && <span className="field-error">{getFieldError('billingAddress.city')}</span>}
          </div>

          <label>Estado (UF)</label>
          <div>
            <input
              className={getFieldError('billingAddress.state') ? 'input-error' : undefined}
              value={data.billingAddress?.state||''}
              onChange={e=>{
                clearFieldError('billingAddress.state')
                setData(prev=>({ ...prev, billingAddress:{ ...prev.billingAddress, state:e.target.value } }))
              }}
            />
            {getFieldError('billingAddress.state') && <span className="field-error">{getFieldError('billingAddress.state')}</span>}
          </div>

          <label>País</label>
          <input value={data.billingAddress?.country||''} onChange={e=> setData(prev=>({ ...prev, billingAddress:{ ...prev.billingAddress, country:e.target.value } }))} />
        </div>
      </div>

      <div className="actions" style={{display:'flex', gap:8}}>
        <button onClick={submit} disabled={saving}>{saving ? 'Salvando...' : (editingId ? 'Atualizar Cliente' : 'Salvar Cliente')}</button>
        {editingId && <button type="button" onClick={()=>{ setEditingId(null); setData({ personType:'PF', contacts:[], billingAddress:{} }); setErrors([]) }}>Cancelar edição</button>}
      </div>

      <h3 style={{marginTop:16}}>Clientes cadastrados</h3>
      <div className="list">
        {clients.map((c: any) => (
          <div key={c.id} className="card">
            <strong>#{c.id} {c.personType==='PJ' ? (c.tradeName || c.corporateName) : (c.fullName || '-') }</strong>
            <div>{c.email} · {c.primaryPhone}</div>

            {/* bloco de ações principais do card */}
            <div className="actions" style={{display:'flex', gap:8}}>
              <button onClick={()=>{ setEditingId(c.id); setFieldErrors({}); setErrors([]); setData({ personType:c.personType||'PF', contacts:c.contacts||[], billingAddress:c.billingAddress||{}, ...c }) }}>Editar formulário</button>
              <button onClick={()=>beginInlineEdit(c)}>Editar direto na lista</button>
              <button onClick={()=>removeClient(c.id)}>Remover</button>
              <button onClick={()=>toggleExpanded(c.id)}>Detalhes</button>
            </div>

            {/* seção expansível com mais informações + edição inline */}
            {expandedCards[c.id] && (
              <div className="card-detail">
                <div className="card-detail-section">
                  <h4>Resumo</h4>
                  <p><strong>Tipo:</strong> {c.personType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                  {c.personType === 'PF' ? (
                    <>
                      <p><strong>Nome:</strong> {c.fullName}</p>
                      <p><strong>CPF:</strong> {c.cpf}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Razão Social:</strong> {c.corporateName}</p>
                      <p><strong>CNPJ:</strong> {c.cnpj}</p>
                    </>
                  )}
                  {c.billingAddress && (
                    <p><strong>Endereço:</strong> {c.billingAddress.street}, {c.billingAddress.number} - {c.billingAddress.neighborhood} - {c.billingAddress.city}/{c.billingAddress.state} · CEP {c.billingAddress.cep}</p>
                  )}
                </div>

                <div className="card-detail-section">
                  <h4>Editar Contatos Direto</h4>
                  {!inlineDrafts[c.id] && (
                    <p style={{marginBottom:8}}>Clique em "Editar direto na lista" para habilitar edição rápida deste cliente.</p>
                  )}

                  {inlineDrafts[c.id] && (
                    <div className="inline-edit-grid">
                      <label>Telefone principal</label>
                      <input value={inlineDrafts[c.id]?.primaryPhone||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, primaryPhone: maskPhone(e.target.value) }))} placeholder="(00) 00000-0000" />

                      <label>E-mail</label>
                      <input value={inlineDrafts[c.id]?.email||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, email: e.target.value }))} placeholder="email@dominio.com" />

                      <label>CEP faturamento</label>
                      <input value={inlineDrafts[c.id]?.billingAddress?.cep||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, billingAddress:{ ...(draft.billingAddress||{}), cep: maskCEP(e.target.value) } }))} />

                      <label>Logradouro</label>
                      <input value={inlineDrafts[c.id]?.billingAddress?.street||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, billingAddress:{ ...(draft.billingAddress||{}), street: e.target.value } }))} />

                      <label>Número</label>
                      <input value={inlineDrafts[c.id]?.billingAddress?.number||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, billingAddress:{ ...(draft.billingAddress||{}), number: e.target.value } }))} />

                      <label>Cidade</label>
                      <input value={inlineDrafts[c.id]?.billingAddress?.city||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, billingAddress:{ ...(draft.billingAddress||{}), city: e.target.value } }))} />

                      <label>Estado</label>
                      <input value={inlineDrafts[c.id]?.billingAddress?.state||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, billingAddress:{ ...(draft.billingAddress||{}), state: e.target.value } }))} />

                      <div style={{gridColumn:'1 / span 2'}}>
                        <h5>Contatos adicionais</h5>
                        {(inlineDrafts[c.id]?.contacts as Contact[] || []).map((contact, idx)=> (
                          <div key={idx} className="inline-contact-row">
                            <input value={contact.name} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, contacts:(draft.contacts as Contact[] || []).map((item,i)=> i===idx ? { ...item, name:e.target.value } : item) }))} placeholder="Nome" />
                            <input value={contact.role||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, contacts:(draft.contacts as Contact[] || []).map((item,i)=> i===idx ? { ...item, role:e.target.value } : item) }))} placeholder="Cargo" />
                            <input value={contact.email||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, contacts:(draft.contacts as Contact[] || []).map((item,i)=> i===idx ? { ...item, email:e.target.value } : item) }))} placeholder="E-mail" />
                            <input value={contact.phone||''} onChange={e=>updateInlineDraft(c.id, draft=>({ ...draft, contacts:(draft.contacts as Contact[] || []).map((item,i)=> i===idx ? { ...item, phone:maskPhone(e.target.value) } : item) }))} placeholder="Telefone" />
                            <button onClick={()=>removeInlineContact(c.id, idx)}>Remover</button>
                          </div>
                        ))}
                        <button onClick={()=>addInlineContact(c.id)} style={{marginTop:8}}>Adicionar contato</button>
                      </div>

                      <div className="actions" style={{gridColumn:'1 / span 2', display:'flex', gap:8}}>
                        <button onClick={()=>saveInline(c.id)} disabled={inlineSaving[c.id]}>Salvar alterações rápidas</button>
                        <button onClick={()=>cancelInlineEdit(c.id)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
