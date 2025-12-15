'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle, FileSignature } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ContractPreview,
  SignaturePad,
  ContractStatusBadge,
} from '@/components/contracts';
import {
  usePublicContract,
  useSignContract,
} from '@/hooks/use-business-contracts';

const signSchema = z.object({
  signerName: z.string().min(1, 'Name is required'),
  signerEmail: z.string().email('Valid email is required'),
  signature: z.string().min(1, 'Signature is required'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms',
  }),
});

type SignFormData = z.infer<typeof signSchema>;

export default function PublicSignPage() {
  const params = useParams();
  const token = params.token as string;

  const { data: contract, isLoading } = usePublicContract(token);
  const signContract = useSignContract();

  const [signature, setSignature] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignFormData>({
    resolver: zodResolver(signSchema),
  });

  const agreeToTerms = watch('agreeToTerms');

  const onSubmit = async (data: SignFormData) => {
    try {
      await signContract.mutateAsync({
        token,
        signatureData: {
          signerName: data.signerName,
          signerEmail: data.signerEmail,
          signature: signature!,
        },
      });
      setIsSigned(true);
    } catch (error) {
      console.error('Failed to sign contract:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading contract...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-12 text-center max-w-md">
          <p className="text-muted-foreground">
            Contract not found or link has expired
          </p>
        </Card>
      </div>
    );
  }

  if (contract.status === 'SIGNED' || isSigned) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="p-12 text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Contract Signed!</h2>
          <p className="text-muted-foreground">
            This contract has been successfully signed. You will receive a copy
            via email shortly.
          </p>
        </Card>
      </div>
    );
  }

  if (contract.status === 'CANCELLED') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="p-12 text-center max-w-md">
          <p className="text-muted-foreground">This contract has been cancelled</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{contract.title}</h1>
              <p className="text-muted-foreground">
                You have been requested to review and sign this contract
              </p>
            </div>
            <ContractStatusBadge status={contract.status} />
          </div>
        </Card>

        {/* Contract Content */}
        <ContractPreview content={contract.content} />

        {/* Signature Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Sign Contract
              </h2>
              <p className="text-sm text-muted-foreground">
                Please provide your information and signature below to complete the
                signing process.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signerName">Full Name *</Label>
                <Input
                  id="signerName"
                  {...register('signerName')}
                  placeholder="John Doe"
                />
                {errors.signerName && (
                  <p className="text-sm text-destructive">
                    {errors.signerName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signerEmail">Email Address *</Label>
                <Input
                  id="signerEmail"
                  type="email"
                  {...register('signerEmail')}
                  placeholder="john@example.com"
                />
                {errors.signerEmail && (
                  <p className="text-sm text-destructive">
                    {errors.signerEmail.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <SignaturePad
                onSignatureChange={(sig) => {
                  setSignature(sig);
                  setValue('signature', sig || '');
                }}
              />
              {errors.signature && (
                <p className="text-sm text-destructive">
                  {errors.signature.message}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="agreeToTerms"
                checked={agreeToTerms}
                onCheckedChange={(checked) =>
                  setValue('agreeToTerms', checked as boolean)
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="agreeToTerms"
                  className="text-sm font-normal cursor-pointer"
                >
                  I agree to the terms and conditions outlined in this contract
                </Label>
                {errors.agreeToTerms && (
                  <p className="text-sm text-destructive">
                    {errors.agreeToTerms.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!signature || signContract.isPending}
            >
              {signContract.isPending ? 'Signing...' : 'Sign Contract'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
