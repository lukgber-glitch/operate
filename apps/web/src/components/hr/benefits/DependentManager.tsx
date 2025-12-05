'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { Dependent } from '@/types/benefits';
import { useToast } from '@/components/ui/use-toast';

interface DependentManagerProps {
  dependents: Dependent[];
  onAdd: (dependent: Dependent) => void;
  onUpdate: (id: string, dependent: Dependent) => void;
  onRemove: (id: string) => void;
}

export function DependentManager({ dependents, onAdd, onUpdate, onRemove }: DependentManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);
  const [formData, setFormData] = useState<Partial<Dependent>>({
    firstName: '',
    lastName: '',
    relationship: 'spouse',
    dateOfBirth: '',
    ssn: '',
    gender: 'male',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.relationship) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const dependent: Dependent = {
      id: editingDependent?.id || `dep-${Date.now()}`,
      firstName: formData.firstName!,
      lastName: formData.lastName!,
      relationship: formData.relationship as any,
      dateOfBirth: formData.dateOfBirth!,
      ssn: formData.ssn,
      gender: formData.gender,
    };

    if (editingDependent) {
      onUpdate(editingDependent.id!, dependent);
      toast({
        title: 'Success',
        description: 'Dependent updated successfully',
      });
    } else {
      onAdd(dependent);
      toast({
        title: 'Success',
        description: 'Dependent added successfully',
      });
    }

    handleCloseDialog();
  };

  const handleEdit = (dependent: Dependent) => {
    setEditingDependent(dependent);
    setFormData(dependent);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingDependent(null);
    setFormData({
      firstName: '',
      lastName: '',
      relationship: 'spouse',
      dateOfBirth: '',
      ssn: '',
      gender: 'male',
    });
  };

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
      onRemove(id);
      toast({
        title: 'Success',
        description: 'Dependent removed successfully',
      });
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getRelationshipBadgeVariant = (relationship: string) => {
    switch (relationship) {
      case 'spouse':
        return 'default';
      case 'child':
        return 'secondary';
      case 'domestic_partner':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Manage Dependents
            </CardTitle>
            <CardDescription>
              Add family members to cover under your benefits plans
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Dependent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDependent ? 'Edit Dependent' : 'Add New Dependent'}
                </DialogTitle>
                <DialogDescription>
                  Enter the information for your dependent. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="relationship">
                      Relationship <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) =>
                        setFormData({ ...formData, relationship: value as any })
                      }
                    >
                      <SelectTrigger id="relationship">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="domestic_partner">Domestic Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value as any })}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ssn">Social Security Number</Label>
                    <Input
                      id="ssn"
                      type="text"
                      value={formData.ssn}
                      onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                      placeholder="###-##-####"
                      maxLength={11}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingDependent ? 'Update' : 'Add'} Dependent</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {dependents.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No dependents added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your spouse, children, or domestic partner to cover them under your benefits.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Dependent
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {dependents.map((dependent, index) => (
              <div key={dependent.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {dependent.firstName} {dependent.lastName}
                      </h4>
                      <Badge variant={getRelationshipBadgeVariant(dependent.relationship)}>
                        {dependent.relationship.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
                      <div>
                        <span className="font-medium">Date of Birth:</span>{' '}
                        {new Date(dependent.dateOfBirth).toLocaleDateString()} (Age:{' '}
                        {calculateAge(dependent.dateOfBirth)})
                      </div>
                      {dependent.gender && (
                        <div>
                          <span className="font-medium">Gender:</span>{' '}
                          {dependent.gender.charAt(0).toUpperCase() + dependent.gender.slice(1)}
                        </div>
                      )}
                      {dependent.ssn && (
                        <div>
                          <span className="font-medium">SSN:</span> ***-**-
                          {dependent.ssn.slice(-4)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(dependent)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleRemove(
                          dependent.id!,
                          `${dependent.firstName} ${dependent.lastName}`
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
