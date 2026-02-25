import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/customers/[id]/claims
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const claims = await prisma.claim.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ claims })
}

// POST /api/customers/[id]/claims
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'AUDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const data = await req.json()
    const claim = await prisma.claim.create({
        data: {
            ...data,
            customerId: id,
            agentId: session.id,
            amount: data.amount ? parseFloat(data.amount) : null,
            settled: data.settled ? parseFloat(data.settled) : null,
        },
    })
    return NextResponse.json({ claim }, { status: 201 })
}

// PUT /api/customers/[id]/claims (update status)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const data = await req.json()
    const { claimId, ...updates } = data
    const claim = await prisma.claim.update({
        where: { id: claimId, customerId: id },
        data: {
            ...updates,
            settled: updates.settled ? parseFloat(updates.settled) : undefined,
        },
    })
    return NextResponse.json({ claim })
}

// DELETE /api/customers/[id]/claims
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { claimId } = await req.json()
    await prisma.claim.delete({ where: { id: claimId, customerId: id } })
    return NextResponse.json({ success: true })
}
