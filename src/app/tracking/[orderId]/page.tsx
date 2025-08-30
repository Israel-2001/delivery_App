// app/tracking/[orderId]/page.tsx
import { OrderTracker } from '@/components/OrderTracker';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
}

export default async function TrackingPage({ params, req }: { params: { orderId: string }, req: Request }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const order = await prisma.order.findUnique({
    where: { id: params.orderId, userId: session.userId },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Track Order {order.id}</h1>
      <p>Status: {order.status}</p>
      <OrderTracker status={order.status} />
      <h2 className="text-xl mb-2">Items</h2>
      <ul>
        {order.items.map((item: OrderItem) => (
          <li key={item.id}>{item.productId} - Quantity: {item.quantity}</li> // Fetch product names if needed
        ))}
      </ul>
    </div>
  );
}