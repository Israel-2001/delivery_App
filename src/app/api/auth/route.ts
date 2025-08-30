import { NextRequest, NextResponse } from 'next/server';
import { signIn, signUp } from '@/lib/auth';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body; // 'signin' or 'signup'

  try {
    if (action === 'signin') {
      const { email, password } = signInSchema.parse(body);
      const user = await signIn(email, password);
      return NextResponse.json({ user, token: user.token }, { status: 200 });
    } else if (action === 'signup') {
      const { email, password, name } = signUpSchema.parse(body);
      const user = await signUp(email, password, name);
      return NextResponse.json({ user, token: user.token }, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
