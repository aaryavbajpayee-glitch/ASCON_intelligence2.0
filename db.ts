import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

// Cryptographic salt for record tamper-proofing
const VAULT_SECRET = process.env.DATABASE_INTEGRITY_KEY || 'ascon-nist-sp-800-232-tamper-guard-2026';

export interface DbHashItem {
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

export interface DbBenchmarkItem {
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

export interface DbReportItem {
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

export interface VaultAuditResult {
  status: 'OPTIMAL' | 'COMPROMISED' | 'ERROR';
  healthy: boolean;
  tamperedRecords: number;
  totalRecordsChecked: number;
  walJournalMode: string;
  fileSizeBytes: number;
  tamperedIds: string[];
  lastAuditTimestamp: string;
  sqlitePragmas: {
    journalMode: string;
    synchronous: number;
    foreignKeys: number;
  };
}

class HardenedVaultDatabase {
  private db: DatabaseSync;
  private dbPath: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.resolve(dataDir, 'ascon_vault.db');
    this.db = new DatabaseSync(this.dbPath);

    this.hardenPragmas();
    this.initializeTables();
    this.seedDefaultsIfEmpty();
  }

  /**
   * Apply defense-in-depth SQLite PRAGMAs:
   * - WAL mode: Atomic concurrency and crash-safe transactions
   * - synchronous = NORMAL: Prevents corruption without I/O stutter
   * - foreign_keys = ON: Enforces referential integrity
   * - busy_timeout = 5000: Mitigates lock contention under load
   */
  private hardenPragmas(): void {
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA busy_timeout = 5000;');
    this.db.exec('PRAGMA temp_store = MEMORY;');
  }

  /**
   * Initializes relational schema with primary keys, constraints, and index optimizations
   */
  private initializeTables(): void {
    // 1. Hash Operations Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hash_operations (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        input_snippet TEXT NOT NULL,
        input_size_bytes INTEGER NOT NULL,
        digest_hex TEXT NOT NULL,
        output_size_bytes INTEGER NOT NULL,
        execution_time_us REAL NOT NULL,
        execution_time_ms REAL NOT NULL,
        status TEXT NOT NULL,
        integrity_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // 2. Benchmarks Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS benchmarks (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        input_size_bytes INTEGER NOT NULL,
        iterations INTEGER NOT NULL,
        avg_time_us REAL NOT NULL,
        min_time_us REAL NOT NULL,
        max_time_us REAL NOT NULL,
        throughput_mbs REAL NOT NULL,
        cycles_per_byte REAL NOT NULL,
        integrity_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // 3. Reports Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        algorithm_suite TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        avg_throughput REAL NOT NULL,
        avg_latency_us REAL NOT NULL,
        security_margin TEXT NOT NULL,
        integrity_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // 4. Immutable Security Audit Log
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS security_audit_log (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        details TEXT,
        checksum TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);

    // Create performance search indices
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_hash_timestamp ON hash_operations(created_at DESC);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_bench_algo ON benchmarks(algorithm);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_time ON security_audit_log(timestamp DESC);`);
  }

  /**
   * Computes an HMAC cryptographic checksum for canonical data fields
   */
  private computeChecksum(payload: string): string {
    return crypto.createHmac('sha256', VAULT_SECRET).update(payload).digest('hex');
  }

  private logAudit(action: string, tableName: string, recordId: string, details: string = ''): void {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = new Date().toISOString();
    const checksum = this.computeChecksum(`${action}|${tableName}|${recordId}|${timestamp}`);

    const stmt = this.db.prepare(`
      INSERT INTO security_audit_log (id, action, table_name, record_id, details, checksum, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, action, tableName, recordId, details, checksum, timestamp);
  }

  /**
   * Seed NIST verified vectors if fresh database
   */
  private seedDefaultsIfEmpty(): void {
    const hashCount = (this.db.prepare('SELECT COUNT(*) as count FROM hash_operations').get() as any)?.count || 0;
    if (hashCount === 0) {
      this.insertHash({
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
      });

      this.insertHash({
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
      });

      this.insertHash({
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
      });
    }

    const benchCount = (this.db.prepare('SELECT COUNT(*) as count FROM benchmarks').get() as any)?.count || 0;
    if (benchCount === 0) {
      this.insertBenchmark({
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
      });

      this.insertBenchmark({
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
      });

      this.insertBenchmark({
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
      });
    }
  }

