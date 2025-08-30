// app/signup/page.tsx
'use client'; // Client component for form

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
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
        body: JSON.stringify({ action: 'signup', name, email, password }),
      });
      if (!res.ok) throw new Error('Signup failed');
  const { token } = await res.json();
document.cookie = `token=${token}; path=/`;
      // Store token, e.g., localStorage.setItem('token', token);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <Input id="email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit">Signup</Button>
      </form>
    </div>
  );
}