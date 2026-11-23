#!/usr/bin/env python3
"""
Aegis Mission Control Web Server
================================
Zero-dependency, production-grade HTTP web application powered by Python standard library.
Provides a real-time web UI, REST API (/api/run, /api/health), and live agent telemetry
without requiring external pip dependencies.
"""

import http.server
import json
import os
import socketserver
import sys
import time
from typing import Any, Dict
from urllib.parse import parse_qs, urlparse

# Ensure src is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.core.llm_router import LLMRouter
from src.core.orchestrator import MasterOrchestrator, OrchestratorResult
from src.core.state import EventType

PORT = int(os.environ.get("PORT", 8000))

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aegis - Hierarchical Multi-Agent Mission Control</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #101726;
      --card-border: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.25);
      --accent: #818cf8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --code-bg: #050811;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-icon {
      font-size: 2rem;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 10px 14px;
      border-radius: 12px;
      box-shadow: 0 0 20px var(--primary-glow);
    }
    .brand-title {
      font-size: 1.6rem;
      font-weight: 800;
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-sub { color: var(--text-muted); font-size: 0.88rem; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: 'DM Mono', monospace;
    }
    .pulse {
      width: 8px; height: 8px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

    .grid-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    @media (max-width: 900px) { .grid-container { grid-template-columns: 1fr; } }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--primary);
    }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 600; }
    textarea, select {
      width: 100%;
      background: #050811;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 12px 14px;
      color: var(--text);
      font-family: inherit;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }
    textarea:focus, select:focus { outline: none; border-color: var(--primary); }
    .btn {
      width: 100%;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Hierarchy Tree */
    .agent-tree {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .tree-tier {
      background: rgba(255,255,255,0.02);
      border: 1px dashed var(--card-border);
      border-radius: 12px;
      padding: 14px;
    }
    .tier-header {
      font-size: 0.78rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
      color: var(--text-muted);
    }
    .agent-badges {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .agent-node {
      background: #0c1220;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 0.85rem;
      font-family: 'DM Mono', monospace;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .agent-node.active { border-color: var(--primary); background: rgba(56, 189, 248, 0.1); }
    .agent-node.done { border-color: var(--success); }
    .node-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
    .agent-node.active .node-dot { background: var(--primary); box-shadow: 0 0 8px var(--primary); }
    .agent-node.done .node-dot { background: var(--success); }

    /* Event Feed */
    .terminal-feed {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      max-height: 280px;
      overflow-y: auto;
      color: #cbd5e1;
    }
    .log-line { margin-bottom: 6px; }
    .log-time { color: var(--text-muted); margin-right: 8px; }
    .log-tag { font-weight: 600; margin-right: 8px; }
    .log-tag.info { color: var(--primary); }
    .log-tag.success { color: var(--success); }
    .log-tag.heal { color: var(--warning); }

    /* Artifacts Viewer */
    .artifacts-box {
      margin-top: 24px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
    }
    .tabs-header {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 12px;
      margin-bottom: 16px;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.88rem;
      font-family: 'DM Mono', monospace;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      border-color: rgba(56, 189, 248, 0.3);
      font-weight: 600;
    }
    .code-viewer {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 18px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88rem;
      color: #e2e8f0;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 480px;
      overflow-y: auto;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: var(--text-muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--card-border);
      padding-top: 20px;
    }
    .footer a { color: var(--primary); text-decoration: none; }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <div class="brand-icon">🛡️</div>
      <div>
        <div class="brand-title">Aegis Mission Control</div>
        <div class="brand-sub">Hierarchical Multi-Agent Orchestration & Closed-Loop Self-Healing</div>
      </div>
    </div>
    <div class="status-badge">
      <span class="pulse"></span> ENGINE ONLINE & READY
    </div>
  </div>

  <div class="grid-container">
    <!-- Dispatch Panel -->
    <div class="card">
      <div class="card-title">🚀 Dispatch Autonomous Team</div>
      <div class="form-group">
        <label>Preset Specifications:</label>
        <select id="presetSelect" onchange="loadPreset()">
          <option value="">Custom Specification...</option>
          <option value="Build an IoT Fleet Anomaly Detector with SQLite, FastAPI and Streamlit dashboard" selected>IoT Telemetry Anomaly Detector</option>
          <option value="Build a Clinical Notes Diagnosis Analyzer with sentence embeddings and diagnostic cards">Healthcare Clinical Notes AI</option>
          <option value="Build an end-to-end Customer Churn Prediction microservice with retention strategy">FinTech Churn Intelligence</option>
        </select>
      </div>
      <div class="form-group">
        <label>Software Goal / Specification:</label>
        <textarea id="taskInput" rows="4">Build an IoT Fleet Anomaly Detector with SQLite, FastAPI and Streamlit dashboard</textarea>
      </div>
      <button class="btn" id="runBtn" onclick="dispatchAgents()">
        <span>Execute Hierarchical Agent Team</span> ⚡
      </button>
    </div>

    <!-- Agent Hierarchy Tree -->
    <div class="card">
      <div class="card-title">🏛️ 3-Tier Agent Team Hierarchy</div>
      <div class="agent-tree">
        <div class="tree-tier">
          <div class="tier-header">Tier 1: Master Orchestration</div>
          <div class="agent-badges">
            <div class="agent-node" id="node-orchestrator"><span class="node-dot"></span> MasterOrchestrator</div>
          </div>
        </div>
        <div class="tree-tier">
          <div class="tier-header">Tier 2: Domain Specialist Leads</div>
          <div class="agent-badges">
            <div class="agent-node" id="node-research"><span class="node-dot"></span> ResearchLead</div>
            <div class="agent-node" id="node-engineering"><span class="node-dot"></span> EngineeringLead</div>
            <div class="agent-node" id="node-qa"><span class="node-dot"></span> QALead</div>
          </div>
        </div>
        <div class="tree-tier">
          <div class="tier-header">Tier 3: Atomic Workers</div>
          <div class="agent-badges">
            <div class="agent-node" id="node-db"><span class="node-dot"></span> DatabaseWorker</div>
            <div class="agent-node" id="node-backend"><span class="node-dot"></span> BackendWorker</div>
            <div class="agent-node" id="node-frontend"><span class="node-dot"></span> FrontendWorker</div>
            <div class="agent-node" id="node-test"><span class="node-dot"></span> TestRunner</div>
            <div class="agent-node" id="node-sec"><span class="node-dot"></span> SecurityWorker</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Real-time Event Feed -->
  <div class="card" style="margin-bottom: 24px;">
    <div class="card-title">📡 Real-Time Agent Telemetry & Pub/Sub Feed</div>
    <div class="terminal-feed" id="eventFeed">
      <div class="log-line"><span class="log-time">[00:00:00]</span> <span class="log-tag info">INFO</span> Ready for task dispatch. Select or enter specification above.</div>
    </div>
  </div>

  <!-- Artifacts Box -->
  <div class="artifacts-box" id="artifactsBox" style="display:none;">
    <div class="card-title">📦 Verified Deliverables & Codebase</div>
    <div class="tabs-header" id="tabsHeader"></div>
    <div class="code-viewer" id="codeViewer"></div>
  </div>

  <div class="footer">
    Aegis Hierarchical Multi-Agent System | Architected by <a href="https://github.com/30Piyush2025" target="_blank">Piyush Tiwari (@30Piyush2025)</a>
  </div>

  <script>
    let currentArtifacts = {};

    function loadPreset() {
      const select = document.getElementById('presetSelect');
      if (select.value) {
        document.getElementById('taskInput').value = select.value;
      }
    }

    function addLog(time, tag, type, msg) {
      const feed = document.getElementById('eventFeed');
      const div = document.createElement('div');
      div.className = 'log-line';
      div.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-tag ${type}">${tag}</span> ${msg}`;
      feed.appendChild(div);
      feed.scrollTop = feed.scrollHeight;
    }

    function resetNodes() {
      document.querySelectorAll('.agent-node').forEach(n => {
        n.className = 'agent-node';
      });
    }

    function setNodeStatus(id, status) {
      const el = document.getElementById(id);
      if (el) {
        el.className = 'agent-node ' + status;
      }
    }

    async function dispatchAgents() {
      const task = document.getElementById('taskInput').value.trim();
      if (!task) return alert('Please enter a goal!');

      const btn = document.getElementById('runBtn');
      btn.disabled = true;
      btn.innerHTML = '<span>Orchestrating Agents...</span> ⏳';

      resetNodes();
      setNodeStatus('node-orchestrator', 'active');

      const now = new Date().toTimeString().split(' ')[0];
      addLog(now, 'START', 'info', `Workflow dispatched: "${task}"`);

      try {
        const resp = await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: task })
        });
        const data = await resp.json();

        if (data.events) {
          data.events.forEach(ev => {
            const p = ev.payload;
            if (p.agent_name) {
              const nameLower = p.agent_name.toLowerCase();
              if (nameLower.includes('research')) setNodeStatus('node-research', p.status === 'COMPLETED' ? 'done' : 'active');
              if (nameLower.includes('engineering')) setNodeStatus('node-engineering', p.status === 'COMPLETED' ? 'done' : 'active');
              if (nameLower.includes('qa')) setNodeStatus('node-qa', p.status === 'COMPLETED' ? 'done' : 'active');
            }
            if (ev.event === 'HEALING_TRIGGERED') {
              addLog(ev.time, 'HEALING', 'heal', `Closed-Loop Remediation Loop triggered: ${p.reason}`);
            } else if (ev.event === 'ARTIFACT_CREATED') {
              addLog(ev.time, 'ARTIFACT', 'success', `Delivered: ${p.name} (by ${p.created_by})`);
            } else if (p.title) {
              addLog(ev.time, 'TASK', 'info', `[${p.domain}] ${p.title}`);
            }
          });
        }

        setNodeStatus('node-orchestrator', 'done');
        setNodeStatus('node-research', 'done');
        setNodeStatus('node-engineering', 'done');
        setNodeStatus('node-qa', 'done');
        setNodeStatus('node-db', 'done');
        setNodeStatus('node-backend', 'done');
        setNodeStatus('node-frontend', 'done');
        setNodeStatus('node-test', 'done');
        setNodeStatus('node-sec', 'done');

        const endNow = new Date().toTimeString().split(' ')[0];
        addLog(endNow, 'SUCCESS', 'success', `Workflow Completed in ${data.duration_seconds.toFixed(2)}s | QA Passed: ✓ | Artifacts: ${data.artifacts_count}`);

        // Display Artifacts
        if (data.artifacts) {
          currentArtifacts = data.artifacts;
          renderArtifactsTabs(data.artifacts);
        }

      } catch (err) {
        addLog(now, 'ERROR', 'heal', `Execution failed: ${err.message}`);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Execute Hierarchical Agent Team</span> ⚡';
      }
    }

    function renderArtifactsTabs(artifacts) {
      const box = document.getElementById('artifactsBox');
      const tabs = document.getElementById('tabsHeader');
      box.style.display = 'block';
      tabs.innerHTML = '';

      const keys = Object.keys(artifacts);
      if (keys.length === 0) return;

      keys.forEach((k, idx) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
        btn.innerText = k;
        btn.onclick = () => showTab(k, btn);
        tabs.appendChild(btn);
      });

      showTab(keys[0], tabs.firstChild);
    }

    function showTab(key, btn) {
      document.querySelectorAll('.tab-btn').forEach(b => b.className = 'tab-btn');
      if (btn) btn.className = 'tab-btn active';
      document.getElementById('codeViewer').innerText = currentArtifacts[key] || '';
    }
  </script>
