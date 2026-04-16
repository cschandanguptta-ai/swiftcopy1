import { FileTask } from '../../types';

export const mockTasks: FileTask[] = [
  { 
    id: '1', 
    sourcePath: 'C:\\Data\\Project_A.iso', 
    destPath: 'D:\\Backup\\Project_A.iso', 
    size: 15 * 1024 * 1024 * 1024, 
    progress: 0, 
    status: 'Pending', 
    throughput: 0, 
    adsCount: 2, 
    hasAcl: true, 
    isLocked: false 
  },
  { 
    id: '2', 
    sourcePath: 'C:\\Users\\Admin\\Documents\\Database.mdf', 
    destPath: 'D:\\Backup\\Database.mdf', 
    size: 42 * 1024 * 1024 * 1024, 
    progress: 0, 
    status: 'Pending', 
    throughput: 0, 
    adsCount: 0, 
    hasAcl: true, 
    isLocked: true 
  },
  { 
    id: '3', 
    sourcePath: 'C:\\Photos\\2024_Trip.zip', 
    destPath: 'D:\\Backup\\2024_Trip.zip', 
    size: 8 * 1024 * 1024 * 1024, 
    progress: 0, 
    status: 'Pending', 
    throughput: 0, 
    adsCount: 5, 
    hasAcl: false, 
    isLocked: false 
  }
];
