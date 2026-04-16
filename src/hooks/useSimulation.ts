import { useState, useEffect } from 'react';
import { FileTask, SimulationState } from '../types';
import { toast } from 'sonner';

const ERROR_MESSAGES = [
  "ERROR_SHARING_VIOLATION: File held by another process.",
  "ERROR_DISK_FULL: Insufficient space on target volume.",
  "ERROR_CRC: Cyclic redundancy check failed (Hardware error).",
  "ERROR_NETWORK_TIMEOUT: Connection to remote storage lost.",
  "ERROR_ACCESS_DENIED: Insufficient permissions for ACL replication."
];

export function useSimulation() {
  const [state, setState] = useState<SimulationState>({
    tasks: [],
    totalBytes: 0,
    copiedBytes: 0,
    startTime: null,
    elapsedTime: 0,
    isPaused: true,
    currentThroughput: 0,
    peakThroughput: 0,
    fidelityStats: {
      adsPreserved: 0,
      aclsCopied: 0,
      vssSnapshots: 0,
      symlinksPreserved: 0
    }
  });

  useEffect(() => {
    if (state.isPaused) return;

    const interval = setInterval(() => {
      setState(prev => {
        const allFinished = prev.tasks.every(t => t.status === 'Done' || t.status === 'Failed');
        if (allFinished && prev.tasks.length > 0) {
          return { ...prev, isPaused: true, currentThroughput: 0 };
        }

        const newThroughput = 3.8 * 1024 * 1024 * 1024 * (0.95 + Math.random() * 0.1); // ~3.8 GB/s
        const increment = newThroughput / 10; // 100ms interval
        
        // Update tasks progress
        let addedCopied = 0;
        const updatedTasks = prev.tasks.map(task => {
          if (task.status === 'Done' || task.status === 'Failed') return task;
          
          // Random error simulation (0.5% chance per tick)
          if (Math.random() < 0.005) {
            const error = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
            toast.error("File Operation Failed", {
              description: `${task.sourcePath.split('\\\\').pop()}: ${error}`,
              duration: 5000,
            });
            return { ...task, status: 'Failed', error };
          }

          const taskProgress = Math.min(task.progress + (increment / prev.totalBytes) * 5, 1);
          let status = task.status;
          if (taskProgress > 0.1 && status === 'Pending') status = 'Reading';
          if (taskProgress > 0.4 && status === 'Reading') status = 'Writing';
          if (taskProgress > 0.8 && status === 'Writing') status = 'Verifying';
          if (taskProgress === 1) status = 'Done';
          
          if (status !== 'Failed') {
            addedCopied += (taskProgress - task.progress) * task.size;
          }

          return { ...task, progress: taskProgress, status, throughput: newThroughput / 4 };
        });

        const newCopied = Math.min(prev.copiedBytes + addedCopied, prev.totalBytes);

        // Update fidelity stats
        const newFidelity = { ...prev.fidelityStats };
        if (Math.random() > 0.9) newFidelity.adsPreserved++;
        if (Math.random() > 0.95) newFidelity.aclsCopied++;
        if (Math.random() > 0.98) newFidelity.vssSnapshots++;

        return {
          ...prev,
          copiedBytes: newCopied,
          currentThroughput: newThroughput,
          peakThroughput: Math.max(prev.peakThroughput, newThroughput),
          elapsedTime: prev.elapsedTime + 0.1,
          tasks: updatedTasks,
          fidelityStats: newFidelity
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [state.isPaused, state.totalBytes]);

  const startSimulation = (mockTasks: FileTask[]) => {
    setState({
      tasks: mockTasks,
      totalBytes: mockTasks.reduce((acc, t) => acc + t.size, 0),
      copiedBytes: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      isPaused: false,
      currentThroughput: 0,
      peakThroughput: 0,
      fidelityStats: {
        adsPreserved: 0,
        aclsCopied: 0,
        vssSnapshots: 0,
        symlinksPreserved: 0
      }
    });
    toast.success("Engine Started", { description: "Work-stealing scheduler initialized with 16 threads." });
  };

  const retryTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status: 'Pending', progress: 0, error: undefined } : t),
      isPaused: false
    }));
    toast.info("Retrying Task", { description: "Task re-queued for processing." });
  };

  const togglePause = () => {
    setState(p => ({ ...p, isPaused: !p.isPaused }));
  };

  return {
    state,
    startSimulation,
    retryTask,
    togglePause
  };
}