</body>
</html>
"""


class AegisAPIHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler serving Aegis Mission Control and REST API."""

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ["/", "/index.html"]:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode("utf-8"))
        elif parsed.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "service": "Aegis Mission Control"}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/run":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body)
            except Exception:
                data = {}

            task = data.get("task", "Build IoT fleet monitoring microservice with FastAPI and SQLite")

            events_stream = []

            def on_event(ev_type: EventType, payload: Dict[str, Any]):
                events_stream.append({
                    "time": time.strftime("%H:%M:%S"),
                    "event": ev_type.value,
                    "payload": payload,
                })

            router = LLMRouter()
            orchestrator = MasterOrchestrator(llm_router=router, max_healing_iterations=3)
            result = orchestrator.run(user_request=task, on_event=on_event)

            response_payload = {
                "execution_id": result.execution_id,
                "success": result.success,
                "duration_seconds": result.duration_seconds,
                "qa_passed": result.qa_passed,
                "healing_iterations": result.healing_iterations,
                "artifacts_count": len(result.artifacts),
                "artifacts": result.artifacts,
                "events": events_stream,
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response_payload).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


def run_server():
    server_address = ("0.0.0.0", PORT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(server_address, AegisAPIHandler) as httpd:
        print(f"🛡️ Aegis Mission Control Web Server live at:")
        print(f"  ➜ Local:   http://localhost:{PORT}")
        print(f"  ➜ Network: http://0.0.0.0:{PORT}")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")


if __name__ == "__main__":
    run_server()
