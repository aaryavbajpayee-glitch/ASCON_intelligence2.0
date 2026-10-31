import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Workbench Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-[#f4f4f5] flex items-center justify-center p-6 font-serif">
          <div className="max-w-2xl w-full bg-[#0a0a0c] border border-red-500/30 rounded-2xl p-8 sm:p-10 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
                <ShieldAlert size={30} />
              </div>
              <div>
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
                  Cryptographic Workbench Interrupted
                </h1>
                <p className="text-sm text-[#a1a1aa] font-sans mt-0.5">
                  An unhandled UI component exception was captured by the safety perimeter.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black border border-white/10 mb-6 font-mono text-xs text-red-300 overflow-x-auto">
              <div className="font-semibold text-red-400 mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown runtime error'}
              </div>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[#71717a] mt-2 whitespace-pre-wrap leading-relaxed">
                  {this.state.errorInfo.componentStack.slice(0, 500)}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-black font-sans font-semibold text-sm hover:bg-neutral-200 transition shadow-lg cursor-pointer"
              >
                <RefreshCw size={16} />
                Reload Workbench
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#18181b] border border-white/20 text-[#e4e4e7] font-sans text-sm hover:bg-[#27272a] hover:border-white/40 transition cursor-pointer"
              >
                Clear Cache & Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
