'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  Trash2,
  FileSignature,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ContractStatusBadge,
  ContractPreview,
  ContractTimeline,
  SendContractDialog,
} from '@/components/contracts';
import {
  useBusinessContract,
  useDeleteBusinessContract,
  useSendBusinessContract,
  useUpdateBusinessContract,
} from '@/hooks/use-business-contracts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const { data: contract, isLoading } = useBusinessContract(contractId);
  const deleteContract = useDeleteBusinessContract();
  const updateContract = useUpdateBusinessContract();
  const sendContract = useSendBusinessContract();

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleDelete = async () => {
    await deleteContract.mutateAsync(contractId);
    router.push('/contracts');
  };

  const handleCancel = async () => {
    await updateContract.mutateAsync({
      id: contractId,
      updates: { status: 'CANCELLED' },
    });
    setCancelDialogOpen(false);
  };

  const handleSend = async (data: any) => {
    await sendContract.mutateAsync({
      id: contractId,
      recipientData: data,
    });
    setSendDialogOpen(false);
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading contract...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Contract not found</p>
        <Button asChild variant="outline">
          <Link href="/contracts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Link>
        </Button>
      </div>
    );
  }

  // Mock timeline events
  const timelineEvents = [
    {
      id: '1',
      type: 'created' as const,
      timestamp: contract.createdAt,
      user: 'You',
    },
    ...(contract.status !== 'DRAFT'
      ? [
          {
            id: '2',
            type: 'sent' as const,
            timestamp: contract.updatedAt,
            user: 'You',
            details: `Sent to ${contract.signerEmail}`,
          },
        ]
      : []),
    ...(contract.status === 'VIEWED'
      ? [
          {
            id: '3',
            type: 'viewed' as const,
            timestamp: contract.updatedAt,
            user: contract.signerName,
          },
        ]
      : []),
    ...(contract.signedAt
      ? [
          {
            id: '4',
            type: 'signed' as const,
            timestamp: contract.signedAt,
            user: contract.signerName,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/contracts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{contract.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <ContractStatusBadge status={contract.status} />
              {contract.clientName && (
                <Badge variant="outline">{contract.clientName}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {contract.status === 'DRAFT' && (
            <>
              <Button asChild variant="outline">
                <Link href={`/contracts/${contractId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button onClick={() => setSendDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send for Signature
              </Button>
            </>
          )}
          {contract.status !== 'CANCELLED' && contract.status !== 'SIGNED' && (
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(true)}
              className="text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Contract Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Content */}
          <ContractPreview content={contract.content} />

          {/* Signature */}
          {contract.signatureUrl && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Signature</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Signed by</p>
                  <p className="font-medium">{contract.signerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {contract.signerEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Signature
                  </p>
                  <div className="border border-white/20 rounded-lg p-4 bg-slate-800/50">
                    <img
                      src={contract.signatureUrl}
                      alt="Signature"
                      className="max-h-24"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Signed on</p>
                  <p className="font-medium">
                    {contract.signedAt &&
                      format(new Date(contract.signedAt), 'PPP p')}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Contract Information</h3>
            <dl className="space-y-3">
              {contract.value && (
                <div>
                  <dt className="text-sm text-muted-foreground">Value</dt>
                  <dd className="font-medium">
                    {new Intl.NumberFormat('de-DE', {
                      style: 'currency',
                      currency: contract.currency || 'EUR',
                    }).format(contract.value)}
                  </dd>
                </div>
              )}
              {contract.startDate && (
                <div>
                  <dt className="text-sm text-muted-foreground">Start Date</dt>
                  <dd className="font-medium">
                    {format(new Date(contract.startDate), 'PPP')}
                  </dd>
                </div>
              )}
              {contract.endDate && (
                <div>
                  <dt className="text-sm text-muted-foreground">End Date</dt>
                  <dd className="font-medium">
                    {format(new Date(contract.endDate), 'PPP')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-muted-foreground">Created</dt>
                <dd className="font-medium">
                  {format(new Date(contract.createdAt), 'PPP')}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Timeline */}
          <ContractTimeline events={timelineEvents} />
        </div>
      </div>

      {/* Dialogs */}
      <SendContractDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onSend={handleSend}
        defaultEmail={contract.signerEmail}
        defaultName={contract.signerName}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contract? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this contract? The recipient will be
              notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancel Contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
