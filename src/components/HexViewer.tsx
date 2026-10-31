import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface HexViewerProps {
  hex: string;
  bytesPerRow?: number; // default 8 or 16
  showAscii?: boolean;
  highlightIndices?: number[];
  label?: string;
  copyable?: boolean;
}

export const HexViewer: React.FC<HexViewerProps> = ({
  hex,
  bytesPerRow = 8,
  showAscii = true,
  highlightIndices = [],
  label,
  copyable = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [hoveredByte, setHoveredByte] = useState<{
    index: number;
    hex: string;
    dec: number;
    bin: string;
  } | null>(null);

  // Clean hex string
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  const bytes: string[] = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(cleanHex.substring(i, i + 2));
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rows: { offset: string; rowBytes: string[]; ascii: string }[] = [];
  for (let i = 0; i < bytes.length; i += bytesPerRow) {
    const chunk = bytes.slice(i, i + bytesPerRow);
    const offset = i.toString(16).padStart(4, '0').toUpperCase();
    const ascii = chunk
      .map((b) => {
        const code = parseInt(b, 16);
        return code >= 32 && code <= 126 ? String.fromCharCode(code) : '·';
      })
      .join('');
    rows.push({ offset, rowBytes: chunk, ascii });
  }

  return (
    <div className="font-mono text-xs rounded-xl border border-white/15 bg-black overflow-hidden shadow-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e0e11] border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span className="label-caps text-[#a1a1aa] font-semibold">{label || 'HEX STREAM REGISTER'}</span>
          <span className="text-[11px] text-[#71717a]">
            ({bytes.length} bytes / {bytes.length * 8} bits)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hoveredByte && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#00f0ff] bg-[#060913] px-2 py-0.5 rounded border border-[rgba(0,240,255,0.2)]">
              <span>IDX: 0x{hoveredByte.index.toString(16).toUpperCase()}</span>
              <span>VAL: 0x{hoveredByte.hex.toUpperCase()}</span>
              <span>DEC: {hoveredByte.dec}</span>
              <span className="text-[#8b5cf6]">BIN: {hoveredByte.bin}</span>
            </div>
          )}

          {copyable && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#00f0ff] hover:bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.25)] rounded transition cursor-pointer"
              title="Copy hex digest"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-[#00e676]" />
                  <span className="text-[#00e676]">COPIED</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>COPY HEX</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hex matrix view */}
      <div className="p-3 overflow-x-auto space-y-1 select-text">
        {rows.length === 0 ? (
          <div className="text-[#4b5563] italic py-2 text-center">No stream data available</div>
        ) : (
          rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-4 hover:bg-[#151f38]/40 px-1 py-0.5 rounded">
              {/* Row offset */}
              <span className="text-[#849495] select-none w-12 font-semibold">
                {row.offset}
              </span>

              {/* Bytes chunk */}
              <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                {row.rowBytes.map((byteStr, cIdx) => {
                  const globalIdx = rIdx * bytesPerRow + cIdx;
                  const isHighlighted = highlightIndices.includes(globalIdx);
                  return (
                    <span
                      key={cIdx}
                      onMouseEnter={() => {
                        const dec = parseInt(byteStr, 16);
                        setHoveredByte({
                          index: globalIdx,
                          hex: byteStr,
                          dec,
                          bin: dec.toString(2).padStart(8, '0'),
                        });
                      }}
                      onMouseLeave={() => setHoveredByte(null)}
                      className={`px-1 py-0.5 rounded transition cursor-crosshair font-medium ${
                        isHighlighted
                          ? 'bg-[#00f0ff]/30 text-[#00f0ff] font-bold border border-[#00f0ff]'
                          : 'text-[#e0e2f1] hover:bg-[#00f0ff]/20 hover:text-[#00f0ff]'
                      }`}
                    >
                      {byteStr}
                    </span>
                  );
                })}
              </div>

              {/* ASCII representation */}
              {showAscii && (
                <span className="text-[#849495] border-l border-[rgba(255,255,255,0.08)] pl-3 tracking-widest select-none">
                  {row.ascii}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
