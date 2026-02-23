import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
    try {
        const today = new Date()
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        const targetDateStr = thirtyDaysFromNow.toISOString().split('T')[0] // YYYY-MM-DD

        // Find policies expiring exactly on that day
        const expiringPolicies = await prisma.policy.findMany({
            where: {
                endDate: targetDateStr,
                status: 'ACTIVE'
            },
            include: {
                customer: true
            }
        })

        const notifications = []

        for (const policy of expiringPolicies) {
            // Check if we already sent a 30-day notification for this policy
            const existing = await prisma.notification.findFirst({
                where: {
                    targetId: policy.id,
                    type: 'RENEWAL',
                    message: { contains: '30 days' }
                }
            })

            if (!existing) {
                const n = await prisma.notification.create({
                    data: {
                        title: 'Upcoming Renewal (30 Days)',
                        message: `Policy ${policy.policyNumber} for ${policy.customer.firstName} ${policy.customer.lastName} is due for renewal in 30 days.`,
                        type: 'RENEWAL',
                        targetId: policy.id,
                        targetType: 'POLICY'
                    }
                })
                notifications.push(n)
            }
        }

        return NextResponse.json({
            success: true,
            checkedDate: targetDateStr,
            notificationsCreated: notifications.length
        })
    } catch (error) {
        console.error('Renewal check error:', error)
        return NextResponse.json({ error: 'Failed to check renewals' }, { status: 500 })
    }
}
