import os
import sys
import time
from typing import Any, Dict

import streamlit as st

# Ensure src is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.core.llm_router import LLMRouter
from src.core.orchestrator import MasterOrchestrator, OrchestratorResult
from src.core.state import EventType

st.set_page_config(
    page_title="Aegis - Hierarchical Multi-Agent Mission Control",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for modern dark / editorial mission control theme
st.markdown("""
<style>
    .mission-header {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #818cf8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .mission-sub {
        color: #94a3b8;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    .tier-badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .tier-1 { background: #1e1b4b; color: #818cf8; border: 1px solid #4338ca; }
    .tier-2 { background: #0c4a6e; color: #38bdf8; border: 1px solid #0284c7; }
    .tier-3 { background: #064e3b; color: #34d399; border: 1px solid #059669; }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="mission-header">🛡️ Aegis : Hierarchical Multi-Agent Mission Control</div>', unsafe_allow_html=True)
st.markdown('<div class="mission-sub">Autonomous Tree-of-Agents Architecture — Master Orchestrator, Domain Specialist Leads & Closed-Loop Self-Healing.</div>', unsafe_allow_html=True)

# Sidebar Configuration
st.sidebar.header("⚙️ Orchestrator Configuration")

execution_mode = st.sidebar.selectbox(
    "Execution Engine Mode",
    ["Hybrid / Auto-Detect", "Groq Llama 3.3 (High Speed)", "Google Gemini", "Offline Deterministic Engine"],
    help="Select LLM provider or offline zero-dependency simulation engine."
)

healing_budget = st.sidebar.slider(
    "Self-Healing Iteration Budget",
    min_value=1,
    max_value=5,
    value=3,
    help="Maximum automated bug-fix / code-remediation loops permitted before aborting."
)

inject_test_defect = st.sidebar.checkbox(
    "Simulate Code Defect (Showcase Self-Healing)",
    value=False,
    help="Injects a deliberate syntax defect into Engineering Lead output to demonstrate QA detection and automated self-healing repair."
)

st.sidebar.markdown("---")
st.sidebar.subheader("🏗️ Agent Architecture Overview")
st.sidebar.markdown("""
- **Tier 1: Master Orchestrator**
  - High-level DAG decomposition & lifecycle sync.
- **Tier 2: Domain Specialist Leads**
  - 🔬 `ResearchLead` (Tech stack RFCs)
  - 💻 `EngineeringLead` (Code decomposition)
  - 🛡️ `QALead` (AST verification & self-healing)
- **Tier 3: Atomic Workers**
  - `DatabaseWorker`, `BackendWorker`, `FrontendWorker`
""")

# Sample Preset Projects
SAMPLE_PROJECTS = {
    "Select a pre-filled specification template...": "",
    "Healthcare AI Triage & Clinical Notes Assistant": (
        "Build a clinical notes diagnosis analyzer using sentence embeddings, "
        "patient demographics extraction, and Streamlit diagnostic assistant."
    ),
    "FinTech Customer Churn Intelligence Microservice": (
        "Build an end-to-end customer churn prediction microservice with FastAPI, "
        "SQLite customer database, and an interactive Streamlit retention dashboard."
    ),
    "Real-Time IoT Fleet Anomaly Detector": (
        "Build a streaming telemetry anomaly detection engine with SQLite storage, "
        "background threshold alerts, and real-time visualization."
    )
}

selected_template = st.selectbox("📋 Load Sample Software Specification:", list(SAMPLE_PROJECTS.keys()))
default_spec = SAMPLE_PROJECTS[selected_template] if selected_template in SAMPLE_PROJECTS else ""

task_input = st.text_area(
    "✍️ Enter Target Software Goal / Objective:",
    value=default_spec or "Build an end-to-end customer churn prediction microservice with FastAPI, SQLite database, and Streamlit dashboard",
    height=100
)

# Execution Trigger
if st.button("🚀 Dispatch Hierarchical Agent Team", type="primary"):
    if not task_input.strip():
        st.warning("Please provide a software objective.")
    else:
        # Event collector for live dashboard display
        events_log = []
        status_placeholder = st.empty()
        log_container = st.container()

        def stream_event(event_type: EventType, payload: Dict[str, Any]):
            events_log.append({"time": time.strftime("%H:%M:%S"), "event": event_type.value, "payload": payload})

        with st.spinner("Master Orchestrator analyzing specification and constructing DAG..."):
            # Initialize Router
            router = LLMRouter()
            orchestrator = MasterOrchestrator(
                llm_router=router,
                max_healing_iterations=healing_budget,
            )

            result = orchestrator.run(user_request=task_input, on_event=stream_event)

        # Display Completion Metrics Banner
        if result.success and result.qa_passed:
            st.success(
                f"### ✅ Execution Complete in {result.duration_seconds:.2f}s | "
                f"QA Passed: ✓ | Self-Healing Loops: {result.healing_iterations} | "
                f"Artifacts Delivered: {len(result.artifacts)}"
            )
        else:
            st.warning(f"### ⚠️ Completed with alerts in {result.duration_seconds:.2f}s")

        # Tabs for Visual Mission Control
        tab1, tab2, tab3, tab4 = st.tabs([
            "📂 Deliverable Artifacts",
            "🛡️ QA Audit & Self-Healing",
            "📜 Inter-Agent Event Feed",
            "📊 Blackboard State Export"
        ])

        with tab1:
            st.subheader("Generated Software Deliverables")
            artifact_names = list(result.artifacts.keys())
            if artifact_names:
                selected_art = st.selectbox("Select deliverable file to inspect:", artifact_names)
                content = result.artifacts[selected_art]
                st.code(content, language="markdown" if selected_art.endswith(".md") else "python")
                st.download_button(
                    label=f"⬇️ Download {selected_art}",
                    data=content,
                    file_name=selected_art,
                    mime="text/plain"
                )

        with tab2:
            st.subheader("Closed-Loop Quality Assurance & AST Verification")
            c1, c2, c3 = st.columns(3)
            with c1:
                st.metric("QA Status", "VERIFIED ✓" if result.qa_passed else "ALERT ✗")
            with c2:
                st.metric("Self-Healing Iterations", f"{result.healing_iterations} / {healing_budget}")
            with c3:
                st.metric("Execution ID", result.execution_id[:8])

            if "QA_REPORT.md" in result.artifacts:
                st.markdown(result.artifacts["QA_REPORT.md"])

        with tab3:
            st.subheader("Inter-Agent Pub/Sub Message Bus")
            for item in events_log:
                ev = item["event"]
                payload = item["payload"]
                tm = item["time"]
                if "agent_name" in payload:
                    st.write(f"`[{tm}]` 🤖 **{payload['agent_name']}** transitioned to `{payload.get('status')}` ({payload.get('role')})")
                elif "title" in payload:
                    st.write(f"`[{tm}]` 📋 **Task Dispatched:** *{payload.get('title')}* `[{payload.get('domain')}]`")
                elif "reason" in payload:
                    st.error(f"`[{tm}]` ⚠️ **Self-Healing Triggered:** {payload.get('reason')}")
                elif "name" in payload:
                    st.success(f"`[{tm}]` ✓ **Artifact Generated:** `{payload.get('name')}` by `{payload.get('created_by')}`")

        with tab4:
            st.subheader("Blackboard Shared State Snapshot")
            st.json(result.to_dict())

# Footer
st.markdown("---")
st.caption("Aegis Hierarchical Multi-Agent System | Designed for Autonomous Software Engineering by Piyush Tiwari (@30Piyush2025)")
