import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SwiftCopyDashboard from './SwiftCopyDashboard';

describe('SwiftCopyDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial state correctly', async () => {
    await act(async () => {
      render(<SwiftCopyDashboard />);
    });
    
    expect(screen.getAllByText(/SWIFTCOPY/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/START ENGINE/i)).toBeInTheDocument();
    expect(screen.getByText(/No active tasks in queue/i)).toBeInTheDocument();
  });

  it('starts engine and updates UI', async () => {
    await act(async () => {
      render(<SwiftCopyDashboard />);
    });
    
    const startButton = screen.getByText(/START ENGINE/i);
    
    act(() => {
      fireEvent.click(startButton);
    });

    expect(screen.getByText(/PAUSE/i)).toBeInTheDocument();
    expect(screen.queryByText(/No active tasks in queue/i)).not.toBeInTheDocument();
  });

  it('toggles pause and resume', async () => {
    await act(async () => {
      render(<SwiftCopyDashboard />);
    });
    
    const startButton = screen.getByText(/START ENGINE/i);
    
    act(() => {
      fireEvent.click(startButton);
    });

    const pauseButton = screen.getByText(/PAUSE/i);
    
    act(() => {
      fireEvent.click(pauseButton);
    });

    expect(screen.getByText(/RESUME/i)).toBeInTheDocument();

    const resumeButton = screen.getByText(/RESUME/i);
    
    act(() => {
      fireEvent.click(resumeButton);
    });

    expect(screen.getByText(/PAUSE/i)).toBeInTheDocument();
  });

  it('simulates native installation wizard', async () => {
    await act(async () => {
      render(<SwiftCopyDashboard />);
    });
    
    // Switch to System Integration tab
    const systemTab = screen.getByText(/System Integration/i);
    act(() => {
      fireEvent.click(systemTab);
    });

    const downloadButton = screen.getByText(/Download Native Installer/i);
    
    act(() => {
      fireEvent.click(downloadButton);
    });

    expect(screen.getByText(/Native Engine Setup/i)).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(screen.getByText(/Extracting swift_core.dll/i)).toBeInTheDocument();

    // Advance timers to complete installation
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const closeButton = screen.getByText(/CLOSE WIZARD/i);
    act(() => {
      fireEvent.click(closeButton);
    });

    // Dialog should close after clicking CLOSE WIZARD
    expect(screen.queryByText(/Native Engine Setup/i)).not.toBeInTheDocument();
  });
});
