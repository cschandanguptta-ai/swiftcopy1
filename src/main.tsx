import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <App />
      <Toaster richColors position="top-right" theme="dark" />
    </TooltipProvider>
  </StrictMode>,
);
