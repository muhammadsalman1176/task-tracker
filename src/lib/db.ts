import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with minimal logging to reduce noise
const prismaClient = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'minimal',
})

export const db = globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}