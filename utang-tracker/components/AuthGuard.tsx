// components/AuthGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const PUBLIC_PATHS = ['/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (!user && !isPublic) router.replace('/login');
    if (user  &&  isPublic) router.replace('/');
  }, [user, isPublic, router]);

  // Block render only on protected pages while unauthenticated
  if (!user && !isPublic) return null;

  return <>{children}</>;
}