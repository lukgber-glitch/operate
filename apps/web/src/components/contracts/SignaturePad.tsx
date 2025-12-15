'use client';

import { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  value?: string;
}

export function SignaturePad({ onSignatureChange, value }: SignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (value && sigPadRef.current) {
      sigPadRef.current.fromDataURL(value);
      setIsEmpty(false);
    }
  }, [value]);

  const handleClear = () => {
    sigPadRef.current?.clear();
    setIsEmpty(true);
    onSignatureChange(null);
  };

  const handleEnd = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const dataURL = sigPadRef.current.toDataURL('image/png');
      setIsEmpty(false);
      onSignatureChange(dataURL);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Signature</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isEmpty}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        <div className="border-2 border-dashed rounded-lg bg-white dark:bg-gray-950">
          <SignatureCanvas
            ref={sigPadRef}
            canvasProps={{
              className: 'w-full h-48 touch-none',
            }}
            onEnd={handleEnd}
            backgroundColor="transparent"
            penColor="currentColor"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Draw your signature above using your mouse or touchscreen
        </p>
      </div>
    </Card>
  );
}
