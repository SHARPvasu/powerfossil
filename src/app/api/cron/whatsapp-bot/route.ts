import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format, addDays } from 'date-fns'

export async function GET(req: Request) {
    // In a real production setup, you would secure this endpoint using a cron secret header
    // e.g. if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) ...

    try {
        const settings = await prisma.whatsAppSettings.findFirst()

        if (!settings || !settings.isActive || !settings.accessToken || !settings.phoneNumberId) {
            return NextResponse.json({ message: 'WhatsApp bot is disabled or missing credentials.' }, { status: 200 })
        }

        const today = new Date()
        const todayMonthObj = format(today, 'MM')
        const todayDayObj = format(today, 'dd')

        const results = {
            birthdaysSent: 0,
            renewalsSent: 0,
            failed: 0
        }

        // ==========================================
        // 1. BIRTHDAYS
        // ==========================================
        const customers = await prisma.customer.findMany({
            where: { dob: { not: null } },
            select: { id: true, firstName: true, lastName: true, phone: true, dob: true }
        })

        const birthdayCustomers = customers.filter((c: any) => {
            if (!c.dob) return false;
            try {
                // DOB is stored as YYYY-MM-DD
                const parts = c.dob.split('-')
                if (parts.length === 3) {
                    return parts[1] === todayMonthObj && parts[2] === todayDayObj
                }
            } catch (e) { return false }
            return false;
        })

        for (const customer of birthdayCustomers) {
            // Check if we already sent a birthday message today
            const alreadySent = await prisma.whatsAppLog.findFirst({
                where: {
                    customerId: customer.id,
                    messageType: 'BIRTHDAY',
                    sentAt: {
                        gte: new Date(today.setHours(0, 0, 0, 0)),
                        lt: new Date(today.setHours(23, 59, 59, 999))
                    },
                    status: 'SUCCESS'
                }
            })

            if (alreadySent) continue;

            // Template or text message payload
            // Meta requires pre-approved templates for business-initiated conversations.
            // Using a generic text fallback to demonstrate the API shape.
            const messagePayload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: formatPhoneNumber(customer.phone),
                type: "text",
                text: {
                    preview_url: false,
                    body: `🎉 Happy Birthday, ${customer.firstName}! Wishing you a fantastic day ahead. - Your UV Insurance Team`
                }
            }

            const success = await sendWhatsAppMessage(settings, messagePayload)

            await prisma.whatsAppLog.create({
                data: {
                    customerId: customer.id,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                    phone: customer.phone,
                    messageType: 'BIRTHDAY',
                    status: success ? 'SUCCESS' : 'FAILED',
                    errorMessage: success ? null : 'Meta API rejected payload or connection error'
                }
            })

            if (success) {
                results.birthdaysSent++
            } else {
                results.failed++
            }
        }

        // ==========================================
        // 2. RENEWALS
        // ==========================================
        // Targets: 30 days, 15 days, 3 days
        const targetDates = [
            { label: 'RENEWAL_30', date: format(addDays(new Date(), 30), 'yyyy-MM-dd') },
            { label: 'RENEWAL_15', date: format(addDays(new Date(), 15), 'yyyy-MM-dd') },
            { label: 'RENEWAL_3', date: format(addDays(new Date(), 3), 'yyyy-MM-dd') },
        ]

        for (const target of targetDates) {
            const expiringPolicies = await prisma.policy.findMany({
                where: { endDate: target.date, status: 'ACTIVE' },
                include: { customer: true }
            })

            for (const policy of expiringPolicies) {
                const customer = policy.customer;

                // Prevent duplicate sends for the same policy & target timeframe
                const alreadySent = await prisma.whatsAppLog.findFirst({
                    where: {
                        customerId: customer.id,
                        messageType: target.label, // specifically the 30/15/3 label
                        sentAt: {
                            gte: new Date(today.setHours(0, 0, 0, 0))
                        },
                        status: 'SUCCESS'
                    }
                })

                if (alreadySent) continue;

                const timeText = target.label === 'RENEWAL_3' ? 'in 3 days' : target.label === 'RENEWAL_15' ? 'in 15 days' : 'next month';

                const messagePayload = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: formatPhoneNumber(customer.phone),
                    type: "text",
                    text: {
                        preview_url: false,
                        body: `Hi ${customer.firstName}, a quick reminder that your ${policy.type} insurance (${policy.company} - ${policy.planName}) is due for renewal ${timeText} on ${policy.endDate}. Premium: ₹${policy.premium}. Please contact us to renew and keep your coverage uninterrupted.`
                    }
                }

                const success = await sendWhatsAppMessage(settings, messagePayload)

                await prisma.whatsAppLog.create({
                    data: {
                        customerId: customer.id,
                        customerName: `${customer.firstName} ${customer.lastName}`,
                        phone: customer.phone,
                        messageType: target.label,
                        status: success ? 'SUCCESS' : 'FAILED',
                        errorMessage: success ? null : 'Meta API rejected payload or connection error'
                    }
                })

                if (success) {
                    results.renewalsSent++
                } else {
                    results.failed++
                }
            }
        }

        return NextResponse.json({ success: true, results })

    } catch (error) {
        console.error('WhatsApp Bot Cron Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// -------------------------------------------------------------
// Helper: Send the HTTP Request to Meta Graph API
// -------------------------------------------------------------
async function sendWhatsAppMessage(settings: any, payload: any): Promise<boolean> {
    const url = `https://graph.facebook.com/v18.0/${settings.phoneNumberId}/messages`

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errData = await response.json()
            console.error('Meta API Error:', errData)
            return false
        }

        return true
    } catch (e) {
        console.error('Fetch Error to Meta:', e)
        return false
    }
}

// Ensure phone number has country code (assumes India +91 if purely 10 digits)
function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
        return `91${cleaned}`
    }
    // Meta requires numbers without the '+' sign
    if (cleaned.startsWith('0')) {
        return `91${cleaned.substring(1)}`
    }
    return cleaned
}
