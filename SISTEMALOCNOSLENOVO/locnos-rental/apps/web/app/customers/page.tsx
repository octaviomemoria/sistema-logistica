async function fetchCustomers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, { cache: 'no-store' })
  return res.json()
}

export default async function CustomersPage() {
  const customers = await fetchCustomers()
  return (
    <main>
      <h2 className="mb-4 text-lg font-semibold">Clientes</h2>
      <ul className="space-y-2">
        {customers.map((c: any) => (
          <li key={c.id} className="rounded border p-3">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-gray-600">{c.email ?? '-'}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
