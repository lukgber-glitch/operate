'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HRPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/hr/employees');
  }, [router]);

  return null;
}
