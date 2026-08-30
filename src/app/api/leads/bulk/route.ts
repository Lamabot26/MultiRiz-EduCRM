import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { ids, action, value } = await req.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'update_status':
        updateData.status = value
        break
      case 'update_priority':
        updateData.priority = value
        break
      case 'update_campus':
        updateData.campus = value
        break
      case 'delete':
        await db.lead.deleteMany({ where: { id: { in: ids } } })
        return NextResponse.json({ success: true, deleted: ids.length })
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const result = await db.lead.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
