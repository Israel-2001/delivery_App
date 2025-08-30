// components/Header.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
    const [role, setRole] = useState('');

  useEffect(() => {
    const fetchRole = async () => {
      const res = await fetch('/api/auth/whoami', { // Create this endpoint if needed
        headers: {
          Authorization: `Bearer ${document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || ''}`,
        },
      });
      if (res.ok) {
        const { role } = await res.json();
        setRole(role);
      }
    };
    fetchRole();
  }, []);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <header className="bg-gray-800 text-white p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          DeliveryApp
        </Link>
        <nav className="space-x-4">
          <Link href="/" className="hover:text-gray-300">Home</Link>
          <Link href="/products" className="hover:text-gray-300">Products</Link>
          <Link href="/cart" className="hover:text-gray-300">Cart</Link>
          <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          {role === 'ADMIN' && (
            <Link href="/admin/products" className="text-white">Admin</Link>
          )}
          <Button onClick={handleLogout} className="text-white border-white hover:bg-gray-700">
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}