// components/UserProfile.tsx
import React from 'react';

interface UserProfileProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="mb-8 border rounded-lg p-4">
      <h2 className="text-2xl font-semibold mb-2">Profile</h2>
      <p className="text-sm">Name: {user.name ?? '—'}</p>
      <p className="text-sm">Email: {user.email ?? '—'}</p>
    </div>
  );
}