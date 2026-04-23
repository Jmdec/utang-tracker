'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AuthInitializer() {
  const rehydrate = useAuthStore((state) => state.rehydrate);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  return null;
}