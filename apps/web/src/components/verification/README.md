# KYC Verification UI Components

This directory contains all UI components for the KYC (Know Your Customer) verification system.

## Components Overview

### Core Components

#### `VerificationBadge.tsx`
Status badge component displaying the current verification status with appropriate colors and icons.
- **Props**: `status`, `className`
- **Statuses**: not_started, pending, under_review, verified, rejected, expired
- **Features**: Color-coded, icon support, dark mode compatible

#### `VerificationStatusCard.tsx`
Main status display card showing verification state and actions.
- **Props**: `verification`, `onStartVerification`, `onRetryVerification`
- **Features**:
  - Dynamic content based on status
  - Progress tracking for in-progress verifications
  - Action buttons for each state
  - Timeline display
  - Expiration warnings

#### `VerificationProgress.tsx`
Multi-step progress indicator for the verification wizard.
- **Props**: `steps`, `currentStep`, `completedSteps`, `className`
- **Features**:
  - Responsive design (mobile compact, desktop full)
  - Step completion tracking
  - Visual connector lines
  - Optional step support

#### `VerificationRequirements.tsx`
List component showing required and optional documents.
- **Props**: `requirements`, `className`
- **Features**:
  - Required vs optional categorization
  - Completion tracking
  - File format and size information
  - Visual completion indicators

#### `DocumentUploader.tsx`
Drag-and-drop document upload component.
- **Props**: `documentType`, `onUploadComplete`, `acceptedFormats`, `maxSizeMB`, `className`
- **Features**:
  - Drag and drop support
  - File validation (type, size)
  - Upload progress tracking
  - Preview support
  - Error handling
  - Multiple states: idle, uploading, processing, complete, error

#### `VerificationTimeline.tsx`
Timeline component showing verification history.
- **Props**: `history`, `className`
- **Events**: started, document_uploaded, submitted, under_review, verified, rejected, expired
- **Features**:
  - Chronological event display
  - Icon-coded events
  - Metadata support
  - Responsive layout

#### `KycDecisionAlert.tsx`
Alert component for displaying verification decisions.
- **Props**: `decision`, `onRetry`, `onRenew`
- **Features**:
  - Status-specific styling
  - Rejection reason display
  - Action buttons
  - Expiration warnings

#### `VerificationPrompt.tsx`
Call-to-action component to start verification.
- **Props**: `onStartVerification`, `className`, `variant`
- **Variants**: default (full), compact
- **Features**:
  - Feature highlights
  - Time estimates
  - Responsive design

#### `VerificationDetailsModal.tsx`
Modal displaying comprehensive verification details.
- **Props**: `verification`, `open`, `onOpenChange`
- **Features**:
  - Complete verification information
  - Document list
  - Timeline display
  - Decision details
  - Metadata display

## Hooks

### `use-verification.ts`
Main hook for managing verification state.
- **Returns**: `verification`, `isLoading`, `error`, `refetch`, `startVerification`, `submitVerification`, `cancelVerification`
- **API Endpoints**:
  - GET `/api/kyc/verification/status`
  - POST `/api/kyc/verification/start`
  - POST `/api/kyc/verification/submit`
  - POST `/api/kyc/verification/cancel`

### `use-kyc-requirements.ts`
Hook for fetching verification requirements.
- **Returns**: `requirements`, `isLoading`, `error`, `refetch`, `completedCount`, `requiredCount`, `progress`
- **API Endpoint**: GET `/api/kyc/requirements`

### `use-document-upload.ts`
Hook for uploading and managing documents.
- **Returns**: `uploadDocument`, `deleteDocument`, `progress`, `isUploading`
- **API Endpoints**:
  - POST `/api/kyc/documents/upload` (multipart/form-data)
  - DELETE `/api/kyc/documents/:id`

## Pages

### `/settings/verification/page.tsx`
Main verification status page displaying overview and history.

### `/settings/verification/start/page.tsx`
Verification level selection page.

### `/settings/verification/documents/page.tsx`
Document upload wizard page.

### `/settings/verification/review/page.tsx`
Review and submit page.

## Types

Located in `/src/types/verification.ts`:
- `VerificationStatus` - Enum for verification states
- `VerificationLevel` - Enum for verification levels (basic, enhanced, full)
- `DocumentType` - Enum for document types
- `VerificationDocument` - Document interface
- `VerificationRequirement` - Requirement interface
- `VerificationHistoryEntry` - History entry interface
- `KycDecision` - Decision interface
- `VerificationData` - Main verification data interface
- `VerificationStats` - Statistics interface
- `DocumentUploadProgress` - Upload progress interface

## Usage Example

```tsx
import { VerificationStatusCard, VerificationPrompt } from '@/components/verification';
import { useVerification } from '@/hooks/use-verification';

export default function MyPage() {
  const { verification, startVerification } = useVerification();

  return (
    <div>
      {verification ? (
        <VerificationStatusCard
          verification={verification}
          onStartVerification={startVerification}
        />
      ) : (
        <VerificationPrompt onStartVerification={startVerification} />
      )}
    </div>
  );
}
```

## Styling

All components use:
- **shadcn/ui** components
- **Tailwind CSS** for styling
- **Dark mode** support via CSS variables
- **Responsive** design patterns
- **Accessibility** features (ARIA labels, keyboard navigation)

## API Integration

All components are designed to work with the backend KYC verification API. Ensure the following endpoints are implemented:

- `GET /api/kyc/verification/status` - Get current verification status
- `POST /api/kyc/verification/start` - Start new verification
- `POST /api/kyc/verification/submit` - Submit for review
- `POST /api/kyc/verification/cancel` - Cancel verification
- `GET /api/kyc/requirements` - Get requirements for level
- `POST /api/kyc/documents/upload` - Upload document
- `DELETE /api/kyc/documents/:id` - Delete document

## Features

- Multi-step verification wizard
- Drag-and-drop document upload
- Real-time progress tracking
- Comprehensive status display
- Decision notifications
- Timeline/history view
- Responsive mobile design
- Dark mode support
- Accessibility compliant
- Error handling
- Loading states
- Empty states
