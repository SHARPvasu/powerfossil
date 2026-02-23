import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Default commission rates (could be moved to a settings model later)
        const commissionRates: Record<string, number> = {
            'HEALTH': 0.15, // 15%
            'MOTOR': 0.05,  // 5%
            'LIFE': 0.25,   // 25%
            'TERM': 0.30,   // 30%
            'OTHER': 0.10   // 10%
        }

        const policies = await prisma.policy.findMany({
            where: { status: 'ACTIVE' },
            select: {
                type: true,
                premium: true,
                createdAt: true,
                agent: { select: { name: true, id: true } }
            }
        })

        // Aggregations
        const byType: Record<string, { premium: number; commission: number; count: number }> = {}
        const byMonth: Record<string, { premium: number; commission: number }> = {}
        const byAgent: Record<string, { agentName: string; premium: number; commission: number; count: number }> = {}

        let totalPremium = 0
        let totalCommission = 0

        policies.forEach(p => {
            const rate = commissionRates[p.type] || commissionRates['OTHER']
            const commission = p.premium * rate

            totalPremium += p.premium
            totalCommission += commission

            // Group by Type
            if (!byType[p.type]) byType[p.type] = { premium: 0, commission: 0, count: 0 }
            byType[p.type].premium += p.premium
            byType[p.type].commission += commission
            byType[p.type].count += 1

            // Group by Month
            const month = p.createdAt.toISOString().substring(0, 7) // YYYY-MM
            if (!byMonth[month]) byMonth[month] = { premium: 0, commission: 0 }
            byMonth[month].premium += p.premium
            byMonth[month].commission += commission

            // Group by Agent
            const agentId = p.agent.id
            if (!byAgent[agentId]) byAgent[agentId] = { agentName: p.agent.name, premium: 0, commission: 0, count: 0 }
            byAgent[agentId].premium += p.premium
            byAgent[agentId].commission += commission
            byAgent[agentId].count += 1
        })

        return NextResponse.json({
            summary: {
                totalPremium,
                totalCommission,
                policyCount: policies.length
            },
            byType,
            byMonth,
            byAgent: Object.values(byAgent).sort((a, b) => b.premium - a.premium)
        })

    } catch (error) {
        console.error('Financial report error:', error)
        return NextResponse.json({ error: 'Failed to generate financial report' }, { status: 500 })
    }
}
