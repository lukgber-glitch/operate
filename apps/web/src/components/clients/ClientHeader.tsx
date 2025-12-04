'use client';

import {
  ArrowLeft,
  Edit,
  FileText,
  Mail,
  MoreVertical,
  Star,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { EditClientDialog } from './EditClientDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateClient } from '@/hooks/use-clients';
import type { Client, ClientStatus } from '@/lib/api/crm';

interface ClientHeaderProps {
  client: Client;
}

const statusVariants = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  CHURNED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const typeVariants = {
  CUSTOMER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  LEAD: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  PROSPECT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  PARTNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  VENDOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const riskVariants = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function ClientHeader({ client }: ClientHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const updateMutation = useUpdateClient();

  const handleStatusChange = async (status: ClientStatus) => {
    await updateMutation.mutateAsync({
      id: client.id,
      data: { status },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isVIP = client.tags?.includes('VIP');

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/crm">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{getInitials(client.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              {isVIP && (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" title="VIP Client" />
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={typeVariants[client.type]}>
                {client.type}
              </Badge>

              <Select value={client.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-auto h-auto px-2 py-1 border-0">
                  <Badge variant="secondary" className={statusVariants[client.status]}>
                    <SelectValue />
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CHURNED">Churned</SelectItem>
                </SelectContent>
              </Select>

              <Badge variant="outline" className={riskVariants[client.riskLevel]}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {client.riskLevel} Risk
              </Badge>

              {client.vatId && (
                <span className="text-sm text-muted-foreground">VAT: {client.vatId}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Send Invoice
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Send Reminder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View Invoices</DropdownMenuItem>
              <DropdownMenuItem>View Payments</DropdownMenuItem>
              <DropdownMenuItem>View Documents</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditClientDialog
        client={client}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}
