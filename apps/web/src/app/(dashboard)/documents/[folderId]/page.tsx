'use client';

import {
  Upload,
  Search,
  Grid3x3,
  List,
  FolderPlus,
  File,
  FileText,
  Receipt,
  FileCheck,
  FileBarChart,
  FileCog,
  Award,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Filter,
  ChevronLeft,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';


// Type definitions
type DocumentType = 'CONTRACT' | 'INVOICE' | 'RECEIPT' | 'REPORT' | 'POLICY' | 'FORM' | 'CERTIFICATE' | 'OTHER';
type DocumentStatus = 'ACTIVE' | 'ARCHIVED';

interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  folderId?: string;
  tags?: string[];
  description?: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  documentCount: number;
}

interface Breadcrumb {
  id: string | null;
  name: string;
  href: string;
}

// Mock data
const mockFolders: { [key: string]: Folder } = {
  '1': { id: '1', name: 'Contracts', documentCount: 23 },
  '2': { id: '2', name: 'Invoices', documentCount: 156 },
  '3': { id: '3', name: 'HR Documents', documentCount: 45 },
  '4': { id: '4', name: 'Employee Contracts', parentId: '3', documentCount: 25 },
  '5': { id: '5', name: 'Certificates', parentId: '3', documentCount: 20 },
  '6': { id: '6', name: 'Tax Returns', documentCount: 12 },
  '7': { id: '7', name: 'Reports', documentCount: 34 },
};

const mockDocumentsByFolder: { [key: string]: Document[] } = {
  '1': [
    {
      id: '1',
      name: 'Employment_Contract_2024.pdf',
      type: 'CONTRACT',
      status: 'ACTIVE',
      size: '2.4 MB',
      uploadedBy: 'John Doe',
      uploadedAt: '2024-11-15',
      folderId: '1',
      tags: ['employment', 'legal'],
      description: 'Standard employment contract template'
    },
    {
      id: '2',
      name: 'Service_Agreement.pdf',
      type: 'CONTRACT',
      status: 'ACTIVE',
      size: '1.8 MB',
      uploadedBy: 'Jane Smith',
      uploadedAt: '2024-11-10',
      folderId: '1',
      tags: ['service', 'vendor'],
    },
    {
      id: '3',
      name: 'NDA_Template.pdf',
      type: 'CONTRACT',
      status: 'ACTIVE',
      size: '456 KB',
      uploadedBy: 'Bob Johnson',
      uploadedAt: '2024-11-08',
      folderId: '1',
      tags: ['legal', 'confidentiality'],
    },
  ],
  '2': [
    {
      id: '10',
      name: 'Invoice_INV-2024-001.pdf',
      type: 'INVOICE',
      status: 'ACTIVE',
      size: '156 KB',
      uploadedBy: 'Jane Smith',
      uploadedAt: '2024-11-20',
      folderId: '2',
      tags: ['billing', 'client-a'],
    },
    {
      id: '11',
      name: 'Invoice_INV-2024-002.pdf',
      type: 'INVOICE',
      status: 'ACTIVE',
      size: '198 KB',
      uploadedBy: 'Sarah Williams',
      uploadedAt: '2024-11-18',
      folderId: '2',
      tags: ['billing', 'client-b'],
    },
  ],
  '3': [
    {
      id: '20',
      name: 'Employee_Handbook.pdf',
      type: 'POLICY',
      status: 'ACTIVE',
      size: '3.2 MB',
      uploadedBy: 'HR Manager',
      uploadedAt: '2024-11-01',
      folderId: '3',
      tags: ['hr', 'policy'],
    },
  ],
  '4': [
    {
      id: '30',
      name: 'John_Doe_Contract.pdf',
      type: 'CONTRACT',
      status: 'ACTIVE',
      size: '2.1 MB',
      uploadedBy: 'HR Manager',
      uploadedAt: '2024-10-15',
      folderId: '4',
      tags: ['employee', 'contract'],
    },
    {
      id: '31',
      name: 'Jane_Smith_Contract.pdf',
      type: 'CONTRACT',
      status: 'ACTIVE',
      size: '2.3 MB',
      uploadedBy: 'HR Manager',
      uploadedAt: '2024-10-20',
      folderId: '4',
      tags: ['employee', 'contract'],
    },
  ],
  '5': [
    {
      id: '40',
      name: 'ISO_Certification.pdf',
      type: 'CERTIFICATE',
      status: 'ACTIVE',
      size: '678 KB',
      uploadedBy: 'David Wilson',
      uploadedAt: '2024-11-12',
      folderId: '5',
      tags: ['certification', 'quality'],
    },
  ],
  '6': [
    {
      id: '50',
      name: 'Tax_Return_2023.pdf',
      type: 'FORM',
      status: 'ACTIVE',
      size: '2.8 MB',
      uploadedBy: 'Accountant',
      uploadedAt: '2024-01-15',
      folderId: '6',
      tags: ['tax', 'annual'],
    },
  ],
  '7': [
    {
      id: '60',
      name: 'Q3_Financial_Report.xlsx',
      type: 'REPORT',
      status: 'ACTIVE',
      size: '3.8 MB',
      uploadedBy: 'Sarah Williams',
      uploadedAt: '2024-11-10',
      folderId: '7',
      tags: ['financial', 'quarterly'],
    },
    {
      id: '61',
      name: 'Annual_Revenue_Report.pdf',
      type: 'REPORT',
      status: 'ACTIVE',
      size: '1.5 MB',
      uploadedBy: 'CFO',
      uploadedAt: '2024-11-05',
      folderId: '7',
      tags: ['financial', 'annual'],
    },
  ],
};

