import { NextRequest, NextResponse } from 'next/server'
import { prisma, getDatabaseEnvIssues, getDatabaseErrorDetails } from '@/lib/db'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        console.log('Login attempt for:', email)

        if (!email || !password) {
            console.log('Missing email or password')
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const envIssues = getDatabaseEnvIssues()
        if (envIssues.length > 0) {
            return NextResponse.json({
                error: `Database configuration missing: ${envIssues.join(', ')}.`,
            }, { status: 500 })
        }

        // Find user in database
        const user = await prisma.user.findUnique({ 
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                role: true
            }
        })
        
        if (!user) {
            console.log('User not found:', email)
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        console.log('User found:', user.email, 'Role:', user.role)

        // Verify password
        const valid = await bcrypt.compare(password, user.password)
        
        if (!valid) {
            console.log('Invalid password for:', email)
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        console.log('Password verified for:', email)

        // Generate JWT token
        const token = await signToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        })

        console.log('Token generated for:', email)

        const response = NextResponse.json({
            success: true,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            }
        })

        // Set cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })

        console.log('Login successful for:', email)
        return response

    } catch (error) {
        console.error('Login error:', error)

        const details = getDatabaseErrorDetails(error)
        if (details) {
            return NextResponse.json({ error: details.message }, { status: details.status })
        }

        return NextResponse.json({ 
            error: 'Server error occurred. Please try again.' 
        }, { status: 500 })
    }
}
