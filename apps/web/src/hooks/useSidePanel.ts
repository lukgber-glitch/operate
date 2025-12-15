'use client';

import { useState, useCallback } from 'react';

export type PanelType = 'invoice' | 'expense' | 'client' | 'transaction' | 'list' | null;

interface UseSidePanelReturn {
  isOpen: boolean;
  panelType: PanelType;
  panelData: any;
  openPanel: (type: PanelType, data: any) => void;
  closePanel: () => void;
}

export function useSidePanel(): UseSidePanelReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [panelType, setPanelType] = useState<PanelType>(null);
  const [panelData, setPanelData] = useState<any>(null);

  const openPanel = useCallback((type: PanelType, data: any) => {
    setPanelType(type);
    setPanelData(data);
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    // Clear data after animation completes
    setTimeout(() => {
      setPanelType(null);
      setPanelData(null);
    }, 300);
  }, []);

  return {
    isOpen,
    panelType,
    panelData,
    openPanel,
    closePanel,
  };
}
