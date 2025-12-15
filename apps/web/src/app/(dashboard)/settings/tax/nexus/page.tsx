'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Plus, MapPin, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUSTax, US_STATES, type TaxNexus } from '@/hooks/useUSTax';

export default function NexusPage() {
  const { useNexus, createNexus, updateNexus } = useUSTax();
  const { data: nexusRegistrations, isLoading } = useNexus();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNexus, setEditingNexus] = useState<TaxNexus | null>(null);

  const [formData, setFormData] = useState({
    state: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    salesThreshold: 100000,
    transactionThreshold: 200,
    taxRegistrationId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingNexus) {
      await updateNexus.mutateAsync({
        id: editingNexus.id,
        data: formData,
      });
    } else {
      await createNexus.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      state: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      salesThreshold: 100000,
      transactionThreshold: 200,
      taxRegistrationId: '',
    });
    setEditingNexus(null);
  };

  const handleEdit = (nexus: TaxNexus) => {
    setEditingNexus(nexus);
    setFormData({
      state: nexus.state,
      effectiveDate: nexus.effectiveDate,
      salesThreshold: nexus.salesThreshold || 100000,
      transactionThreshold: nexus.transactionThreshold || 200,
      taxRegistrationId: nexus.taxRegistrationId || '',
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getThresholdProgress = (current: number | undefined, threshold: number | undefined) => {
    if (!current || !threshold) return 0;
    return Math.min((current / threshold) * 100, 100);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nexus Configuration</h1>
          <p className="text-muted-foreground">
            Manage sales tax nexus registrations across US states
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Nexus
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingNexus ? 'Edit' : 'Add'} Nexus Registration
                </DialogTitle>
                <DialogDescription>
                  Configure sales tax nexus for a US state
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) =>
                      setFormData({ ...formData, state: value })
                    }
                    disabled={!!editingNexus}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {US_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) =>
                      setFormData({ ...formData, effectiveDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesThreshold">
                    Sales Threshold (USD)
                  </Label>
                  <Input
                    id="salesThreshold"
                    type="number"
                    value={formData.salesThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salesThreshold: parseInt(e.target.value),
                      })
                    }
                    placeholder="100000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Economic nexus sales threshold for this state
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionThreshold">
                    Transaction Threshold
                  </Label>
                  <Input
                    id="transactionThreshold"
                    type="number"
                    value={formData.transactionThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transactionThreshold: parseInt(e.target.value),
                      })
                    }
                    placeholder="200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of transactions threshold for economic nexus
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRegistrationId">
                    Tax Registration ID
                  </Label>
                  <Input
                    id="taxRegistrationId"
                    value={formData.taxRegistrationId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxRegistrationId: e.target.value,
                      })
                    }
                    placeholder="State-issued tax ID"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.state || createNexus.isPending || updateNexus.isPending}
                >
                  {createNexus.isPending || updateNexus.isPending
                    ? 'Saving...'
                    : editingNexus
                    ? 'Update'
                    : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Info Banner */}
      <motion.div variants={fadeUp}>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Economic Nexus:</strong> Most states require sales tax collection
              when you exceed $100,000 in sales or 200 transactions per year. Configure
              thresholds to monitor your exposure.
            </div>
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Nexus List */}
      <motion.div variants={fadeUp}>
        <Card>
        <CardHeader>
          <CardTitle>Active Nexus Registrations</CardTitle>
          <CardDescription>
            States where you are registered to collect sales tax
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !nexusRegistrations || nexusRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Nexus Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add states where you have sales tax nexus to begin collecting tax
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Nexus
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Threshold Progress</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nexusRegistrations.map((nexus) => {
                  const state = US_STATES.find((s) => s.code === nexus.state);
                  const progress = getThresholdProgress(
                    nexus.currentSales,
                    nexus.salesThreshold
                  );

                  return (
                    <TableRow key={nexus.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {state?.name || nexus.state}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(nexus.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(nexus.effectiveDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            {formatCurrency(nexus.currentSales)} /{' '}
                            {formatCurrency(nexus.salesThreshold)}
                          </div>
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {nexus.taxRegistrationId || 'Not set'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(nexus)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
