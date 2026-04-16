/**
 * Formats bytes into a human-readable string.
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generates mock chart data based on throughput.
 */
export const generateChartData = (throughput: number) => {
  return Array.from({ length: 30 }, (_, i) => ({
    time: i,
    speed: throughput * (0.9 + Math.random() * 0.2) / (1024 * 1024 * 1024) // GB/s
  }));
};
