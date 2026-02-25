import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT /api/companies/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const data = await req.json()
    const company = await prisma.insuranceCompany.update({
        where: { id },
        data: {
            name: data.name,
            logo: data.logo || null,
            category: data.category || 'GENERAL',
            contact: data.contact || null,
            email: data.email || null,
            website: data.website || null,
            products: data.products ? JSON.stringify(data.products) : null,
            notes: data.notes || null,
            isActive: data.isActive ?? true,
        },
    })
    return NextResponse.json({ company })
}

// DELETE /api/companies/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    await prisma.insuranceCompany.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
