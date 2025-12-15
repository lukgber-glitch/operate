'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';
import { VATReturnWizard } from '@/components/tax/uk/VATReturnWizard';
import { useHMRCConnection } from '@/hooks/useHMRC';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{
    periodKey: string;
  }>;
}

export default function UKVATPeriodPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const periodKey = decodeURIComponent(resolvedParams.periodKey);
  const router = useRouter();
  const { connection, isLoading } = useHMRCConnection();

  const handleComplete = () => {
    router.push('/tax/vat/uk');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/tax/vat/uk">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to UK VAT
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!connection?.isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/tax/vat/uk">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to UK VAT
            </Button>
          </Link>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>HMRC Connection Required</AlertTitle>
          <AlertDescription>
            You need to be connected to HMRC Making Tax Digital to file VAT returns.
            Please go back and connect your HMRC account first.
          </AlertDescription>
        </Alert>

        <Link href="/tax/vat/uk">
          <Button>
            Go to UK VAT Settings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-4"
      >
        <Link href="/tax/vat/uk">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to UK VAT
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File VAT Return</h1>
          <p className="text-muted-foreground">
            Period: {periodKey}
          </p>
        </div>
      </motion.div>

      {/* Wizard */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <VATReturnWizard initialPeriodKey={periodKey} onComplete={handleComplete} />
      </motion.div>
    </div>
  );
}
