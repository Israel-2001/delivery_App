// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { prisma, connectDB } from '@/lib/db';
import { withDB, dbOperations } from '@/lib/db-middleware';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Validation schema
const paymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive'),
});

export async function POST(req: NextRequest) {
  // Authenticate user
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure database connection
    await connectDB();
    
    // Parse and validate request body
    const body = await req.json();
    const { orderId, amount } = paymentSchema.parse(body);

    // Verify order exists and belongs to user using middleware
    const order = await withDB(
      () => prisma.order.findUnique({
        where: { id: orderId, userId: session.userId },
      }),
      null
    );
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: { orderId, userId: session.userId },
      description: `Payment for order ${orderId}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });
   
    return NextResponse.json(
      { clientSecret: paymentIntent.client_secret },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment creation failed:', error);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('prepared statement')) {
      console.error('Database prepared statement error - this may indicate connection issues');
      return NextResponse.json({ 
        error: 'Database connection error. Please try again.' 
      }, { status: 503 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}