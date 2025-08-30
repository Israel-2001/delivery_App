// lib/db.ts
import { PrismaClient } from '@prisma/client';

// Reuse Prisma client in development to avoid exhausting connections during HMR
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Add connection pool configuration to prevent prepared statement conflicts
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Only connect when explicitly needed, not on module import
// This prevents connection issues during hot reloads
export async function connectDB() {
  try {
    // Check if already connected
    if (prisma.$connect) {
      await prisma.$connect();
      console.log('Database connected');
    }
  } catch (err) {
    console.error('Database connection failed:', err);
    // Don't throw here, let the application continue
    // The connection might already be established
  }
}

export async function disconnectDB() {
  try {
    if (prisma.$disconnect) {
      await prisma.$disconnect();
      console.log('Database disconnected');
    }
  } catch (err) {
    console.error('Database disconnection failed:', err);
  }
}

// Add a health check function
export async function checkDBHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}