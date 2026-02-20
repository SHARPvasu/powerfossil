import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const users = await prisma.user.findMany({
        select: {
            id: true, name: true, email: true, role: true, phone: true, createdAt: true,
            _count: { select: { customers: true, policies: true, calls: true } },
        },
        orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, email, password, role, phone } = await req.json()
    if (!name || !email || !password) return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data: { name, email, password: hashed, role: role || 'AGENT', phone: phone || null },
        select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true, _count: { select: { customers: true, policies: true, calls: true } } },
    })

    return NextResponse.json({ user }, { status: 201 })
}