  // --- HASH OPERATIONS ---
  public insertHash(item: DbHashItem): void {
    const canonical = `${item.id}|${item.algorithm}|${item.digestHex}|${item.inputSizeBytes}|${item.executionTimeUs}`;
    const integrityHash = this.computeChecksum(canonical);
    const createdAt = Date.now();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO hash_operations (
        id, timestamp, algorithm, input_snippet, input_size_bytes,
        digest_hex, output_size_bytes, execution_time_us, execution_time_ms,
        status, integrity_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      item.id,
      item.timestamp,
      item.algorithm,
      item.inputSnippet,
      item.inputSizeBytes,
      item.digestHex,
      item.outputSizeBytes,
      item.executionTimeUs,
      item.executionTimeMs,
      item.status,
      integrityHash,
      createdAt
    );

    this.logAudit('INSERT_HASH', 'hash_operations', item.id, item.algorithm);
  }

  public getHashes(limit = 100): DbHashItem[] {
    const stmt = this.db.prepare(`
      SELECT id, timestamp, algorithm, input_snippet, input_size_bytes,
             digest_hex, output_size_bytes, execution_time_us, execution_time_ms, status
      FROM hash_operations
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      algorithm: r.algorithm,
      inputSnippet: r.input_snippet,
      inputSizeBytes: r.input_size_bytes,
      digestHex: r.digest_hex,
      outputSizeBytes: r.output_size_bytes,
      executionTimeUs: r.execution_time_us,
      executionTimeMs: r.execution_time_ms,
      status: r.status,
    }));
  }

  public clearHashes(): void {
    this.db.exec(`DELETE FROM hash_operations;`);
    this.logAudit('PURGE', 'hash_operations', 'ALL');
  }

  // --- BENCHMARKS ---
  public insertBenchmark(item: DbBenchmarkItem): void {
    const canonical = `${item.id}|${item.algorithm}|${item.inputSizeBytes}|${item.iterations}|${item.throughputMBs}`;
    const integrityHash = this.computeChecksum(canonical);
    const createdAt = Date.now();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO benchmarks (
        id, timestamp, algorithm, input_size_bytes, iterations,
        avg_time_us, min_time_us, max_time_us, throughput_mbs,
        cycles_per_byte, integrity_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      item.id,
      item.timestamp,
      item.algorithm,
      item.inputSizeBytes,
      item.iterations,
      item.avgTimeUs,
      item.minTimeUs,
      item.maxTimeUs,
      item.throughputMBs,
      item.cyclesPerByte,
      integrityHash,
      createdAt
    );

    this.logAudit('INSERT_BENCHMARK', 'benchmarks', item.id, `${item.algorithm} @ ${item.throughputMBs} MB/s`);
  }

  public getBenchmarks(limit = 100): DbBenchmarkItem[] {
    const stmt = this.db.prepare(`
      SELECT id, timestamp, algorithm, input_size_bytes, iterations,
             avg_time_us, min_time_us, max_time_us, throughput_mbs, cycles_per_byte
      FROM benchmarks
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      algorithm: r.algorithm,
      inputSizeBytes: r.input_size_bytes,
      iterations: r.iterations,
      avgTimeUs: r.avg_time_us,
      minTimeUs: r.min_time_us,
      maxTimeUs: r.max_time_us,
      throughputMBs: r.throughput_mbs,
      cyclesPerByte: r.cycles_per_byte,
    }));
  }

  // --- REPORTS ---
  public insertReport(item: DbReportItem): void {
    const canonical = `${item.id}|${item.title}|${item.date}|${item.algorithmSuite}|${item.metrics.avgThroughput}`;
    const integrityHash = this.computeChecksum(canonical);
    const createdAt = Date.now();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO reports (
        id, title, date, algorithm_suite, summary, content,
        avg_throughput, avg_latency_us, security_margin, integrity_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      item.id,
      item.title,
      item.date,
      item.algorithmSuite,
      item.summary,
      item.content,
      item.metrics.avgThroughput,
      item.metrics.avgLatencyUs,
      item.metrics.securityMargin,
      integrityHash,
      createdAt
    );

    this.logAudit('INSERT_REPORT', 'reports', item.id, item.title);
  }

