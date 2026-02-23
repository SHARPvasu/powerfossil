import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { target, code } = await req.json()

        if (!target || !code) {
            return NextResponse.json({ error: 'Target and code required' }, { status: 400 })
        }

        // Find the most recent OTP for this target
        const record = await prisma.oTPVerification.findFirst({
            where: { target },
            orderBy: { createdAt: 'desc' }
        })

        if (!record) {
            return NextResponse.json({ error: 'No OTP requested for this address/number' }, { status: 404 })
        }

        if (record.verified) {
            return NextResponse.json({ error: 'OTP already used' }, { status: 400 })
        }

        if (new Date() > record.expiresAt) {
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
        }

        if (record.code !== code) {
            return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 })
        }

        // Mark as verified so they can proceed with the primary action (Register/Create)
        await prisma.oTPVerification.update({
            where: { id: record.id },
            data: { verified: true }
        })

        return NextResponse.json({ success: true, message: 'Verified successfully' })

    } catch (error) {
        console.error('OTP Verify Error:', error)
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
    }
}
