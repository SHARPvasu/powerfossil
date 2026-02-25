import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        if (!session?.id || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch logs, most recent first, limit to latest 200
        const logs = await prisma.whatsAppLog.findMany({
            orderBy: { sentAt: 'desc' },
            take: 200
        })

        return NextResponse.json({ logs })
    } catch (error) {
        console.error('Fetch WhatsApp logs error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
