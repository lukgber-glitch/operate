/**
 * Context-Proof State Tracking System
 *
 * Ensures test progress survives context loss, agent restarts, and CI failures.
 * Based on AI consensus recommendations for file-based state persistence.
 *
 * Features:
 * - Checkpoint save/restore for resumable execution
 * - Progress tracking with JSON state files
 * - Orphaned task detection
 * - Atomic file operations for consistency
 */

import * as fs from 'fs';
import * as path from 'path';

// State directory path
const STATE_DIR = path.join(__dirname);
const CHECKPOINT_FILE = path.join(STATE_DIR, 'checkpoint.json');
const PROGRESS_FILE = path.join(STATE_DIR, 'progress.json');
const RESULTS_FILE = path.join(STATE_DIR, 'results.json');

/**
 * Checkpoint data structure
 */
export interface Checkpoint {
  id: string;
  testFile: string;
  testName: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  timestamp: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Progress tracking structure
 */
export interface TestProgress {
  startTime: string;
  lastUpdate: string;
  totalTests: number;
  completedTests: number;
  failedTests: number;
  skippedTests: number;
  currentTest?: string;
  checkpoints: Checkpoint[];
}

/**
 * Test result structure
 */
export interface TestResult {
  testFile: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: string;
  retries: number;
  timestamp: string;
}

/**
 * Save a checkpoint for current test
 */
export function saveCheckpoint(checkpoint: Omit<Checkpoint, 'timestamp'>): void {
  const data: Checkpoint = {
    ...checkpoint,
    timestamp: new Date().toISOString(),
  };

  try {
    // Atomic write using unique temp file to avoid race conditions in parallel tests
    const uniqueId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempFile = `${CHECKPOINT_FILE}.${uniqueId}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    try {
      fs.renameSync(tempFile, CHECKPOINT_FILE);
    } catch (renameError) {
      // Clean up temp file if rename fails (another worker may have won the race)
      try { fs.unlinkSync(tempFile); } catch { /* ignore cleanup errors */ }
    }
  } catch (error) {
    console.error('Failed to save checkpoint:', error);
  }
}

/**
 * Load the most recent checkpoint
 */
export function loadCheckpoint(): Checkpoint | null {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf-8');
      return JSON.parse(data) as Checkpoint;
    }
  } catch (error) {
    console.error('Failed to load checkpoint:', error);
  }
  return null;
}

/**
 * Clear the checkpoint file
 */
export function clearCheckpoint(): void {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }
  } catch (error) {
    console.error('Failed to clear checkpoint:', error);
  }
}

/**
 * Check if a checkpoint is stale (older than threshold)
 */
export function isCheckpointStale(maxAgeMs: number = 10 * 60 * 1000): boolean {
  const checkpoint = loadCheckpoint();
  if (!checkpoint) return true;

  const age = Date.now() - new Date(checkpoint.timestamp).getTime();
  return age > maxAgeMs;
}

/**
 * Initialize or load progress tracker
 */
export function initProgress(totalTests: number): TestProgress {
  const existing = loadProgress();

  if (existing && !isProgressStale()) {
    return existing;
  }

  const progress: TestProgress = {
    startTime: new Date().toISOString(),
    lastUpdate: new Date().toISOString(),
    totalTests,
    completedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    checkpoints: [],
  };

  saveProgress(progress);
  return progress;
}

/**
 * Load progress from file
 */
export function loadProgress(): TestProgress | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      return JSON.parse(data) as TestProgress;
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return null;
}

/**
 * Save progress to file
 */
export function saveProgress(progress: TestProgress): void {
  progress.lastUpdate = new Date().toISOString();

  try {
    // Unique temp file to avoid race conditions in parallel tests
    const uniqueId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempFile = `${PROGRESS_FILE}.${uniqueId}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(progress, null, 2));
    try {
      fs.renameSync(tempFile, PROGRESS_FILE);
    } catch (renameError) {
      try { fs.unlinkSync(tempFile); } catch { /* ignore cleanup errors */ }
    }
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

/**
 * Check if progress is stale
 */
export function isProgressStale(maxAgeMs: number = 60 * 60 * 1000): boolean {
  const progress = loadProgress();
  if (!progress) return true;

  const age = Date.now() - new Date(progress.lastUpdate).getTime();
  return age > maxAgeMs;
}

/**
 * Update progress with test completion
 */
export function updateProgress(
  testFile: string,
  testName: string,
  status: 'completed' | 'failed' | 'skipped'
): void {
  const progress = loadProgress();
  if (!progress) return;

  if (status === 'completed') {
    progress.completedTests++;
  } else if (status === 'failed') {
    progress.failedTests++;
  } else if (status === 'skipped') {
    progress.skippedTests++;
  }

  progress.currentTest = undefined;

  // Add checkpoint for this test
  progress.checkpoints.push({
    id: `${testFile}:${testName}`,
    testFile,
    testName,
    status,
    timestamp: new Date().toISOString(),
  });

  saveProgress(progress);
}

/**
 * Record test result
 */
export function recordResult(result: TestResult): void {
  try {
    let results: TestResult[] = [];

    if (fs.existsSync(RESULTS_FILE)) {
      const data = fs.readFileSync(RESULTS_FILE, 'utf-8');
      results = JSON.parse(data) as TestResult[];
    }

    results.push(result);

    // Unique temp file to avoid race conditions in parallel tests
    const uniqueId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempFile = `${RESULTS_FILE}.${uniqueId}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(results, null, 2));
    try {
      fs.renameSync(tempFile, RESULTS_FILE);
    } catch (renameError) {
      try { fs.unlinkSync(tempFile); } catch { /* ignore cleanup errors */ }
    }
  } catch (error) {
    console.error('Failed to record result:', error);
  }
}

/**
 * Load all results
 */
export function loadResults(): TestResult[] {
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      const data = fs.readFileSync(RESULTS_FILE, 'utf-8');
      return JSON.parse(data) as TestResult[];
    }
  } catch (error) {
    console.error('Failed to load results:', error);
  }
  return [];
}

/**
 * Get tests that need to be retried (failed or orphaned)
 */
export function getRetryableTests(): string[] {
  const results = loadResults();
  const checkpoint = loadCheckpoint();

  const failedTests = results
    .filter(r => r.status === 'failed' && r.retries < 2)
    .map(r => `${r.testFile}:${r.testName}`);

  // Add orphaned test if checkpoint is stale
  if (checkpoint && checkpoint.status === 'running' && isCheckpointStale()) {
    failedTests.push(`${checkpoint.testFile}:${checkpoint.testName}`);
  }

  return failedTests;
}

/**
 * Reset all state files
 */
export function resetState(): void {
  clearCheckpoint();

  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
    if (fs.existsSync(RESULTS_FILE)) {
      fs.unlinkSync(RESULTS_FILE);
    }
  } catch (error) {
    console.error('Failed to reset state:', error);
  }
}

/**
 * Generate summary report
 */
export function generateSummary(): {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failedTests: string[];
} {
  const results = loadResults();
  const progress = loadProgress();

  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  const duration = progress
    ? Date.now() - new Date(progress.startTime).getTime()
    : 0;

  const failedTests = results
    .filter(r => r.status === 'failed')
    .map(r => `${r.testFile}:${r.testName}`);

  return {
    total: results.length,
    passed,
    failed,
    skipped,
    duration,
    failedTests,
  };
}
