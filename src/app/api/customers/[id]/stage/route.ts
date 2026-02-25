import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PATCH /api/customers/[id]/stage — update pipeline stage and auto-record the date
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'AUDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const { stage, lostReason } = await req.json()

    const now = new Date()
    const stageData: Record<string, unknown> = { stage }

    if (stage === 'PITCHED') stageData.pitchedDate = now
    if (stage === 'INTERESTED') stageData.interestedDate = now
    if (stage === 'CONVERTED') stageData.convertedDate = now
    if (stage === 'LOST') { stageData.lostDate = now; if (lostReason) stageData.lostReason = lostReason }

    const customer = await prisma.customer.update({
        where: { id },
        data: stageData,
    })
    return NextResponse.json({ customer })
}
