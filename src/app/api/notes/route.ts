import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    const where: Record<string, unknown> = {}
    if (customerId) where.customerId = customerId
    if (session.role === 'AGENT') where.agentId = session.id

    const notes = await prisma.note.findMany({
        where,
        include: { agent: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notes })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const note = await prisma.note.create({
        data: { ...data, agentId: session.id },
        include: { agent: { select: { name: true } } },
    })
    return NextResponse.json({ note }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.note.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
