import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    const where: Record<string, unknown> = {}
    if (session.role === 'AGENT') where.agentId = session.id
    if (customerId) where.customerId = customerId

    const calls = await prisma.callLog.findMany({
        where,
        include: {
            customer: { select: { firstName: true, lastName: true, phone: true } },
            agent: { select: { name: true } },
        },
        orderBy: { callDate: 'desc' },
        take: 50,
    })

    return NextResponse.json({ calls })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'AUDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const call = await prisma.callLog.create({
        data: { ...data, agentId: session.id },
        include: {
            customer: { select: { firstName: true, lastName: true, phone: true } },
            agent: { select: { name: true } },
        },
    })
    return NextResponse.json({ call }, { status: 201 })
}
