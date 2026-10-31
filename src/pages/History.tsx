import React, { useState } from 'react';
import {
  Activity,
  Search,
  Trash2,
  Download,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Eye,
  X,
  Database,
  Lock,
} from 'lucide-react';
import { useCrypto, HashHistoryItem } from '../context/CryptoContext';
import { HexViewer } from '../components/HexViewer';

export const History: React.FC = () => {
  const { history, clearHistory, vaultTelemetry } = useCrypto();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [algoFilter, setAlgoFilter] = useState<'ALL' | 'ASCON-Hash256' | 'ASCON-XOF128'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HashHistoryItem | null>(null);

  const filteredHistory = history.filter((item) => {
    const matchesAlgo = algoFilter === 'ALL' || item.algorithm === algoFilter;
    const matchesSearch =
      item.inputSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.digestHex.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.timestamp.includes(searchQuery);
    return matchesAlgo && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ascon_audit_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 font-serif">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Operational History & Test Vector Audit Log
            </h2>
          </div>
          <p className="text-sm font-sans text-[#a1a1aa] mt-1">
            Complete cryptographic audit trail of all ASCON-Hash256 and ASCON-XOF128 executions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111113] border border-white/15 text-xs font-mono text-white">
            <Database size={13} className="text-[#d4af37]" />
            <span>SQLite WAL Synced</span>
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111113] hover:bg-[#1a1a1e] hover:border-white/30 border border-white/15 text-xs font-mono text-white transition cursor-pointer"
          >
            <Download size={14} />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={clearHistory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1a0f12] hover:bg-[#2c1318] hover:border-[#f43f5e] border border-[rgba(244,63,94,0.3)] text-xs font-mono text-[#fda4af] transition cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by input snippet, digest hex, or date..."
            className="w-full pl-11 pr-4 py-2.5 bg-[#09090b] border border-white/15 focus:border-white rounded-lg text-sm font-sans text-white placeholder:text-[#52525b] outline-none transition"
          />
        </div>

        {/* Algorithm Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-[#0e0e11] p-1.5 rounded-lg border border-white/15 text-xs font-mono self-start sm:self-auto">
          {(['ALL', 'ASCON-Hash256', 'ASCON-XOF128'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setAlgoFilter(filter)}
              className={`px-4 py-2 rounded-md transition cursor-pointer ${
                algoFilter === filter
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* History Records Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="label-caps text-white font-bold">AUDITED SESSIONS</span>
            <span className="text-xs font-mono text-[#10b981] flex items-center gap-1.5 bg-[#0e2318] px-2.5 py-0.5 rounded border border-[#10b981]/30">
              <Lock size={11} />
              HMAC SEALED
            </span>
          </div>
          <span className="text-xs font-mono text-[#a1a1aa]">
            Showing {filteredHistory.length} of {history.length} records
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Activity size={36} className="mx-auto text-[#71717a]/40" />
            <div className="text-sm font-serif text-[#a1a1aa]">
              No cryptographic history records match the filter query.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050505] text-[#71717a] uppercase text-[11px]">
                <tr>
                  <th className="py-4 px-5">Timestamp</th>
                  <th className="py-4 px-5">Algorithm</th>
                  <th className="py-4 px-5">Input Snippet</th>
                  <th className="py-4 px-5">Payload Size</th>
                  <th className="py-4 px-5">Digest Hex</th>
                  <th className="py-4 px-5">Latency</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#d4d4d8]">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#111114] transition">
                    <td className="py-4 px-5 text-[#71717a]">{item.timestamp}</td>
                    <td className="py-4 px-5">
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
                    <td className="py-4 px-5 text-white font-sans text-sm max-w-xs truncate">
                      {item.inputSnippet}
                    </td>
                    <td className="py-4 px-5 text-[#a1a1aa]">{item.inputSizeBytes} B</td>
                    <td className="py-4 px-5">
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
                    <td className="py-4 px-5 text-white font-semibold">{item.executionTimeUs} µs</td>
                    <td className="py-4 px-5">
                      <span className="flex items-center gap-1.5 text-[#10b981]">
                        <CheckCircle2 size={13} />
                        <span className="text-[11px] font-semibold">{item.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1.5 rounded-lg bg-[#141416] hover:bg-[#1e1e23] text-xs text-white border border-white/20 transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#09090b] border border-white/25 rounded-2xl p-7 max-w-2xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-[#10b981]" />
                <h3 className="font-serif font-bold text-xl text-white">
                  Cryptographic Operation Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[#71717a] hover:text-white transition p-1.5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#111114] border border-white/10">
                  <span className="text-[#71717a] block text-[10px] uppercase font-semibold">Algorithm:</span>
                  <span className="text-white font-bold text-base mt-0.5 block">{selectedItem.algorithm}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#111114] border border-white/10">
                  <span className="text-[#71717a] block text-[10px] uppercase font-semibold">Execution Latency:</span>
                  <span className="text-[#10b981] font-bold text-base mt-0.5 block">
                    {selectedItem.executionTimeUs} µs ({selectedItem.executionTimeMs} ms)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#71717a] block text-[10px] uppercase font-semibold mb-1.5">Input Snippet:</span>
                <div className="p-3.5 rounded-xl bg-[#111114] border border-white/10 text-white font-sans text-sm break-all leading-relaxed">
                  {selectedItem.inputSnippet}
                </div>
              </div>

              <div>
                <span className="text-[#71717a] block text-[10px] uppercase font-semibold mb-1.5">Output Squeeze Register:</span>
                <HexViewer hex={selectedItem.digestHex} bytesPerRow={8} label="DIGEST HEX STREAM" />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 bg-white hover:bg-[#e4e4e7] text-black font-sans font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
