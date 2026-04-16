import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

/**
 * Phase 4: Frontend IPC Wiring (Stub)
 * This hook will replace `useSimulation` when we transition to the actual native engine. 
 * Currently deployed to showcase the Native Bridge scaffold.
 */
export function useIpcEngine() {
  const [isBridged, setIsBridged] = useState(false);

  const pingRust = async () => {
    try {
      // In the web environment (AI Studio browser), this will fail since window.__TAURI__ is missing.
      // We catch the error and simulate the response layout logic.
      if (!(window as any).__TAURI__) {
        toast.warning("Webview Environment Detected", { 
          description: "Tauri IPC is unavailable in the browser. Must compile via 'cargo tauri dev'." 
        });
        return false;
      }

      const response = await invoke('ping_engine');
      setIsBridged(true);
      toast.success("Native Bridge Connected", { 
        description: `Rust backend replied: ${response}` 
      });
      return true;
    } catch (error) {
      console.error(error);
      setIsBridged(false);
      toast.error("Bridge Error", { 
        description: "Failed to communicate with Tauri backend." 
      });
      return false;
    }
  };

  const startNativeCopy = async (source: string, destination: string, allowVss: boolean = true) => {
    try {
      if (!(window as any).__TAURI__) {
        toast.info("Simulation Fallback", { 
          description: `Bypassing native engine. Target: ${destination}` 
        });
        return "MOCK_BLAKE3_HASH_5F3A";
      }

      const hash = await invoke<string>('begin_copy_task', { source, destination, allowVss });
      toast.success("Native Verification Complete", { 
        description: `BLAKE3 Hash: ${hash.substring(0, 8)}...` 
      });
      return hash;
    } catch (error) {
      console.error(error);
      toast.error("Native I/O Error", { 
        description: "Review system logs for ERROR_SHARING_VIOLATION or Access Denied." 
      });
      throw error;
    }
  };

  return {
    isBridged,
    pingRust,
    startNativeCopy
  };
}
