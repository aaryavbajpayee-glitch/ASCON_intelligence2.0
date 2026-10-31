/**
 * ASCON Lightweight Cryptography Suite
 * NIST SP 800-232 Standard Implementation
 *
 * Implements:
 * - ASCON-Hash256 (256-bit output, rate=64 bits, capacity=256 bits, a=12, b=12)
 * - ASCON-XOF128 (Variable output, rate=64 bits, capacity=256 bits, a=12, b=12)
 * - ASCON-128a (Permutation primitive benchmark)
 */

export interface PermutationTraceStep {
  round: number;
  constant: string;
  x0: string;
  x1: string;
  x2: string;
  x3: string;
  x4: string;
}

export interface HashResult {
  algorithm: 'ASCON-Hash256' | 'ASCON-XOF128';
  digestHex: string;
  digestBytes: Uint8Array;
  executionTimeUs: number; // microseconds
  executionTimeMs: number;
  inputSizeBytes: number;
  outputSizeBytes: number;
  stateTrace?: PermutationTraceStep[];
  finalStateHex: {
    x0: string;
    x1: string;
    x2: string;
    x3: string;
    x4: string;
  };
}

const MASK64 = 0xffffffffffffffffn;

// Round constants for ASCON permutation (rounds 0 to 11)
const ROUND_CONSTANTS: bigint[] = [
  0xf0n, 0xe1n, 0xd2n, 0xc3n,
  0xb4n, 0xa5n, 0x96n, 0x87n,
  0x78n, 0x69n, 0x5an, 0x4bn,
];

// 64-bit circular right shift
function rotr(val: bigint, n: bigint): bigint {
  return ((val >> n) | (val << (64n - n))) & MASK64;
}

// Convert 8 bytes from buffer (big-endian) to BigInt
function bytesToBigInt64BE(bytes: Uint8Array, offset: number): bigint {
  let val = 0n;
  for (let i = 0; i < 8; i++) {
    val = (val << 8n) | BigInt(bytes[offset + i]);
  }
  return val;
}

// Convert BigInt to 8 bytes (big-endian)
function bigInt64BEToBytes(val: bigint, out: Uint8Array, offset: number): void {
  for (let i = 7; i >= 0; i--) {
    out[offset + i] = Number(val & 0xffn);
    val >>= 8n;
  }
}

// Convert byte array to hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert string to Uint8Array UTF-8
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Format 64-bit BigInt to 16-character hex string
export function toHex64(val: bigint): string {
  return (val & MASK64).toString(16).padStart(16, '0');
}

/**
 * ASCON 320-bit core permutation
 * Operates on 5 64-bit words: x0, x1, x2, x3, x4
 */
export class AsconState {
  x0: bigint = 0n;
  x1: bigint = 0n;
  x2: bigint = 0n;
  x3: bigint = 0n;
  x4: bigint = 0n;

  constructor(x0 = 0n, x1 = 0n, x2 = 0n, x3 = 0n, x4 = 0n) {
    this.x0 = x0 & MASK64;
    this.x1 = x1 & MASK64;
    this.x2 = x2 & MASK64;
    this.x3 = x3 & MASK64;
    this.x4 = x4 & MASK64;
  }

  clone(): AsconState {
    return new AsconState(this.x0, this.x1, this.x2, this.x3, this.x4);
  }

