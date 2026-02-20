import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const data = await req.json()

    const member = await prisma.familyMember.create({
        data: { ...data, customerId: id },
    })

    return NextResponse.json({ member }, { status: 201 })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const members = await prisma.familyMember.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ members })
}
