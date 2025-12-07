'use client';

import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Edit, FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { VendorCard } from '@/components/vendors/VendorCard';
import { VendorStats } from '@/components/vendors/VendorStats';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVendor, useVendorStats, useDeleteVendor } from '@/hooks/useVendors';

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: vendor, isLoading: isVendorLoading } = useVendor(vendorId);
  const { data: stats, isLoading: isStatsLoading } = useVendorStats(vendorId);
  const deleteMutation = useDeleteVendor();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(vendorId);
      router.push('/vendors');
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  if (isVendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Vendor not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/vendors')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {vendor.displayName || vendor.name}
            </h1>
            <p className="text-muted-foreground">Vendor details and bill history</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/bills/new?vendorId=${vendorId}`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Create Bill
          </Button>
          <Button variant="outline" onClick={() => router.push(`/vendors/${vendorId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <VendorStats stats={stats} isLoading={isStatsLoading} />

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <VendorCard vendor={vendor} />
        </TabsContent>

        <TabsContent value="bills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill History</CardTitle>
              <CardDescription>All bills from this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Bill management coming soon</p>
                <p className="text-sm mt-2">
                  This will show all bills associated with this vendor
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Contracts, invoices, and other files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Document management coming soon</p>
                <p className="text-sm mt-2">
                  Upload and manage vendor-related documents
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vendor "{vendor.displayName || vendor.name}" and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Vendor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
