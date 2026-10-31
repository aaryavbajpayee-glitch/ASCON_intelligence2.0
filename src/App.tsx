/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CryptoProvider } from './context/CryptoContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';

// Direct robust imports: Guarantees 0ms slide transitions and immunity from dynamic import fetch errors
import { Dashboard } from './pages/Dashboard';
import { HashGenerator } from './pages/HashGenerator';
import { Benchmark } from './pages/Benchmark';
import { Comparison } from './pages/Comparison';
import { AIAssistant } from './pages/AIAssistant';
import { Reports } from './pages/Reports';
import { History } from './pages/History';

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
              </main>
            </div>
          </div>
        </BrowserRouter>
      </CryptoProvider>
    </ErrorBoundary>
  );
}
