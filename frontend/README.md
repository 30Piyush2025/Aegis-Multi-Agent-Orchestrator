# Aegis AI Desktop Assistant (Next.js 14)

> **"Crafted with care, not wires."**  
> A premium, production-ready desktop-style AI assistant interface built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion spring physics, and Lucide icons.

---

## Architecture Overview

```text
frontend/
├── app/
│   ├── layout.tsx              # Root HTML & body wrapper with Syne / JetBrains Mono fonts
│   ├── page.tsx                # Main desktop canvas assembling Sidebar, Chat, Windows & Dock
│   └── globals.css             # Tailwind directives, custom scrollbars, dark-theme styles
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx   # Markdown conversation view with copy, auto-scroll & badges
│   │   └── ChatInput.tsx       # Auto-expanding textarea, action triggers & keyboard shortcuts
│   ├── layout/
│   │   └── TaskbarDock.tsx     # Minimized window taskbar dock with restore pills
│   ├── sidebar/
│   │   └── Sidebar.tsx         # Collapsible sidebar with active indicators & tool triggers
│   ├── tools/
│   │   ├── CalculatorTool.tsx  # Scientific calculator with memory & history tape
│   │   ├── ClockTool.tsx       # Live world clock (UTC/EST/JST/IST/BST), stopwatch & countdown
│   │   ├── CalendarTool.tsx    # Interactive monthly calendar with task agenda planner
│   │   ├── SpreadsheetTool.tsx # Dynamic CSV/XLSX transformer with binary .xlsx export
│   │   ├── CharacterArtTool.tsx# Kinetic 3D wireframe canvas & Octane/Midjourney prompt engine
│   │   ├── CodeOrchestratorTool.tsx # Live dispatch to Aegis Multi-Agent DAG pipeline
│   │   └── SettingsTool.tsx    # Router selection, healing budget slider & theme preferences
│   └── windows/
│       ├── WindowFrame.tsx     # Desktop floating window (drag, resize, minimize, maximize)
│       └── FloatingWindowManager.tsx # Multi-window state coordinator & tool host
├── hooks/                      # Custom React hooks
├── lib/
│   └── utils.ts                # Tailwind class merging (clsx + tailwind-merge)
├── services/
│   └── api.ts                  # Centralized TypeScript API client connecting to backend (:8080)
├── store/
│   ├── chatStore.ts            # Zustand store for chat messages, streaming & model selection
│   └── windowStore.ts          # Zustand store for floating window positions, sizes & z-index
├── types/
│   └── index.ts                # TypeScript interfaces for Chat, Windows, Tools & Orchestration
├── package.json                # Dependencies and build scripts
├── tsconfig.json               # Strict TypeScript configuration
├── tailwind.config.js          # Tailwind styling system with amber & zinc dark palettes
└── next.config.mjs             # Next.js bundler configuration
```

---

## Key Features

### 1. Desktop Floating Window System
- **Drag Anywhere**: Fluid dragging across the desktop workspace with smooth Framer Motion spring constraints.
- **Resize from Edges**: Interactive bottom-right grab handle allowing arbitrary dimension adjustment.
- **Minimize to Dock**: Shrink windows into the bottom taskbar dock; click any dock pill to restore with state intact.
- **Maximize / Restore**: Expand to fill the active desktop canvas or return to previous exact dimensions.
- **Smart Stacking**: Clicking any window immediately elevates its `z-index` to the foreground.
- **Multi-Instance Support**: Open multiple tools simultaneously (e.g., Calculator + Clock + Spreadsheet) without modal blocking.

### 2. Built-in Interactive Tool Suite
1. **Scientific Calculator**: Arithmetic evaluation, trigonometric functions (`sin`, `cos`, `tan`), log, square root, power, and persistent calculation history tape.
2. **World Clock & Timer**: Live real-time world clock across 5 timezones (UTC, EST, JST, IST, BST), high-precision stopwatch with lap recording, and countdown timer.
3. **Interactive Calendar**: 12-month calendar grid with current day highlight and quick agenda event logging.
4. **Spreadsheet Transformer**: Upload CSV or paste raw data, apply natural language transformation instructions (e.g. *"filter high values"*, *"summarize department"*), preview live tabular data, and export directly as `.xlsx`.
5. **3D Character Art Studio**: Real-time kinetic wireframe rendering with camera controls, lighting setups, and copyable Octane / Midjourney production prompts.
6. **Aegis Code Orchestrator**: Direct bridge to the backend multi-agent pipeline (`MasterOrchestrator`) displaying live DAG task execution and generated code deliverables.
7. **Settings & Diagnostics**: Select routing models, tune the self-healing retry budget (0 to 5 loops), and toggle simulated defect injection.

### 3. Modern AI Chat Interface
- Markdown rendering with code syntax highlighting and one-click code copy.
- Auto-expanding message textarea supporting `Enter` to send and `Shift + Enter` for new lines.
- Quick tool launch pills right beneath the message input for instant access.
- Live backend connectivity badge (`Online` vs `Connecting`).

---

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Python 3.9+ (for running the Aegis backend API server on `:8080`)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## Backend Integration

The Next.js frontend connects to the Aegis Atelier backend server running on `http://localhost:8080`.

To start the backend server:
```bash
# In the repository root
python3 web/server.py 8080
# or
bash start_studio.sh 8080
```

Available API Endpoints:
- `GET  /api/health` - Server healthcheck and status
- `POST /api/office/transform` - Execute spreadsheet transformation
- `POST /api/office/export-xlsx` - Generate binary `.xlsx` spreadsheet download
- `POST /api/character-art` - Generate 3D concept prompts and specifications
- `POST /api/code/orchestrate` - Dispatch Aegis Multi-Agent DAG workflow
- `POST /api/universal/execute` - Process open-ended natural language requests
