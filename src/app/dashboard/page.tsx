// app/dashboard/page.tsx
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OrderTracker } from '@/components/OrderTracker';
import { redirect } from 'next/navigation';

interface Order {
  id: string;
  status: string;
  items: unknown[];
}

export default async function DashboardPage({ req }: { req: Request }) { // Note: In App Router, use cookies or headers for server-side auth
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: { items: true },
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <h2 className="text-xl mb-2">Order History</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order: Order) => (
            <li key={order.id} className="border p-4">
              <p>Order ID: {order.id}</p>
              <p>Status: {order.status}</p>
              <OrderTracker status={order.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}