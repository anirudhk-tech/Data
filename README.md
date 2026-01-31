# 🗡️ Dagger

**Turn messy data into clean, reproducible pipelines with plain English.**

Dagger is an AI-powered data transformation platform that converts natural language descriptions into deterministic, executable data pipelines. Unlike chat-based AI tools that give you different outputs each time, Dagger creates reusable **DAG**s (Directed Acyclic Graphs) that run consistently on any dataset.

> **Why "Dagger"?** The name is a play on **DAG** (Directed Acyclic Graph) - the fundamental data structure that powers our pipelines. Each pipeline you create is a DAG of transformation nodes, executed in order with no cycles. Plus, it cuts through messy data like a blade. ⚔️

![Dagger Demo](https://via.placeholder.com/800x400/0a0a0a/c43c2c?text=Dagger+Demo)

---

## ✨ Features

### 🧠 AI-Powered Pipeline Generation
- Describe your data transformation in plain English
- LLM generates a structured pipeline specification
- Automatic validation and self-repair (up to 3 iterations)
- Powered by [Keywords AI](https://keywordsai.co) for LLM orchestration and observability

### ⚡ High-Performance Execution
- **C++ WASM Engine**: Pipelines execute in compiled WebAssembly for near-native speed
- **TypeScript Fallback**: Graceful degradation when WASM unavailable
- **Deterministic Results**: Same input + same pipeline = same output, every time

### 🔄 Reusable Pipelines
- Run the same pipeline on new data with one click
- Version control for pipeline specifications
- Full execution history and metrics

### 📊 Comprehensive Analytics
- Input/output row counts and transformations
- Quality scoring powered by Keywords AI
- Detailed execution logs with timing
- Constraint validation

### 🎨 Modern Developer Experience
- Futuristic dark UI with real-time pipeline visualization
- Live node graph showing transformation flow
- Expandable execution logs
- One-click CSV export

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Pipeline    │  │ Live Canvas │  │ Results & Logs          │  │
│  │ Builder     │  │ Visualizer  │  │ Viewer                  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server (Bun + Elysia)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Keywords AI │  │ WASM Engine │  │ Evaluation &            │  │
│  │ Integration │  │ (C++)       │  │ Metrics                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (Postgres)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Pipelines   │  │ Versions    │  │ Runs & Logs             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Upload & Describe**: User uploads a CSV and describes the transformation in plain English
2. **Spec Generation**: Keywords AI generates a pipeline specification (JSON DAG)
3. **Validation Loop**: C++ WASM validator checks the spec; if invalid, AI repairs it (max 3 iterations)
4. **Execution**: WASM engine executes the DAG nodes in topological order
5. **Evaluation**: Quality metrics computed and stored with full execution logs
6. **Reuse**: Pipeline saved for re-running on new datasets

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React, Tailwind CSS, shadcn/ui |
| **Backend** | Bun, Elysia.js, TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **LLM** | Keywords AI (OpenAI-compatible gateway) |
| **Engine** | C++ compiled to WebAssembly via Emscripten |
| **Styling** | Custom dark theme with glow effects |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Supabase](https://supabase.com/) account
- [Keywords AI](https://keywordsai.co/) API key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dagger.git
cd dagger
```

### 2. Set Up Supabase

Create a new Supabase project and run the migrations:

```bash
# In Supabase SQL Editor, run:
# server/supabase/migrations/001_init.sql
# server/supabase/migrations/002_add_logs.sql
```

### 3. Configure Environment

**Server** (`server/.env`):
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
KEYWORDS_AI_API_KEY=your-keywords-ai-key
KEYWORDS_AI_BASE_URL=https://api.keywordsai.co/api
MAX_INPUT_BYTES=10000000
MAX_FIX_ITERS_DEFAULT=3
```

**Client** (`client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Install Dependencies

```bash
# Server
cd server
bun install

# Client
cd ../client
pnpm install
```

### 5. Run the Application

```bash
# Terminal 1: Start server
cd server
bun run dev

# Terminal 2: Start client
cd client
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see Dagger in action!

---

## 📁 Project Structure

```
dagger/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   │   ├── live-builder/  # Real-time pipeline visualization
│   │   ├── pipelines/     # Pipeline management
│   │   ├── runs/          # Run results & logs
│   │   ├── shared/        # Shared components
│   │   └── ui/            # shadcn/ui components
│   └── lib/               # Utilities & API client
│
├── server/                 # Bun + Elysia backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   └── lib/           # Core logic
│   │       ├── keywords.ts    # Keywords AI integration
│   │       ├── eval.ts        # Quality evaluation
│   │       ├── logger.ts      # Execution logging
│   │       └── db.ts          # Supabase client
│   ├── engine_wasm/       # C++ WASM engine
│   │   ├── src/           # C++ source files
│   │   ├── lib/           # Dependencies (nlohmann/json)
│   │   └── bindings.ts    # TypeScript bindings
│   └── supabase/
│       └── migrations/    # Database schema
│
└── README.md
```

---

## 🔧 Pipeline Operations

Dagger supports these transformation operations:

| Operation | Description |
|-----------|-------------|
| `filter` | Filter rows based on conditions |
| `select_columns` | Keep only specified columns |
| `dedupe` | Remove duplicate rows |
| `rename_columns` | Rename column headers |
| `transform` | Apply transformations (lowercase, uppercase, trim, etc.) |
| `validate_email` | Validate and filter email addresses |
| `fix_dates` | Normalize date formats |

---

## 📝 Example Prompts

Try these prompts to see Dagger's capabilities:

**Lead Qualification:**
> "Score leads based on engagement signals. Create a lead_score (0-100) using: company email domain (+30), title contains Director/VP/C-level (+25), company size > 100 (+20). Segment into hot (>=70), warm (40-69), cold (<40). Filter out personal email domains."

**Data Standardization:**
> "Normalize phone numbers to E.164 format, standardize addresses into separate columns (street, city, state, zip), fix date formats to YYYY-MM-DD, validate emails and flag invalid ones. Remove empty rows and dedupe by email."

**Smart Deduplication:**
> "Identify and merge duplicate customer records based on email similarity. Keep the most recent entry's data but preserve the earliest created_at date. Normalize emails to lowercase, remove invalid emails."

---

## 🔑 Keywords AI Integration

Dagger uses [Keywords AI](https://keywordsai.co) for:

- **LLM Orchestration**: Unified API for spec generation and repair
- **Observability**: Full trace logging for every LLM call
- **Reliability**: Automatic retries and fallbacks

Every run stores a `keywords_trace_id` that links directly to the Keywords AI dashboard for debugging.

---

## 🎯 Why Dagger Over ChatGPT/Perplexity?

| Feature | Chat-based AI | Dagger |
|---------|---------------|--------|
| **Reproducibility** | Different output each time | Deterministic pipelines |
| **Reusability** | Copy-paste prompts | One-click re-run |
| **Performance** | API latency per request | WASM execution in milliseconds |
| **Auditability** | Chat logs | Structured specs + execution logs |
| **Data Privacy** | Data sent to LLM | LLM only sees schema, not data |

---

## 🏆 Hackathon

Built for Keywords AI by The Stack.

**The Problem**: Data analysts spend hours writing repetitive transformation scripts. Chat-based AI tools help, but outputs aren't reproducible or reusable.

**Our Solution**: Dagger bridges the gap between natural language and production-ready data pipelines. Describe once, run forever.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>🗡️ Dagger</strong> — Cut through the noise. Transform your data.
</p>
