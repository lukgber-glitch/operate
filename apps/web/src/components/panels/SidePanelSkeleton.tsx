'use client';

import React from 'react';
import { SidePanel } from './SidePanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface SidePanelSkeletonProps {
  isOpen: boolean;
  onClose: () => void;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'invoice' | 'expense' | 'client' | 'transaction' | 'list';
}

export function SidePanelSkeleton({
  isOpen,
  onClose,
  width = 'lg',
  variant = 'invoice',
}: SidePanelSkeletonProps) {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Loading..."
      width={width}
    >
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 bg-zinc-800" />
            <Skeleton className="h-6 w-24 bg-zinc-800" />
          </div>
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-10 w-full bg-zinc-800" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32 bg-zinc-800" />
            <Skeleton className="h-4 w-32 bg-zinc-800" />
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Content Skeleton - varies by variant */}
        {variant === 'invoice' && <InvoiceSkeleton />}
        {variant === 'expense' && <ExpenseSkeleton />}
        {variant === 'client' && <ClientSkeleton />}
        {variant === 'transaction' && <TransactionSkeleton />}
        {variant === 'list' && <ListSkeleton />}

        <Separator className="bg-zinc-800" />

        {/* Actions Skeleton */}
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 w-full bg-zinc-800" />
          <Skeleton className="h-10 w-full bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-full bg-zinc-800" />
      </div>
    </SidePanel>
  );
}

function InvoiceSkeleton() {
  return (
    <>
      {/* Client Info */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <Skeleton className="h-5 w-40 bg-zinc-800" />
        <Skeleton className="h-4 w-48 bg-zinc-800" />
      </div>

      <Separator className="bg-zinc-800" />

      {/* Line Items */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <Skeleton className="h-4 w-full bg-zinc-800 mb-2" />
              <Skeleton className="h-3 w-32 bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20 bg-zinc-800" />
          <Skeleton className="h-4 w-24 bg-zinc-800" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16 bg-zinc-800" />
          <Skeleton className="h-4 w-20 bg-zinc-800" />
        </div>
        <Separator className="bg-zinc-800" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20 bg-zinc-800" />
          <Skeleton className="h-5 w-28 bg-zinc-800" />
        </div>
      </div>
    </>
  );
}

function ExpenseSkeleton() {
  return (
    <>
      {/* Receipt */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <Skeleton className="h-48 w-full bg-zinc-800 rounded-lg" />
      </div>

      <Separator className="bg-zinc-800" />

      {/* Tax Info */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <Skeleton className="h-4 w-40 bg-zinc-800 mb-2" />
          <Skeleton className="h-4 w-24 bg-zinc-800" />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Category */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 bg-zinc-800" />
          <Skeleton className="h-6 w-20 bg-zinc-800" />
        </div>
      </div>
    </>
  );
}

function ClientSkeleton() {
  return (
    <>
      {/* Contact Info */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40 bg-zinc-800" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-40 bg-zinc-800" />
          <Skeleton className="h-4 w-56 bg-zinc-800" />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Financial Summary */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36 bg-zinc-800" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <Skeleton className="h-3 w-28 bg-zinc-800 mb-2" />
              <Skeleton className="h-8 w-32 bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Recent Activity */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <Skeleton className="h-4 w-full bg-zinc-800 mb-2" />
              <Skeleton className="h-3 w-32 bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TransactionSkeleton() {
  return (
    <>
      {/* Account */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <Skeleton className="h-5 w-40 bg-zinc-800 mb-1" />
          <Skeleton className="h-3 w-32 bg-zinc-800" />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Category */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <Skeleton className="h-6 w-28 bg-zinc-800 mb-2" />
          <Skeleton className="h-2 w-full bg-zinc-800" />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Matching */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <Skeleton className="h-4 w-36 bg-zinc-800 mb-2" />
          <Skeleton className="h-4 w-28 bg-zinc-800" />
        </div>
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search/Filter Bar */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 bg-zinc-800" />
        <Skeleton className="h-10 w-24 bg-zinc-800" />
      </div>

      {/* Table Header */}
      <div className="space-y-2">
        <div className="flex gap-4 p-3 border-b border-zinc-800">
          <Skeleton className="h-4 w-32 bg-zinc-800" />
          <Skeleton className="h-4 w-40 bg-zinc-800" />
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-4 w-28 bg-zinc-800" />
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 p-3 border-b border-zinc-800">
            <Skeleton className="h-4 w-32 bg-zinc-800" />
            <Skeleton className="h-4 w-40 bg-zinc-800" />
            <Skeleton className="h-4 w-24 bg-zinc-800" />
            <Skeleton className="h-4 w-28 bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-48 bg-zinc-800" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 bg-zinc-800" />
          <Skeleton className="h-8 w-8 bg-zinc-800" />
          <Skeleton className="h-8 w-20 bg-zinc-800" />
          <Skeleton className="h-8 w-8 bg-zinc-800" />
          <Skeleton className="h-8 w-8 bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
