import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, action, type } = await req.json()
    // action: 'APPROVE' or 'REJECT'
    // type: 'CUSTOMER' or 'KYC'

    if (!id || !action || !type) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
        if (type === 'CUSTOMER') {
            await prisma.customer.update({
                where: { id },
                data: {
                    status: action === 'APPROVE' ? 'ACTIVE' : 'REJECTED'
                }
            })
        } else if (type === 'KYC') {
            await prisma.customer.update({
                where: { id },
                data: {
                    kycStatus: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED'
                }
            })
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        // Notify the agent who created the customer
        const customer = await prisma.customer.findUnique({
            where: { id },
            select: { agentId: true, firstName: true }
        });

        if (customer) {
            await prisma.notification.create({
                data: {
                    title: `${type === 'CUSTOMER' ? 'Customer' : 'KYC'} ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
                    message: `Admin has ${action === 'APPROVE' ? 'approved' : 'rejected'} the ${type.toLowerCase()} for ${customer.firstName}.`,
                    type: 'APPROVAL_RESULT',
                    targetId: id,
                    targetType: 'CUSTOMER',
                    // Note: Schema currently doesn't link notification to specific user directly
                    // It's a general list.
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Approval Error:', error)
        return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
    }
}
