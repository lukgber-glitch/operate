'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Plus, FileText, Calendar, Shield, Upload } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useUSTax, US_STATES, type ExemptionCertificate } from '@/hooks/useUSTax';

export default function ExemptionsPage() {
  const { useExemptions, createExemption, updateExemption } = useUSTax();
  const { data: exemptions, isLoading } = useExemptions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExemption, setEditingExemption] = useState<ExemptionCertificate | null>(
    null
  );

  const [formData, setFormData] = useState({
    certificateNumber: '',
    customerId: '',
    customerName: '',
    exemptionType: 'RESALE' as 'RESALE' | 'GOVERNMENT' | 'NONPROFIT' | 'AGRICULTURAL' | 'OTHER',
    states: [] as string[],
    effectiveDate: new Date().toISOString().split('T')[0] || '',
    expirationDate: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingExemption) {
      await updateExemption.mutateAsync({
        id: editingExemption.id,
        data: formData,
      });
    } else {
      await createExemption.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      certificateNumber: '',
      customerId: '',
      customerName: '',
      exemptionType: 'RESALE',
      states: [],
      effectiveDate: new Date().toISOString().split('T')[0] || '',
      expirationDate: '',
      notes: '',
    });
    setEditingExemption(null);
  };

  const handleEdit = (exemption: ExemptionCertificate) => {
    setEditingExemption(exemption);
    setFormData({
      certificateNumber: exemption.certificateNumber,
      customerId: exemption.customerId,
      customerName: exemption.customerName,
      exemptionType: exemption.exemptionType,
      states: exemption.states,
      effectiveDate: exemption.effectiveDate,
      expirationDate: exemption.expirationDate || '',
      notes: exemption.notes || '',
    });
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string, expirationDate?: string) => {
    if (expirationDate && new Date(expirationDate) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }

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

  const getExemptionTypeLabel = (type: string) => {
    switch (type) {
      case 'RESALE':
        return 'Resale';
      case 'GOVERNMENT':
        return 'Government';
      case 'NONPROFIT':
        return 'Non-Profit';
      case 'AGRICULTURAL':
        return 'Agricultural';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  const toggleState = (stateCode: string) => {
    setFormData((prev) => ({
      ...prev,
      states: prev.states.includes(stateCode)
        ? prev.states.filter((s) => s !== stateCode)
        : [...prev.states, stateCode],
    }));
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
          <h1 className="text-3xl font-bold tracking-tight">
            Exemption Certificates
          </h1>
          <p className="text-muted-foreground">
            Manage customer tax exemption certificates
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingExemption ? 'Edit' : 'Add'} Exemption Certificate
                </DialogTitle>
                <DialogDescription>
                  Enter customer tax exemption certificate details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="certificateNumber">
                      Certificate Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="certificateNumber"
                      value={formData.certificateNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certificateNumber: e.target.value,
                        })
                      }
                      placeholder="CERT-12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exemptionType">
                      Exemption Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.exemptionType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, exemptionType: value })
                      }
                    >
                      <SelectTrigger id="exemptionType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESALE">Resale</SelectItem>
                        <SelectItem value="GOVERNMENT">Government</SelectItem>
                        <SelectItem value="NONPROFIT">Non-Profit</SelectItem>
                        <SelectItem value="AGRICULTURAL">Agricultural</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">
                      Customer Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      placeholder="Acme Corporation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer ID</Label>
                    <Input
                      id="customerId"
                      value={formData.customerId}
                      onChange={(e) =>
                        setFormData({ ...formData, customerId: e.target.value })
                      }
                      placeholder="CUST-001"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) =>
                        setFormData({ ...formData, expirationDate: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank if no expiration
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Applicable States <span className="text-destructive">*</span>
                  </Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {US_STATES.map((state) => (
                        <label
                          key={state.code}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.states.includes(state.code)}
                            onChange={() => toggleState(state.code)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{state.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {formData.states.length} state(s)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes about this exemption..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Certificate Document (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input id="document" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a copy of the exemption certificate (PDF, JPG, or PNG)
                  </p>
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
                  disabled={
                    !formData.certificateNumber ||
                    !formData.customerName ||
                    formData.states.length === 0 ||
                    createExemption.isPending ||
                    updateExemption.isPending
                  }
                >
                  {createExemption.isPending || updateExemption.isPending
                    ? 'Saving...'
                    : editingExemption
                    ? 'Update'
                    : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Exemptions List */}
      <motion.div variants={fadeUp}>
        <Card>
        <CardHeader>
          <CardTitle>Exemption Certificates</CardTitle>
          <CardDescription>
            Customer tax exemption certificates on file
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !exemptions || exemptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                No Exemption Certificates
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add customer exemption certificates to enable tax-free sales
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Certificate
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>States</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exemptions.map((exemption) => (
                  <TableRow key={exemption.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {exemption.certificateNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exemption.customerName}</div>
                        {exemption.customerId && (
                          <div className="text-xs text-muted-foreground">
                            ID: {exemption.customerId}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getExemptionTypeLabel(exemption.exemptionType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {exemption.states.length} state(s)
                        <div className="text-xs text-muted-foreground">
                          {exemption.states.slice(0, 3).join(', ')}
                          {exemption.states.length > 3 &&
                            ` +${exemption.states.length - 3}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          {formatDate(exemption.effectiveDate)}
                          {exemption.expirationDate && (
                            <>
                              <br />
                              <span className="text-xs text-muted-foreground">
                                to {formatDate(exemption.expirationDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(exemption.status, exemption.expirationDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(exemption)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
