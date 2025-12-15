/**
 * Dashboard Customizer Component
 * Edit mode overlay with controls for dashboard customization
 */

'use client';

import { Edit3, Save, X, RotateCcw, Plus, Eye, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { WidgetPicker } from './WidgetPicker';
import { WidgetType } from './dashboard-layout.types';

export interface DashboardCustomizerProps {
  isEditMode: boolean;
  isSaving: boolean;
  visibleWidgetCount: number;
  totalWidgetCount: number;
  onToggleEditMode: () => void;
  onReset: () => void;
  onAddWidget: (type: WidgetType) => void;
}

export function DashboardCustomizer({
  isEditMode,
  isSaving,
  visibleWidgetCount,
  totalWidgetCount,
  onToggleEditMode,
  onReset,
  onAddWidget,
}: DashboardCustomizerProps) {
  return (
    <>
      {/* Edit Mode Banner */}
      {isEditMode && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Customize Dashboard</CardTitle>
                  <CardDescription>
                    Drag widgets to reorder, resize, show/hide, or add new widgets
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Eye className="h-3 w-3" />
                  {visibleWidgetCount} / {totalWidgetCount} widgets visible
                </Badge>

                {isSaving && (
                  <Badge variant="secondary" className="animate-pulse">
                    Saving...
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between">
              {/* Actions */}
              <div className="flex items-center gap-2">
                <WidgetPicker
                  onAddWidget={onAddWidget}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Widget
                    </Button>
                  }
                />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset to Default
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Dashboard Layout?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will restore the default dashboard layout. All customizations will be lost. This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onReset} className="bg-destructive text-destructive-foreground">
                        Reset Layout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Done Button */}
              <Button onClick={onToggleEditMode} className="gap-2">
                <Save className="h-4 w-4" />
                Done Customizing
              </Button>
            </div>

            {/* Instructions */}
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-primary/10 mt-0.5">
                  <Edit3 className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Drag & Drop</p>
                  <p className="text-xs">Use the grip handle to reorder widgets</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-primary/10 mt-0.5">
                  <Settings className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Resize & Hide</p>
                  <p className="text-xs">Use the toolbar to resize or hide widgets</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-primary/10 mt-0.5">
                  <Plus className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Add Widgets</p>
                  <p className="text-xs">Click Add Widget to choose from available widgets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button (when not in edit mode) */}
      {!isEditMode && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={onToggleEditMode}
            size="lg"
            className="gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Edit3 className="h-5 w-5" />
            Customize Dashboard
          </Button>
        </div>
      )}
    </>
  );
}
