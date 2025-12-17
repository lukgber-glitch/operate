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
  Filter
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

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
  children?: Folder[];
}

// Mock data
const mockFolders: Folder[] = [
  { id: '1', name: 'Contracts', documentCount: 23, children: [] },
  { id: '2', name: 'Invoices', documentCount: 156, children: [] },
  { id: '3', name: 'HR Documents', documentCount: 45, children: [
      { id: '4', name: 'Employee Contracts', parentId: '3', documentCount: 25, children: [] },
      { id: '5', name: 'Certificates', parentId: '3', documentCount: 20, children: [] },
    ]
  },
  { id: '6', name: 'Tax Returns', documentCount: 12, children: [] },
  { id: '7', name: 'Reports', documentCount: 34, children: [] },
];

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Employment_Contract_2024.pdf',
    type: 'CONTRACT',
    status: 'ACTIVE',
    size: '2.4 MB',
    uploadedBy: 'John Doe',
    uploadedAt: '2024-11-15',
    tags: ['employment', 'legal'],
    description: 'Standard employment contract template'
  },
  {
    id: '2',
    name: 'Invoice_INV-2024-001.pdf',
    type: 'INVOICE',
    status: 'ACTIVE',
    size: '156 KB',
    uploadedBy: 'Jane Smith',
    uploadedAt: '2024-11-20',
    tags: ['billing', 'client-a'],
  },
  {
    id: '3',
    name: 'Receipt_Office_Supplies.jpg',
    type: 'RECEIPT',
    status: 'ACTIVE',
    size: '892 KB',
    uploadedBy: 'Bob Johnson',
    uploadedAt: '2024-11-22',
    tags: ['expense', 'office'],
  },
  {
    id: '4',
    name: 'Q3_Financial_Report.xlsx',
    type: 'REPORT',
    status: 'ACTIVE',
    size: '3.8 MB',
    uploadedBy: 'Sarah Williams',
    uploadedAt: '2024-11-10',
    tags: ['financial', 'quarterly'],
  },
  {
    id: '5',
    name: 'Privacy_Policy_v2.pdf',
    type: 'POLICY',
    status: 'ACTIVE',
    size: '425 KB',
    uploadedBy: 'Michael Brown',
    uploadedAt: '2024-11-05',
    tags: ['legal', 'compliance'],
  },
  {
    id: '6',
    name: 'Tax_Form_2024.pdf',
    type: 'FORM',
    status: 'ACTIVE',
    size: '1.2 MB',
    uploadedBy: 'Emily Davis',
    uploadedAt: '2024-11-18',
    tags: ['tax', 'annual'],
  },
  {
    id: '7',
    name: 'ISO_Certification.pdf',
    type: 'CERTIFICATE',
    status: 'ACTIVE',
    size: '678 KB',
    uploadedBy: 'David Wilson',
    uploadedAt: '2024-11-12',
    tags: ['certification', 'quality'],
  },
  {
    id: '8',
    name: 'Meeting_Notes.docx',
    type: 'OTHER',
    status: 'ACTIVE',
    size: '234 KB',
    uploadedBy: 'Lisa Anderson',
    uploadedAt: '2024-11-25',
    tags: ['meeting', 'internal'],
  },
];

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

function DocumentsPageContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['3']));

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    const matchesFolder = !selectedFolder || doc.folderId === selectedFolder;
    return matchesSearch && matchesType && matchesStatus && matchesFolder;
  });

  const renderFolderTree = (folders: Folder[], level = 0) => {
    return folders.map(folder => (
      <div key={folder.id}>
        <button
          onClick={() => {
            setSelectedFolder(folder.id);
            if (folder.children && folder.children.length > 0) {
              toggleFolder(folder.id);
            }
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            selectedFolder === folder.id ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          <svg
            className={`h-4 w-4 transition-transform ${
              expandedFolders.has(folder.id) ? 'rotate-90' : ''
            } ${folder.children && folder.children.length > 0 ? '' : 'opacity-0'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="flex-1 text-left">{folder.name}</span>
          <span className="text-xs text-slate-500">{folder.documentCount}</span>
        </button>
        {folder.children && expandedFolders.has(folder.id) && renderFolderTree(folder.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage and organize your business documents</p>
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

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-6"
      >
        {/* Folders Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <Card className="rounded-[16px]">
            <CardContent className="p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    selectedFolder === null ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="flex-1 text-left">All Documents</span>
                  <span className="text-xs text-slate-500">{mockDocuments.length}</span>
                </button>
                <div className="border-t dark:border-slate-700 my-2" />
                {renderFolderTree(mockFolders)}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Filters and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
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
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredDocuments.length} of {mockDocuments.length} documents
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No documents found</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Try adjusting your filters or upload a new document
                  </p>
                </div>
              ) : (
                filteredDocuments.map((doc) => {
                  const typeConfig = documentTypeConfig[doc.type];
                  const TypeIcon = typeConfig.icon;

                  return (
                    <Card key={doc.id} className="rounded-[16px] group hover:shadow-md transition-shadow">
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
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <Card className="rounded-[16px]">
              <CardContent className="p-4">
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
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No documents found</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Try adjusting your filters or upload a new document
                        </p>
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
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to your document library
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
              <Label htmlFor="folder">Folder</Label>
              <Select>
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Select folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root</SelectItem>
                  {mockFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                  ))}
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
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input id="folder-name" placeholder="Enter folder name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-folder">Parent Folder</Label>
              <Select>
                <SelectTrigger id="parent-folder">
                  <SelectValue placeholder="Select parent folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root</SelectItem>
                  {mockFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

export default function DocumentsPage() {
  return (
    <ErrorBoundary>
      <DocumentsPageContent />
    </ErrorBoundary>
  );
}
