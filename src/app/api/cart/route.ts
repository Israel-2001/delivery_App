// app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for adding items
const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(1),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cart = await prisma.cart.findFirst({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, price: true } },
        },
      },
    },
  });

  if (!cart) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const items = cart.items.map((item: { product: { id: string; name: string; price: number }; quantity: number }) => ({
    id: item.product.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));

  return NextResponse.json(items, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { productId, quantity } = addToCartSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Find or create cart
    let cart = await prisma.cart.findFirst({ where: { userId: session.userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: session.userId } });
    }

    // Add or update cart item
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return NextResponse.json({ message: 'Item added to cart' }, { status: 201 });
  } catch (error) {
    console.error('Cart update failed:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}