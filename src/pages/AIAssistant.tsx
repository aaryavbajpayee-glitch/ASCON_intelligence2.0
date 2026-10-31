import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  Send,
  Sparkles,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { useCrypto } from '../context/CryptoContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const { benchmarks, history, systemMetrics, incrementAiInsights } = useCrypto();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `### 👋 Welcome! I'm Gemma 4, Your Cryptography Assistant

I explain how **ASCON (NIST SP 800-232)** and lightweight security work in **clear, simple, everyday language**.

**📊 Current Live Measurements on Your Device:**
- **Operations Logged:** \`${systemMetrics.totalHashes}\` hashes
- **Average Time:** \`${systemMetrics.avgExecutionTimeUs} µs\` (under 0.2 milliseconds)
- **Average Speed:** \`${systemMetrics.avgThroughputMBs} MB/s\`

Ask me anything in plain English! You can ask how ASCON compares to regular SHA-256, how the "sponge" design works, or which algorithm to choose for your project.`,
      timestamp: '08:10:00',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showContextDrawer, setShowContextDrawer] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestedQuestions = [
    'How does ASCON work in simple terms?',
    'Why is ASCON better than SHA-256 for smart devices?',
    'Explain how the "sponge" design works with a simple analogy',
    'What do my latest benchmark numbers mean in plain English?',
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const contextData = {
        systemMetrics,
        latestBenchmarks: benchmarks.slice(0, 5),
        recentHashes: history.slice(0, 3).map((h) => ({
          algorithm: h.algorithm,
          inputSize: h.inputSizeBytes,
          executionTimeUs: h.executionTimeUs,
          status: h.status,
        })),
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          contextData,
        }),
      });

      const data = await response.json();
      const replyContent = data.reply || 'Analysis complete.';

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      incrementAiInsights();
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `### Telemetry Analysis Alert\n\nFailed to establish connection to the Gemma 4 neural coprocessor service. Please check your network or server configuration.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto flex flex-col h-[calc(100vh-9.5rem)]">
      {/* Top Gemma 4 Branding & Context Drawer Bar */}
      <div className="glass-panel p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-white/15 bg-[#09090b]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#141417] border border-white/20 flex items-center justify-center text-[#d4af37] shadow-md">
            <Cpu size={24} className="text-[#d4af37]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif font-bold text-xl text-white">
                Gemma 4 Cryptographic Intelligence Coprocessor
              </h2>
              <span className="label-caps px-2 py-0.5 rounded bg-[#1f1b13] text-[#fef08a] border border-[#d4af37]/30 text-[10px]">
                PLAIN LANGUAGE
              </span>
            </div>
            <p className="text-xs text-[#a1a1aa] font-sans mt-0.5">
              Real-time cryptanalysis explained in clear, accessible language
            </p>
          </div>
        </div>

        {/* Context Button */}
        <button
          onClick={() => setShowContextDrawer(!showContextDrawer)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121215] hover:bg-[#1c1c20] border border-white/15 text-xs font-mono text-white transition cursor-pointer self-start sm:self-auto"
        >
          <Database size={14} className="text-[#d4af37]" />
          <span>Active Telemetry ({benchmarks.length} runs)</span>
          {showContextDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Collapsible Telemetry Context Drawer */}
      {showContextDrawer && (
        <div className="glass-panel p-5 rounded-xl border-white/15 bg-[#0c0c0e] text-xs font-mono space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-white font-semibold">GROUNDED BENCHMARK CONTEXT PAYLOAD</span>
            <span className="text-[#71717a]">Sent with each query</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
            <div className="p-3 rounded-lg bg-[#141417] border border-white/10">
              <span className="text-[#71717a] block text-[10px] uppercase">Total Operations:</span>
              <span className="text-white font-bold text-sm mt-0.5 block">{systemMetrics.totalHashes}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#141417] border border-white/10">
              <span className="text-[#71717a] block text-[10px] uppercase">Avg Latency:</span>
              <span className="text-[#d4af37] font-bold text-sm mt-0.5 block">{systemMetrics.avgExecutionTimeUs} µs</span>
            </div>
            <div className="p-3 rounded-lg bg-[#141417] border border-white/10">
              <span className="text-[#71717a] block text-[10px] uppercase">Avg Throughput:</span>
              <span className="text-[#10b981] font-bold text-sm mt-0.5 block">{systemMetrics.avgThroughputMBs} MB/s</span>
            </div>
            <div className="p-3 rounded-lg bg-[#141417] border border-white/10">
              <span className="text-[#71717a] block text-[10px] uppercase">Hardware Profile:</span>
              <span className="text-white font-bold text-sm mt-0.5 block">ARM / RISC-V</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Workspace */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border-white/15 bg-black">
        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border text-xs font-mono ${
                    isUser
                      ? 'bg-white text-black border-white'
                      : 'bg-[#18181b] border-white/20 text-[#d4af37]'
                  }`}
                >
                  {isUser ? 'YOU' : <Cpu size={17} />}
                </div>

                {/* Bubble */}
                <div
                  className={`relative rounded-xl p-5 transition ${
                    isUser
                      ? 'bg-[#18181b] text-white border border-white/20 shadow-lg'
                      : 'bg-[#0a0a0c] text-[#f4f4f5] border border-white/15 shadow-xl'
                  }`}
                >
                  {/* Top Bar for assistant */}
                  <div className="flex items-center justify-between text-xs font-mono mb-3 pb-2 border-b border-white/10">
                    <span className={isUser ? 'text-white font-bold' : 'text-[#d4af37] font-semibold'}>
                      {isUser ? 'YOU' : 'GEMMA 4 COPROCESSOR'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#71717a]">{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="text-[#71717a] hover:text-white transition cursor-pointer"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check size={14} className="text-[#10b981]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content with elegant serif format and increased font size */}
                  <div className="whitespace-pre-line font-serif space-y-2.5 text-[15px] sm:text-[16px] text-[#f4f4f5] leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-xs font-mono text-[#d4af37] bg-[#0c0c0e] p-4 rounded-xl border border-white/15 max-w-md">
              <RefreshCw size={17} className="animate-spin text-[#d4af37]" />
              <span>Gemma 4 is synthesizing a plain-language explanation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Ribbon */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#070708] overflow-x-auto">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <span className="label-caps text-[#71717a] text-[10px] flex items-center gap-1.5 font-semibold">
              <Sparkles size={13} className="text-[#d4af37]" /> QUESTIONS:
            </span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-sans rounded-lg bg-[#121215] hover:bg-[#1e1e23] text-[#d4d4d8] hover:text-white border border-white/15 hover:border-white/30 transition cursor-pointer disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-black border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Gemma 4 anything about ASCON, speed, battery, or security in plain English..."
              disabled={isLoading}
              className="flex-1 bg-[#0c0c0e] border border-white/15 focus:border-white rounded-lg px-4 py-3 text-sm font-sans text-white placeholder:text-[#52525b] outline-none transition"
            />

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-6 py-3 bg-white hover:bg-[#e4e4e7] text-black font-sans font-bold text-sm rounded-lg transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Ask Gemma</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
