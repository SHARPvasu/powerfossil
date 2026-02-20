import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const where: Record<string, unknown> = {}
    if (session.role === 'AGENT') where.agentId = session.id

    // Stats
    const [
        totalCustomers,
        totalPolicies,
        activePolicies,
        expiredPolicies,
        totalPremium,
        healthPolicies,
        motorPolicies,
        lifePolicies,
        recentCustomers,
        expiringPolicies,
        callsToday,
        notesCount,
    ] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.policy.count({ where }),
        prisma.policy.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma.policy.count({ where: { ...where, status: 'EXPIRED' } }),
        prisma.policy.aggregate({ where: { ...where, status: 'ACTIVE' }, _sum: { premium: true } }),
        prisma.policy.count({ where: { ...where, type: 'HEALTH' } }),
        prisma.policy.count({ where: { ...where, type: 'MOTOR' } }),
        prisma.policy.count({ where: { ...where, type: 'LIFE' } }),
        prisma.customer.findMany({
            where,
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, firstName: true, lastName: true, phone: true, createdAt: true },
        }),
        prisma.policy.findMany({
            where: {
                ...where,
                status: 'ACTIVE',
                endDate: {
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    gte: new Date().toISOString().split('T')[0],
                },
            },
            take: 10,
            orderBy: { endDate: 'asc' },
            include: {
                customer: { select: { firstName: true, lastName: true, phone: true } },
            },
        }),
        prisma.callLog.count({
            where: {
                ...(session.role === 'AGENT' ? { agentId: session.id } : {}),
                callDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
        }),
        prisma.note.count({ where: session.role === 'AGENT' ? { agentId: session.id } : {} }),
    ])

    return NextResponse.json({
        stats: {
            totalCustomers,
            totalPolicies,
            activePolicies,
            expiredPolicies,
            totalPremium: totalPremium._sum.premium || 0,
            policyBreakdown: { health: healthPolicies, motor: motorPolicies, life: lifePolicies },
            callsToday,
            notesCount,
        },
        recentCustomers,
        expiringPolicies,
    })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    if (type === 'calls') {
        const data = await req.json()
        const call = await prisma.callLog.create({
            data: { ...data, agentId: session.id },
        })
        return NextResponse.json({ call })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
