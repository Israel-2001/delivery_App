// app/admin/products/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  description: z.string().optional(),
  image: z.string().url().optional(),
});

export default function AdminProductsPage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) throw new Error('Price must be a valid number');

      const data = productSchema.parse({
        name,
        price: parsedPrice,
        description: description || undefined,
        image: image || undefined,
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))?.split('=')[1] || '';

      const res = await fetch(`${apiUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to add product');
      }

      router.push('/admin/products'); // Refresh or redirect as needed
      setName('');
      setPrice('');
      setDescription('');
      setImage('');
    } catch (err) {
      setError(err instanceof z.ZodError ? err.issues[0].message : (err as Error).message);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Product Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter product name"
            required
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium">
            Price ($)
          </label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="Enter price"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <Input
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter product description (optional)"
          />
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium">
            Image URL
          </label>
          <Input
            id="image"
            value={image}
            onChange={e => setImage(e.target.value)}
            placeholder="Enter image URL (optional)"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit">Add Product</Button>
      </form>
    </div>
  );
}