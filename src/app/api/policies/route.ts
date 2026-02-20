import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const daysToExpiry = searchParams.get('daysToExpiry')

    const where: Record<string, unknown> = {}
    if (session.role === 'AGENT') where.agentId = session.id
    if (customerId) where.customerId = customerId
    if (type) where.type = type
    if (status) where.status = status

    if (daysToExpiry) {
        const days = parseInt(daysToExpiry)
        const today = new Date()
        const future = new Date(today)
        future.setDate(future.getDate() + days)
        const todayStr = today.toISOString().split('T')[0]
        const futureStr = future.toISOString().split('T')[0]
        where.endDate = { gte: todayStr, lte: futureStr }
        where.status = 'ACTIVE'
    }

    const policies = await prisma.policy.findMany({
        where,
        include: {
            customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
            agent: { select: { name: true } },
            documents: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ policies })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const policy = await prisma.policy.create({
        data: {
            ...data,
            agentId: session.id,
        },
    })
    return NextResponse.json({ policy }, { status: 201 })
}
