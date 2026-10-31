/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CryptoProvider } from './context/CryptoContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShieldCheck } from 'lucide-react';

// Route-level code splitting & lazy loading for enterprise performance
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const HashGenerator = lazy(() =>
  import('./pages/HashGenerator').then((m) => ({ default: m.HashGenerator }))
);
const Benchmark = lazy(() =>
  import('./pages/Benchmark').then((m) => ({ default: m.Benchmark }))
);
const Comparison = lazy(() =>
  import('./pages/Comparison').then((m) => ({ default: m.Comparison }))
);
const AIAssistant = lazy(() =>
  import('./pages/AIAssistant').then((m) => ({ default: m.AIAssistant }))
);
const Reports = lazy(() =>
  import('./pages/Reports').then((m) => ({ default: m.Reports }))
);
const History = lazy(() =>
  import('./pages/History').then((m) => ({ default: m.History }))
);

/**
 * Elegant pure-black serif loading state during lazy module hydration
 */
function RouteLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-[#111113] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          <ShieldCheck size={26} className="animate-pulse" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border border-white/10 animate-ping opacity-25" />
      </div>
      <div className="text-center">
        <p className="font-serif font-semibold text-base text-white tracking-tight">
          Loading Cryptographic Workstation
        </p>
        <p className="text-xs text-[#71717a] font-mono mt-1">
          NIST SP 800-232 ASCON Core Hydrating...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ErrorBoundary>
      <CryptoProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-black text-[#f4f4f5] flex flex-col font-serif">
            {/* Consistent Persistent Sidebar across all routes */}
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            {/* Main Viewport Workspace: offset by 72 (18rem) on desktop */}
            <div className="lg:pl-72 flex-1 flex flex-col min-h-screen transition-all">
              {/* Top Instrument Bar */}
              <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

              {/* Individual Webpages with their own URL routes */}
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto telemetry-grid-fine">
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/hash-generator" element={<HashGenerator />} />
                    <Route path="/benchmark" element={<Benchmark />} />
                    <Route path="/comparison" element={<Comparison />} />
                    <Route path="/ai-assistant" element={<AIAssistant />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/history" element={<History />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </CryptoProvider>
    </ErrorBoundary>
  );
}
