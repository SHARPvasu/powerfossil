import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/admin/agents-performance
export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            _count: { select: { customers: true, policies: true } },
            policies: {
                where: { status: 'ACTIVE' },
                select: { premium: true, commissionAmt: true, type: true },
            },
        },
    })

    const performance = agents.map(agent => {
        const totalPremium = agent.policies.reduce((s, p) => s + (p.premium || 0), 0)
        const totalCommission = agent.policies.reduce((s, p) => s + (p.commissionAmt || 0), 0)
        const byType = agent.policies.reduce((acc: Record<string, number>, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1
            return acc
        }, {})
        return {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            phone: agent.phone,
            totalCustomers: agent._count.customers,
            totalPolicies: agent._count.policies,
            activePolicies: agent.policies.length,
            totalPremium,
            totalCommission,
            byType,
        }
    }).sort((a, b) => b.totalPremium - a.totalPremium)

    return NextResponse.json({ performance })
}
