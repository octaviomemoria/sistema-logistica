async function fetchModels() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipment/models`, { cache: 'no-store' })
  return res.json()
}

export default async function EquipmentPage() {
  const models = await fetchModels()
  return (
    <main>
      <h2 className="mb-4 text-lg font-semibold">Modelos</h2>
      <ul className="space-y-2">
        {models.map((m: any) => (
          <li key={m.id} className="rounded border p-3">
            <div className="font-medium">{m.name}</div>
            <div className="text-sm text-gray-600">{m.description}</div>
            <div className="text-sm">Diária: R$ {Number(m.dailyRate).toFixed(2)}</div>
            <div className="text-xs text-gray-500">Itens: {m.items?.length ?? 0}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
