import React, { useState } from 'react';
import { Menu, ShieldCheck, Activity, Cpu, Database, CheckCircle2, AlertTriangle, RefreshCw, X, Download } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useCrypto } from '../context/CryptoContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { vaultTelemetry, runVaultAudit, exportVault } = useCrypto();
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const getPageInfo = (path: string) => {
    switch (path) {
      case '/dashboard':
        return { title: 'Dashboard', sub: 'System Telemetry & Real-Time Performance Matrix' };
      case '/hash-generator':
        return { title: 'Hash Generator', sub: 'ASCON-Hash256 & ASCON-XOF128 Permutation Engine' };
      case '/benchmark':
        return { title: 'Performance Benchmark', sub: 'Throughput & Micro-benchmarking Suite' };
      case '/comparison':
        return { title: 'Algorithm Comparison', sub: 'ASCON-Hash256 vs ASCON-XOF128 vs SHA-256' };
      case '/ai-assistant':
        return { title: 'Gemma AI Assistant', sub: 'Gemma 4 Plain-Language Cryptographic Reasoning' };
      case '/reports':
        return { title: 'Audit Reports', sub: 'Formal NIST SP 800-232 Cryptographic Certification' };
      case '/history':
        return { title: 'History & Vectors', sub: 'Operational Digest & Benchmark Audit Log' };
      default:
        return { title: 'ASCON Intelligence', sub: 'Executive Cryptography Workbench' };
    }
  };

  const pageInfo = getPageInfo(location.pathname);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    const result = await runVaultAudit();
    setAuditResult(result);
    setIsAuditing(false);
  };

  const handleExportVault = async () => {
    const data = await exportVault();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascon_hardened_vault_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-20 bg-black/95 backdrop-blur-xl border-b border-white/10 px-6 lg:px-10 flex items-center justify-between shadow-2xl">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2.5 rounded bg-[#121214] text-[#a1a1aa] hover:text-white hover:bg-[#1c1c1f] transition border border-white/15"
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif font-bold text-2xl text-white tracking-tight">
                {pageInfo.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 label-caps px-2.5 py-1 rounded bg-[#18181b] text-[#e4e4e7] border border-white/15">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                ROUTE: {location.pathname}
              </span>
            </div>
            <p className="hidden md:block text-xs text-[#a1a1aa] font-sans mt-0.5">
              {pageInfo.sub}
            </p>
          </div>
        </div>

        {/* Right: Telemetry chips and quick link */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Hardened Vault Database Chip */}
          <button
            onClick={() => {
              setShowVaultModal(true);
              handleRunAudit();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded bg-[#111113] hover:bg-[#1a1a1e] border border-white/15 hover:border-white/30 text-xs font-mono transition group cursor-pointer shadow-sm"
            title="Click to view Hardened SQLite Vault status & run integrity audit"
          >
            <Database size={15} className="text-[#d4af37]" />
            <span className="hidden md:inline text-[#a1a1aa]">VAULT:</span>
            <span className="text-[#10b981] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block animate-ping" />
              SQLITE WAL
            </span>
          </button>

          {/* NIST Verified Chip */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded bg-[#111113] border border-white/15 text-xs font-mono text-[#f4f4f5]">
            <ShieldCheck size={16} className="text-[#10b981]" />
            <span className="font-semibold tracking-wide">NIST SP 800-232</span>
          </div>

          {/* AI coprocessor link */}
          <Link
            to="/ai-assistant"
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#18181b] hover:bg-[#27272a] border border-white/20 hover:border-white/40 text-xs font-sans font-semibold text-white transition shadow-sm"
          >
            <Cpu size={15} className="text-[#d4af37]" />
            <span className="hidden sm:inline">Gemma 4 Coprocessor</span>
            <span className="sm:hidden">Gemma 4</span>
          </Link>
        </div>
      </header>

      {/* Hardened Vault Modal */}
      {showVaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#09090b] border border-white/20 rounded-xl shadow-2xl p-7 text-[#f4f4f5] space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-[#18181b] border border-white/15 rounded-lg text-[#d4af37]">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-white">
                    Hardened SQLite Cryptographic Vault
                  </h3>
                  <p className="text-xs text-[#a1a1aa] font-sans mt-0.5">
                    Embedded storage with HMAC-SHA256 record sealing & WAL crash protection
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVaultModal(false)}
                className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#18181b] rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Vault Architecture Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-[#121215] border border-white/10 rounded-lg">
                <span className="text-[#71717a] text-[10px] uppercase block font-semibold">Storage Engine</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">node:sqlite</span>
              </div>
              <div className="p-3.5 bg-[#121215] border border-white/10 rounded-lg">
                <span className="text-[#71717a] text-[10px] uppercase block font-semibold">Journal Mode</span>
                <span className="text-[#10b981] font-semibold text-sm mt-0.5 block">WAL Mode</span>
              </div>
              <div className="p-3.5 bg-[#121215] border border-white/10 rounded-lg">
                <span className="text-[#71717a] text-[10px] uppercase block font-semibold">Tamper Defense</span>
                <span className="text-[#d4af37] font-semibold text-sm mt-0.5 block">HMAC-SHA256</span>
              </div>
            </div>

            {/* Audit Status Panel */}
            <div className="p-5 rounded-lg bg-[#111113] border border-white/15 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {auditResult?.healthy !== false ? (
                    <CheckCircle2 size={20} className="text-[#10b981]" />
                  ) : (
                    <AlertTriangle size={20} className="text-[#f43f5e]" />
                  )}
                  <span className="font-serif font-bold text-base text-white">
                    {auditResult?.healthy !== false ? 'Cryptographic Integrity Verified' : 'Integrity Anomaly Detected'}
                  </span>
                </div>
                <button
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#1f1f23] hover:bg-[#2c2c31] border border-white/15 rounded text-xs font-mono text-white transition cursor-pointer"
                >
                  <RefreshCw size={13} className={isAuditing ? 'animate-spin text-[#d4af37]' : 'text-[#a1a1aa]'} />
                  <span>{isAuditing ? 'Auditing...' : 'Re-verify'}</span>
                </button>
              </div>

              <div className="text-xs font-mono text-[#a1a1aa] space-y-1.5">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Total Records Checked:</span>
                  <span className="text-white font-semibold">{auditResult?.totalRecordsChecked ?? vaultTelemetry.totalRecords}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Tampered / Altered Records:</span>
                  <span className="text-[#10b981] font-semibold">{auditResult?.tamperedRecords ?? 0}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Vault File Size:</span>
                  <span className="text-white font-semibold">{Math.round((auditResult?.fileSizeBytes || 4096) / 1024)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Audit Timestamp:</span>
                  <span className="text-[#e4e4e7]">{auditResult?.lastAuditTimestamp ? new Date(auditResult.lastAuditTimestamp).toLocaleTimeString() : 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleExportVault}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#121215] hover:bg-[#1c1c20] text-white border border-white/20 rounded-lg text-xs font-mono transition cursor-pointer"
              >
                <Download size={14} />
                <span>Export JSON Vault</span>
              </button>
              <button
                onClick={() => setShowVaultModal(false)}
                className="px-5 py-2.5 bg-white hover:bg-[#e4e4e7] text-black font-sans font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
