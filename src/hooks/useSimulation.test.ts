import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSimulation } from './useSimulation';
import { mockTasks } from '../tests/fixtures/tasks';

describe('useSimulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSimulation());
    expect(result.current.state.isPaused).toBe(true);
    expect(result.current.state.tasks).toEqual([]);
    expect(result.current.state.copiedBytes).toBe(0);
  });

  it('starts simulation correctly', () => {
    const { result } = renderHook(() => useSimulation());
    
    act(() => {
      result.current.startSimulation(mockTasks);
    });

    expect(result.current.state.isPaused).toBe(false);
    expect(result.current.state.tasks).toHaveLength(mockTasks.length);
    expect(result.current.state.totalBytes).toBeGreaterThan(0);
  });

  it('toggles pause state', () => {
    const { result } = renderHook(() => useSimulation());
    
    act(() => {
      result.current.togglePause();
    });
    expect(result.current.state.isPaused).toBe(false);

    act(() => {
      result.current.togglePause();
    });
    expect(result.current.state.isPaused).toBe(true);
  });

  it('progresses tasks over time', () => {
    const { result } = renderHook(() => useSimulation());
    
    act(() => {
      result.current.startSimulation(mockTasks);
    });

    expect(result.current.state.copiedBytes).toBe(0);

    // Advance time by 1 second (10 ticks)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.state.copiedBytes).toBeGreaterThan(0);
    expect(result.current.state.elapsedTime).toBeGreaterThan(0);
    expect(result.current.state.currentThroughput).toBeGreaterThan(0);
  });

  it('retries a failed task', () => {
    const { result } = renderHook(() => useSimulation());
    
    act(() => {
      result.current.startSimulation(mockTasks);
    });

    // Force a task to fail
    act(() => {
      result.current.retryTask(mockTasks[0].id);
    });

    const retriedTask = result.current.state.tasks.find(t => t.id === mockTasks[0].id);
    expect(retriedTask?.status).toBe('Pending');
    expect(retriedTask?.progress).toBe(0);
    expect(retriedTask?.error).toBeUndefined();
  });
});
