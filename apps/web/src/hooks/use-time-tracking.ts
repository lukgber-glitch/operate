'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';
import {
  timeTrackingApi,
  type TimeEntry,
  type Project,
  type TimeSummary,
  type RunningTimer,
  type TimeEntryFilters,
  type ProjectFilters,
  type CreateTimeEntryRequest,
  type UpdateTimeEntryRequest,
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type StartTimerRequest,
  type StopTimerRequest,
} from '@/lib/api/time-tracking';

// ============================================================================
// Time Entries Hook
// ============================================================================

interface UseTimeEntriesState {
  entries: TimeEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function useTimeEntries(initialFilters?: TimeEntryFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseTimeEntriesState>({
    entries: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    isLoading: false,
    error: null,
  });
  const [filters, setFilters] = useState<TimeEntryFilters>(initialFilters || {});

  const fetchEntries = useCallback(
    async (customFilters?: TimeEntryFilters) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const mergedFilters = { ...filters, ...customFilters };
        const response = await timeTrackingApi.getTimeEntries(mergedFilters);
        setState({
          entries: response.data,
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [filters, toast]
  );

  const createEntry = useCallback(
    async (data: CreateTimeEntryRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const entry = await timeTrackingApi.createTimeEntry(data);
        setState((prev) => ({
          ...prev,
          entries: [entry, ...prev.entries],
          total: prev.total + 1,
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Time entry created successfully',
        });
        return entry;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const updateEntry = useCallback(
    async (id: string, data: UpdateTimeEntryRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const entry = await timeTrackingApi.updateTimeEntry(id, data);
        setState((prev) => ({
          ...prev,
          entries: prev.entries.map((e) => (e.id === id ? entry : e)),
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Time entry updated successfully',
        });
        return entry;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        await timeTrackingApi.deleteTimeEntry(id);
        setState((prev) => ({
          ...prev,
          entries: prev.entries.filter((e) => e.id !== id),
          total: prev.total - 1,
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Time entry deleted successfully',
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const bulkMarkAsBillable = useCallback(
    async (ids: string[]) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const result = await timeTrackingApi.bulkMarkAsBillable(ids);
        await fetchEntries();
        toast({
          title: 'Success',
          description: `${result.updated} entries marked as billable`,
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast, fetchEntries]
  );

  const bulkMarkAsBilled = useCallback(
    async (ids: string[]) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const result = await timeTrackingApi.bulkMarkAsBilled(ids);
        await fetchEntries();
        toast({
          title: 'Success',
          description: `${result.updated} entries marked as billed`,
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast, fetchEntries]
  );

  const exportEntries = useCallback(async () => {
    try {
      const blob = await timeTrackingApi.exportTimeEntries(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-entries-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Success',
        description: 'Time entries exported successfully',
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [filters, toast]);

  return {
    ...state,
    filters,
    setFilters,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    bulkMarkAsBillable,
    bulkMarkAsBilled,
    exportEntries,
  };
}

// ============================================================================
// Running Timer Hook
// ============================================================================

export function useRunningTimer() {
  const { toast } = useToast();
  const [timer, setTimer] = useState<RunningTimer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchTimer = useCallback(async () => {
    try {
      const data = await timeTrackingApi.getRunningTimer();
      setTimer(data);
      if (data) {
        setElapsedSeconds(data.elapsedSeconds);
      }
    } catch (error) {
      // Silently handle 404 - timer may not exist yet
      console.debug('Timer not available:', error);
      setTimer(null);
    }
  }, []);

  const startTimer = useCallback(
    async (data?: StartTimerRequest) => {
      setIsLoading(true);
      try {
        const newTimer = await timeTrackingApi.startTimer(data);
        setTimer(newTimer);
        setElapsedSeconds(0);
        toast({
          title: 'Timer Started',
          description: 'Time tracking has started',
        });
        return newTimer;
      } catch (error) {
        const errorMessage = handleApiError(error);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const stopTimer = useCallback(
    async (data?: StopTimerRequest) => {
      setIsLoading(true);
      try {
        const entry = await timeTrackingApi.stopTimer(data);
        setTimer(null);
        setElapsedSeconds(0);
        toast({
          title: 'Timer Stopped',
          description: `Time entry created: ${formatDuration(entry.duration)}`,
        });
        return entry;
      } catch (error) {
        const errorMessage = handleApiError(error);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const updateTimer = useCallback(
    async (data: Partial<StartTimerRequest>) => {
      try {
        const updated = await timeTrackingApi.updateRunningTimer(data);
        setTimer(updated);
        return updated;
      } catch (error) {
        const errorMessage = handleApiError(error);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const discardTimer = useCallback(async () => {
    setIsLoading(true);
    try {
      await timeTrackingApi.discardTimer();
      setTimer(null);
      setElapsedSeconds(0);
      toast({
        title: 'Timer Discarded',
        description: 'Time tracking has been cancelled',
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Tick the timer every second
  useEffect(() => {
    if (!timer) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Fetch timer on mount
  useEffect(() => {
    fetchTimer();
  }, [fetchTimer]);

  return {
    timer,
    isLoading,
    elapsedSeconds,
    isRunning: !!timer,
    fetchTimer,
    startTimer,
    stopTimer,
    updateTimer,
    discardTimer,
  };
}

// ============================================================================
// Projects Hook
// ============================================================================

interface UseProjectsState {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function useProjects(initialFilters?: ProjectFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    isLoading: false,
    error: null,
  });
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters || {});

  const fetchProjects = useCallback(
    async (customFilters?: ProjectFilters) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const mergedFilters = { ...filters, ...customFilters };
        const response = await timeTrackingApi.getProjects(mergedFilters);
        setState({
          projects: response.data,
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [filters, toast]
  );

  const createProject = useCallback(
    async (data: CreateProjectRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const project = await timeTrackingApi.createProject(data);
        setState((prev) => ({
          ...prev,
          projects: [project, ...prev.projects],
          total: prev.total + 1,
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Project created successfully',
        });
        return project;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const updateProject = useCallback(
    async (id: string, data: UpdateProjectRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const project = await timeTrackingApi.updateProject(id, data);
        setState((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === id ? project : p)),
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Project updated successfully',
        });
        return project;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        await timeTrackingApi.deleteProject(id);
        setState((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== id),
          total: prev.total - 1,
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Project deleted successfully',
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const archiveProject = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const project = await timeTrackingApi.archiveProject(id);
        setState((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === id ? project : p)),
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Project archived successfully',
        });
        return project;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  return {
    ...state,
    filters,
    setFilters,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
  };
}

// ============================================================================
// Single Project Hook
// ============================================================================

export function useProject(id: string) {
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await timeTrackingApi.getProject(id);
      setProject(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  const updateProject = useCallback(
    async (data: UpdateProjectRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const updated = await timeTrackingApi.updateProject(id, data);
        setProject(updated);
        toast({
          title: 'Success',
          description: 'Project updated successfully',
        });
        return updated;
      } catch (error) {
        const errorMessage = handleApiError(error);
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [id, toast]
  );

  return {
    project,
    isLoading,
    error,
    fetchProject,
    updateProject,
  };
}

// ============================================================================
// Time Summary Hook
// ============================================================================

export function useTimeSummary(dateRange?: { startDate?: string; endDate?: string }) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<TimeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await timeTrackingApi.getSummary(dateRange);
      setSummary(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    fetchSummary,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseDuration(formatted: string): number {
  const parts = formatted.split(':').map(Number);
  if (parts.length === 3) {
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  return 0;
}

export function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return `${hours.toFixed(2)}h`;
}