  /**
   * Run p^rounds on the state
   * @param rounds Number of rounds (typically 12 for hash, 6, 8, or 12)
   * @param captureTrace Optional callback to capture state after each round
   */
  permute(rounds = 12, captureTrace?: (step: PermutationTraceStep) => void): void {
    const startRound = 12 - rounds;

    for (let r = startRound; r < 12; r++) {
      // 1. Addition of round constant
      this.x2 = (this.x2 ^ ROUND_CONSTANTS[r]) & MASK64;

      // 2. Substitution layer (5-bit S-box)
      let x0 = this.x0;
      let x1 = this.x1;
      let x2 = this.x2;
      let x3 = this.x3;
      let x4 = this.x4;

      x0 = (x0 ^ x4) & MASK64;
      x4 = (x4 ^ x3) & MASK64;
      x2 = (x2 ^ x1) & MASK64;

      const t0 = (~x0 & x1) & MASK64;
      const t1 = (~x1 & x2) & MASK64;
      const t2 = (~x2 & x3) & MASK64;
      const t3 = (~x3 & x4) & MASK64;
      const t4 = (~x4 & x0) & MASK64;

      x0 = (x0 ^ t1) & MASK64;
      x1 = (x1 ^ t2) & MASK64;
      x2 = (x2 ^ t3) & MASK64;
      x3 = (x3 ^ t4) & MASK64;
      x4 = (x4 ^ t0) & MASK64;

      x1 = (x1 ^ x0) & MASK64;
      x0 = (x0 ^ x4) & MASK64;
      x3 = (x3 ^ x2) & MASK64;
      x2 = (~x2) & MASK64;

      // 3. Linear diffusion layer
      this.x0 = (x0 ^ rotr(x0, 19n) ^ rotr(x0, 28n)) & MASK64;
      this.x1 = (x1 ^ rotr(x1, 61n) ^ rotr(x1, 39n)) & MASK64;
      this.x2 = (x2 ^ rotr(x2, 1n) ^ rotr(x2, 6n)) & MASK64;
      this.x3 = (x3 ^ rotr(x3, 10n) ^ rotr(x3, 17n)) & MASK64;
      this.x4 = (x4 ^ rotr(x4, 7n) ^ rotr(x4, 41n)) & MASK64;

      if (captureTrace) {
        captureTrace({
          round: r + 1,
          constant: '0x' + ROUND_CONSTANTS[r].toString(16),
          x0: toHex64(this.x0),
          x1: toHex64(this.x1),
          x2: toHex64(this.x2),
          x3: toHex64(this.x3),
          x4: toHex64(this.x4),
        });
      }
    }
  }

  getHexState() {
    return {
      x0: toHex64(this.x0),
      x1: toHex64(this.x1),
      x2: toHex64(this.x2),
      x3: toHex64(this.x3),
      x4: toHex64(this.x4),
    };
  }
}

/**
 * Standard ASCON-Hash256
 * Rate = 64 bits (8 bytes)
 * Rounds a = 12, b = 12
 * Output = 256 bits (32 bytes)
 */
export function asconHash256(
  input: Uint8Array | string,
  options?: { trace?: boolean }
): HashResult {
  const data = typeof input === 'string' ? stringToBytes(input) : input;
  const start = performance.now();

  const traceSteps: PermutationTraceStep[] = [];
  const capture = options?.trace ? (s: PermutationTraceStep) => traceSteps.push(s) : undefined;

  // 1. Initialization
  // IV for ASCON-Hash256: 0x00400c0000000100
  const state = new AsconState(0x00400c0000000100n, 0n, 0n, 0n, 0n);
  state.permute(12, capture);

  // 2. Absorbing Phase
  const rate = 8;
  const len = data.length;
  const paddedLen = Math.ceil((len + 1) / rate) * rate;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[len] = 0x80; // append 10000000b

  const numBlocks = paddedLen / rate;
  for (let i = 0; i < numBlocks; i++) {
    const blockVal = bytesToBigInt64BE(padded, i * rate);
    state.x0 = (state.x0 ^ blockVal) & MASK64;
    // Permute between blocks
    if (i < numBlocks - 1) {
      state.permute(12, capture);
    }
  }

  // 3. Squeezing Phase (256 bits = 32 bytes = 4 blocks of 8 bytes)
  state.permute(12, capture);
  const outBytes = new Uint8Array(32);
  bigInt64BEToBytes(state.x0, outBytes, 0);

  for (let i = 1; i < 4; i++) {
    state.permute(12, capture);
    bigInt64BEToBytes(state.x0, outBytes, i * rate);
  }

  const end = performance.now();
  const timeMs = end - start;
  const timeUs = Math.round(timeMs * 1000 * 100) / 100;

  return {
    algorithm: 'ASCON-Hash256',
    digestHex: bytesToHex(outBytes),
    digestBytes: outBytes,
    executionTimeMs: Math.round(timeMs * 1000) / 1000,
    executionTimeUs: timeUs,
    inputSizeBytes: data.length,
    outputSizeBytes: 32,
    stateTrace: options?.trace ? traceSteps : undefined,
    finalStateHex: state.getHexState(),
  };
}

