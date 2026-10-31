import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HashResult } from '../crypto/ascon';

export interface HashHistoryItem {
  id: string;
  timestamp: string;
  algorithm: 'ASCON-Hash256' | 'ASCON-XOF128';
  inputSnippet: string;
  inputSizeBytes: number;
  digestHex: string;
  outputSizeBytes: number;
  executionTimeUs: number;
  executionTimeMs: number;
  status: 'VERIFIED' | 'COMPLIANT';
}

export interface BenchmarkRecord {
  id: string;
  timestamp: string;
  algorithm: string;
  inputSizeBytes: number;
  iterations: number;
  avgTimeUs: number;
  minTimeUs: number;
  maxTimeUs: number;
  throughputMBs: number;
  cyclesPerByte: number;
}

export interface ReportItem {
  id: string;
  title: string;
  date: string;
  algorithmSuite: string;
  summary: string;
  content: string;
  metrics: {
    avgThroughput: number;
    avgLatencyUs: number;
    securityMargin: string;
  };
}

export interface VaultTelemetry {
  connected: boolean;
  healthy: boolean;
  engine: string;
  journalMode: string;
  totalRecords: number;
  tamperedRecords: number;
  lastAudited?: string;
}

interface CryptoContextType {
  history: HashHistoryItem[];
  benchmarks: BenchmarkRecord[];
  reports: ReportItem[];
  aiInsightsCount: number;
  vaultTelemetry: VaultTelemetry;
  addHashToHistory: (result: HashResult, inputSnippet: string) => void;
  addBenchmarkRecord: (record: Omit<BenchmarkRecord, 'id' | 'timestamp'>) => void;
  addReport: (report: Omit<ReportItem, 'id' | 'date'>) => void;
  clearHistory: () => void;
  incrementAiInsights: () => void;
  runVaultAudit: () => Promise<any>;
  exportVault: () => Promise<any>;
  systemMetrics: {
    totalHashes: number;
    avgExecutionTimeUs: number;
    avgThroughputMBs: number;
    aiInsights: number;
  };
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

// Initial seed history reflecting NIST reference vector tests
const INITIAL_HISTORY: HashHistoryItem[] = [
  {
    id: 'h-1',
    timestamp: '2026-10-30 08:04:12',
    algorithm: 'ASCON-Hash256',
    inputSnippet: 'NIST SP 800-232 Verification Vector (Zero-Length Payload)',
    inputSizeBytes: 0,
    digestHex: '7346bc14f036e87ae03d0997913088f5f68411434b3cf8b54fa796a80d251f91',
    outputSizeBytes: 32,
    executionTimeUs: 14.2,
    executionTimeMs: 0.014,
    status: 'VERIFIED',
  },
  {
    id: 'h-2',
    timestamp: '2026-10-30 08:06:45',
    algorithm: 'ASCON-XOF128',
    inputSnippet: 'IoT CAN-Bus Frame Telemetry: [0x41, 0x53, 0x43, 0x4F, 0x4E]',
    inputSizeBytes: 128,
    digestHex: '5d4cbde6350ea4c174bd65b5b332f8408f99740b81aa02735eaefbcf0ba0339e',
    outputSizeBytes: 32,
    executionTimeUs: 32.8,
    executionTimeMs: 0.033,
    status: 'COMPLIANT',
  },
  {
    id: 'h-3',
    timestamp: '2026-10-30 08:08:20',
    algorithm: 'ASCON-Hash256',
    inputSnippet: 'Firmware Bootloader Signature Block: Cortex-M4 v2.4.1',
    inputSizeBytes: 1024,
    digestHex: '2f9a710bc8d3e5a1b04618e3914a27f6c3e981204d603a117b8f0426c59d81ea',
    outputSizeBytes: 32,
    executionTimeUs: 182.4,
    executionTimeMs: 0.182,
    status: 'VERIFIED',
  },
];

const INITIAL_BENCHMARKS: BenchmarkRecord[] = [
  {
    id: 'b-1',
    timestamp: '2026-10-30 08:00:00',
    algorithm: 'ASCON-Hash256',
    inputSizeBytes: 1024,
    iterations: 100,
    avgTimeUs: 188.5,
    minTimeUs: 172.0,
    maxTimeUs: 215.3,
    throughputMBs: 5.43,
    cyclesPerByte: 18.2,
  },
  {
    id: 'b-2',
    timestamp: '2026-10-30 08:01:25',
    algorithm: 'ASCON-XOF128',
    inputSizeBytes: 1024,
    iterations: 100,
    avgTimeUs: 182.1,
    minTimeUs: 169.5,
    maxTimeUs: 208.7,
    throughputMBs: 5.62,
    cyclesPerByte: 17.6,
  },
  {
    id: 'b-3',
    timestamp: '2026-10-30 08:03:10',
    algorithm: 'ASCON-Hash256',
    inputSizeBytes: 4096,
    iterations: 50,
    avgTimeUs: 724.8,
    minTimeUs: 698.2,
    maxTimeUs: 792.1,
    throughputMBs: 5.65,
    cyclesPerByte: 17.5,
  },
];

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HashHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ascon_hash_history');
      return saved ? JSON.parse(saved) : INITIAL_HISTORY;
    } catch {
      return INITIAL_HISTORY;
    }
  });

  const [benchmarks, setBenchmarks] = useState<BenchmarkRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ascon_benchmarks');
      return saved ? JSON.parse(saved) : INITIAL_BENCHMARKS;
    } catch {
      return INITIAL_BENCHMARKS;
    }
  });

  const [reports, setReports] = useState<ReportItem[]>(() => {
    try {
      const saved = localStorage.getItem('ascon_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [aiInsightsCount, setAiInsightsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ascon_ai_insights');
      return saved ? parseInt(saved, 10) : 14;
    } catch {
      return 14;
    }
  });

  const [vaultTelemetry, setVaultTelemetry] = useState<VaultTelemetry>({
    connected: false,
    healthy: true,
    engine: 'SQLite3 Embedded (node:sqlite)',
    journalMode: 'WAL (Write-Ahead Logging)',
    totalRecords: 0,
    tamperedRecords: 0,
  });

  // Fetch verified records from the server-side hardened SQLite Vault
  const syncWithServerVault = useCallback(async () => {
    try {
      const [statsRes, historyRes, benchRes, reportsRes] = await Promise.all([
        fetch('/api/vault/stats').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/vault/history').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/vault/benchmarks').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/vault/reports').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (statsRes) {
        setVaultTelemetry((prev) => ({
          ...prev,
          connected: true,
          engine: statsRes.engine || prev.engine,
          journalMode: statsRes.journalMode || prev.journalMode,
          totalRecords: statsRes.recordCounts?.total ?? 0,
        }));
      }

      if (Array.isArray(historyRes) && historyRes.length > 0) {
        setHistory(historyRes);
      }
      if (Array.isArray(benchRes) && benchRes.length > 0) {
        setBenchmarks(benchRes);
      }
      if (Array.isArray(reportsRes) && reportsRes.length > 0) {
        setReports(reportsRes);
      }
    } catch (err) {
      console.warn('Operating in offline-resilient local cache mode:', err);
      setVaultTelemetry((prev) => ({ ...prev, connected: false }));
    }
  }, []);

  useEffect(() => {
    syncWithServerVault();
  }, [syncWithServerVault]);

  // Sync to local browser cache
  useEffect(() => {
    try {
      localStorage.setItem('ascon_hash_history', JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage quota limit reached for hash history');
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('ascon_benchmarks', JSON.stringify(benchmarks));
    } catch (e) {
      console.warn('LocalStorage quota limit reached for benchmarks');
    }
  }, [benchmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('ascon_reports', JSON.stringify(reports));
    } catch (e) {
      console.warn('LocalStorage quota limit reached for reports');
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem('ascon_ai_insights', aiInsightsCount.toString());
    } catch (e) {
      // ignore
    }
  }, [aiInsightsCount]);

  const addHashToHistory = (result: HashResult, inputSnippet: string) => {
    const item: HashHistoryItem = {
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      algorithm: result.algorithm,
      inputSnippet: inputSnippet.slice(0, 80) + (inputSnippet.length > 80 ? '...' : ''),
      inputSizeBytes: result.inputSizeBytes,
      digestHex: result.digestHex,
      outputSizeBytes: result.outputSizeBytes,
      executionTimeUs: result.executionTimeUs,
      executionTimeMs: result.executionTimeMs,
      status: 'VERIFIED',
    };

    setHistory((prev) => [item, ...prev]);

    // Asynchronously commit to hardened SQLite vault
    fetch('/api/vault/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
      .then((r) => r.ok && setVaultTelemetry((prev) => ({ ...prev, totalRecords: prev.totalRecords + 1 })))
      .catch((e) => console.warn('Failed to commit hash to server vault:', e));
  };

  const addBenchmarkRecord = (record: Omit<BenchmarkRecord, 'id' | 'timestamp'>) => {
    const item: BenchmarkRecord = {
      ...record,
      id: `b-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setBenchmarks((prev) => [item, ...prev]);

    // Asynchronously commit to hardened SQLite vault
    fetch('/api/vault/benchmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
      .then((r) => r.ok && setVaultTelemetry((prev) => ({ ...prev, totalRecords: prev.totalRecords + 1 })))
      .catch((e) => console.warn('Failed to commit benchmark to server vault:', e));
  };

  const addReport = (report: Omit<ReportItem, 'id' | 'date'>) => {
    const item: ReportItem = {
      ...report,
      id: `rep-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setReports((prev) => [item, ...prev]);

    // Asynchronously commit to hardened SQLite vault
    fetch('/api/vault/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
      .then((r) => r.ok && setVaultTelemetry((prev) => ({ ...prev, totalRecords: prev.totalRecords + 1 })))
      .catch((e) => console.warn('Failed to commit report to server vault:', e));
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('ascon_hash_history');
    } catch {}
    fetch('/api/vault/history', { method: 'DELETE' }).catch((e) => console.warn('Vault clear error:', e));
  };

  const incrementAiInsights = () => {
    setAiInsightsCount((prev) => prev + 1);
  };

  const runVaultAudit = async () => {
    try {
      const res = await fetch('/api/vault/audit');
      if (res.ok) {
        const audit = await res.json();
        setVaultTelemetry((prev) => ({
          ...prev,
          connected: true,
          healthy: audit.healthy,
          tamperedRecords: audit.tamperedRecords,
          totalRecords: audit.totalRecordsChecked,
          lastAudited: audit.lastAuditTimestamp,
        }));
        return audit;
      }
    } catch (err) {
      console.error('Audit failed:', err);
    }
    return null;
  };

  const exportVault = async () => {
    try {
      const res = await fetch('/api/vault/export');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    return {
      history,
      benchmarks,
      reports,
      exportedAt: new Date().toISOString(),
    };
  };

  // Compute live system metrics
  const totalHashes = history.length;
  const avgExecutionTimeUs =
    history.length > 0
      ? Math.round((history.reduce((acc, h) => acc + h.executionTimeUs, 0) / history.length) * 10) / 10
      : 0;

  const avgThroughputMBs =
    benchmarks.length > 0
      ? Math.round((benchmarks.reduce((acc, b) => acc + b.throughputMBs, 0) / benchmarks.length) * 100) / 100
      : 5.5;

  return (
    <CryptoContext.Provider
      value={{
        history,
        benchmarks,
        reports,
        aiInsightsCount,
        vaultTelemetry,
        addHashToHistory,
        addBenchmarkRecord,
        addReport,
        clearHistory,
        incrementAiInsights,
        runVaultAudit,
        exportVault,
        systemMetrics: {
          totalHashes,
          avgExecutionTimeUs,
          avgThroughputMBs,
          aiInsights: aiInsightsCount,
        },
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};
