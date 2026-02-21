import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const databaseEnvStatus = () => ({
  databaseUrl: Boolean(process.env.DATABASE_URL),
  directUrl: Boolean(process.env.DIRECT_URL),
})

export const getDatabaseEnvIssues = () => {
  const issues: string[] = []
  if (!process.env.DATABASE_URL) issues.push('DATABASE_URL')
  if (!process.env.DIRECT_URL) issues.push('DIRECT_URL')
  return issues
}

export const getDatabaseErrorDetails = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('P1001')) {
    return { message: 'Unable to reach the database server. Please try again shortly.', status: 503 }
  }

  if (message.includes('P1000')) {
    return { message: 'Database authentication failed. Verify your database credentials.', status: 503 }
  }

  if (message.includes('P1002')) {
    return { message: 'Database connection timed out. Please retry in a moment.', status: 503 }
  }

  if (message.includes('P1013')) {
    return { message: 'Database connection string is invalid. Check DATABASE_URL and DIRECT_URL.', status: 500 }
  }

  return null
}

export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (error) {
    const details = getDatabaseErrorDetails(error)
    return {
      connected: false,
      error,
      message: details?.message ?? 'Database connection failed.',
      status: details?.status ?? 503,
    }
  }
}

export default prisma
