// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // To get authenticated user
import { prisma } from '@/lib/db'; // Assume Prisma client in lib/db.ts
import { z } from 'zod';

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })),
  address: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: { items: true },
  });
  return NextResponse.json(orders, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { items, address } = createOrderSchema.parse(body);

    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        address,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
    
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order creation failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// app/api/orders/route.ts (add to existing file)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId, status } = z.object({
      orderId: z.string(),
      status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAID']),
    }).parse(body);

    // Use updateMany with userId guard to avoid P2025 on missing record
    const result = await prisma.order.updateMany({
      where: { id: orderId, userId: session.userId },
      data: { status },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    // Return the updated order
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Order update failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}