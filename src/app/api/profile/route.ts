import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            aadharNo: true,
            panNo: true,
            aadharFront: true,
            aadharBack: true,
            panPhoto: true,
            createdAt: true,
        }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user })
}

export async function PUT(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    // Strip read-only fields
    const { id: _id, email: _email, role: _role, createdAt: _createdAt, ...updateData } = data
    void _id; void _email; void _role; void _createdAt;

    // Handle Image Uploads for Agent KYC
    try {
        if (updateData.aadharFront && updateData.aadharFront.startsWith('data:image')) {
            updateData.aadharFront = await uploadImage(updateData.aadharFront, 'agents/kyc')
        }
        if (updateData.aadharBack && updateData.aadharBack.startsWith('data:image')) {
            updateData.aadharBack = await uploadImage(updateData.aadharBack, 'agents/kyc')
        }
        if (updateData.panPhoto && updateData.panPhoto.startsWith('data:image')) {
            updateData.panPhoto = await uploadImage(updateData.panPhoto, 'agents/kyc')
        }
    } catch (uploadError) {
        console.error("Cloudinary upload failed during agent profile update:", uploadError)
        return NextResponse.json({ error: 'Failed to upload one or more documents' }, { status: 500 })
    }

    const user = await prisma.user.update({
        where: { id: session.id },
        data: updateData,
    })

    return NextResponse.json({ user })
}
