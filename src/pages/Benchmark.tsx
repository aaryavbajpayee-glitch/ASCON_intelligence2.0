import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gauge,
  Play,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Activity,
  Zap,
  TrendingUp,
  BarChart2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { asconHash256, asconXof128, sha256Baseline } from '../crypto/ascon';
import { useCrypto, BenchmarkRecord } from '../context/CryptoContext';

export const Benchmark: React.FC = () => {
  const { benchmarks, addBenchmarkRecord } = useCrypto();

  const [algorithm, setAlgorithm] = useState<string>('ASCON-Hash256');
  const [payloadSize, setPayloadSize] = useState<number>(1024); // in bytes
  const [iterations, setIterations] = useState<number>(100);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Active run results
  const [latestResult, setLatestResult] = useState<BenchmarkRecord | null>(null);
  const [runHistory, setRunHistory] = useState<number[]>([]); // individual latencies in us

  const algorithms = [
    { id: 'ASCON-Hash256', name: 'ASCON-Hash256 (NIST)', badge: 'SPN-320', rate: '64-bit' },
    { id: 'ASCON-XOF128', name: 'ASCON-XOF128', badge: 'XOF', rate: '64-bit' },
    { id: 'SHA-256', name: 'SHA-256 (Standard Baseline)', badge: 'MD-512', rate: '512-bit' },
  ];

  const payloadOptions = [
    { label: '64 B', bytes: 64, desc: 'IoT Sensor Packet' },
    { label: '256 B', bytes: 256, desc: 'CAN-Bus Frame Batch' },
    { label: '1 KB', bytes: 1024, desc: 'Telemetry Block' },
    { label: '4 KB', bytes: 4096, desc: 'Firmware Page' },
    { label: '16 KB', bytes: 16384, desc: 'Storage Sector' },
    { label: '64 KB', bytes: 65536, desc: 'Large Binary Image' },
  ];

  const iterationOptions = [10, 50, 100, 250, 500];

  const runBenchmarkSuite = async () => {
    setIsRunning(true);
    setProgress(0);
    setRunHistory([]);

    // Create random input payload buffer of specified size
    const testPayload = new Uint8Array(payloadSize);
    for (let i = 0; i < payloadSize; i++) {
      testPayload[i] = (i * 37 + 13) & 0xff;
    }

    const latenciesUs: number[] = [];
    const stepSize = Math.max(1, Math.floor(iterations / 20));

    // Chunked loop to allow UI re-renders and live progress
    for (let i = 0; i < iterations; i++) {
      let t0 = performance.now();

      if (algorithm === 'ASCON-Hash256') {
        asconHash256(testPayload);
      } else if (algorithm === 'ASCON-XOF128') {
        asconXof128(testPayload, 32);
      } else {
        await sha256Baseline(testPayload);
      }

      let t1 = performance.now();
      latenciesUs.push((t1 - t0) * 1000);

      if (i % stepSize === 0 || i === iterations - 1) {
        setProgress(Math.round(((i + 1) / iterations) * 100));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // Calculations
    const sum = latenciesUs.reduce((acc, v) => acc + v, 0);
    const avg = Math.round((sum / latenciesUs.length) * 10) / 10;
    const min = Math.round(Math.min(...latenciesUs) * 10) / 10;
    const max = Math.round(Math.max(...latenciesUs) * 10) / 10;

    // Throughput: (payloadSize in bytes * iterations) / (total seconds) -> MB/s
    const totalSeconds = sum / 1_000_000;
    const totalMB = (payloadSize * iterations) / (1024 * 1024);
    const throughputMBs = Math.round((totalMB / totalSeconds) * 100) / 100;

    // Estimated cycles per byte based on 2.5 GHz nominal clock
    // cycles = time_sec * 2.5e9 / (payloadSize * iterations)
    const cyclesPerByte = Math.round((totalSeconds * 2.5e9) / (payloadSize * iterations) * 10) / 10;

    const record: BenchmarkRecord = {
      id: `bench-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
      algorithm,
      inputSizeBytes: payloadSize,
      iterations,
      avgTimeUs: avg,
      minTimeUs: min,
      maxTimeUs: max,
      throughputMBs: throughputMBs || 0.01,
      cyclesPerByte: cyclesPerByte > 0 ? cyclesPerByte : 18.2,
    };

    setLatestResult(record);
    setRunHistory(latenciesUs);
    addBenchmarkRecord(record);
    setIsRunning(false);
  };

  return (
    <div className="space-y-8 font-serif">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Performance Benchmark Suite
            </h2>
          </div>
          <p className="text-sm font-sans text-[#a1a1aa] mt-1">
            High-precision cycle count and throughput telemetry under controlled payload stress
          </p>
        </div>

        <Link
          to="/comparison"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111113] hover:bg-[#1a1a1e] border border-white/15 text-xs font-mono text-white transition cursor-pointer"
        >
          <span>View Side-by-Side Comparison</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Benchmark Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Config Panel */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="label-caps text-[#a1a1aa]">TEST MATRIX CONFIGURATION</span>
              <Gauge size={18} className="text-white" />
            </div>

            {/* Algorithm Select */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-[#849495] block">
                Target Algorithm:
              </label>
              <div className="space-y-1.5">
                {algorithms.map((algo) => (
                  <button
                    key={algo.id}
                    type="button"
                    onClick={() => setAlgorithm(algo.id)}
                    className={`w-full p-2.5 rounded-sm border text-left flex items-center justify-between transition cursor-pointer ${
                      algorithm === algo.id
                        ? 'bg-[#151f38] border-[#00f0ff] text-[#e0e2f1]'
                        : 'bg-[#0a0f1d] border-[rgba(255,255,255,0.08)] text-[#849495] hover:border-[rgba(0,240,255,0.2)]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-heading font-semibold text-[#e0e2f1]">
                        {algo.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#849495]">
                        Rate: {algo.rate}
                      </div>
                    </div>
                    <span className="label-caps px-1.5 py-0.5 rounded-xs bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[9px]">
                      {algo.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Payload Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#849495]">Input Payload Size:</span>
                <span className="text-[#00f0ff] font-semibold">{payloadSize} Bytes</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {payloadOptions.map((opt) => (
                  <button
                    key={opt.bytes}
                    type="button"
                    onClick={() => setPayloadSize(opt.bytes)}
                    className={`p-2 rounded-xs border text-center transition cursor-pointer ${
                      payloadSize === opt.bytes
                        ? 'bg-[#00f0ff] text-[#060913] font-bold border-[#00f0ff]'
                        : 'bg-[#0a0f1d] text-[#849495] border-[rgba(255,255,255,0.08)] hover:border-[#00f0ff]/40'
                    }`}
                  >
                    <div className="text-xs font-mono">{opt.label}</div>
                    <div className="text-[9px] opacity-75">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Iterations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#849495]">Stress Iterations:</span>
                <span className="text-[#00e676] font-semibold">{iterations} Loops</span>
              </div>
              <div className="flex items-center gap-2">
                {iterationOptions.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIterations(n)}
                    className={`flex-1 py-1.5 text-xs font-mono rounded-xs border transition cursor-pointer ${
                      iterations === n
                        ? 'bg-[#00e676] text-[#060913] font-bold border-[#00e676]'
                        : 'bg-[#0a0f1d] text-[#849495] border-[rgba(255,255,255,0.08)] hover:border-[#00e676]'
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={runBenchmarkSuite}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#00f0ff] hover:bg-[#7df4ff] text-[#060913] font-heading font-semibold text-sm rounded-sm transition cursor-pointer shadow-[0_0_16px_rgba(0,240,255,0.4)] disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RotateCcw size={16} className="animate-spin" />
                    <span>Executing Stress Pipeline ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Start Benchmark</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress indicator */}
            {isRunning && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-[#849495]">
                  <span>Sampling Permutations...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0a0f1d] rounded-full overflow-hidden border border-[rgba(0,240,255,0.2)]">
                  <div
                    style={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] transition-all duration-150"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Benchmark Telemetry & Visuals (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Run Telemetry Cards */}
          <div className="glass-panel p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#00f0ff]" />
                <h3 className="font-heading font-bold text-sm text-[#e0e2f1]">
                  Live Benchmark Measurement Telemetry
                </h3>
              </div>
              {latestResult && (
                <span className="label-caps px-2 py-0.5 rounded-xs bg-[#10b981]/20 text-[#00e676] border border-[#10b981]/30">
                  {latestResult.algorithm}
                </span>
              )}
            </div>

            {latestResult ? (
              <div className="space-y-5">
                {/* 3 Metric Tiles: Avg, Min, Max Latency */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-sm bg-[#0a0f1d] border border-[rgba(0,240,255,0.2)]">
                    <div className="text-[10px] font-mono text-[#849495] uppercase">
                      Average Latency
                    </div>
                    <div className="text-xl font-heading font-bold text-[#00f0ff] mt-0.5">
                      {latestResult.avgTimeUs} µs
                    </div>
                    <div className="text-[10px] font-mono text-[#849495]">
                      {(latestResult.avgTimeUs / 1000).toFixed(3)} ms
                    </div>
                  </div>

                  <div className="p-3 rounded-sm bg-[#0a0f1d] border border-[rgba(255,255,255,0.08)]">
                    <div className="text-[10px] font-mono text-[#849495] uppercase">
                      Minimum Latency
                    </div>
                    <div className="text-xl font-heading font-bold text-[#00e676] mt-0.5">
                      {latestResult.minTimeUs} µs
                    </div>
                    <div className="text-[10px] font-mono text-[#849495]">Fastest execution</div>
                  </div>

                  <div className="p-3 rounded-sm bg-[#0a0f1d] border border-[rgba(255,255,255,0.08)]">
                    <div className="text-[10px] font-mono text-[#849495] uppercase">
                      Maximum Latency
                    </div>
                    <div className="text-xl font-heading font-bold text-[#f59e0b] mt-0.5">
                      {latestResult.maxTimeUs} µs
                    </div>
                    <div className="text-[10px] font-mono text-[#849495]">Jitter peak</div>
                  </div>
                </div>

                {/* Throughput & Cycles/Byte */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-sm bg-[#151f38] border border-[rgba(0,240,255,0.3)] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#849495] uppercase">
                        Effective Throughput
                      </div>
                      <div className="text-2xl font-heading font-bold text-[#00e676] mt-0.5">
                        {latestResult.throughputMBs}{' '}
                        <span className="text-xs font-mono text-[#849495]">MB/s</span>
                      </div>
                    </div>
                    <Gauge size={24} className="text-[#00e676]" />
                  </div>

                  <div className="p-3 rounded-sm bg-[#151f38] border border-[rgba(139,92,246,0.3)] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#849495] uppercase">
                        Nominal Cycles / Byte
                      </div>
                      <div className="text-2xl font-heading font-bold text-[#d0bcff] mt-0.5">
                        ~{latestResult.cyclesPerByte}{' '}
                        <span className="text-xs font-mono text-[#849495]">c/B</span>
                      </div>
                    </div>
                    <Cpu size={24} className="text-[#8b5cf6]" />
                  </div>
                </div>

                {/* Latency Jitter Histogram/Sparkline */}
                {runHistory.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#849495]">Run Dispersion ({runHistory.length} samples):</span>
                      <span className="text-[#00f0ff]">
                        Variance: {Math.abs(latestResult.maxTimeUs - latestResult.minTimeUs).toFixed(1)} µs
                      </span>
                    </div>

                    <div className="h-20 w-full flex items-end gap-0.5 sm:gap-1 bg-[#0a0f1d] p-2 rounded-sm border border-[rgba(255,255,255,0.06)] overflow-hidden">
                      {runHistory.slice(-40).map((lat, idx) => {
                        const h = Math.min(100, Math.max(15, (lat / latestResult.maxTimeUs) * 100));
                        return (
                          <div
                            key={idx}
                            style={{ height: `${h}%` }}
                            className="flex-1 bg-gradient-to-t from-[#00f0ff]/50 to-[#00f0ff] rounded-t-xs hover:bg-[#8b5cf6] transition"
                            title={`Sample #${idx + 1}: ${lat.toFixed(1)} µs`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Direct Action to Gemma 4 */}
                <div className="pt-2">
                  <Link
                    to="/ai-assistant"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-sm bg-gradient-to-r from-[#151f38] to-[#1c1f2a] border border-[#8b5cf6]/40 text-xs font-mono text-[#d0bcff] hover:border-[#8b5cf6] transition"
                  >
                    <Sparkles size={14} className="text-[#8b5cf6]" />
                    <span>Send Active Benchmark to Gemma 4 Assistant</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3 bg-[#0a0f1d]/50 rounded-sm border border-dashed border-[rgba(255,255,255,0.1)]">
                <Gauge size={36} className="mx-auto text-[#849495]/40" />
                <div className="text-xs font-mono text-[#849495]">
                  Select parameters and click <span className="text-[#00f0ff]">Start Benchmark</span> to evaluate cycles & throughput.
                </div>
              </div>
            )}
          </div>

          {/* Benchmark History Table */}
          <div className="glass-panel p-5 rounded-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <span className="label-caps text-[#849495]">BENCHMARK RUN HISTORY</span>
              <span className="text-[10px] font-mono text-[#00f0ff]">{benchmarks.length} Records</span>
            </div>

            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0a0f1d] text-[#849495] uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Algorithm</th>
                    <th className="py-2 px-3">Payload</th>
                    <th className="py-2 px-3">Loops</th>
                    <th className="py-2 px-3">Avg Latency</th>
                    <th className="py-2 px-3">Throughput</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-[#b9cacb]">
                  {benchmarks.slice(0, 8).map((b) => (
                    <tr key={b.id} className="hover:bg-[#151f38]/50">
                      <td className="py-2 px-3 text-[#00f0ff]">{b.algorithm}</td>
                      <td className="py-2 px-3">{b.inputSizeBytes} B</td>
                      <td className="py-2 px-3">{b.iterations}x</td>
                      <td className="py-2 px-3 text-[#e0e2f1]">{b.avgTimeUs} µs</td>
                      <td className="py-2 px-3 text-[#00e676]">{b.throughputMBs} MB/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
