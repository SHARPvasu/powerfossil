import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (session.role === 'AGENT') where.agentId = session.id
    if (status) where.status = status
    if (search) {
        where.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            { aadharNo: { contains: search } },
        ]
    }

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                policies: { select: { id: true, type: true, status: true, endDate: true } },
                agent: { select: { name: true } },
            },
        }),
        prisma.customer.count({ where }),
    ])

    return NextResponse.json({ customers, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'AUDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const isAgent = session.role === 'AGENT'

    // Agents create customers as PENDING_APPROVAL. Admins create them as ACTIVE.
    const status = isAgent ? 'PENDING_APPROVAL' : 'ACTIVE'

    const customer = await prisma.customer.create({
        data: {
            ...data,
            agentId: session.id,
            status,
        },
    })

    if (isAgent) {
        // Notify admins about the new customer requiring approval
        await prisma.notification.create({
            data: {
                title: 'New Customer Approval Required',
                message: `Agent ${session.name} created a new customer: ${customer.firstName} ${customer.lastName}`,
                type: 'APPROVAL',
                targetId: customer.id,
                targetType: 'CUSTOMER'
            }
        })
    }

    return NextResponse.json({ customer }, { status: 201 })
}
