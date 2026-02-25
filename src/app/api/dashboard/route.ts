import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const agentWhere: Record<string, unknown> = {}
    if (session.role === 'AGENT') agentWhere.agentId = session.id

    // Birthday query: customers whose dob month+day matches today or this week
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    // Fetch upcoming 7 days of birthdays
    const next7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() + i)
        return `-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })

    const [
        totalCustomers,
        totalPolicies,
        activePolicies,
        expiredPolicies,
        totalPremium,
        totalCommission,
        healthPolicies,
        motorPolicies,
        lifePolicies,
        recentCustomers,
        expiringPolicies,
        callsToday,
        notesCount,
        allCustomers,
    ] = await Promise.all([
        prisma.customer.count({ where: agentWhere }),
        prisma.policy.count({ where: agentWhere }),
        prisma.policy.count({ where: { ...agentWhere, status: 'ACTIVE' } }),
        prisma.policy.count({ where: { ...agentWhere, status: 'EXPIRED' } }),
        prisma.policy.aggregate({ where: { ...agentWhere, status: 'ACTIVE' }, _sum: { premium: true } }),
        prisma.policy.aggregate({ where: { ...agentWhere, status: 'ACTIVE' }, _sum: { commissionAmt: true } }),
        prisma.policy.count({ where: { ...agentWhere, type: 'HEALTH' } }),
        prisma.policy.count({ where: { ...agentWhere, type: 'MOTOR' } }),
        prisma.policy.count({ where: { ...agentWhere, type: 'LIFE' } }),
        prisma.customer.findMany({
            where: agentWhere,
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, firstName: true, lastName: true, phone: true, createdAt: true },
        }),
        prisma.policy.findMany({
            where: {
                ...agentWhere,
                status: 'ACTIVE',
                endDate: {
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    gte: new Date().toISOString().split('T')[0],
                },
            },
            take: 10,
            orderBy: { endDate: 'asc' },
            include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
        }),
        prisma.callLog.count({
            where: {
                ...(session.role === 'AGENT' ? { agentId: session.id } : {}),
                callDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
        }),
        prisma.note.count({ where: session.role === 'AGENT' ? { agentId: session.id } : {} }),
        // Get all customers to filter birthdays in JS (dob stored as string)
        prisma.customer.findMany({
            where: { ...agentWhere, dob: { not: null } },
            select: { id: true, firstName: true, lastName: true, phone: true, dob: true },
        }),
    ])

    // Filter birthday customers: dob is stored as YYYY-MM-DD or DD/MM/YYYY
    const birthdayCustomers = allCustomers.filter(c => {
        if (!c.dob) return false
        const dob = c.dob.trim()
        // Support both YYYY-MM-DD and DD/MM/YYYY
        let mmdd = ''
        if (dob.includes('/')) {
            const parts = dob.split('/')
            if (parts.length === 3) mmdd = `-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        } else if (dob.includes('-')) {
            const parts = dob.split('-')
            if (parts.length === 3) mmdd = `-${parts[1]}-${parts[2]}`
        }
        return next7.includes(mmdd)
    }).map(c => {
        const dob = c.dob!.trim()
        let dayOfMonth = 0, monthNum = 0
        if (dob.includes('/')) {
            const p = dob.split('/'); dayOfMonth = parseInt(p[0]); monthNum = parseInt(p[1])
        } else {
            const p = dob.split('-'); dayOfMonth = parseInt(p[2]); monthNum = parseInt(p[1])
        }
        const thisYear = new Date()
        const bdThisYear = new Date(thisYear.getFullYear(), monthNum - 1, dayOfMonth)
        const daysUntil = Math.ceil((bdThisYear.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
        const todayStr = `-${mm}-${dd}`
        const actual = `-${String(monthNum).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`
        return { ...c, daysUntil, isToday: todayStr === actual }
    }).sort((a, b) => a.daysUntil - b.daysUntil)

    return NextResponse.json({
        stats: {
            totalCustomers,
            totalPolicies,
            activePolicies,
            expiredPolicies,
            totalPremium: totalPremium._sum.premium || 0,
            totalCommission: totalCommission._sum.commissionAmt || 0,
            policyBreakdown: { health: healthPolicies, motor: motorPolicies, life: lifePolicies },
            callsToday,
            notesCount,
        },
        recentCustomers,
        expiringPolicies,
        birthdayCustomers,
    })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    if (type === 'calls') {
        const data = await req.json()
        const call = await prisma.callLog.create({ data: { ...data, agentId: session.id } })
        return NextResponse.json({ call })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
