#!/usr/bin/env python3
"""
Aegis CLI - Mission Control Terminal Interface
===============================================
Interactive command-line execution for the Aegis Hierarchical Multi-Agent System.
Demonstrates 3-tier task decomposition, real-time agent event streaming,
and closed-loop self-healing directly in the terminal.
"""

import argparse
import os
import sys
import time
from typing import Any, Dict

# Ensure src is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.core.llm_router import LLMRouter
from src.core.orchestrator import MasterOrchestrator, OrchestratorResult
from src.core.state import EventType

# ANSI Color codes for rich, dependency-free terminal output
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def print_banner():
    banner = f"""
{CYAN}{BOLD}======================================================================
     🛡️  AEGIS : HIERARCHICAL MULTI-AGENT ORCHESTRATION ENGINE
======================================================================{RESET}
{DIM}  Tier 1: Master Orchestrator (DAG Planner & Aggregator)
  Tier 2: Domain Specialist Leads (Research, Engineering, QA)
  Tier 3: Atomic Workers (Backend, Frontend, DB, Pytest, Security)
  Engine: Closed-Loop Self-Healing & Multi-Brain Routing{RESET}
"""
    print(banner)


def handle_event(event_type: EventType, payload: Dict[str, Any]):
    """Real-time event handler for streaming agent updates to the terminal."""
    timestamp = time.strftime("%H:%M:%S")

    if event_type == EventType.WORKFLOW_STARTED:
        print(f"\n{BLUE}[{timestamp}] 🚀 Workflow Initiated:{RESET} {payload.get('user_request')}")
        print(f"{DIM}    Session ID: {payload.get('execution_id')}{RESET}\n")

    elif event_type == EventType.AGENT_STATUS_CHANGED:
        agent_name = payload.get("agent_name", "Unknown")
        status = payload.get("status", "")
        role = payload.get("role", "")

        status_colors = {
            "PLANNING": YELLOW,
            "WORKING": CYAN,
            "REVIEWING": MAGENTA,
            "HEALING": RED + BOLD,
            "COMPLETED": GREEN,
            "FAILED": RED,
        }
        color = status_colors.get(status, RESET)
        print(f"  {color}● [{status:^10}]{RESET} {BOLD}{agent_name:<20}{RESET} {DIM}({role}){RESET}")

    elif event_type == EventType.TASK_CREATED:
        title = payload.get("title", "")
        domain = payload.get("domain", "")
        print(f"    {DIM}↳ Task Dispatched [{domain}]: {title}{RESET}")

    elif event_type == EventType.HEALING_TRIGGERED:
        iteration = payload.get("iteration", 1)
        reason = payload.get("reason", "")
        print(f"\n{RED}{BOLD}  ⚠️  [SELF-HEALING TRIGGERED] Iteration {iteration}:{RESET} {YELLOW}{reason}{RESET}")
        print(f"{DIM}     Dispatched auto-remediation patch task to Engineering Lead...{RESET}\n")

    elif event_type == EventType.ARTIFACT_CREATED:
        name = payload.get("name", "")
        agent = payload.get("created_by", "")
        print(f"    {GREEN}✓ Artifact Delivered:{RESET} {BOLD}{name}{RESET} {DIM}(by {agent}){RESET}")

    elif event_type == EventType.WORKFLOW_COMPLETED:
        success = payload.get("success", False)
        dur = payload.get("duration_seconds", 0.0)
        mark = f"{GREEN}COMPLETED IN {dur:.2f}s{RESET}" if success else f"{RED}FAILED IN {dur:.2f}s{RESET}"
        print(f"\n{BLUE}[{timestamp}] 🏁 Workflow Result:{RESET} {mark}\n")


def display_results(result: OrchestratorResult, output_dir: str = None):
    """Prints a polished summary and writes artifacts to disk if requested."""
    print(f"\n{CYAN}{BOLD}======================================================================{RESET}")
    print(f"{CYAN}{BOLD}                    EXECUTION DELIVERABLES & METRICS                  {RESET}")
    print(f"{CYAN}{BOLD}======================================================================{RESET}")
    print(f"  Execution ID       : {BOLD}{result.execution_id}{RESET}")
    print(f"  Total Duration     : {BOLD}{result.duration_seconds:.2f} seconds{RESET}")
    print(f"  QA Verification    : {GREEN if result.qa_passed else RED}{BOLD}{'PASSED ✓' if result.qa_passed else 'FAILED ✗'}{RESET}")
    print(f"  Self-Healing Loops : {YELLOW if result.healing_iterations > 0 else GREEN}{BOLD}{result.healing_iterations} iteration(s){RESET}")
    print(f"  Artifacts Produced : {BOLD}{len(result.artifacts)}{RESET}")

    print(f"\n{BOLD}Generated Deliverables:{RESET}")
    for name, content in result.artifacts.items():
        size = len(str(content))
        print(f"  • {GREEN}{name:<25}{RESET} ({size:,} bytes)")

    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        for name, content in result.artifacts.items():
            path = os.path.join(output_dir, name)
            with open(path, "w", encoding="utf-8") as f:
                f.write(str(content))
        print(f"\n{GREEN}✓ All artifacts saved to directory:{RESET} {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="Aegis Hierarchical Multi-Agent Orchestrator CLI")
    parser.add_argument(
        "--task",
        "-t",
        type=str,
        default=None,
        help="Task description for the agent team to execute.",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=None,
        help="Directory to save generated artifacts (e.g. ./output/).",
    )
    parser.add_argument(
        "--healing",
        type=int,
        default=3,
        help="Maximum self-healing recovery iterations (default: 3).",
    )
    parser.add_argument(
        "--simulate-defect",
        action="store_true",
        help="Intentionally inject a syntax defect to showcase self-healing auto-repair.",
    )

    args = parser.parse_args()
    print_banner()

    user_task = args.task
    if not user_task:
        print(f"{YELLOW}Enter your project goal / software specification:{RESET}")
        print(f"{DIM}(e.g., 'Build a real-time IoT anomaly detection engine with FastAPI and Streamlit dashboard'){RESET}\n")
        try:
            user_task = input(f"{BOLD}Goal > {RESET}").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            sys.exit(0)

    if not user_task:
        user_task = "Build an end-to-end customer churn prediction microservice with FastAPI and Streamlit dashboard"
        print(f"{DIM}No input provided. Using default demo specification:{RESET}\n{BOLD}'{user_task}'{RESET}\n")

    # Initialize Router and Orchestrator
    router = LLMRouter()
    orchestrator = MasterOrchestrator(
        llm_router=router,
        max_healing_iterations=args.healing,
    )

    result = orchestrator.run(user_request=user_task, on_event=handle_event)
    display_results(result, output_dir=args.output)


if __name__ == "__main__":
    main()
