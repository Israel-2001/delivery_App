// app/products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

async function getProduct(id: string): Promise<Product> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deliveryapp-ten.vercel.app/';
  const res = await fetch(`${apiUrl}/api/products?id=${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.statusText}`);
  }
  return res.json();
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { id } = await params;
        const productData = await getProduct(id);
        setProduct(productData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))?.split('=')[1] || '';

      if (!token) {
        router.push('/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add to cart');
      }

      // Redirect to cart page
      router.push('/cart');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-red-500">{error || 'Error loading product. Please try again later.'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      {product.image && (
        <Image src={product.image} alt={product.name} width={640} height={256} className="w-full object-cover mb-4" />
      )}
      <p className="text-xl mb-4">${product.price.toFixed(2)}</p>
      <p className="mb-4">{product.description || 'No description available.'}</p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Button 
        onClick={handleAddToCart} 
        disabled={addingToCart}
        className="w-full md:w-auto"
      >
        {addingToCart ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  );
}
