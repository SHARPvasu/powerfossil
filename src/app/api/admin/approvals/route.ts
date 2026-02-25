import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        // Fetch customers pending creation approval OR pending KYC approval
        const pendingCustomers = await prisma.customer.findMany({
            where: {
                OR: [
                    { status: 'PENDING_APPROVAL' },
                    { kycStatus: 'PENDING' }
                ]
            },
            include: {
                agent: {
                    select: { name: true, email: true }
                },
                policies: {
                    select: {
                        id: true,
                        policyNumber: true,
                        type: true,
                        company: true,
                        status: true,
                        endDate: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        // Separate them for the frontend
        const pendingNew = pendingCustomers.filter(c => c.status === 'PENDING_APPROVAL')
        const pendingKyc = pendingCustomers.filter(c => c.status !== 'PENDING_APPROVAL' && c.kycStatus === 'PENDING')

        return NextResponse.json({
            pendingNew,
            pendingKyc
        })

    } catch (error) {
        console.error('Error fetching approvals:', error)
        return NextResponse.json({ error: 'Failed to fetch pending approvals' }, { status: 500 })
    }
}
