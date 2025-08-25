const mem = new Map()

export async function saveReport(id, data) {
  mem.set(id, data)
  return data
}

export async function getReport(id) {
  return mem.get(id) || null
}
