import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // Fetch all policies for the logged in agent (or all if admin)
        const whereClause = session.role === 'ADMIN' ? {} : { agentId: session.id }

        const policies = await prisma.policy.findMany({
            where: {
                ...whereClause,
                status: 'ACTIVE', // Only look at currently active policies (ignoring already renewed/cancelled)
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true
                    }
                }
            },
            orderBy: {
                endDate: 'asc' // Show closest expiry first
            }
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // The endDate in DB is a String (e.g. "2024-12-31")
        // We need to parse and filter them

        const expired: typeof policies = []
        const upcoming: typeof policies = [] // Next 1-30 days
        const critical: typeof policies = [] // Next 1-7 days

        policies.forEach(policy => {
            const endDateString = policy.endDate
            if (!endDateString) return

            // Convert "YYYY-MM-DD" back to date
            const endDate = new Date(endDateString)

            // Normalize time for accurate day calculation
            endDate.setHours(0, 0, 0, 0)
            today.setHours(0, 0, 0, 0)

            const timeDiff = endDate.getTime() - today.getTime()
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

            if (daysDiff < 0) {
                expired.push(policy)
            } else if (daysDiff <= 7) {
                critical.push(policy)
            } else if (daysDiff <= 30) {
                upcoming.push(policy)
            }
        })

        return NextResponse.json({
            expired,
            critical,
            upcoming,
            totalCount: expired.length + critical.length + upcoming.length
        })

    } catch (error) {
        console.error('Error fetching renewals:', error)
        return NextResponse.json({ error: 'Failed to fetch renewals' }, { status: 500 })
    }
}
