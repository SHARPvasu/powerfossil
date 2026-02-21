import { NextResponse } from 'next/server'
import { checkDatabaseConnection, getDatabaseEnvIssues, databaseEnvStatus } from '@/lib/db'

export async function GET() {
  const envIssues = getDatabaseEnvIssues()
  const envStatus = databaseEnvStatus()
  const timestamp = new Date().toISOString()

  if (envIssues.length > 0) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'misconfigured',
      env: envStatus,
      issues: envIssues,
      timestamp,
    }, { status: 500 })
  }

  const connection = await checkDatabaseConnection()

  if (!connection.connected) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      env: envStatus,
      error: connection.message,
      timestamp,
    }, { status: connection.status ?? 503 })
  }

  return NextResponse.json({
    status: 'healthy',
    database: 'connected',
    env: envStatus,
    timestamp,
  })
}
