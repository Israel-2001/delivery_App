// app/api/health/db/route.ts
import { NextResponse } from 'next/server';
import { checkDBHealth, connectDB } from '@/lib/db';

export async function GET() {
  try {
    // Try to connect to database
    await connectDB();
    
    // Check database health
    const isHealthy = await checkDBHealth();
    
    if (isHealthy) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
