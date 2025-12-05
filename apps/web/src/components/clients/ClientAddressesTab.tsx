'use client';

import { Building2, Edit, Home, MapPin, MoreVertical, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { AddAddressDialog } from './AddAddressDialog';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Client } from '@/lib/api/crm';

interface ClientAddressesTabProps {
  client: Client;
}

interface Address {
  id: string;
  type: 'PRIMARY' | 'BILLING' | 'SHIPPING' | 'REGISTERED';
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode: string;
  isPrimary?: boolean;
}

export function ClientAddressesTab({ client }: ClientAddressesTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);

  // Convert client addresses to array format
  const addresses: Address[] = [];
  if (client.address) {
    addresses.push({
      id: 'primary',
      type: 'PRIMARY',
      ...client.address,
      isPrimary: true,
    });
  }
  if (client.billingAddress) {
    addresses.push({
      id: 'billing',
      type: 'BILLING',
      ...client.billingAddress,
    });
  }

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'PRIMARY':
        return <Home className="h-5 w-5 text-muted-foreground" />;
      case 'BILLING':
        return <Building2 className="h-5 w-5 text-muted-foreground" />;
      case 'SHIPPING':
        return <Package className="h-5 w-5 text-muted-foreground" />;
      case 'REGISTERED':
        return <MapPin className="h-5 w-5 text-muted-foreground" />;
      default:
        return <MapPin className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'PRIMARY':
        return 'Primary Address';
      case 'BILLING':
        return 'Billing Address';
      case 'SHIPPING':
        return 'Shipping Address';
      case 'REGISTERED':
        return 'Registered Address';
      default:
        return 'Address';
    }
  };

  const handleDeleteAddress = async () => {
    if (deleteAddress) {
      // TODO: Implement address deletion
      setDeleteAddress(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Addresses</h2>
          <p className="text-muted-foreground">Manage client addresses and locations</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {!addresses.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No addresses added yet</p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className={address.isPrimary ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getAddressIcon(address.type)}
                    <div>
                      <CardTitle className="text-lg">{getAddressTypeLabel(address.type)}</CardTitle>
                      {address.isPrimary && (
                        <Badge variant="default" className="mt-1">
                          Primary
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditAddress(address)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!address.isPrimary && (
                        <DropdownMenuItem
                          onClick={() => setDeleteAddress(address)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  {address.street && <p>{address.street}</p>}
                  {(address.city || address.postalCode) && (
                    <p>
                      {address.postalCode} {address.city}
                    </p>
                  )}
                  <p className="text-muted-foreground">{address.countryCode}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddAddressDialog
        clientId={client.id}
        address={editAddress}
        open={isAddOpen || !!editAddress}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditAddress(null);
          }
        }}
      />

      <AlertDialog open={!!deleteAddress} onOpenChange={() => setDeleteAddress(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
