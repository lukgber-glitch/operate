'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import {
  InsuranceTypeIcon,
  getInsuranceTypeLabel,
  InsuranceStatusBadge,
} from '@/components/insurance';
import {
  useInsurancePolicies,
  InsuranceType,
  InsuranceStatus,
} from '@/hooks/use-insurance';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function InsurancePoliciesPage() {
  const { policies, filters, setFilters, fetchPolicies, deletePolicy, isLoading } = useInsurancePolicies();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleSearch = () => {
    setFilters({ ...filters, search });
    fetchPolicies({ search });
  };

  const handleTypeFilter = (type: string) => {
    const newType = type === 'all' ? undefined : (type as InsuranceType);
    setFilters({ ...filters, type: newType });
    fetchPolicies({ type: newType });
  };

  const handleStatusFilter = (status: string) => {
    const newStatus = status === 'all' ? undefined : (status as InsuranceStatus);
    setFilters({ ...filters, status: newStatus });
    fetchPolicies({ status: newStatus });
  };

  const handleExpiringSoonFilter = (expiring: boolean) => {
    setFilters({ ...filters, expiringSoon: expiring });
    fetchPolicies({ expiringSoon: expiring });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this policy?')) {
      await deletePolicy(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Insurance Policies</h1>
          <p className="text-gray-400">Manage all your insurance policies</p>
        </div>
        <Link href="/insurance/policies/new">
          <Button className="bg-white text-blue-900 hover:bg-gray-100">
            <Plus className="h-4 w-4 mr-2" />
            Add Policy
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/5 p-4 rounded-lg border border-white/10">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>
          <Button onClick={handleSearch} className="bg-white text-blue-900 hover:bg-gray-100">
            Search
          </Button>
        </div>

        <div className="flex gap-2">
          <Select defaultValue="all" onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LIABILITY">Liability</SelectItem>
              <SelectItem value="PROFESSIONAL_INDEMNITY">Professional Indemnity</SelectItem>
              <SelectItem value="PROPERTY">Property</SelectItem>
              <SelectItem value="HEALTH">Health</SelectItem>
              <SelectItem value="CYBER">Cyber Liability</SelectItem>
              <SelectItem value="VEHICLE">Vehicle</SelectItem>
              <SelectItem value="DIRECTORS_OFFICERS">Directors & Officers</SelectItem>
              <SelectItem value="WORKERS_COMPENSATION">Workers Compensation</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all" onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRING">Expiring Soon</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => handleExpiringSoonFilter(!filters.expiringSoon)}
            className={`${
              filters.expiringSoon
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                : 'bg-white/5 text-white border-white/10'
            } hover:bg-white/10`}
          >
            Expiring Soon
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No policies found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Provider</TableHead>
                <TableHead className="text-gray-300">Premium</TableHead>
                <TableHead className="text-gray-300">Frequency</TableHead>
                <TableHead className="text-gray-300">Expires</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map(policy => (
                <TableRow key={policy.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-medium">
                    <div className="flex items-center gap-2">
                      <InsuranceTypeIcon type={policy.type} className="h-4 w-4" />
                      {policy.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {getInsuranceTypeLabel(policy.type)}
                  </TableCell>
                  <TableCell className="text-gray-300">{policy.provider}</TableCell>
                  <TableCell className="text-gray-300">
                    {formatCurrency(policy.premiumAmount)}
                  </TableCell>
                  <TableCell className="text-gray-300 capitalize">
                    {policy.paymentFrequency.toLowerCase().replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {format(new Date(policy.endDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <InsuranceStatusBadge status={policy.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/insurance/policies/${policy.id}`}>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/insurance/policies/${policy.id}/edit`}>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(policy.id)}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
