export async function get<T>(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export async function post<T>(url: string, body: any) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export async function put<T>(url: string, body: any) {
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export async function del(url: string) {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
  return res
}
