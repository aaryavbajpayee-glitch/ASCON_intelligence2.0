<div align="center">
  <h1>ASCON INTELLIGENCE</h1>
  <p><strong>NIST SP 800-232 Lightweight Cryptography Suite & Neural Performance Analyzer</strong></p>
</div>

ASCON INTELLIGENCE is a high-performance, enterprise-grade cryptographic analysis, benchmarking, and intelligence platform implementing the official NIST SP 800-232 lightweight standard (**ASCON-Hash256** and **ASCON-XOF128**) with hardware telemetry modeling, permutation tracing, and AI cryptographic coprocessor assistance.

---

## 🚀 Enterprise Scalability & Production Architecture

1. **Multi-Core Clustering Engine (`node:cluster`):**
   - Built-in multi-process orchestrator spawns worker processes matching `os.availableParallelism()` to scale across all CPU cores.
   - Self-healing supervision: automatically restarts crashed workers with circuit-breaker throttling to prevent crash loops.
   - Shared OS socket handling for high-concurrency request throughput.

2. **Hardened SQLite Vault (`node:sqlite`):**
   - Embedded database configured with Write-Ahead Logging (`WAL`), `synchronous = NORMAL`, `busy_timeout = 5000`, and foreign keys.
   - **HMAC-SHA256 Tamper Sealing:** Every stored hash, benchmark, and report is cryptographically signed upon insertion.
   - **Automated WAL Checkpoints:** Scheduled background checkpointing keeps disk write logs compact and fast (`PRAGMA wal_checkpoint(PASSIVE)`).
   - Dedicated integrity audit routines (`/api/vault/audit`) and on-demand maintenance (`/api/vault/checkpoint`).

3. **High-Performance Front-End Code Splitting:**
   - Client is modularized with `React.lazy` and `Suspense` route-based chunking.
   - Initial bundle size reduced from ~387 KB to small, cacheable vendor and page chunks (`vendor-react`, `vendor-icons`, `Dashboard`, `HashGenerator`, etc.).
   - Global `ErrorBoundary` catches unexpected UI exceptions, providing instant recovery options.

4. **Defense-in-Depth Security Headers & Rate Limiting:**
   - Native sliding-window rate limiter protects all endpoints against DDoS and brute-force traffic (`300 req/min` for APIs, `60 req/min` for AI).
   - Strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), nosniff, frame-ancestors, cross-origin isolation.

5. **Payload Compression & Observability:**
   - Native `node:zlib` HTTP response compression (gzip/deflate) reduces network bandwidth consumption by up to 80%.
   - Unique correlation IDs (`X-Request-Id`) attached to every request and response.
   - Latency tracking header (`X-Response-Time`).
   - Detailed APM metrics endpoint (`/api/metrics`) reporting CPU, memory, uptime, latency, and vault statistics.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ or v22+
- npm v10+

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port the server listens on | `3000` |
| `HOST` | Network interface to bind | `0.0.0.0` |
| `CLUSTER_MODE` | Enable multi-core Node.js clustering (`true` / `false`) | `false` |
| `WEB_CONCURRENCY` | Number of worker processes to fork in cluster mode | Auto (`os.cpus().length`) |
| `DATABASE_INTEGRITY_KEY` | HMAC salt used to seal records against tampering | Auto-generated default |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key for live AI synthesis. If omitted, built-in coprocessor provides grounded cryptographic telemetry analysis. | `""` |
| `GEMINI_MODEL` | Google GenAI model | `gemini-2.5-flash` |

---

## Running the Application

### Production Mode (Recommended)

1. Build both client bundle and standalone server executable:
   ```bash
   npm run build
   ```
2. Start the optimized production server:
   ```bash
   npm start
   ```
3. Open your browser at: [http://localhost:3000](http://localhost:3000)

### Development Mode

Run with hot module replacement (HMR) and Vite dev middleware:
```bash
npm run dev
```

---

## 🐳 Docker & Docker Compose Deployment

### Single-Command Orchestration (Docker Compose)

```bash
docker compose up -d --build
```
This launches the container with:
- Persistent SQLite storage volume mounted to `/app/data`
- Resource constraints (2.0 CPUs, 1GB RAM)
- Built-in container health check probe hitting `/api/health`
- Automatic restart policy (`unless-stopped`)

### Direct Docker Run

```bash
# Build production image
docker build -t ascon-intelligence .

# Run with persistent volume
docker run -d \
  -p 3000:3000 \
  -v ascon_vault_data:/app/data \
  --name ascon-prod \
  ascon-intelligence
```

---

## 📡 Enterprise API & Telemetry Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Container liveness & readiness probe (Docker / K8s) |
| `GET` | `/api/metrics` | APM telemetry (Memory RSS, Heap, RPS, Latency, Vault Stats) |
| `GET` | `/api/vault/stats` | SQLite engine status, journal mode, record counts |
| `GET` | `/api/vault/audit` | HMAC-SHA256 cryptographic tamper verification |
| `POST` | `/api/vault/checkpoint` | Trigger on-demand SQLite WAL checkpoint |
| `GET` | `/api/vault/export` | Complete cryptographically sealed vault JSON dump |
| `POST` | `/api/ai/chat` | Gemma 4 plain-language coprocessor |
| `POST` | `/api/ai/analyze-comparison` | Telemetry-grounded multi-algorithm comparison |
| `POST` | `/api/ai/generate-report` | Formal NIST SP 800-232 audit report synthesis |

---

## License

Apache-2.0
