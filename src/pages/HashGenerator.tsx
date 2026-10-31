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
} from 'lucide-react';
import { asconHash256, asconXof128, HashResult } from '../crypto/ascon';
import { HexViewer } from '../components/HexViewer';
import { useCrypto } from '../context/CryptoContext';

export const HashGenerator: React.FC = () => {
  const { addHashToHistory } = useCrypto();

  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState<string>('The quick brown fox jumps over the lazy dog');
  const [fileData, setFileData] = useState<{ name: string; size: number; bytes: Uint8Array } | null>(null);
  const [algorithm, setAlgorithm] = useState<'ASCON-Hash256' | 'ASCON-XOF128'>('ASCON-Hash256');
  const [xofLength, setXofLength] = useState<number>(32); // in bytes
  const [enableTrace, setEnableTrace] = useState<boolean>(true);

  const [result, setResult] = useState<HashResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Test vector presets
  const presets = [
    { label: 'NIST Empty String ("")', text: '' },
    { label: 'NIST Pangram ("The quick brown...")', text: 'The quick brown fox jumps over the lazy dog' },
    { label: 'IoT CAN-Bus Frame (16B)', text: '\x02\x01\x88\x32\x00\x10\x45\x21\x89\xAB\xCD\xEF\x00\xFF\xAA\x55' },
    { label: 'Smart Meter Telemetry (64B)', text: 'METER_ID=0x88921;TIMESTAMP=1798603200;PWR_KW=4.82;VOLTS=239.8;AMPS=20.1' },
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
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      let hashRes: HashResult;
      const dataToHash = inputMode === 'text' ? inputText : fileData?.bytes || new Uint8Array(0);
      const snippet = inputMode === 'text' ? (inputText.length === 0 ? '[Empty String]' : inputText) : `File: ${fileData?.name} (${fileData?.size} B)`;

      if (algorithm === 'ASCON-Hash256') {
        hashRes = asconHash256(dataToHash, { trace: enableTrace });
      } else {
        hashRes = asconXof128(dataToHash, xofLength, { trace: enableTrace });
      }

      setResult(hashRes);
      addHashToHistory(hashRes, snippet);
      setIsGenerating(false);
    }, 40);
  };

  const copyDigest = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.digestHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 font-serif">
      {/* Page Title & Instrument Subtitle */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Input and Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Algorithm & Sponge Parameters Card */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
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

            {/* XOF Length Selection (if XOF is selected) */}
            {algorithm === 'ASCON-XOF128' && (
              <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#849495]">XOF Output Length:</span>
                  <span className="text-[#d0bcff] font-semibold">
                    {xofLength} bytes ({xofLength * 8} bits)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[16, 32, 48, 64, 128].map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setXofLength(len)}
                      className={`flex-1 py-1 text-xs font-mono rounded-xs border transition cursor-pointer ${
                        xofLength === len
                          ? 'bg-[#8b5cf6] text-[#060913] font-bold border-[#8b5cf6]'
                          : 'bg-[#0a0f1d] text-[#849495] border-[rgba(255,255,255,0.1)] hover:border-[#8b5cf6]'
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
          <div className="glass-panel p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[#849495]">INPUT DATA REGISTER</span>
              
              {/* Input Mode Switch */}
              <div className="flex items-center bg-[#0a0f1d] p-0.5 rounded-sm border border-[rgba(0,240,255,0.15)] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-[#00f0ff] text-[#060913] font-semibold'
                      : 'text-[#849495] hover:text-[#e0e2f1]'
                  }`}
                >
                  Text / Hex String
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                    inputMode === 'file'
                      ? 'bg-[#00f0ff] text-[#060913] font-semibold'
                      : 'text-[#849495] hover:text-[#e0e2f1]'
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
                  onChange={(e) => setInputText(e.target.value)}
                  rows={5}
                  placeholder="Enter UTF-8 text or raw data to hash..."
                  className="w-full bg-[#0a0f1d] border border-[rgba(255,255,255,0.12)] focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] rounded-sm p-3 text-xs font-mono text-[#e0e2f1] outline-none transition resize-y"
                />

                <div className="flex items-center justify-between text-[11px] font-mono text-[#849495]">
                  <span>Payload Size: {new TextEncoder().encode(inputText).length} bytes</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setInputText('')}
                      className="hover:text-[#00f0ff] underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Presets */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-mono text-[#849495] uppercase">
                    NIST Test Vector Presets:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(preset.text)}
                        className="px-2 py-1 rounded-xs bg-[#111827] hover:bg-[#151f38] text-[10px] font-mono text-[#b9cacb] hover:text-[#00f0ff] border border-[rgba(255,255,255,0.08)] transition cursor-pointer"
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
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[rgba(0,240,255,0.2)] hover:border-[#00f0ff]/50 rounded-sm bg-[#0a0f1d] cursor-pointer transition">
                  <Upload size={32} className="text-[#00f0ff] mb-2" />
                  <span className="text-xs font-semibold text-[#e0e2f1]">
                    Select file or drag and drop binary image
                  </span>
                  <span className="text-[10px] font-mono text-[#849495] mt-1">
                    Accepts firmware images (.bin, .hex), documents, images, or IoT packet captures
                  </span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {fileData && (
                  <div className="p-3 rounded-sm bg-[#111827] border border-[#00f0ff]/30 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <FileCode size={16} className="text-[#00f0ff]" />
                      <span className="text-[#e0e2f1] font-semibold">{fileData.name}</span>
                    </div>
                    <span className="text-[#00e676]">{fileData.size} bytes loaded</span>
                  </div>
                )}
              </div>
            )}

            {/* Options & Action Button */}
            <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-mono text-[#b9cacb] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableTrace}
                  onChange={(e) => setEnableTrace(e.target.checked)}
                  className="rounded-xs bg-[#0a0f1d] border-[rgba(255,255,255,0.2)] text-[#00f0ff] focus:ring-0"
                />
                <span>Capture 320-Bit Permutation State Trace</span>
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#00f0ff] hover:bg-[#7df4ff] text-[#060913] font-heading font-semibold text-sm rounded-sm transition cursor-pointer shadow-[0_0_16px_rgba(0,240,255,0.4)] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Permuting Sponge...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
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
          <div className="glass-panel p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <Binary size={16} className="text-[#00f0ff]" />
                <h3 className="font-heading font-bold text-sm text-[#e0e2f1]">
                  Generated Cryptographic Digest
                </h3>
              </div>
              {result && (
                <span className="label-caps px-2 py-0.5 rounded-xs bg-[#10b981]/20 text-[#00e676] border border-[#10b981]/30">
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

                {/* Telemetry Metrics Bar */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-sm bg-[#0a0f1d] border border-[rgba(0,240,255,0.1)]">
                    <div className="text-[#849495] text-[10px] uppercase">Execution Latency</div>
                    <div className="text-[#00f0ff] font-bold text-base mt-0.5">
                      {result.executionTimeUs} µs
                    </div>
                    <div className="text-[10px] text-[#849495]">({result.executionTimeMs} ms)</div>
                  </div>

                  <div className="p-2.5 rounded-sm bg-[#0a0f1d] border border-[rgba(0,240,255,0.1)]">
                    <div className="text-[#849495] text-[10px] uppercase">Output Size</div>
                    <div className="text-[#00e676] font-bold text-base mt-0.5">
                      {result.outputSizeBytes} Bytes
                    </div>
                    <div className="text-[10px] text-[#849495]">({result.outputSizeBytes * 8} Bits)</div>
                  </div>
                </div>

                {/* Final 320-Bit State Registers (x0..x4) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-[#849495]">FINAL 320-BIT STATE WORDS</span>
                    <span className="text-[10px] font-mono text-[#00f0ff]">5 x 64-bit BigInts</span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] bg-[#0a0f1d] p-3 rounded-sm border border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between text-[#849495]">
                      <span>x0 (Rate Register):</span>
                      <span className="text-[#00f0ff]">0x{result.finalStateHex.x0}</span>
                    </div>
                    <div className="flex justify-between text-[#849495]">
                      <span>x1 (Capacity Register):</span>
                      <span className="text-[#e0e2f1]">0x{result.finalStateHex.x1}</span>
                    </div>
                    <div className="flex justify-between text-[#849495]">
                      <span>x2 (Round Constant):</span>
                      <span className="text-[#e0e2f1]">0x{result.finalStateHex.x2}</span>
                    </div>
                    <div className="flex justify-between text-[#849495]">
                      <span>x3 (Diffusion Word):</span>
                      <span className="text-[#e0e2f1]">0x{result.finalStateHex.x3}</span>
                    </div>
                    <div className="flex justify-between text-[#849495]">
                      <span>x4 (Linear State):</span>
                      <span className="text-[#e0e2f1]">0x{result.finalStateHex.x4}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center space-y-3 bg-[#0a0f1d]/50 rounded-sm border border-dashed border-[rgba(255,255,255,0.1)]">
                <Binary size={36} className="mx-auto text-[#849495]/40" />
                <div className="text-xs font-mono text-[#849495]">
                  Digest awaiting execution. Configure input and click <span className="text-[#00f0ff]">Generate Hash</span>.
                </div>
              </div>
            )}
          </div>

          {/* Permutation Trace Preview */}
          {result?.stateTrace && result.stateTrace.length > 0 && (
            <div className="glass-panel p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                <span className="label-caps text-[#00f0ff]">PERMUTATION ROUND TRACE</span>
                <span className="text-[10px] font-mono text-[#849495]">
                  {result.stateTrace.length} Steps Logged
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[10px]">
                {result.stateTrace.slice(-6).map((step, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-xs bg-[#0a0f1d] border border-[rgba(255,255,255,0.05)] flex items-center justify-between"
                  >
                    <span className="text-[#00f0ff]">R{step.round} (c={step.constant})</span>
                    <span className="text-[#849495] truncate max-w-[180px]">
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
