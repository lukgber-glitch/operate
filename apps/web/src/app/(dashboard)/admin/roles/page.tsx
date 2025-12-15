'use client';

import { useState } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Check,
  X,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data for roles and permissions
const permissions = [
  { id: 'users.view', name: 'View Users', category: 'Users' },
  { id: 'users.create', name: 'Create Users', category: 'Users' },
  { id: 'users.edit', name: 'Edit Users', category: 'Users' },
  { id: 'users.delete', name: 'Delete Users', category: 'Users' },
  { id: 'finance.view', name: 'View Finance', category: 'Finance' },
  { id: 'finance.edit', name: 'Edit Finance', category: 'Finance' },
  { id: 'reports.view', name: 'View Reports', category: 'Reports' },
  { id: 'reports.export', name: 'Export Reports', category: 'Reports' },
  { id: 'settings.view', name: 'View Settings', category: 'Settings' },
  { id: 'settings.edit', name: 'Edit Settings', category: 'Settings' },
];

const mockRoles = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system access with all permissions',
    userCount: 12,
    permissions: permissions.map((p) => p.id), // All permissions
    color: 'red',
    isSystem: true,
  },
  {
    id: '2',
    name: 'Manager',
    description: 'Can manage users and view reports',
    userCount: 34,
    permissions: [
      'users.view',
      'users.create',
      'users.edit',
      'finance.view',
      'reports.view',
      'reports.export',
    ],
    color: 'blue',
    isSystem: true,
  },
  {
    id: '3',
    name: 'User',
    description: 'Basic access to view own data',
    userCount: 1188,
    permissions: ['finance.view', 'reports.view'],
    color: 'gray',
    isSystem: true,
  },
  {
    id: '4',
    name: 'Accountant',
    description: 'Full access to finance and reports',
    userCount: 8,
    permissions: [
      'finance.view',
      'finance.edit',
      'reports.view',
      'reports.export',
    ],
    color: 'green',
    isSystem: false,
  },
];

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleDeleteRole = (roleId: string, roleName: string) => {
    // Placeholder for delete functionality
    console.log('Delete role:', roleId);
    const role = mockRoles.find((r) => r.id === roleId);
    if (role?.isSystem) {
      alert(`Cannot delete system role: ${roleName}`);
    } else {
      alert(`Delete role functionality would be implemented here for: ${roleName}`);
    }
  };

  const handleEditRole = (roleId: string) => {
    // Placeholder for edit functionality
    console.log('Edit role:', roleId);
    setSelectedRole(roleId);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[color] || colors.gray;
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category]!.push(permission);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
            <span>/</span>
            <span>Roles</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Role Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage roles and permissions across your organization
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">{mockRoles.length}</div>
            <p className="text-xs text-muted-foreground">
              Including {mockRoles.filter((r) => r.isSystem).length} system
              roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Permissions
            </CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {Object.keys(permissionsByCategory).length} categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">
              {mockRoles.reduce((sum, role) => sum + role.userCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total users with roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">
              {mockRoles.filter((r) => !r.isSystem).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Organization-specific
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Define roles and assign permissions to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRoles.map((role) => (
                <Card
                  key={role.id}
                  className={`transition-all ${
                    selectedRole === role.id
                      ? 'ring-2 ring-primary'
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getColorClasses(role.color)}`}
                          >
                            <Shield className="h-3 w-3" />
                            {role.name}
                          </span>
                          {role.isSystem && (
                            <span className="text-xs text-muted-foreground">
                              (System)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {role.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {role.userCount} users
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {role.permissions.length} permissions
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditRole(role.id)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={
                              role.isSystem
                                ? 'text-muted-foreground cursor-not-allowed'
                                : 'text-red-600'
                            }
                            onClick={() =>
                              handleDeleteRole(role.id, role.name)
                            }
                            disabled={role.isSystem}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions Matrix</CardTitle>
            <CardDescription>
              View which roles have which permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Permission</TableHead>
                    {mockRoles.map((role) => (
                      <TableHead key={role.id} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Shield className="h-4 w-4" />
                          <span className="text-xs">{role.name}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(permissionsByCategory).map(
                    ([category, perms]) => (
                      <>
                        <TableRow key={`category-${category}`}>
                          <TableCell
                            colSpan={mockRoles.length + 1}
                            className="bg-muted/50 font-semibold text-sm"
                          >
                            {category}
                          </TableCell>
                        </TableRow>
                        {perms.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell className="font-medium text-sm">
                              {permission.name}
                            </TableCell>
                            {mockRoles.map((role) => (
                              <TableCell key={role.id} className="text-center">
                                {role.permissions.includes(permission.id) ? (
                                  <Check className="h-4 w-4 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-slate-300 mx-auto" />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Permissions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Permissions</CardTitle>
          <CardDescription>
            Complete list of available permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {perms.map((permission) => (
                      <li
                        key={permission.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-3 w-3 text-primary" />
                        {permission.name}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
