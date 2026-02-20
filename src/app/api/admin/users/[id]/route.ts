import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    if (id === session.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
