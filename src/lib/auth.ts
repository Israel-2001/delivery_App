// lib/auth.ts
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface Session {
  userId: string;
  role: string; // Add role to session
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });
    if (!user) return null;
    return { userId: user.id, role: user.role };
  } catch {
    return null;
  }
}

export async function signUp(email: string, password: string, name: string, role: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER'): Promise<{ user: { id: string; email: string; name: string; role: string }; token: string }> {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, role },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
}

export async function signIn(email: string, password: string): Promise<{ user: { id: string; email: string; name: string; role: string }; token: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
}