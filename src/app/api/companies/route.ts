import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/companies
export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const companies = await prisma.insuranceCompany.findMany({
        orderBy: { name: 'asc' },
    })
    return NextResponse.json({ companies })
}

// POST /api/companies
export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const data = await req.json()
    const company = await prisma.insuranceCompany.create({
        data: {
            name: data.name,
            logo: data.logo || null,
            category: data.category || 'GENERAL',
            contact: data.contact || null,
            email: data.email || null,
            website: data.website || null,
            products: data.products ? JSON.stringify(data.products) : null,
            notes: data.notes || null,
        },
    })
    return NextResponse.json({ company }, { status: 201 })
}
