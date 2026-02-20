import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const policy = await prisma.policy.findUnique({
        where: { id },
        include: {
            customer: true,
            agent: { select: { name: true } },
            documents: true,
        },
    })
    if (!policy) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ policy })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const data = await req.json()
    // Strip non-updatable fields
    const { id: _id, createdAt, updatedAt, customer, agent, documents, proposer, ...updateData } = data
    void _id; void createdAt; void updatedAt; void customer; void agent; void documents; void proposer;
    const policy = await prisma.policy.update({
        where: { id },
        data: updateData,
        include: {
            customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, city: true } },
            agent: { select: { name: true } },
            proposer: { select: { firstName: true, lastName: true } },
            documents: true,
        },
    })
    return NextResponse.json({ policy })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    await prisma.policy.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
