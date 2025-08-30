// app/products/page.tsx
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

async function getProducts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // Fallback for development
  const res = await fetch(`${apiUrl}/api/products`, {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`);
  }
  return res.json();
}

export default async function ProductsPage() {
  let products = [];
  try {
    products = await getProducts();
  } catch (error) {
    console.error(error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        <p className="text-red-500">Error loading products. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product: { id: string; name: string; price: number; image: string }) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <ProductCard product={product} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}