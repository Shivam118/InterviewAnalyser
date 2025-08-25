import { NextResponse } from "next/server"
import { getReport } from "@/lib/store"

export async function GET(_req, { params }) {
  const data = await getReport(params.id)
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}
