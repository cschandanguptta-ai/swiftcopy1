export type FileStatus = 'Pending' | 'Enumerating' | 'Reading' | 'Writing' | 'Verifying' | 'SecCopy' | 'Done' | 'Failed' | 'Skipped';

export interface FileTask {
  id: string;
  sourcePath: string;
  destPath: string;
  size: number; // in bytes
  progress: number; // 0 to 1
  status: FileStatus;
  throughput: number; // bytes per second
  adsCount: number;
  hasAcl: boolean;
  isLocked: boolean;
  error?: string;
}

export interface DriveMetrics {
  id: string;
  name: string;
  type: 'NVMe' | 'SATA' | 'HDD' | 'Network';
  readSpeed: number;
  writeSpeed: number;
  latency: number;
  iops: number;
}

export interface SimulationState {
  tasks: FileTask[];
  totalBytes: number;
  copiedBytes: number;
  startTime: number | null;
  elapsedTime: number;
  isPaused: boolean;
  currentThroughput: number;
  peakThroughput: number;
  fidelityStats: {
    adsPreserved: number;
    aclsCopied: number;
    vssSnapshots: number;
    symlinksPreserved: number;
  };
}