  public getReports(limit = 50): DbReportItem[] {
    const stmt = this.db.prepare(`
      SELECT id, title, date, algorithm_suite, summary, content,
             avg_throughput, avg_latency_us, security_margin
      FROM reports
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.date,
      algorithmSuite: r.algorithm_suite,
      summary: r.summary,
      content: r.content,
      metrics: {
        avgThroughput: r.avg_throughput,
        avgLatencyUs: r.avg_latency_us,
        securityMargin: r.security_margin,
      },
    }));
  }

  public deleteReport(id: string): void {
    const stmt = this.db.prepare(`DELETE FROM reports WHERE id = ?`);
    stmt.run(id);
    this.logAudit('DELETE_REPORT', 'reports', id);
  }

  // --- HARDENED INTEGRITY AUDIT ---
  public auditDatabaseIntegrity(): VaultAuditResult {
    const tamperedIds: string[] = [];
    let totalRecordsChecked = 0;

    // 1. Audit hash operations
    const hashRows = this.db.prepare(`
      SELECT id, algorithm, digest_hex, input_size_bytes, execution_time_us, integrity_hash
      FROM hash_operations
    `).all() as any[];

    for (const row of hashRows) {
      totalRecordsChecked++;
      const canonical = `${row.id}|${row.algorithm}|${row.digest_hex}|${row.input_size_bytes}|${row.execution_time_us}`;
      const expected = this.computeChecksum(canonical);
      if (row.integrity_hash !== expected) {
        tamperedIds.push(`hash_operations:${row.id}`);
      }
    }

    // 2. Audit benchmarks
    const benchRows = this.db.prepare(`
      SELECT id, algorithm, input_size_bytes, iterations, throughput_mbs, integrity_hash
      FROM benchmarks
    `).all() as any[];

    for (const row of benchRows) {
      totalRecordsChecked++;
      const canonical = `${row.id}|${row.algorithm}|${row.input_size_bytes}|${row.iterations}|${row.throughput_mbs}`;
      const expected = this.computeChecksum(canonical);
      if (row.integrity_hash !== expected) {
        tamperedIds.push(`benchmarks:${row.id}`);
      }
    }

    // 3. Audit reports
    const reportRows = this.db.prepare(`
      SELECT id, title, date, algorithm_suite, avg_throughput, integrity_hash
      FROM reports
    `).all() as any[];

    for (const row of reportRows) {
      totalRecordsChecked++;
      const canonical = `${row.id}|${row.title}|${row.date}|${row.algorithm_suite}|${row.avg_throughput}`;
      const expected = this.computeChecksum(canonical);
      if (row.integrity_hash !== expected) {
        tamperedIds.push(`reports:${row.id}`);
      }
    }

    // Check PRAGMA statuses
    const journalMode = (this.db.prepare('PRAGMA journal_mode').get() as any)?.journal_mode || 'unknown';
    const synchronous = (this.db.prepare('PRAGMA synchronous').get() as any)?.synchronous || 0;
    const foreignKeys = (this.db.prepare('PRAGMA foreign_keys').get() as any)?.foreign_keys || 0;

    let fileSizeBytes = 0;
    try {
      fileSizeBytes = fs.statSync(this.dbPath).size;
    } catch {
      fileSizeBytes = 0;
    }

    const healthy = tamperedIds.length === 0;

    return {
      status: healthy ? 'OPTIMAL' : 'COMPROMISED',
      healthy,
      tamperedRecords: tamperedIds.length,
      totalRecordsChecked,
      walJournalMode: journalMode,
      fileSizeBytes,
      tamperedIds,
      lastAuditTimestamp: new Date().toISOString(),
      sqlitePragmas: {
        journalMode,
        synchronous,
        foreignKeys,
      },
    };
  }

  public getDatabaseStats(): any {
    const hashCount = (this.db.prepare('SELECT COUNT(*) as c FROM hash_operations').get() as any)?.c || 0;
    const benchCount = (this.db.prepare('SELECT COUNT(*) as c FROM benchmarks').get() as any)?.c || 0;
    const reportCount = (this.db.prepare('SELECT COUNT(*) as c FROM reports').get() as any)?.c || 0;
    const auditCount = (this.db.prepare('SELECT COUNT(*) as c FROM security_audit_log').get() as any)?.c || 0;

    let fileSizeBytes = 0;
    try {
      fileSizeBytes = fs.statSync(this.dbPath).size;
    } catch {
      fileSizeBytes = 0;
    }

    return {
      engine: 'SQLite3 Embedded (node:sqlite)',
      vaultPath: this.dbPath,
      fileSizeBytes,
      journalMode: 'WAL (Write-Ahead Logging)',
      tamperProtection: 'HMAC-SHA256 Cryptographic Record Sealing',
      recordCounts: {
        hashOperations: hashCount,
        benchmarks: benchCount,
        reports: reportCount,
        auditLogs: auditCount,
        total: hashCount + benchCount + reportCount + auditCount,
      },
    };
  }

  /**
   * Performs an explicit WAL checkpoint to flush WAL logs to the primary database file
   */
  public checkpoint(): { success: boolean; mode: string; error?: string } {
    try {
      this.db.exec('PRAGMA wal_checkpoint(PASSIVE);');
      return { success: true, mode: 'PASSIVE' };
    } catch (err: any) {
      console.warn('SQLite WAL checkpoint warning:', err?.message || err);
      return { success: false, mode: 'PASSIVE', error: err?.message };
    }
  }

  /**
   * Cleanly closes the database file and executes final checkpoint
   */
  public close(): void {
    try {
      this.db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      this.db.close();
    } catch (err: any) {
      console.warn('Error during database shutdown:', err?.message || err);
    }
  }
}

export const vaultDb = new HardenedVaultDatabase();
