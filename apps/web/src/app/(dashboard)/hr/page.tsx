'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HRPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/hr/employees');
  }, [router]);

  return null;
}
