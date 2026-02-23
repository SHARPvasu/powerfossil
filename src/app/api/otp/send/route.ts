import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { target, type } = await req.json()

        if (!target || !type) {
            return NextResponse.json({ error: 'Target and type required' }, { status: 400 })
        }

        // Generate a random 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        // Set expiration for 10 minutes from now
        const expiresAt = new Date(Date.now() + 10 * 60000)

        // Invalid past OTPs for this target so they can't be guessed
        await prisma.oTPVerification.deleteMany({
            where: { target }
        })

        // Save new OTP
        await prisma.oTPVerification.create({
            data: {
                target,
                code,
                expiresAt,
            }
        })

        // ==========================================
        // SIMULATION LOGIC - Output to Console
        // ==========================================
        console.log(`\n============================`)
        console.log(`🔒 SECURE OTP GENERATED`)
        console.log(`Target (${type}): ${target}`)
        console.log(`Code: ${code}`)
        console.log(`============================\n`)
        // ==========================================

        // Note: For production, you would call Resend/Twilio here:
        // if (type === 'email') await resend.emails.send({ ... })
        // if (type === 'phone') await twilio.messages.create({ ... })

        return NextResponse.json({ success: true, message: `OTP sent to ${target} (Check terminal/console during development)` })

    } catch (error) {
        console.error('OTP Send Error:', error)
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
    }
}
