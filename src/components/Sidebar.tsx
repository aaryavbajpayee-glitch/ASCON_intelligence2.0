import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Binary,
  FileSpreadsheet,
  Gauge,
  GitCompare,
  Cpu,
  FileText,
  History as HistoryIcon,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  Database,
  Lock,
} from 'lucide-react';
import { useCrypto } from '../context/CryptoContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { vaultTelemetry } = useCrypto();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'MAIN',
      description: 'System overview & telemetry',
    },
    {
      to: '/hash-generator',
      label: 'Hash Generator',
      icon: Binary,
      badge: 'NIST',
      description: 'ASCON-Hash256 / XOF128',
    },
    {
      to: '/csv-analyzer',
      label: 'CSV Data Analyzer',
      icon: FileSpreadsheet,
      badge: 'NEW',
      description: 'Bulk CSV hashing & verification',
    },
    {
      to: '/benchmark',
      label: 'Performance Benchmark',
      icon: Gauge,
      badge: 'LIVE',
      description: 'Throughput & cycle testing',
    },
    {
      to: '/comparison',
      label: 'Algorithm Comparison',
      icon: GitCompare,
      badge: 'EVAL',
      description: 'Hash256 vs XOF128 vs SHA-256',
    },
    {
      to: '/ai-assistant',
      label: 'Gemma AI Assistant',
      icon: Cpu,
      badge: 'GEMMA 4',
      badgeColor: 'gold',
      description: 'Plain-language coprocessor',
    },
    {
      to: '/reports',
      label: 'Audit Reports',
      icon: FileText,
      badge: 'DOCS',
      description: 'Formal certification & audits',
    },
    {
      to: '/history',
      label: 'History & Vectors',
      icon: HistoryIcon || Activity,
      badge: 'LOGS',
      description: 'Operations & test vectors',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-black border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section (Click to navigate Home / Dashboard) */}
        <Link
          to="/dashboard"
          onClick={onClose}
          className="block p-6 border-b border-white/10 bg-[#050505] hover:bg-[#0d0d10] transition-colors cursor-pointer group focus:outline-none focus:ring-1 focus:ring-white/20 select-none"
          title="Return to Home Dashboard"
          aria-label="ASCON Intelligence Home Dashboard"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#121214] border border-white/20 flex items-center justify-center text-white shadow-md group-hover:border-[#d4af37]/60 group-hover:bg-[#18181b] group-hover:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all">
              <ShieldCheck size={24} className="text-[#d4af37] group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-lg tracking-tight text-white group-hover:text-white transition-colors">
                  ASCON
                </span>
                <span className="text-[#d4af37] font-serif font-bold text-lg tracking-tight">
                  INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] font-sans tracking-tight group-hover:text-[#d4d4d8] transition-colors">
                NIST SP 800-232 Cryptosuite
              </p>
            </div>
          </div>

          {/* Engine Status Tag */}
          <div className="mt-4 flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#0e0e11] border border-white/10 text-xs font-mono group-hover:border-white/25 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              <span className="text-[#a1a1aa]">STANDARD:</span>
            </div>
            <span className="text-white font-semibold">NIST SP 800-232</span>
          </div>
        </Link>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="px-3 pb-2 text-xs font-mono font-semibold tracking-wider text-[#71717a] uppercase">
            Workstations & Routing
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isGold = item.badgeColor === 'gold';

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-3 rounded-lg transition-all duration-150 border ${
                    isActive
                      ? isGold
                        ? 'bg-[#18181b] border-[#d4af37]/60 text-white shadow-[0_0_16px_rgba(212,175,55,0.15)]'
                        : 'bg-[#18181b] border-white/30 text-white shadow-[0_0_16px_rgba(255,255,255,0.08)]'
                      : 'border-transparent text-[#a1a1aa] hover:text-white hover:bg-[#111113] hover:border-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3.5">
                      <Icon
                        size={19}
                        className={`transition-colors ${
                          isActive
                            ? isGold
                              ? 'text-[#d4af37]'
                              : 'text-white'
                            : 'text-[#71717a] group-hover:text-white'
                        }`}
                      />
                      <div className="text-left">
                        <div
                          className={`text-sm font-sans ${
                            isActive ? 'text-white font-bold' : 'text-[#d4d4d8] font-medium'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-xs text-[#71717a] font-sans leading-none mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`label-caps px-2 py-0.5 rounded text-[10px] border ${
                        isGold
                          ? 'bg-[#2a2415] text-[#fef08a] border-[#d4af37]/40'
                          : 'bg-[#1c1c20] text-[#e4e4e7] border-white/15'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Hardened Database Vault Status Section */}
        <div className="p-3.5 mx-4 mb-3 rounded-lg bg-[#0c0c0e] border border-white/10 text-xs font-mono">
          <div className="flex items-center justify-between text-[#71717a] text-[10px] uppercase font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Database size={12} className="text-[#d4af37]" />
              HARDENED VAULT
            </span>
            <span className="flex items-center gap-1 text-[#10b981] font-semibold">
              <Lock size={11} />
              SEALED
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#d4d4d8]">
            <span className="text-[#a1a1aa]">Engine:</span>
            <span className="text-white font-semibold">node:sqlite</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#d4d4d8] mt-1">
            <span className="text-[#a1a1aa]">Mode:</span>
            <span className="text-[#10b981] font-semibold">WAL Crash-Proof</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#d4d4d8] mt-1">
            <span className="text-[#a1a1aa]">Records:</span>
            <span className="text-[#d4af37] font-bold">{vaultTelemetry.totalRecords} Sealed</span>
          </div>
        </div>

        {/* Footer Hardware & AI Spec */}
        <div className="p-4 border-t border-white/10 bg-[#050505]">
          <div className="flex items-center justify-between text-xs font-mono text-[#71717a] mb-2.5">
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-[#d4af37]" />
              TARGET ARCH
            </span>
            <span className="text-white font-medium">ARM / RISC-V</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0e0e11] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse"></span>
              <div>
                <div className="text-xs font-sans font-bold text-white">Gemma 4 Coprocessor</div>
                <div className="text-xs font-sans text-[#a1a1aa]">Plain-Language AI</div>
              </div>
            </div>
            <Terminal size={15} className="text-[#d4af37]" />
          </div>
        </div>
      </aside>
    </>
  );
};
