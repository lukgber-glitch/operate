'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { AudioVisualizerData } from './voice.types';

interface VoiceWaveformProps {
  audioData: AudioVisualizerData | null;
  isRecording: boolean;
  variant?: 'bars' | 'pulse' | 'wave';
  className?: string;
  color?: string;
}

/**
 * VoiceWaveform Component
 *
 * Visual feedback during voice recording
 * Displays audio levels as animated bars, pulse, or waveform
 */
export function VoiceWaveform({
  audioData,
  isRecording,
  variant = 'bars',
  className,
  color = 'currentColor',
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!audioData) return;

    const { volume } = audioData;

    if (variant === 'bars') {
      drawBars(ctx, rect.width, rect.height, volume, color);
    } else if (variant === 'pulse') {
      drawPulse(ctx, rect.width, rect.height, volume, color);
    } else if (variant === 'wave') {
      drawWave(ctx, rect.width, rect.height, volume, color);
    }
  }, [audioData, isRecording, variant, color]);

  if (!isRecording) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-full', className)}
      aria-hidden="true"
    />
  );
}

// Draw animated bars
function drawBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  volume: number,
  color: string
) {
  const barCount = 5;
  const barWidth = 3;
  const barGap = 4;
  const totalWidth = barCount * (barWidth + barGap) - barGap;
  const startX = (width - totalWidth) / 2;
  const centerY = height / 2;

  ctx.fillStyle = color;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barWidth + barGap);

    // Staggered animation effect
    const delay = i * 0.1;
    const time = Date.now() / 1000 + delay;
    const wave = Math.sin(time * 2) * 0.5 + 0.5;

    // Bar height based on volume and wave
    const maxHeight = height * 0.6;
    const barHeight = Math.max(4, maxHeight * volume * (0.5 + wave * 0.5));

    const y = centerY - barHeight / 2;

    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
    ctx.fill();
  }
}

// Draw pulsing circle
function drawPulse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  volume: number,
  color: string
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.15;

  // Outer pulse
  const time = Date.now() / 1000;
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;
  const outerRadius = baseRadius + volume * 10 + pulse * 5;

  ctx.fillStyle = `${color}20`; // Semi-transparent
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  // Inner circle
  const innerRadius = baseRadius + volume * 5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fill();
}

// Draw sine wave
function drawWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  volume: number,
  color: string
) {
  const centerY = height / 2;
  const amplitude = height * 0.3 * volume;
  const frequency = 0.05;
  const speed = Date.now() / 500;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();

  for (let x = 0; x < width; x++) {
    const y = centerY + Math.sin(x * frequency + speed) * amplitude;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}