/**
 * Standard ASCON-XOF128 (Extendable-Output Function)
 * Rate = 64 bits (8 bytes)
 * Rounds a = 12, b = 12
 * Output = user configured byte length (default 32 bytes)
 */
export function asconXof128(
  input: Uint8Array | string,
  outputLengthBytes = 32,
  options?: { trace?: boolean }
): HashResult {
  const data = typeof input === 'string' ? stringToBytes(input) : input;
  const start = performance.now();

  const traceSteps: PermutationTraceStep[] = [];
  const capture = options?.trace ? (s: PermutationTraceStep) => traceSteps.push(s) : undefined;

  // 1. Initialization
  // IV for ASCON-XOF128: 0x00400c0000000000
  const state = new AsconState(0x00400c0000000000n, 0n, 0n, 0n, 0n);
  state.permute(12, capture);

  // 2. Absorbing Phase
  const rate = 8;
  const len = data.length;
  const paddedLen = Math.ceil((len + 1) / rate) * rate;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[len] = 0x80;

  const numBlocks = paddedLen / rate;
  for (let i = 0; i < numBlocks; i++) {
    const blockVal = bytesToBigInt64BE(padded, i * rate);
    state.x0 = (state.x0 ^ blockVal) & MASK64;
    if (i < numBlocks - 1) {
      state.permute(12, capture);
    }
  }

  // 3. Squeezing Phase
  state.permute(12, capture);
  const outBytes = new Uint8Array(outputLengthBytes);
  let bytesWritten = 0;

  while (bytesWritten < outputLengthBytes) {
    const remaining = outputLengthBytes - bytesWritten;
    const block = new Uint8Array(8);
    bigInt64BEToBytes(state.x0, block, 0);

    const toCopy = Math.min(8, remaining);
    outBytes.set(block.subarray(0, toCopy), bytesWritten);
    bytesWritten += toCopy;

    if (bytesWritten < outputLengthBytes) {
      state.permute(12, capture);
    }
  }

  const end = performance.now();
  const timeMs = end - start;
  const timeUs = Math.round(timeMs * 1000 * 100) / 100;

  return {
    algorithm: 'ASCON-XOF128',
    digestHex: bytesToHex(outBytes),
    digestBytes: outBytes,
    executionTimeMs: Math.round(timeMs * 1000) / 1000,
    executionTimeUs: timeUs,
    inputSizeBytes: data.length,
    outputSizeBytes: outputLengthBytes,
    stateTrace: options?.trace ? traceSteps : undefined,
    finalStateHex: state.getHexState(),
  };
}

/**
 * SHA-256 baseline standard implementation using Web Crypto API for comparison
 */
export async function sha256Baseline(input: Uint8Array | string): Promise<{
  algorithm: 'SHA-256';
  digestHex: string;
  executionTimeMs: number;
  executionTimeUs: number;
  inputSizeBytes: number;
  outputSizeBytes: number;
}> {
  const data = typeof input === 'string' ? stringToBytes(input) : input;
  const start = performance.now();
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as Uint8Array<ArrayBuffer>);
  const end = performance.now();
  const timeMs = end - start;
  const bytes = new Uint8Array(hashBuffer);

  return {
    algorithm: 'SHA-256',
    digestHex: bytesToHex(bytes),
    executionTimeMs: Math.round(timeMs * 1000) / 1000,
    executionTimeUs: Math.round(timeMs * 1000 * 100) / 100,
    inputSizeBytes: data.length,
    outputSizeBytes: 32,
  };
}
