'use client';

import { useState, useEffect } from 'react';
import { Play, Square, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRunningTimer, formatDuration } from '@/hooks/use-time-tracking';
import { useProjects } from '@/hooks/use-time-tracking';
import { cn } from '@/lib/utils';

export function ActiveTimer() {
  const { timer, isLoading, elapsedSeconds, isRunning, startTimer, stopTimer, updateTimer, discardTimer } =
    useRunningTimer();
  const { projects, fetchProjects } = useProjects({ status: 'ACTIVE', pageSize: 100 });

  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [billable, setBillable] = useState(true);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sync state with timer
  useEffect(() => {
    if (timer) {
      setDescription(timer.description || '');
      setProjectId(timer.projectId || '');
    }
  }, [timer]);

  const handleStart = async () => {
    await startTimer({
      projectId: projectId || undefined,
      description: description || undefined,
    });
  };

  const handleStop = async () => {
    await stopTimer({
      description: description || undefined,
      billable,
    });
    setDescription('');
    setProjectId('');
  };

  const handleDiscard = async () => {
    if (confirm('Are you sure you want to discard this timer?')) {
      await discardTimer();
      setDescription('');
      setProjectId('');
    }
  };

  const handleUpdateDescription = async (value: string) => {
    setDescription(value);
    if (isRunning) {
      await updateTimer({ description: value });
    }
  };

  const handleUpdateProject = async (value: string) => {
    setProjectId(value);
    if (isRunning) {
      await updateTimer({ projectId: value || undefined });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-300 uppercase tracking-wider">
                {isRunning ? 'Timer Running' : 'Time Tracker'}
              </span>
            </div>
            <div
              className={cn(
                'text-6xl font-mono font-bold transition-colors',
                isRunning ? 'text-blue-400' : 'text-gray-400'
              )}
            >
              {formatDuration(elapsedSeconds)}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Project Selector */}
            <div className="space-y-2">
              <Label htmlFor="project">Project (optional)</Label>
              <Select value={projectId || 'none'} onValueChange={(v) => handleUpdateProject(v === 'none' ? '' : v)} disabled={isLoading}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: project.color || '#6b7280' }}
                        />
                        <span>{project.name}</span>
                        {project.client && <span className="text-gray-400 text-xs">({project.client.name})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label htmlFor="description">What are you working on?</Label>
              <Input
                id="description"
                placeholder="Describe your task..."
                value={description}
                onChange={(e) => handleUpdateDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Billable Toggle (only when stopping) */}
            {isRunning && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="billable"
                  checked={billable}
                  onChange={(e) => setBillable(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="billable" className="cursor-pointer">
                  Billable time
                </Label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Timer
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleStop}
                    disabled={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    size="lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Timer
                  </Button>
                  <Button onClick={handleDiscard} disabled={isLoading} variant="outline" size="lg">
                    <X className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
