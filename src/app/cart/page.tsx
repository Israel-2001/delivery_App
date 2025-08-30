// app/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import CartItem from '@/components/CartItem';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

async function getCartItems() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))?.split('=')[1] || '';
  const res = await fetch(`${apiUrl}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getCartItems()
      .then(items => {
        // Ensure items is always an array
        const cartItemsArray = Array.isArray(items) ? items : [];
        setCartItems(cartItemsArray);
      })
      .catch(err => {
        setError(err.message);
        setCartItems([]); // Set empty array on error
      });
  }, []);

  const total = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      {error && <p className="text-red-500">{error}</p>}
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cartItems.map(item => (
              <CartItem key={item.id} item={item} />
            ))}
          </ul>
          <div className="mt-4">
            <p className="text-xl">Total: ${total.toFixed(2)}</p>
            <Link href="/checkout">
              <Button>Proceed to Checkout</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}