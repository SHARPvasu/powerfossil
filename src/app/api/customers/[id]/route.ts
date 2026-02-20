import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            policies: {
                include: { documents: true },
                orderBy: { createdAt: 'desc' },
            },
            family: { orderBy: { createdAt: 'asc' } },
            notes: {
                include: { agent: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            },
            callLogs: {
                include: { agent: { select: { name: true } } },
                orderBy: { callDate: 'desc' },
                take: 20,
            },
            agent: { select: { name: true, email: true } },
        },
    })

    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ customer })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const data = await req.json()
    // Strip read-only and relation fields
    const { id: _id, createdAt, updatedAt, agent, policies, family, notes, callLogs, proposerFor, ...updateData } = data
    void _id; void createdAt; void updatedAt; void agent; void policies; void family; void notes; void callLogs; void proposerFor;
    const customer = await prisma.customer.update({
        where: { id },
        data: updateData,
    })
    return NextResponse.json({ customer })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
