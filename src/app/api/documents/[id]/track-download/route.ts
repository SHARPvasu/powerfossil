import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = params

        await prisma.document.update({
            where: { id },
            data: { lastDownloadedAt: new Date() }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Download tracking error:', error)
        return NextResponse.json({ error: 'Failed to track download' }, { status: 500 })
    }
}
