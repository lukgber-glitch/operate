/**
 * Widget Picker Component
 * Modal for adding new widgets to the dashboard
 */

'use client';

import {
  Sparkles,
  TrendingUp,
  Zap,
  FileText,
  Bell,
  Calendar,
  BarChart3,
  PieChart,
  Plus,
  Filter,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { AVAILABLE_WIDGETS, WidgetConfig, WidgetType } from './dashboard-layout.types';

interface WidgetPickerProps {
  onAddWidget: (type: WidgetType) => void;
  disabledWidgets?: string[];
  trigger?: React.ReactNode;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  TrendingUp,
  Zap,
  FileText,
  Bell,
  Calendar,
  BarChart3,
  PieChart,
};

const CATEGORY_LABELS: Record<string, string> = {
  analytics: 'Analytics',
  actions: 'Actions',
  insights: 'Insights',
  finance: 'Finance',
  compliance: 'Compliance',
};

export function WidgetPicker({ onAddWidget, disabledWidgets = [], trigger }: WidgetPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredWidgets = AVAILABLE_WIDGETS.filter((widget) => {
    const matchesSearch =
      searchQuery === '' ||
      widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(AVAILABLE_WIDGETS.map((w) => w.category))];

  const handleAddWidget = (type: WidgetType) => {
    onAddWidget(type);
    setOpen(false);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Widget to Dashboard</DialogTitle>
          <DialogDescription>Choose from available widgets to customize your dashboard</DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === 'all' ? 'All Widgets' : CATEGORY_LABELS[category] || category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Widget Grid */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWidgets.map((widget) => {
              const Icon = ICON_MAP[widget.icon];
              const isDisabled = disabledWidgets.includes(widget.id);

              return (
                <Card
                  key={widget.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => !isDisabled && handleAddWidget(widget.type)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {Icon && (
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{widget.title}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs capitalize">
                            {CATEGORY_LABELS[widget.category] || widget.category}
                          </Badge>
                        </div>
                      </div>
                      {isDisabled && (
                        <Badge variant="secondary" className="text-xs">
                          Added
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{widget.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-300">
                      <span>Default size: {widget.defaultSize}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredWidgets.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                <Filter className="h-12 w-12 text-gray-300/50 mb-4" />
                <p className="text-sm text-gray-300">No widgets found matching your criteria</p>
                <Button variant="ghost" size="sm" className="mt-4" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
