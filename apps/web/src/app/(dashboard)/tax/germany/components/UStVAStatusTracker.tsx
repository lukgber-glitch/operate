'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, FileText, Send } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UStVAStatusTrackerProps {
  submissionId: string;
}

interface StatusStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
}

export function UStVAStatusTracker({ submissionId }: UStVAStatusTrackerProps) {
  const [steps, setSteps] = useState<StatusStep[]>([
    {
      id: 'submitted',
      label: 'Submitted',
      description: 'Your return has been sent to ELSTER',
      icon: <Send className="w-4 h-4" />,
      status: 'completed',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'processing',
      label: 'Processing',
      description: 'ELSTER is validating your submission',
      icon: <Clock className="w-4 h-4" />,
      status: 'current',
    },
    {
      id: 'accepted',
      label: 'Accepted',
      description: 'Your return has been accepted by the tax office',
      icon: <CheckCircle2 className="w-4 h-4" />,
      status: 'pending',
    },
    {
      id: 'receipt',
      label: 'Receipt Available',
      description: 'Official receipt is ready for download',
      icon: <FileText className="w-4 h-4" />,
      status: 'pending',
    },
  ]);

  // Simulate status updates
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === 'processing'
            ? { ...step, status: 'completed', timestamp: new Date().toISOString() }
            : step.id === 'accepted'
            ? { ...step, status: 'current' }
            : step
        )
      );
    }, 3000);

    const timer2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === 'accepted'
            ? { ...step, status: 'completed', timestamp: new Date().toISOString() }
            : step.id === 'receipt'
            ? { ...step, status: 'current' }
            : step
        )
      );
    }, 6000);

    const timer3 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === 'receipt'
            ? { ...step, status: 'completed', timestamp: new Date().toISOString() }
            : step
        )
      );
    }, 9000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [submissionId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Submission Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-4 pb-8 last:pb-0">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-8 -translate-x-1/2 ${
                    step.status === 'completed' ? 'bg-primary' : 'bg-muted'
                  }`}
                  style={{ top: `${index * 64 + 32}px` }}
                />
              )}

              {/* Status Icon */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  step.status === 'completed'
                    ? 'bg-primary text-primary-foreground'
                    : step.status === 'current'
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`font-medium ${
                      step.status === 'pending' ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.status === 'current' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(step.timestamp).toLocaleString('de-DE')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
