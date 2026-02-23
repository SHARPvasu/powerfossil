import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            policies: {
                include: { documents: true },
                orderBy: { createdAt: 'desc' },
            },
            family: { orderBy: { createdAt: 'asc' } },
            notes: {
                include: { agent: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            },
            callLogs: {
                include: { agent: { select: { name: true } } },
                orderBy: { callDate: 'desc' },
                take: 20,
            },
            agent: { select: { name: true, email: true } },
        },
    })

    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ customer })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'AUDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const data = await req.json()
    // Strip read-only and relation fields
    const { id: _id, createdAt, updatedAt, agent, policies, family, notes, callLogs, proposerFor, ...updateData } = data
    void _id; void createdAt; void updatedAt; void agent; void policies; void family; void notes; void callLogs; void proposerFor;

    // Check if kycStatus is becoming PENDING from a previous state and an AGENT is doing it
    let notifyKyc = false;
    if (session.role === 'AGENT' && updateData.kycStatus === 'PENDING') {
        const existing = await prisma.customer.findUnique({ where: { id }, select: { kycStatus: true, firstName: true, lastName: true } });
        if (existing && existing.kycStatus !== 'PENDING') {
            notifyKyc = true;
            // Temporarily store name for notification
            updateData._tempName = `${existing.firstName} ${existing.lastName}`;
        }
    }

    // Handle Image Uploads for Updates
    try {
        if (updateData.livePhoto && updateData.livePhoto.startsWith('data:image')) {
            updateData.livePhoto = await uploadImage(updateData.livePhoto, 'customers')
        }
        if (updateData.aadharFront && updateData.aadharFront.startsWith('data:image')) {
            updateData.aadharFront = await uploadImage(updateData.aadharFront, 'customers/kyc')
        }
        if (updateData.aadharBack && updateData.aadharBack.startsWith('data:image')) {
            updateData.aadharBack = await uploadImage(updateData.aadharBack, 'customers/kyc')
        }
        if (updateData.panPhoto && updateData.panPhoto.startsWith('data:image')) {
            updateData.panPhoto = await uploadImage(updateData.panPhoto, 'customers/kyc')
        }
    } catch (uploadError) {
        console.error("Cloudinary upload failed during customer update:", uploadError)
        return NextResponse.json({ error: 'Failed to upload one or more documents' }, { status: 500 })
    }

    const { _tempName, ...finalUpdateData } = updateData;

    const customer = await prisma.customer.update({
        where: { id },
        data: finalUpdateData,
    })

    if (notifyKyc && _tempName) {
        await prisma.notification.create({
            data: {
                title: 'KYC Approval Required',
                message: `Agent ${session.name} submitted KYC documents for customer: ${_tempName}`,
                type: 'APPROVAL',
                targetId: customer.id,
                targetType: 'CUSTOMER'
            }
        })
    }

    return NextResponse.json({ customer })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
