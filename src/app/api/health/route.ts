import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`
        
        return NextResponse.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Health check failed:', error)
        return NextResponse.json({
            status: 'unhealthy',
            database: 'disconnected',
            error: 'Database connection failed',
            timestamp: new Date().toISOString()
        }, { status: 503 })
    }
}