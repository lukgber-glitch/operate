'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { VendorForm } from '@/components/vendors/VendorForm';
import { Button } from '@/components/ui/button';

export default function NewVendorPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Vendor</h1>
          <p className="text-white/70">
            Create a new vendor for accounts payable management
          </p>
        </div>
      </div>

      {/* Form */}
      <VendorForm />
    </div>
  );
}
