'use client';

import { useState } from 'react';
import { Copy, Key, Trash2, Plus, Eye, EyeOff, Check } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string | null;
  status: 'active' | 'revoked';
  environment: 'production' | 'development';
}

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'sk_live_a1b2c3d4e5f6g7h8i9j0',
    created: '2024-11-15',
    lastUsed: '2024-12-10',
    status: 'active',
    environment: 'production',
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'sk_test_z9y8x7w6v5u4t3s2r1q0',
    created: '2024-10-20',
    lastUsed: '2024-12-09',
    status: 'active',
    environment: 'development',
  },
  {
    id: '3',
    name: 'Legacy Integration',
    key: 'sk_live_p0o9i8u7y6t5r4e3w2q1',
    created: '2024-08-05',
    lastUsed: '2024-09-30',
    status: 'revoked',
    environment: 'production',
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(mockApiKeys);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnvironment, setNewKeyEnvironment] = useState<'production' | 'development'>('development');
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const maskKey = (key: string) => {
    if (key.length < 12) return key;
    const prefix = key.substring(0, 8);
    const suffix = key.substring(key.length - 4);
    return `${prefix}****${suffix}`;
  };

  const handleCopyKey = (key: ApiKey) => {
    navigator.clipboard.writeText(key.key);
    setCopiedKey(key.id);
    toast({
      title: 'API Key Copied',
      description: 'The API key has been copied to your clipboard',
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleRevealKey = (keyId: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    // Simulate API call
    setTimeout(() => {
      const newKey: ApiKey = {
        id: String(keys.length + 1),
        name: newKeyName,
        key: `sk_${newKeyEnvironment === 'production' ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 22)}`,
        created: new Date().toISOString().split('T')[0] || new Date().toISOString(),
        lastUsed: null,
        status: 'active',
        environment: newKeyEnvironment,
      };

      setKeys([...keys, newKey]);
      setIsCreateDialogOpen(false);
      setNewKeyName('');
      setNewKeyEnvironment('development');
      setIsCreating(false);

      toast({
        title: 'API Key Created',
        description: `${newKey.name} has been created successfully`,
      });

      // Auto-copy new key
      navigator.clipboard.writeText(newKey.key);
      toast({
        title: 'Key Copied',
        description: 'The new API key has been copied to your clipboard',
      });
    }, 1000);
  };

  const handleRevokeKey = async () => {
    if (!selectedKey) return;

    setIsRevoking(true);

    // Simulate API call
    setTimeout(() => {
      setKeys(keys.map(k =>
        k.id === selectedKey.id ? { ...k, status: 'revoked' as const } : k
      ));
      setIsRevokeDialogOpen(false);
      setSelectedKey(null);
      setIsRevoking(false);

      toast({
        title: 'API Key Revoked',
        description: `${selectedKey.name} has been revoked`,
      });
    }, 800);
  };

  const openRevokeDialog = (key: ApiKey) => {
    setSelectedKey(key);
    setIsRevokeDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for authentication and access control
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Keys</CardDescription>
            <CardTitle className="text-2xl text-white">
              {keys.filter(k => k.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Production Keys</CardDescription>
            <CardTitle className="text-2xl text-white">
              {keys.filter(k => k.environment === 'production' && k.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Revoked Keys</CardDescription>
            <CardTitle className="text-2xl text-white">
              {keys.filter(k => k.status === 'revoked').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            View and manage your API keys. Keep your keys secure and never share them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No API Keys</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first API key to get started
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => {
                  const isRevealed = revealedKeys.has(key.id);
                  const isCopied = copiedKey === key.id;

                  return (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {isRevealed ? key.key : maskKey(key.key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleRevealKey(key.id)}
                          >
                            {isRevealed ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={key.environment === 'production' ? 'default' : 'secondary'}
                        >
                          {key.environment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(key.created).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {key.lastUsed
                          ? new Date(key.lastUsed).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={key.status === 'active' ? 'default' : 'secondary'}
                          className={
                            key.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : ''
                          }
                        >
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(key)}
                            disabled={key.status === 'revoked'}
                          >
                            {isCopied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRevokeDialog(key)}
                            disabled={key.status === 'revoked'}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for authentication. The key will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <select
                id="environment"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newKeyEnvironment}
                onChange={(e) => setNewKeyEnvironment(e.target.value as 'production' | 'development')}
              >
                <option value="development">Development</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewKeyName('');
                setNewKeyEnvironment('development');
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke API Key Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone
              and will immediately stop all applications using this key.
            </DialogDescription>
          </DialogHeader>
          {selectedKey && (
            <div className="space-y-2 py-4">
              <div className="text-sm">
                <span className="font-medium">Key Name:</span> {selectedKey.name}
              </div>
              <div className="text-sm">
                <span className="font-medium">Key:</span>{' '}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {maskKey(selectedKey.key)}
                </code>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRevokeDialogOpen(false);
                setSelectedKey(null);
              }}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeKey}
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking...' : 'Revoke Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
