'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ContractForm } from '@/components/hr/contract-form';
import { ContractList } from '@/components/hr/contract-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useContracts } from '@/hooks/use-contracts';
import type { Contract } from '@/lib/api/employees';

export default function EmployeeContractsPage() {
  const params = useParams();
  const { toast } = useToast();
  const employeeId = params.id as string;

  const {
    contracts,
    isLoading,
    error,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
  } = useContracts(employeeId);

  const [showDialog, setShowDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleCreate = () => {
    setEditingContract(null);
    setShowDialog(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setShowDialog(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingContract) {
        await updateContract(editingContract.id, data);
        toast({
          title: 'Success',
          description: 'Contract updated successfully',
        });
      } else {
        await createContract(data);
        toast({
          title: 'Success',
          description: 'Contract created successfully',
        });
      }
      setShowDialog(false);
      setEditingContract(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingContract ? 'update' : 'create'} contract`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContract(id);
      toast({
        title: 'Success',
        description: 'Contract deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete contract',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setEditingContract(null);
  };

  if (isLoading && contracts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/hr/employees/${employeeId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
              <p className="text-muted-foreground">
                Manage employment contracts
              </p>
            </div>
          </div>

          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contract
          </Button>
        </div>

        <ContractList
          contracts={contracts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? 'Edit Contract' : 'Create Contract'}
            </DialogTitle>
          </DialogHeader>
          <ContractForm
            contract={editingContract || undefined}
            employeeId={employeeId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
