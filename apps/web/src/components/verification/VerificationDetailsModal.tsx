'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VerificationBadge } from './VerificationBadge';
import type { VerificationData } from '@/types/verification';
import { format } from 'date-fns';
import { FileText, Calendar, User, Shield } from 'lucide-react';

interface VerificationDetailsModalProps {
  verification: VerificationData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerificationDetailsModal({
  verification,
  open,
  onOpenChange,
}: VerificationDetailsModalProps) {
  if (!verification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verification Details
          </DialogTitle>
          <DialogDescription>
            Complete information about your verification status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Status</h4>
            <div className="flex items-center gap-4">
              <VerificationBadge status={verification.status} />
              <Badge variant="outline">Level: {verification.level}</Badge>
            </div>
          </div>

          <Separator />

          {/* Timeline Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h4>
            <div className="space-y-2 text-sm">
              {verification.startedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {format(new Date(verification.startedAt), 'PPP')}
                  </span>
                </div>
              )}
              {verification.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="font-medium">
                    {format(new Date(verification.submittedAt), 'PPP')}
                  </span>
                </div>
              )}
              {verification.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium">
                    {format(new Date(verification.completedAt), 'PPP')}
                  </span>
                </div>
              )}
              {verification.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">
                    {format(new Date(verification.expiresAt), 'PPP')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Documents Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents ({verification.documents.length})
            </h4>
            {verification.documents.length > 0 ? (
              <div className="space-y-2">
                {verification.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{doc.type}</p>
                      {doc.fileName && (
                        <p className="text-xs text-muted-foreground">
                          {doc.fileName}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        doc.status === 'approved'
                          ? 'default'
                          : doc.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            )}
          </div>

          {/* Decision Section */}
          {verification.decision && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Decision Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decided At:</span>
                    <span className="font-medium">
                      {format(new Date(verification.decision.decidedAt), 'PPP')}
                    </span>
                  </div>
                  {verification.decision.decidedBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Decided By:</span>
                      <span className="font-medium">
                        {verification.decision.decidedBy}
                      </span>
                    </div>
                  )}
                  {verification.decision.reason && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Reason:</p>
                      <p className="text-sm text-muted-foreground">
                        {verification.decision.reason}
                      </p>
                    </div>
                  )}
                  {verification.decision.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">
                        {verification.decision.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Metadata Section */}
          {verification.metadata && Object.keys(verification.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Additional Information</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(verification.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
