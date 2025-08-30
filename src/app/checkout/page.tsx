// app/checkout/page.tsx
'use client'; // Client component for form handling

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { z } from 'zod';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Validation schema for address
const addressSchema = z.object({
  address: z.string().min(1, 'Shipping address is required'),
});

// Fetch cart items
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

export default function CheckoutPage() {
  const [address, setAddress] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const router = useRouter();

  // Calculate total
  const total = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;

  // Fetch cart items on mount
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

  // Create order and fetch PaymentIntent client secret
  const handleCreateOrder = async () => {
    if (!address || cartItems.length === 0) {
      setError('Please enter an address and ensure you have items in your cart');
      return;
    }

    try {
      setError('');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Safe token extraction with null checks
      const cookies = document.cookie || '';
      const token = cookies
        .split('; ')
        .find(row => row.startsWith('token='))?.split('=')[1] || '';

      if (!token) {
        setError('Please log in to continue');
        return;
      }

      // Create order
      const orderRes = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          address,
        }),
      });
      
      if (!orderRes.ok) {
        let errorMessage = 'Failed to create order';
        try {
          const errorData = await orderRes.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = orderRes.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      let orderData;
      try {
        orderData = await orderRes.json();
      } catch (parseError) {
        throw new Error('Invalid response from order creation');
      }
      
      const { id: orderId } = orderData;
      if (!orderId) {
        throw new Error('Order created but no ID returned');
      }

      // Create PaymentIntent
      const paymentRes = await fetch(`${apiUrl}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, amount: total }),
      });
      
      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
      
      const { clientSecret } = await paymentRes.json();
      setClientSecret(clientSecret);
      setCreatedOrderId(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
          {cartItems.length === 0 ? (
            <p>No items in cart.</p>
          ) : (
            <ul className="space-y-2">
              {cartItems.map(item => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 font-bold">Total: ${total.toFixed(2)}</p>
        </div>

        {/* Checkout Form */}
        <div>
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium">
                Shipping Address
              </label>
              <Input
                id="address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main St, City, Country"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {!clientSecret ? (
              <Button 
                onClick={handleCreateOrder} 
                disabled={!address || cartItems.length === 0}
                className="w-full"
              >
                Create Order & Continue to Payment
              </Button>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm orderId={createdOrderId} />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment Form Component
function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        // Safe token extraction with null checks
        const cookies = document.cookie || '';
        const token = cookies
          .split('; ')
          .find(row => row.startsWith('token='))?.split('=')[1] || '';
          
        if (!orderId) {
          setPaymentError('Missing order ID; cannot update order status');
          return;
        }

        await fetch(`${apiUrl}/api/orders`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId,
            status: 'PAID',
          }),
        });
        router.push('/dashboard');
      }
    } catch (err) {
      setPaymentError('An unexpected error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {paymentError && <p className="text-red-500 text-sm">{paymentError}</p>}
      <Button type="submit" disabled={!stripe || !elements}>
        Pay Now
      </Button>
    </form>
  );
}