const documentTypeConfig = {
  CONTRACT: { color: 'text-white/70', icon: FileText },
  INVOICE: { color: 'text-white/70', icon: Receipt },
  RECEIPT: { color: 'text-white/70', icon: Receipt },
  REPORT: { color: 'text-white/70', icon: FileBarChart },
  POLICY: { color: 'text-white/70', icon: FileCheck },
  FORM: { color: 'text-white/70', icon: FileCog },
  CERTIFICATE: { color: 'text-white/70', icon: Award },
  OTHER: { color: 'text-white/70', icon: File },
};

export default function FolderPage({ params }: { params: { folderId: string } }) {
  const { folderId } = params;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  const currentFolder = mockFolders[folderId];
  const documents = mockDocumentsByFolder[folderId] || [];

  // Build breadcrumb trail
  const buildBreadcrumbs = (): Breadcrumb[] => {
    const breadcrumbs: Breadcrumb[] = [
      { id: null, name: 'Documents', href: '/documents' }
    ];

    if (currentFolder) {
      const trail: Folder[] = [];
      let folder: Folder | undefined = currentFolder;

      while (folder) {
        trail.unshift(folder);
        folder = folder.parentId ? mockFolders[folder.parentId] : undefined;
      }

      trail.forEach(f => {
        breadcrumbs.push({
          id: f.id,
          name: f.name,
          href: `/documents/${f.id}`
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (!currentFolder) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl text-white font-bold">Folder not found</h1>
          <p className="mt-2 text-muted-foreground">The folder you are looking for does not exist.</p>
          <Button className="mt-4" asChild>
            <Link href="/documents">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <motion.nav
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400"
      >
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && (
              <svg className="h-4 w-4 mx-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {crumb.name}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                {crumb.name}
              </Link>
            )}
          </div>
        ))}
      </motion.nav>

      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={breadcrumbs[breadcrumbs.length - 2]?.href || '/documents'}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{currentFolder.name}</h1>
              <p className="text-muted-foreground">
                {currentFolder.documentCount} document{currentFolder.documentCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateFolderDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </motion.div>

      {/* Filters and View Toggle */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as DocumentType | 'ALL')}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="INVOICE">Invoice</SelectItem>
              <SelectItem value="RECEIPT">Receipt</SelectItem>
              <SelectItem value="REPORT">Report</SelectItem>
              <SelectItem value="POLICY">Policy</SelectItem>
              <SelectItem value="FORM">Form</SelectItem>
              <SelectItem value="CERTIFICATE">Certificate</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DocumentStatus | 'ALL')}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
            <TabsList>
              <TabsTrigger value="grid">
                <Grid3x3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground"
      >
        Showing {filteredDocuments.length} of {documents.length} documents
      </motion.div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredDocuments.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                {documents.length === 0 ? 'No documents in this folder' : 'No documents found'}
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {documents.length === 0
                  ? 'Upload your first document to get started'
                  : 'Try adjusting your filters or upload a new document'}
              </p>
              <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const typeConfig = documentTypeConfig[doc.type];
              const TypeIcon = typeConfig.icon;

              return (
                <Card key={doc.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-lg ${typeConfig.color.split(' ')[0]} ${typeConfig.color.split(' ')[1]}`}>
                          <TypeIcon className="h-6 w-6" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewDocument(doc)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div>
                        <h3 className="font-medium text-sm truncate" title={doc.name}>
                          {doc.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">{doc.size}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={typeConfig.color}>
                          {doc.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                      {documents.length === 0 ? 'No documents in this folder' : 'No documents found'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {documents.length === 0
                        ? 'Upload your first document to get started'
                        : 'Try adjusting your filters or upload a new document'}
                    </p>
                    <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => {
                  const typeConfig = documentTypeConfig[doc.type];
                  const TypeIcon = typeConfig.icon;

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${typeConfig.color.split(' ')[0]} ${typeConfig.color.split(' ')[1]}`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeConfig.color}>
                          {doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>{doc.uploadedBy}</TableCell>
                      <TableCell>{doc.uploadedAt}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewDocument(doc)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
        </motion.div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to {currentFolder.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF, DOC, XLS, JPG, PNG up to 10MB</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INVOICE">Invoice</SelectItem>
                  <SelectItem value="RECEIPT">Receipt</SelectItem>
                  <SelectItem value="REPORT">Report</SelectItem>
                  <SelectItem value="POLICY">Policy</SelectItem>
                  <SelectItem value="FORM">Form</SelectItem>
                  <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="Add tags (comma separated)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Add a description (optional)" rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setUploadDialogOpen(false)}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Subfolder</DialogTitle>
            <DialogDescription>
              Create a new subfolder in {currentFolder.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input id="folder-name" placeholder="Enter folder name" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateFolderDialogOpen(false)}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{previewDocument?.name}</DialogTitle>
            <DialogDescription>
              Document preview and details
            </DialogDescription>
          </DialogHeader>

          {previewDocument && (
            <div className="space-y-4">
              <div className="border rounded-lg p-8 bg-slate-50 dark:bg-slate-900 text-center">
                <FileText className="mx-auto h-24 w-24 text-slate-400" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Preview not available for this file type
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Document Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Type:</div>
                  <div>
                    <Badge variant="outline" className={documentTypeConfig[previewDocument.type].color}>
                      {previewDocument.type}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">Size:</div>
                  <div>{previewDocument.size}</div>
                  <div className="text-muted-foreground">Uploaded by:</div>
                  <div>{previewDocument.uploadedBy}</div>
                  <div className="text-muted-foreground">Upload date:</div>
                  <div>{previewDocument.uploadedAt}</div>
                  {previewDocument.tags && previewDocument.tags.length > 0 && (
                    <>
                      <div className="text-muted-foreground">Tags:</div>
                      <div className="flex gap-1 flex-wrap">
                        {previewDocument.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {previewDocument.description && (
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{previewDocument.description}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDocument(null)}>
              Close
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
