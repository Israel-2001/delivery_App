// lib/db-middleware.ts
import { prisma, checkDBHealth } from './db';

// Middleware to handle database operations with connection management
export async function withDB<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    // Check database health before operation
    const isHealthy = await checkDBHealth();
    if (!isHealthy) {
      throw new Error('Database connection unhealthy');
    }
    
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error);
    
    // If it's a prepared statement error, try to recover
    if (error instanceof Error && error.message.includes('prepared statement')) {
      console.log('Attempting to recover from prepared statement error...');
      
      try {
        // Wait a bit and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        const isHealthy = await checkDBHealth();
        if (isHealthy) {
          return await operation();
        }
      } catch (retryError) {
        console.error('Recovery attempt failed:', retryError);
      }
    }
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw error;
  }
}

// Specific middleware for common database operations
export const dbOperations = {
  async findUnique<T>(model: { findUnique: (args: Record<string, unknown>) => Promise<T | null> }, args: Record<string, unknown>): Promise<T | null> {
    return withDB(() => model.findUnique(args), null);
  },
  
  async findMany<T>(model: { findMany: (args?: Record<string, unknown>) => Promise<T[]> }, args?: Record<string, unknown>): Promise<T[]> {
    return withDB(() => model.findMany(args), []);
  },
  
  async create<T>(model: { create: (args: { data: Record<string, unknown> }) => Promise<T> }, args: { data: Record<string, unknown> }): Promise<T> {
    return withDB(() => model.create(args));
  },
  
  async update<T>(model: { update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<T> }, args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<T> {
    return withDB(() => model.update(args));
  },
  
  async delete<T>(model: { delete: (args: { where: Record<string, unknown> }) => Promise<T> }, args: { where: Record<string, unknown> }): Promise<T> {
    return withDB(() => model.delete(args));
  },
};
