import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        if (!session?.id || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const settings = await prisma.whatsAppSettings.findFirst()
        return NextResponse.json({ settings })
    } catch (error) {
        console.error('Fetch WhatsApp settings error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session?.id || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await req.json()
        const { phoneNumberId, accessToken, isActive } = data

        let settings = await prisma.whatsAppSettings.findFirst()

        if (settings) {
            settings = await prisma.whatsAppSettings.update({
                where: { id: settings.id },
                data: {
                    phoneNumberId: phoneNumberId || settings.phoneNumberId,
                    accessToken: accessToken || settings.accessToken,
                    isActive: isActive !== undefined ? isActive : settings.isActive,
                },
            })
        } else {
            settings = await prisma.whatsAppSettings.create({
                data: {
                    phoneNumberId: phoneNumberId || '',
                    accessToken: accessToken || '',
                    isActive: isActive !== undefined ? isActive : false,
                },
            })
        }

        return NextResponse.json({ settings })
    } catch (error) {
        console.error('Update WhatsApp settings error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
