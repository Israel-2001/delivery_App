// app/login/page.tsx
'use client'; // Client component for form

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signin', email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const { token } = await res.json();
    document.cookie = `token=${token}; path=/; secure; samesite=strict`;
    router.push('/dashboard');
  } catch (err) {
    setError((err as Error).message);
  }
};

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit">Login</Button>
      </form>
    </div>
  );
}