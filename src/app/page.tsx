// app/dashboard/page.tsx
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OrderTracker } from '@/components/OrderTracker';
import UserProfile from '@/components/UserProfile';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  status: string;
  createdAt: string | Date;
  items: OrderItem[];
}

export default async function DashboardPage() {
  // Note: In App Router, server components don't receive 'req' directly.
  // For auth, use cookies/headers within your session helper.
  const session = await getSession(); // App Router server component: no args
  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: { select: { name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* User Profile Section */}
      {user && <UserProfile user={user} />}

      {/* Order History Section */}
      <h2 className="text-2xl font-semibold mb-4">Order History</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet. <Link href="/products" className="text-blue-500 hover:underline">Start shopping!</Link></p>
      ) : (
        <div className="space-y-6">
          {orders.map((order: Order) => (
            <div key={order.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">Order ID: {order.id}</p>
                  <p className="text-sm text-gray-600">Placed on: {formatDate(new Date(order.createdAt))}</p>
                </div>
                <Link href={`/tracking/${order.id}`}>
                  <Button>Track Order</Button>
                </Link>
              </div>
              <p className="text-sm">Status: <span className="font-semibold">{order.status}</span></p>
              <OrderTracker status={order.status} />
              <h3 className="text-sm font-medium mt-4">Items:</h3>
              <ul className="list-disc pl-5">
                {order.items.map((item: OrderItem) => (
                  <li key={item.id} className="text-sm">
                    {item.product.name} - {item.quantity} x {formatCurrency(item.product.price)}
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-semibold">
                Total: {formatCurrency(
                  order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity * item.product.price, 0)
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}