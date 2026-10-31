import React, { useState } from 'react';
import {
  Binary,
  Upload,
  FileCode,
  Copy,
  Check,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  Heart,
  Radio,
  Car,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { asconHash256, asconXof128, HashResult } from '../crypto/ascon';
import { HexViewer } from '../components/HexViewer';
import { useCrypto } from '../context/CryptoContext';

export const HashGenerator: React.FC = () => {
  const { addHashToHistory } = useCrypto();

  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState<string>(
    'PATIENT_ID=9021;GLUCOSE_MG_DL=114;PUMP_RATE=0.2U;STATUS=STABLE'
  );
  const [fileData, setFileData] = useState<{ name: string; size: number; bytes: Uint8Array } | null>(null);
  const [algorithm, setAlgorithm] = useState<'ASCON-Hash256' | 'ASCON-XOF128'>('ASCON-Hash256');
  const [xofLength, setXofLength] = useState<number>(32); // in bytes
  const [enableTrace, setEnableTrace] = useState<boolean>(true);

  const [result, setResult] = useState<HashResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTelemetryPreset, setActiveTelemetryPreset] = useState<'cgm' | 'cardiac' | 'canbus' | null>('cgm');

  // Standard NIST reference test vectors
  const nistPresets = [
    { label: 'NIST Zero-Length ("")', text: '' },
    { label: 'NIST Pangram ("The quick brown...")', text: 'The quick brown fox jumps over the lazy dog' },
    { label: 'Smart Meter Ingestion (64B)', text: 'METER_ID=0x88921;TIMESTAMP=1798603200;PWR_KW=4.82;VOLTS=239.8;AMPS=20.1' },
  ];

  // Simulated IoT Hardware Streams
  const telemetryPresets = [
    {
      id: 'cgm' as const,
      title: 'Continuous Glucose Monitor (CGM)',
      deviceType: 'Subcutaneous Biosensor Wearable',
      icon: Activity,
      rateHz: '1 pkt / 5 min',
      payload: 'PATIENT_ID=9021;GLUCOSE_MG_DL=114;PUMP_RATE=0.2U;STATUS=STABLE',
      description: 'Encrypted ambulatory insulin delivery telemetry with tamper-resistant pump status.',
    },
    {
      id: 'cardiac' as const,
      title: 'Cardiac Telemetry Patch',
      deviceType: 'Continuous Holter ECG Patch',
      icon: Heart,
      rateHz: '250 Hz sample stream',
      payload: 'PATIENT_ID=4082;HR_BPM=78;ECG_LEAD_II_MV=1.24;O2_SAT=98%;TEMP_C=36.7',
      description: 'Real-time multi-vital biometric telemetry payload for hospital arrhythmia monitoring.',
    },
    {
      id: 'canbus' as const,
      title: 'Automotive CAN-Bus ECU Frame',
      deviceType: 'ISO 11898-1 High-Speed CAN Frame',
      icon: Car,
      rateHz: '100 Hz broadcast',
      payload: 'CAN_ID=0x412;RPM=2450;SPEED_KPH=68.5;BRAKE_PRESSURE=0.0',
      description: 'Mission-critical powertrain bus packet shielded against spoofing & injection hacks.',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      setFileData({
        name: file.name,
        size: file.size,
        bytes,
      });
      setActiveTelemetryPreset(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const executeHash = (data: Uint8Array | string, snippet: string) => {
    setIsGenerating(true);

    setTimeout(() => {
      let hashRes: HashResult;
      if (algorithm === 'ASCON-Hash256') {
        hashRes = asconHash256(data, { trace: enableTrace });
      } else {
        hashRes = asconXof128(data, xofLength, { trace: enableTrace });
      }

      setResult(hashRes);
      addHashToHistory(hashRes, snippet);
      setIsGenerating(false);
    }, 40);
  };

  const handleGenerate = () => {
    const dataToHash = inputMode === 'text' ? inputText : fileData?.bytes || new Uint8Array(0);
    const snippet =
      inputMode === 'text'
        ? inputText.length === 0
          ? '[Empty String]'
          : inputText
        : `File: ${fileData?.name} (${fileData?.size} B)`;

    executeHash(dataToHash, snippet);
  };

  const handleLoadTelemetryStream = (presetId: 'cgm' | 'cardiac' | 'canbus') => {
    const selected = telemetryPresets.find((p) => p.id === presetId);
    if (!selected) return;

    setActiveTelemetryPreset(presetId);
    setInputMode('text');
    setInputText(selected.payload);
    executeHash(selected.payload, `IoT Stream: ${selected.title}`);
  };

  const copyDigest = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.digestHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 font-serif pb-12">
      {/* 1. Page Title & Instrument Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
              ASCON Permutation & Hash Generation Unit
            </h2>
          </div>
          <p className="text-sm font-sans text-[#a1a1aa] mt-1">
            Standard NIST SP 800-232 Cryptographic Hash and Extendable-Output Function
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="label-caps px-2.5 py-1 rounded bg-[#0f241a] text-[#4ade80] border border-[#10b981]/30">
            NIST VERIFIED
          </span>
          <span className="label-caps px-2.5 py-1 rounded bg-[#18181b] text-white border border-white/20">
            RATE: 64-BIT
          </span>
        </div>
      </div>

      {/* 2. NEW INTERACTIVE WORKSTATION: IoT & Medical Sensor Telemetry Sandbox */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#121214] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
                  IoT & Medical Sensor Telemetry Sandbox
                </h3>
                <span className="label-caps px-2 py-0.5 rounded bg-[#2a2415] text-[#fef08a] border border-[#d4af37]/40 text-[10px]">
                  STREAM SIMULATOR
                </span>
              </div>
              <p className="text-xs font-sans text-[#a1a1aa] mt-0.5">
                Simulate microsecond ASCON hashing for mission-critical medical wearables & CAN-bus frames
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>HARDWARE REGISTERS: 40 BYTES</span>
          </div>
        </div>

        {/* 3 Quick-Preset Buttons for Simulated IoT Hardware Streams */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {telemetryPresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = activeTelemetryPreset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadTelemetryStream(preset.id)}
                className={`p-5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#18181b] border-[#d4af37] text-white shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                    : 'bg-black/60 border-white/10 text-[#a1a1aa] hover:border-white/30 hover:bg-[#111113]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#2a2415] border-[#d4af37]/60 text-[#d4af37]'
                          : 'bg-[#121214] border-white/15 text-[#71717a] group-hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#a1a1aa]">
                      {preset.rateHz}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-white group-hover:text-white">
                    {preset.title}
                  </h4>
                  <div className="text-[11px] font-mono text-[#d4af37] mt-0.5">
                    {preset.deviceType}
                  </div>

                  <p className="text-xs font-sans text-[#a1a1aa] mt-2.5 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-[10px] font-mono text-[#71717a] truncate">
                    PAYLOAD: <code className="text-[#e4e4e7]">{preset.payload}</code>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs font-sans text-[#d4af37] font-semibold">
                    <span>Load & Permute Stream</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Two-Column Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Input and Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Algorithm & Sponge Parameters Card */}
          <div className="glass-panel p-6 rounded-2xl space-y-5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[#a1a1aa]">ALGORITHM SELECTION</span>
              <span className="text-xs font-mono text-[#d4af37]">SPONGE RATIO: 64:256</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ASCON-Hash256 Button */}
              <button
                type="button"
                onClick={() => setAlgorithm('ASCON-Hash256')}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  algorithm === 'ASCON-Hash256'
                    ? 'bg-[#18181b] border-white text-white shadow-lg'
                    : 'bg-[#09090b] border-white/10 text-[#71717a] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-base text-white">
                    ASCON-Hash256
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                    FIXED 256b
                  </span>
                </div>
                <p className="text-xs font-serif text-[#a1a1aa] mt-2 leading-relaxed">
                  Standard fixed 32-byte digest for digital signatures and document integrity.
                </p>
                <div className="mt-2.5 text-[11px] font-mono text-[#71717a]">
                  a=12 rounds, b=12 rounds, rate=8B
                </div>
              </button>

              {/* ASCON-XOF128 Button */}
              <button
                type="button"
                onClick={() => setAlgorithm('ASCON-XOF128')}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  algorithm === 'ASCON-XOF128'
                    ? 'bg-[#18181b] border-[#d4af37] text-white shadow-lg'
                    : 'bg-[#09090b] border-white/10 text-[#71717a] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-base text-[#d4af37]">
                    ASCON-XOF128
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2a2415] text-[#fef08a] border border-[#d4af37]/40">
                    VARIABLE
                  </span>
                </div>
                <p className="text-xs font-serif text-[#a1a1aa] mt-2 leading-relaxed">
                  Extendable output function for customizable key expansion and MAC generation.
                </p>
                <div className="mt-2.5 text-[11px] font-mono text-[#71717a]">
                  Arbitrary squeeze length
                </div>
              </button>
            </div>

            {/* XOF Length Selection */}
            {algorithm === 'ASCON-XOF128' && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#a1a1aa]">XOF Output Length:</span>
                  <span className="text-[#d4af37] font-bold">
                    {xofLength} bytes ({xofLength * 8} bits)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[16, 32, 48, 64, 128].map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setXofLength(len)}
                      className={`flex-1 py-1.5 text-xs font-mono rounded-lg border transition cursor-pointer ${
                        xofLength === len
                          ? 'bg-[#d4af37] text-black font-bold border-[#d4af37]'
                          : 'bg-black text-[#a1a1aa] border-white/15 hover:border-white/30'
                      }`}
                    >
                      {len}B
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Data Source Card */}
          <div className="glass-panel p-6 rounded-2xl space-y-5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[#a1a1aa]">INPUT DATA REGISTER</span>

              {/* Input Mode Switch */}
              <div className="flex items-center bg-black p-1 rounded-xl border border-white/15 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  Text / Hex String
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    inputMode === 'file'
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  Binary File Upload
                </button>
              </div>
            </div>

            {/* Text Mode */}
            {inputMode === 'text' ? (
              <div className="space-y-3">
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setActiveTelemetryPreset(null);
                  }}
                  rows={5}
                  placeholder="Enter UTF-8 text, medical telemetry or raw sensor data to hash..."
                  className="w-full bg-black border border-white/15 focus:border-white focus:ring-1 focus:ring-white rounded-xl p-3.5 text-xs font-mono text-[#f4f4f5] outline-none transition resize-y"
                />

                <div className="flex items-center justify-between text-xs font-mono text-[#71717a]">
                  <span>Payload Size: {new TextEncoder().encode(inputText).length} bytes</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText('');
                      setActiveTelemetryPreset(null);
                    }}
                    className="hover:text-white underline underline-offset-4 cursor-pointer"
                  >
                    Clear Register
                  </button>
                </div>

                {/* NIST Presets */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-[11px] font-mono text-[#71717a] uppercase">
                    Reference NIST Test Vectors:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nistPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputText(preset.text);
                          setActiveTelemetryPreset(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#111113] hover:bg-[#1a1a1e] text-xs font-mono text-[#a1a1aa] hover:text-white border border-white/10 hover:border-white/20 transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* File Mode */
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl bg-black cursor-pointer transition">
                  <Upload size={32} className="text-[#d4af37] mb-2" />
                  <span className="text-sm font-serif font-semibold text-white">
                    Select file or drag and drop binary image
                  </span>
                  <span className="text-xs font-sans text-[#71717a] mt-1">
                    Accepts firmware binaries (.bin, .hex), document digests, or IoT packet captures
                  </span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>

                {fileData && (
                  <div className="p-3.5 rounded-xl bg-[#111113] border border-white/15 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <FileCode size={16} className="text-[#d4af37]" />
                      <span className="text-white font-semibold">{fileData.name}</span>
                    </div>
                    <span className="text-[#10b981]">{fileData.size} bytes loaded</span>
                  </div>
                )}
              </div>
            )}

            {/* Options & Action Button */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-xs font-sans text-[#a1a1aa] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableTrace}
                  onChange={(e) => setEnableTrace(e.target.checked)}
                  className="rounded bg-black border-white/20 accent-[#d4af37]"
                />
                <span>Capture 320-Bit Permutation State Trace</span>
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-7 py-3 bg-white hover:bg-neutral-200 text-black font-sans font-bold text-sm rounded-xl transition cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-black" />
                    <span>Permuting Sponge...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} className="text-black" />
                    <span>Generate Hash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Digest and State Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Output Digest Display */}
          <div className="glass-panel p-6 rounded-2xl space-y-5 border border-white/10">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Binary size={18} className="text-[#d4af37]" />
                <h3 className="font-serif font-bold text-base text-white">
                  Generated Cryptographic Digest
                </h3>
              </div>
              {result && (
                <span className="label-caps px-2 py-0.5 rounded bg-[#0f241a] text-[#4ade80] border border-[#10b981]/30">
                  {result.algorithm}
                </span>
              )}
            </div>

            {result ? (
              <div className="space-y-4">
                {/* Digest Hex View */}
                <div>
                  <HexViewer
                    hex={result.digestHex}
                    bytesPerRow={8}
                    label="OUTPUT SQUEEZE REGISTER"
                  />
                </div>

                {/* Copy Digest Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={copyDigest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-white/15 text-xs font-mono text-white transition cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied to Clipboard' : 'Copy Hex Digest'}</span>
                  </button>
                </div>

                {/* Telemetry Metrics Bar */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-black border border-white/10">
                    <div className="text-[#71717a] text-[10px] uppercase">Execution Latency</div>
                    <div className="text-[#d4af37] font-bold text-lg mt-0.5">
                      {result.executionTimeUs} µs
                    </div>
                    <div className="text-[10px] text-[#71717a]">({result.executionTimeMs} ms)</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black border border-white/10">
                    <div className="text-[#71717a] text-[10px] uppercase">Digest Output Size</div>
                    <div className="text-[#10b981] font-bold text-lg mt-0.5">
                      {result.outputSizeBytes} Bytes
                    </div>
                    <div className="text-[10px] text-[#71717a]">
                      ({result.outputSizeBytes * 8} Bits)
                    </div>
                  </div>
                </div>

                {/* Final 320-Bit State Registers (x0..x4) */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-[#71717a]">FINAL 320-BIT STATE WORDS</span>
                    <span className="text-[10px] font-mono text-[#d4af37]">5 x 64-bit BigInts</span>
                  </div>

                  <div className="space-y-1 font-mono text-xs bg-black p-3.5 rounded-xl border border-white/10">
                    <div className="flex justify-between text-[#71717a]">
                      <span>x0 (Rate Register):</span>
                      <span className="text-white font-semibold">0x{result.finalStateHex.x0}</span>
                    </div>
                    <div className="flex justify-between text-[#71717a]">
                      <span>x1 (Capacity Register):</span>
                      <span className="text-[#e4e4e7]">0x{result.finalStateHex.x1}</span>
                    </div>
                    <div className="flex justify-between text-[#71717a]">
                      <span>x2 (Round Constant):</span>
                      <span className="text-[#e4e4e7]">0x{result.finalStateHex.x2}</span>
                    </div>
                    <div className="flex justify-between text-[#71717a]">
                      <span>x3 (Diffusion Word):</span>
                      <span className="text-[#e4e4e7]">0x{result.finalStateHex.x3}</span>
                    </div>
                    <div className="flex justify-between text-[#71717a]">
                      <span>x4 (Linear State):</span>
                      <span className="text-[#e4e4e7]">0x{result.finalStateHex.x4}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center space-y-3 bg-black/60 rounded-xl border border-dashed border-white/15">
                <Binary size={36} className="mx-auto text-[#71717a]/40" />
                <div className="text-xs font-mono text-[#71717a]">
                  Digest awaiting execution. Select an IoT preset or configure input and click{' '}
                  <span className="text-white font-bold">Generate Hash</span>.
                </div>
              </div>
            )}
          </div>

          {/* Permutation Trace Preview */}
          {result?.stateTrace && result.stateTrace.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <span className="label-caps text-[#d4af37]">PERMUTATION ROUND TRACE</span>
                <span className="text-[10px] font-mono text-[#71717a]">
                  {result.stateTrace.length} Steps Logged
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 font-mono text-xs">
                {result.stateTrace.slice(-6).map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-black border border-white/10 flex items-center justify-between"
                  >
                    <span className="text-[#d4af37] font-semibold">
                      R{step.round} (c={step.constant})
                    </span>
                    <span className="text-[#71717a] truncate max-w-[180px]">
                      x0: {step.x0.slice(0, 8)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
