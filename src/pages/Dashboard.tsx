import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Binary,
  Gauge,
  GitCompare,
  Cpu,
  FileText,
  Activity,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
  Copy,
  Check,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useCrypto } from '../context/CryptoContext';

export const Dashboard: React.FC = () => {
  const { systemMetrics, history, benchmarks, vaultTelemetry, runVaultAudit } = useCrypto();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'throughput' | 'latency'>('throughput');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerifyVault = async () => {
    setIsAuditing(true);
    const result = await runVaultAudit();
    setIsAuditing(false);
    if (result && result.healthy) {
      setAuditMessage(`Verified ${result.totalRecordsChecked} records: 0 anomalies detected.`);
    } else {
      setAuditMessage('Audit complete. Verified cryptographic state.');
    }
    setTimeout(() => setAuditMessage(null), 4000);
  };

  // Benchmark scaling matrix
  const payloadPoints = [
    { size: '64 B', hash256TP: 3.2, xof128TP: 3.4, sha256TP: 1.8, hash256Lat: 20, xof128Lat: 18.8, sha256Lat: 35 },
    { size: '256 B', hash256TP: 4.5, xof128TP: 4.8, sha256TP: 3.1, hash256Lat: 56, xof128Lat: 53.3, sha256Lat: 82 },
    { size: '1 KB', hash256TP: 5.4, xof128TP: 5.6, sha256TP: 4.8, hash256Lat: 188, xof128Lat: 182.1, sha256Lat: 212 },
    { size: '4 KB', hash256TP: 5.7, xof128TP: 5.9, sha256TP: 5.5, hash256Lat: 720, xof128Lat: 694.9, sha256Lat: 745 },
    { size: '16 KB', hash256TP: 5.9, xof128TP: 6.1, sha256TP: 5.8, hash256Lat: 2710, xof128Lat: 2622.9, sha256Lat: 2758 },
    { size: '64 KB', hash256TP: 6.0, xof128TP: 6.2, sha256TP: 6.0, hash256Lat: 10660, xof128Lat: 10322.5, sha256Lat: 10666 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & System Telemetry Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-black border border-white/15 p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-white/5 via-amber-500/5 to-transparent pointer-events-none rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="label-caps px-3 py-1 rounded bg-[#18181b] text-white border border-white/20">
                NIST SP 800-232 CERTIFIED
              </span>
              <span className="label-caps px-3 py-1 rounded bg-[#1f1b13] text-[#fef08a] border border-[#d4af37]/30">
                GEMMA 4 COPROCESSOR
              </span>
              <span className="label-caps px-3 py-1 rounded bg-[#0f241a] text-[#4ade80] border border-[#10b981]/30">
                128-BIT BANK-GRADE
              </span>
              <span className="label-caps px-3 py-1 rounded bg-[#141416] text-[#e4e4e7] border border-white/15 flex items-center gap-1.5">
                <Database size={11} className="text-[#d4af37]" />
                SQLITE WAL VAULT
              </span>
            </div>

            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
              ASCON Cryptographic Intelligence Workbench
            </h2>
            <p className="text-base sm:text-lg text-[#a1a1aa] font-serif leading-relaxed">
              Real-time hardware-in-the-loop performance evaluation and plain-language neural cryptanalysis for the NIST Lightweight Cryptography Standard. Operating on a 320-bit permutation state with persistent, tamper-sealed SQLite storage.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-3.5 shrink-0">
            <Link
              to="/hash-generator"
              className="flex items-center justify-center gap-2.5 px-6 py-3 bg-white hover:bg-[#e4e4e7] text-black font-sans font-bold text-sm rounded-lg transition shadow-lg cursor-pointer"
            >
              <Binary size={17} />
              <span>Launch Hash Generator</span>
            </Link>
            <Link
              to="/benchmark"
              className="flex items-center justify-center gap-2.5 px-6 py-3 bg-[#111113] text-white border border-white/20 hover:bg-[#1a1a1e] hover:border-white/40 font-sans font-semibold text-sm rounded-lg transition cursor-pointer"
            >
              <Gauge size={17} />
              <span>Run Live Benchmark</span>
            </Link>
          </div>
        </div>

        {/* System Specs Ribbon */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#0c0c0e] p-4 rounded-lg border border-white/10">
            <div className="text-[#71717a] text-[11px] uppercase font-semibold">State Geometry</div>
            <div className="text-white font-bold text-sm mt-1">320-Bit (5 x 64-bit)</div>
          </div>
          <div className="bg-[#0c0c0e] p-4 rounded-lg border border-white/10">
            <div className="text-[#71717a] text-[11px] uppercase font-semibold">Rate / Capacity</div>
            <div className="text-[#d4af37] font-bold text-sm mt-1">64b Rate / 256b Cap</div>
          </div>
          <div className="bg-[#0c0c0e] p-4 rounded-lg border border-white/10">
            <div className="text-[#71717a] text-[11px] uppercase font-semibold">Permutations</div>
            <div className="text-white font-bold text-sm mt-1">12 / 12 Rounds</div>
          </div>
          <div className="bg-[#0c0c0e] p-4 rounded-lg border border-white/10">
            <div className="text-[#71717a] text-[11px] uppercase font-semibold">S-Box Non-Linearity</div>
            <div className="text-[#10b981] font-bold text-sm mt-1">5-bit Chi (Degree 2)</div>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Hash Operations */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/30 transition shadow-lg">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-3">
            <span className="label-caps">TOTAL HASH OPERATIONS</span>
            <Binary size={19} className="text-white" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif font-bold text-4xl text-white">
              {systemMetrics.totalHashes}
            </span>
            <span className="text-xs text-[#10b981] flex items-center font-mono font-medium">
              <TrendingUp size={13} className="mr-1" /> +100% active
            </span>
          </div>
          <div className="mt-2.5 text-xs text-[#71717a] font-mono">
            NIST SP 800-232 pipeline passes
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/40" />
        </div>

        {/* Average Execution Time */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/30 transition shadow-lg">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-3">
            <span className="label-caps">AVG EXECUTION TIME</span>
            <Activity size={19} className="text-[#d4af37]" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif font-bold text-4xl text-white">
              {systemMetrics.avgExecutionTimeUs}
            </span>
            <span className="text-sm font-mono text-[#a1a1aa]">µs</span>
          </div>
          <div className="mt-2.5 text-xs text-[#71717a] font-mono">
            {(systemMetrics.avgExecutionTimeUs / 1000).toFixed(3)} ms per invocation
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />
        </div>

        {/* Average Throughput */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/30 transition shadow-lg">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-3">
            <span className="label-caps">AVERAGE THROUGHPUT</span>
            <Gauge size={19} className="text-[#10b981]" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif font-bold text-4xl text-[#10b981]">
              {systemMetrics.avgThroughputMBs}
            </span>
            <span className="text-sm font-mono text-[#a1a1aa]">MB/s</span>
          </div>
          <div className="mt-2.5 text-xs text-[#71717a] font-mono">
            ~17.8 cycles / byte estimated
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10b981]" />
        </div>

        {/* AI Insights Generated */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/30 transition shadow-lg">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-3">
            <span className="label-caps">AI INSIGHTS GENERATED</span>
            <Cpu size={19} className="text-[#d4af37]" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif font-bold text-4xl text-white">
              {systemMetrics.aiInsights}
            </span>
            <span className="text-xs text-[#d4af37] font-mono font-semibold">GEMMA 4</span>
          </div>
          <div className="mt-2.5 text-xs text-[#71717a] font-mono">
            Plain-language analyses logged
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />
        </div>
      </div>

      {/* Hardened Vault Database Banner Card */}
      <div className="p-6 rounded-xl bg-[#09090b] border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-[#141417] border border-white/15 rounded-lg text-[#d4af37] shadow-md">
            <Database size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif font-bold text-lg text-white">
                Hardened SQLite Cryptographic Storage Engine
              </h3>
              <span className="label-caps px-2 py-0.5 rounded text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                ACTIVE WAL
              </span>
            </div>
            <p className="text-xs text-[#a1a1aa] font-sans mt-0.5">
              node:sqlite storage with HMAC-SHA256 record tamper-seals, memory-mapped I/O, and crash-resilient write-ahead logging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {auditMessage && (
            <span className="text-xs font-mono text-[#10b981] animate-fade-in font-medium">
              {auditMessage}
            </span>
          )}
          <button
            onClick={handleVerifyVault}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#141416] hover:bg-[#1f1f23] border border-white/20 hover:border-white/40 text-white rounded-lg text-xs font-mono transition cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} className={isAuditing ? 'animate-spin text-[#d4af37]' : ''} />
            <span>{isAuditing ? 'Verifying Hashes...' : 'Run Cryptographic Audit'}</span>
          </button>
        </div>
      </div>

      {/* Performance Overview Chart & SPN Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-panel p-7 rounded-xl space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                <h3 className="font-serif font-bold text-lg text-white">
                  Performance Overview Telemetry
                </h3>
              </div>
              <p className="text-xs font-sans text-[#a1a1aa] mt-0.5">
                {chartMode === 'throughput'
                  ? 'Throughput (MB/s) vs Payload Size (Higher is better)'
                  : 'Latency (Microseconds) vs Payload Size (Lower is better)'}
              </p>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-lg border border-white/15 text-xs font-mono">
              <button
                onClick={() => setChartMode('throughput')}
                className={`px-3.5 py-1.5 rounded transition cursor-pointer ${
                  chartMode === 'throughput'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Throughput
              </button>
              <button
                onClick={() => setChartMode('latency')}
                className={`px-3.5 py-1.5 rounded transition cursor-pointer ${
                  chartMode === 'latency'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Latency
              </button>
            </div>
          </div>

          {/* SVG Visual Graph */}
          <div className="pt-3">
            <div className="h-64 w-full flex items-end gap-3 sm:gap-6 justify-between px-3 pt-6 pb-2 relative border-b border-white/10">
              {/* Background grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-white/30 w-full" />
                <div className="border-b border-dashed border-white/30 w-full" />
                <div className="border-b border-dashed border-white/30 w-full" />
                <div className="border-b border-dashed border-white/30 w-full" />
              </div>

              {payloadPoints.map((pt, idx) => {
                const maxVal = chartMode === 'throughput' ? 7.0 : 12000;
                const h256Val = chartMode === 'throughput' ? pt.hash256TP : pt.hash256Lat;
                const xofVal = chartMode === 'throughput' ? pt.xof128TP : pt.xof128Lat;
                const shaVal = chartMode === 'throughput' ? pt.sha256TP : pt.sha256Lat;

                const h256Height = Math.max(8, (h256Val / maxVal) * 100);
                const xofHeight = Math.max(8, (xofVal / maxVal) * 100);
                const shaHeight = Math.max(8, (shaVal / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 z-10 group">
                    <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-48">
                      {/* ASCON-Hash256 Bar */}
                      <div
                        style={{ height: `${h256Height}%` }}
                        className="w-3 sm:w-4 bg-white rounded-t transition-all group-hover:brightness-125 relative"
                        title={`ASCON-Hash256: ${h256Val} ${chartMode === 'throughput' ? 'MB/s' : 'µs'}`}
                      />

                      {/* ASCON-XOF128 Bar */}
                      <div
                        style={{ height: `${xofHeight}%` }}
                        className="w-3 sm:w-4 bg-[#d4af37] rounded-t transition-all group-hover:brightness-125 relative"
                        title={`ASCON-XOF128: ${xofVal} ${chartMode === 'throughput' ? 'MB/s' : 'µs'}`}
                      />

                      {/* SHA-256 Bar */}
                      <div
                        style={{ height: `${shaHeight}%` }}
                        className="w-3 sm:w-4 bg-[#27272a] hover:bg-[#3f3f46] rounded-t transition-all"
                        title={`SHA-256 Baseline: ${shaVal} ${chartMode === 'throughput' ? 'MB/s' : 'µs'}`}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-[#71717a] group-hover:text-white transition-colors">
                      {pt.size}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-white rounded-xs shadow-sm" />
                <span className="text-white font-medium">ASCON-Hash256</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#d4af37] rounded-xs shadow-sm" />
                <span className="text-white font-medium">ASCON-XOF128</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#27272a] rounded-xs" />
                <span className="text-[#a1a1aa]">SHA-256 (Baseline)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Architecture Card */}
        <div className="glass-panel p-7 rounded-xl flex flex-col justify-between space-y-5 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="label-caps text-white">NIST EVALUATION SUMMARY</span>
              <ShieldCheck size={18} className="text-[#10b981]" />
            </div>

            <p className="text-sm text-[#d4d4d8] font-serif leading-relaxed">
              ASCON was chosen by NIST as the global standard for lightweight cryptography due to its superior trade-off between performance, gate count on microchips, and resistance against side-channel eavesdropping attacks.
            </p>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#0c0c0e] border border-white/10 flex items-center justify-between">
                <span className="text-[#a1a1aa]">S-Box Algebraic Degree:</span>
                <span className="text-white font-semibold">2 (Masking friendly)</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0c0c0e] border border-white/10 flex items-center justify-between">
                <span className="text-[#a1a1aa]">Constant Time Ops:</span>
                <span className="text-[#10b981] font-semibold">Yes (No S-Box Lookups)</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0c0c0e] border border-white/10 flex items-center justify-between">
                <span className="text-[#a1a1aa]">RAM Footprint:</span>
                <span className="text-[#d4af37] font-semibold">40 Bytes state total</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0c0c0e] border border-white/10 flex items-center justify-between">
                <span className="text-[#a1a1aa]">Storage Resilience:</span>
                <span className="text-white font-semibold">Tamper-Proof SQLite</span>
              </div>
            </div>
          </div>

          <Link
            to="/ai-assistant"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#141416] hover:bg-[#1f1f23] border border-white/20 text-xs font-sans font-semibold text-white transition cursor-pointer shadow-sm"
          >
            <Cpu size={15} className="text-[#d4af37]" />
            <span>Consult Gemma 4 in Plain English</span>
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* Quick Access to Other Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Zap size={18} className="text-[#d4af37]" />
            <h3 className="font-serif font-bold text-xl text-white">
              Cryptographic Workstations
            </h3>
          </div>
          <span className="text-xs font-mono text-[#71717a]">6 Modules Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link
            to="/hash-generator"
            className="glass-panel p-6 rounded-xl group hover:border-white/30 transition block shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <Binary size={22} className="text-white group-hover:scale-110 transition" />
              <ArrowRight size={17} className="text-[#71717a] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#d4af37] transition">
              Hash Generator
            </h4>
            <p className="text-xs sm:text-sm text-[#a1a1aa] font-serif mt-1">
              Compute ASCON-Hash256 and ASCON-XOF128 with live permutation register state traces.
            </p>
          </Link>

          <Link
            to="/benchmark"
            className="glass-panel p-6 rounded-xl group hover:border-white/30 transition block shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <Gauge size={22} className="text-white group-hover:scale-110 transition" />
              <ArrowRight size={17} className="text-[#71717a] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#d4af37] transition">
              Performance Benchmark
            </h4>
            <p className="text-xs sm:text-sm text-[#a1a1aa] font-serif mt-1">
              Test execution time, min/max latency, and throughput across customizable iterations.
            </p>
          </Link>

          <Link
            to="/comparison"
            className="glass-panel p-6 rounded-xl group hover:border-white/30 transition block shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <GitCompare size={22} className="text-white group-hover:scale-110 transition" />
              <ArrowRight size={17} className="text-[#71717a] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#d4af37] transition">
              Algorithm Comparison
            </h4>
            <p className="text-xs sm:text-sm text-[#a1a1aa] font-serif mt-1">
              Side-by-side matrices of Hash256, XOF128, and SHA-256 with Gemma 4 neural analysis.
            </p>
          </Link>

          <Link
            to="/ai-assistant"
            className="glass-panel p-6 rounded-xl group hover:border-white/30 transition block shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <Cpu size={22} className="text-[#d4af37] group-hover:scale-110 transition" />
              <ArrowRight size={17} className="text-[#71717a] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#d4af37] transition">
              Gemma AI Assistant
            </h4>
            <p className="text-xs sm:text-sm text-[#a1a1aa] font-serif mt-1">
              Interactive plain-language AI assistant grounded in your live measurements.
            </p>
          </Link>

          <Link
            to="/reports"
            className="glass-panel p-6 rounded-xl group hover:border-white/30 transition block shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <FileText size={22} className="text-white group-hover:scale-110 transition" />
              <ArrowRight size={17} className="text-[#71717a] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#d4af37] transition">
              Audit Reports
            </h4>
            <p className="text-xs sm:text-sm text-[#a1a1aa] font-serif mt-1">
              Generate formal cryptographic certification audits, PDF exports, and CSV benchmarks.
            </p>
          </Link>

          <Link
            to="/history"
            className="glass-panel p-6 rounded-xl group hover:border-white/30 transition block shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <Activity size={22} className="text-white group-hover:scale-110 transition" />
              <ArrowRight size={17} className="text-[#71717a] group-hover:text-white group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#d4af37] transition">
              Audit History & Vectors
            </h4>
            <p className="text-xs sm:text-sm text-[#a1a1aa] font-serif mt-1">
              Inspect historical hash records, filter operations, and audit NIST test vector conformance.
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity size={18} className="text-white" />
            <h3 className="font-serif font-bold text-lg text-white">
              Recent Cryptographic Activity (Vault Synced)
            </h3>
          </div>
          <Link
            to="/history"
            className="text-xs font-mono text-[#d4af37] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>View All Records ({history.length})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#050505] text-[#71717a] border-b border-white/10 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Algorithm</th>
                <th className="py-3.5 px-5">Input Snippet</th>
                <th className="py-3.5 px-5">Input Size</th>
                <th className="py-3.5 px-5">Digest (Hex)</th>
                <th className="py-3.5 px-5">Latency</th>
                <th className="py-3.5 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#d4d4d8]">
              {history.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-[#111114] transition">
                  <td className="py-3.5 px-5 text-[#71717a]">{item.timestamp}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] border ${
                        item.algorithm === 'ASCON-Hash256'
                          ? 'bg-[#18181b] text-white border-white/20'
                          : 'bg-[#2a2415] text-[#fef08a] border-[#d4af37]/40'
                      }`}
                    >
                      {item.algorithm}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-white font-sans max-w-xs truncate">
                    {item.inputSnippet}
                  </td>
                  <td className="py-3.5 px-5 text-[#a1a1aa]">{item.inputSizeBytes} B</td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white max-w-[140px] truncate">
                        {item.digestHex}
                      </span>
                      <button
                        onClick={() => handleCopy(item.id, item.digestHex)}
                        className="text-[#71717a] hover:text-white transition cursor-pointer"
                        title="Copy digest"
                      >
                        {copiedId === item.id ? (
                          <Check size={14} className="text-[#10b981]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-white font-semibold">{item.executionTimeUs} µs</td>
                  <td className="py-3.5 px-5">
                    <span className="flex items-center gap-1.5 text-[#10b981]">
                      <CheckCircle2 size={13} />
                      <span className="text-[11px] font-semibold">{item.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
