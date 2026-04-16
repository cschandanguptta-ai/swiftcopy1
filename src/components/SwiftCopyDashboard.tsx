import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Database, 
  FileText, 
  HardDrive, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Pause, 
  Play, 
  RotateCcw,
  Search,
  Settings,
  Shield,
  Layers,
  Lock,
  ArrowRightLeft,
  ChevronRight,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileTask, SimulationState, DriveMetrics } from '@/src/types';

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Mock data for the throughput chart
const generateChartData = (throughput: number) => {
  return Array.from({ length: 30 }, (_, i) => ({
    time: i,
    speed: throughput * (0.9 + Math.random() * 0.2) / (1024 * 1024 * 1024) // GB/s
  }));
};

const ERROR_MESSAGES = [
  "ERROR_SHARING_VIOLATION: File held by another process.",
  "ERROR_DISK_FULL: Insufficient space on target volume.",
  "ERROR_CRC: Cyclic redundancy check failed (Hardware error).",
  "ERROR_NETWORK_TIMEOUT: Connection to remote storage lost.",
  "ERROR_ACCESS_DENIED: Insufficient permissions for ACL replication."
];

export default function SwiftCopyDashboard() {
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

  const [chartData, setChartData] = useState(generateChartData(0));
  const [activeTab, setActiveTab] = useState('queue');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStep, setInstallStep] = useState('');

  const runInstallation = () => {
    setIsInstalling(true);
    setInstallProgress(0);
    const steps = [
      'Extracting swift_core.dll...',
      'Registering COM Shell Extension...',
      'Mapping IOCP Kernel entry points...',
      'Acquiring SE_BACKUP_NAME privileges...',
      'Finalizing Registry entries...',
      'System Integration Complete.'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          toast.success("Native Engine Registered", { description: "SwiftCopy is now integrated with Windows Explorer." });
          return 100;
        }
        const next = prev + 2;
        if (next > (currentStep + 1) * (100 / steps.length)) {
          currentStep++;
          setInstallStep(steps[Math.min(currentStep, steps.length - 1)]);
        }
        return next;
      });
    }, 50);
  };

  // Simulation Logic
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
              description: `${task.sourcePath.split('\\').pop()}: ${error}`,
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

  // Update chart data
  useEffect(() => {
    if (state.isPaused) return;
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1), { 
          time: prev[prev.length - 1].time + 1, 
          speed: state.currentThroughput / (1024 * 1024 * 1024) 
        }];
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isPaused, state.currentThroughput]);

  const startSimulation = () => {
    const mockTasks: FileTask[] = [
      { id: '1', sourcePath: 'C:\\Data\\Project_A.iso', destPath: 'D:\\Backup\\Project_A.iso', size: 15 * 1024 * 1024 * 1024, progress: 0, status: 'Pending', throughput: 0, adsCount: 2, hasAcl: true, isLocked: false },
      { id: '2', sourcePath: 'C:\\Users\\Admin\\Documents\\Database.mdf', destPath: 'D:\\Backup\\Database.mdf', size: 42 * 1024 * 1024 * 1024, progress: 0, status: 'Pending', throughput: 0, adsCount: 0, hasAcl: true, isLocked: true },
      { id: '3', sourcePath: 'C:\\Photos\\2024_Trip.zip', destPath: 'D:\\Backup\\2024_Trip.zip', size: 8 * 1024 * 1024 * 1024, progress: 0, status: 'Pending', throughput: 0, adsCount: 5, hasAcl: false, isLocked: false },
      { id: '4', sourcePath: 'C:\\System\\Registry_Hive', destPath: 'D:\\Backup\\Registry_Hive', size: 2 * 1024 * 1024 * 1024, progress: 0, status: 'Pending', throughput: 0, adsCount: 1, hasAcl: true, isLocked: true },
      { id: '5', sourcePath: 'C:\\Work\\Project_B.vmdk', destPath: 'D:\\Backup\\Project_B.vmdk', size: 25 * 1024 * 1024 * 1024, progress: 0, status: 'Pending', throughput: 0, adsCount: 0, hasAcl: true, isLocked: false },
      { id: '6', sourcePath: 'C:\\Media\\Video_Archive.tar', destPath: 'D:\\Backup\\Video_Archive.tar', size: 12 * 1024 * 1024 * 1024, progress: 0, status: 'Pending', throughput: 0, adsCount: 3, hasAcl: false, isLocked: false },
    ];

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
    setChartData(generateChartData(0));
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

  const progressPercent = state.totalBytes > 0 ? (state.copiedBytes / state.totalBytes) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 technical-grid relative overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="text-primary-foreground w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight font-mono">SWIFTCOPY <span className="text-primary text-xs align-top">v2.0</span></h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">High-Performance File Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 px-4 py-2 bg-secondary/50 rounded-full border border-border/50">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Throughput</span>
                <span className="text-sm font-mono font-bold text-primary">{(state.currentThroughput / (1024 * 1024 * 1024)).toFixed(2)} GB/s</span>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Elapsed</span>
                <span className="text-sm font-mono font-bold">{state.elapsedTime.toFixed(1)}s</span>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Status</span>
                <Badge variant={state.isPaused ? "secondary" : "default"} className="h-5 text-[10px] px-2">
                  {state.isPaused ? (state.copiedBytes >= state.totalBytes && state.totalBytes > 0 ? "COMPLETED" : "IDLE") : "ACTIVE"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-full border-border/50">
                <Settings className="w-4 h-4" />
              </Button>
              <Button 
                onClick={state.tasks.length === 0 || (state.copiedBytes >= state.totalBytes) ? startSimulation : () => setState(p => ({ ...p, isPaused: !p.isPaused }))}
                className="rounded-full px-6 shadow-lg shadow-primary/20"
              >
                {state.isPaused ? <Play className="w-4 h-4 mr-2 fill-current" /> : <Pause className="w-4 h-4 mr-2 fill-current" />}
                {state.tasks.length === 0 || (state.copiedBytes >= state.totalBytes) ? "START ENGINE" : (state.isPaused ? "RESUME" : "PAUSE")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Metrics & Charts */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Throughput Chart */}
          <Card className="bg-card/30 border-border/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Real-time I/O Pipeline
                </CardTitle>
                <CardDescription className="text-xs">Sustained throughput across NVMe PCIe 4.0 interface</CardDescription>
              </div>
              <div className="text-right">
                <span className="text-2xl font-mono font-bold text-primary">{(state.currentThroughput / (1024 * 1024 * 1024)).toFixed(2)}</span>
                <span className="text-xs text-muted-foreground ml-1">GB/s</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[240px] w-full min-h-[240px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis 
                      domain={[0, 6]} 
                      stroke="#71717a" 
                      fontSize={10} 
                      tickFormatter={(val) => `${val} GB/s`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#141414', border: '1px solid #27272a', fontSize: '12px' }}
                      itemStyle={{ color: '#3b82f6' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="speed" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSpeed)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Queue & Tasks */}
          <Card className="bg-card/30 border-border/50 backdrop-blur-sm">
            <Tabs defaultValue="queue" className="w-full" onValueChange={setActiveTab}>
              <CardHeader className="flex flex-row items-center justify-between pb-0">
                <TabsList className="bg-secondary/50 border border-border/50">
                  <TabsTrigger value="queue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Active Queue
                  </TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="failed" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                    Failed
                  </TabsTrigger>
                  <TabsTrigger value="system">System Integration</TabsTrigger>
                  <TabsTrigger value="fidelity">Fidelity Report</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Search className="w-3 h-3" />
                  <span>FILTER: ALL_VOLUMES</span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <TabsContent value="queue" className="mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="w-[300px] text-[10px] uppercase font-bold tracking-wider">Source / Destination</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Size</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Status</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.tasks.filter(t => t.status !== 'Done' && t.status !== 'Failed').map((task) => (
                          <TableRow key={task.id} className="border-border/50 hover:bg-secondary/30 transition-colors group">
                            <TableCell className="py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3 h-3 text-primary" />
                                  <span className="text-sm font-medium truncate max-w-[240px]">{task.sourcePath.split('\\').pop()}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <span>{task.sourcePath}</span>
                                  <ChevronRight className="w-2 h-2" />
                                  <span>{task.destPath}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{formatBytes(task.size)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                  task.status === 'Reading' ? 'bg-blue-500' : 
                                  task.status === 'Writing' ? 'bg-green-500' : 
                                  task.status === 'Verifying' ? 'bg-amber-500' : 'bg-zinc-500'
                                }`} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">{task.status}</span>
                              </div>
                            </TableCell>
                            <TableCell className="w-[150px]">
                              <div className="space-y-1">
                                <Progress value={task.progress * 100} className="h-1 bg-secondary" />
                                <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                                  <span>{(task.progress * 100).toFixed(0)}%</span>
                                  <span>{formatBytes(task.throughput)}/s</span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {state.tasks.filter(t => t.status !== 'Done' && t.status !== 'Failed').length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Database className="w-8 h-8 opacity-20" />
                                <p className="text-sm">No active tasks in queue.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="w-[300px] text-[10px] uppercase font-bold tracking-wider">File Name</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Size</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Verification</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.tasks.filter(t => t.status === 'Done').map((task) => (
                          <TableRow key={task.id} className="border-border/50 hover:bg-secondary/30 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span className="text-sm font-medium">{task.sourcePath.split('\\').pop()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{formatBytes(task.size)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-500 bg-green-500/5">
                                BLAKE3_MATCH
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-[10px] font-bold text-green-500">SUCCESS</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="failed" className="mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="w-[300px] text-[10px] uppercase font-bold tracking-wider">File Name</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Error Details</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.tasks.filter(t => t.status === 'Failed').map((task) => (
                          <TableRow key={task.id} className="border-border/50 hover:bg-destructive/10 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-3 h-3 text-destructive" />
                                <span className="text-sm font-medium">{task.sourcePath.split('\\').pop()}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-destructive font-bold">{task.error?.split(':')[0]}</span>
                                <span className="text-[10px] text-muted-foreground">{task.error?.split(':')[1]}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px] gap-1 border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => retryTask(task.id)}
                              >
                                <RefreshCw className="w-3 h-3" />
                                RETRY
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {state.tasks.filter(t => t.status === 'Failed').length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="h-40 text-center text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="w-8 h-8 opacity-20" />
                                <p className="text-sm">No failed tasks detected.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="system" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase flex items-center gap-2">
                        <Settings className="w-3 h-3 text-primary" />
                        Native Engine Configuration
                      </h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Shell Extension', status: 'Registered', desc: 'Explorer Context Menu (IContextMenu)' },
                          { label: 'I/O Backend', status: 'IOCP (Async)', desc: 'Windows I/O Completion Ports' },
                          { label: 'Priority Class', status: 'High', desc: 'Process scheduling priority' },
                          { label: 'VSS Provider', status: 'Active', desc: 'Volume Shadow Copy integration' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">{item.label}</span>
                              <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">{item.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase flex items-center gap-2">
                        <Shield className="w-3 h-3 text-primary" />
                        Privilege Escalation
                      </h4>
                      <div className="p-4 bg-secondary/30 rounded-lg border border-border/50 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-muted-foreground">SE_BACKUP_NAME</span>
                          <span className="text-green-500">GRANTED</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-muted-foreground">SE_RESTORE_NAME</span>
                          <span className="text-green-500">GRANTED</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-muted-foreground">SE_MANAGE_VOLUME</span>
                          <span className="text-amber-500">PENDING_UAC</span>
                        </div>
                        <Separator className="bg-border/50" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                          Native installation requires administrative privileges to register the COM server for Explorer integration and to acquire backup tokens for locked file access.
                        </p>
                      </div>
                      <Button 
                        className="w-full text-xs font-bold uppercase tracking-wider h-10"
                        onClick={runInstallation}
                      >
                        Download Native Installer (.msi)
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fidelity" className="mt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                    {[
                      { label: 'ADS Preserved', value: state.fidelityStats.adsPreserved, icon: Layers, color: 'text-blue-500' },
                      { label: 'ACLs Copied', value: state.fidelityStats.aclsCopied, icon: Shield, color: 'text-green-500' },
                      { label: 'VSS Snapshots', value: state.fidelityStats.vssSnapshots, icon: Lock, color: 'text-purple-500' },
                      { label: 'Symlinks', value: state.fidelityStats.symlinksPreserved, icon: ArrowRightLeft, color: 'text-amber-500' },
                    ].map((stat, i) => (
                      <Card key={i} className="bg-secondary/20 border-border/50">
                        <CardContent className="p-4 flex flex-col items-center gap-2">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          <span className="text-2xl font-mono font-bold">{stat.value}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">{stat.label}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-secondary/20 rounded-lg border border-border/50">
                    <h4 className="text-xs font-bold uppercase mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                      Fidelity Verification Log
                    </h4>
                    <div className="space-y-2 font-mono text-[10px] text-muted-foreground">
                      <p>[02:06:19] INFO: Initializing BackupRead pipeline for NTFS ADS preservation...</p>
                      <p>[02:06:20] INFO: SE_BACKUP_NAME privilege acquired successfully.</p>
                      <p>[02:06:21] WARN: Sharing violation on Database.mdf. Initiating VSS snapshot...</p>
                      <p>[02:06:22] INFO: VSS Snapshot {`{VSS-001}`} created on Volume C:.</p>
                      <p>[02:06:23] INFO: ACL/DACL/SACL descriptors read for 142 objects.</p>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column: Storage & System */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Progress Overview */}
          <Card className="bg-card/30 border-border/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-wider">Job Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">TOTAL COPIED</span>
                  <span className="font-bold">{progressPercent.toFixed(1)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-secondary" />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{formatBytes(state.copiedBytes)}</span>
                  <span>{formatBytes(state.totalBytes)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Peak Speed</div>
                  <div className="text-lg font-mono font-bold text-primary">{(state.peakThroughput / (1024 * 1024 * 1024)).toFixed(2)} <span className="text-[10px]">GB/s</span></div>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Files Left</div>
                  <div className="text-lg font-mono font-bold">{state.tasks.filter(t => t.status !== 'Done' && t.status !== 'Failed').length}</div>
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Engine Status</h4>
                <div className="space-y-2">
                  {[
                    { label: 'I/O Threads', value: '16 Active', icon: Activity },
                    { label: 'Buffer Pool', value: '512 MB Aligned', icon: Layers },
                    { label: 'Checkpoint', value: 'WAL Enabled', icon: Database },
                    { label: 'Verification', value: 'Inline BLAKE3', icon: ShieldCheck },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <item.icon className="w-3 h-3" />
                        <span>{item.label}</span>
                      </div>
                      <span className="font-mono font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drive Health */}
          <Card className="bg-card/30 border-border/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-wider">Storage Topology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Samsung 990 Pro', type: 'NVMe Gen4', usage: 42, temp: 45, icon: Zap, color: 'text-blue-500' },
                { name: 'WD Black SN850X', type: 'NVMe Gen4', usage: 68, temp: 48, icon: Zap, color: 'text-primary' },
                { name: 'Seagate IronWolf', type: 'HDD 7200', usage: 12, temp: 38, icon: HardDrive, color: 'text-amber-500' },
              ].map((drive, i) => (
                <div key={i} className="p-3 bg-secondary/20 rounded-lg border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <drive.icon className={`w-3 h-3 ${drive.color}`} />
                      <span className="text-xs font-bold">{drive.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[8px] h-4">{drive.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>LOAD</span>
                      <span>{drive.usage}%</span>
                    </div>
                    <Progress value={drive.usage} className="h-1 bg-secondary" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-muted-foreground">TEMP</span>
                    <span className={drive.temp > 50 ? 'text-destructive' : 'text-green-500'}>{drive.temp}°C</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Architecture Summary */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
            <h4 className="text-[10px] font-bold uppercase text-primary flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Refinement Loop v2.0
            </h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              SwiftCopy utilizes a lock-free work-stealing scheduler with platform-specific I/O backends (IOCP/io_uring). 
              Fidelity is guaranteed via BackupRead/Write for ADS and SetFileSecurity for ACLs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-border/50 bg-card/50 py-4 mt-8">
        <div className="container mx-auto px-6 flex justify-between items-center text-[10px] text-muted-foreground font-mono">
          <div className="flex gap-4">
            <span>OS: WINDOWS_NT_10.0.22631</span>
            <span>KERNEL: SWIFT_CORE_2.0.4</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> SYSTEM_READY</span>
            <span>© 2026 SWIFTCOPY ENGINE</span>
          </div>
        </div>
      </footer>

      {/* Installation Wizard Dialog */}
      <Dialog open={isInstalling} onOpenChange={setIsInstalling}>
        <DialogContent className="bg-card border-border/50 sm:max-w-[425px] font-mono">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Native Engine Setup
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase">
              Integrating SwiftCopy with Windows NT Kernel
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{installStep}</span>
                <span className="text-primary font-bold">{installProgress}%</span>
              </div>
              <Progress value={installProgress} className="h-1 bg-secondary" />
            </div>
            
            <div className="bg-black/40 p-3 rounded border border-border/30 h-32 overflow-hidden">
              <div className="text-[9px] text-muted-foreground space-y-1 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-primary/70">{`> regsvr32 /s swift_shell_ext.dll`}</p>
                <p>{`> sc create SwiftCopyEngine binPath= "C:\\Program Files\\SwiftCopy\\engine.exe"`}</p>
                <p>{`> net start SwiftCopyEngine`}</p>
                {installProgress > 40 && <p className="text-green-500/70">{`> SUCCESS: IOCP Handle 0x000004FC mapped.`}</p>}
                {installProgress > 70 && <p className="text-green-500/70">{`> SUCCESS: SE_BACKUP_NAME privilege acquired.`}</p>}
                {installProgress === 100 && <p className="text-primary font-bold">{`> INSTALLATION COMPLETE. RESTART EXPLORER.EXE TO APPLY.`}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              disabled={installProgress < 100} 
              onClick={() => setIsInstalling(false)}
              className="w-full text-xs font-bold"
            >
              {installProgress < 100 ? "INSTALLING..." : "CLOSE WIZARD"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
