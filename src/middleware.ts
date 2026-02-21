import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/', '/setup', '/api/auth/login', '/api/health', '/api/health/db']

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname

    // Allow public paths
    if (publicPaths.includes(path)) return NextResponse.next()

    // Allow API auth routes
    if (path.startsWith('/api/auth/')) return NextResponse.next()

    const token = req.cookies.get('auth_token')?.value

    if (!token) {
        if (path.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/', req.url))
    }

    const payload = await verifyToken(token)
    if (!payload) {
        if (path.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/', req.url))
    }

    // Admin-only routes
    if (path.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
