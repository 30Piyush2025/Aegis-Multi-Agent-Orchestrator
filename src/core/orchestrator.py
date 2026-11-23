"""
Aegis Master Orchestrator
=========================
Coordinates hierarchical multi-agent execution across Research, Engineering,
and QA domain leads. Manages DAG resolution, concurrency, autonomous self-healing,
and deliverable packaging.
"""

from __future__ import annotations

import concurrent.futures
import copy
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from .domain_lead import EngineeringLead, QALead, ResearchLead
from .llm_router import LLMRouter
from .state import (
    AgentStatus,
    BlackboardState,
    EventType,
    Message,
    MessageType,
    Task,
    TaskPriority,
    TaskStatus,
)

logger = logging.getLogger("aegis.core.orchestrator")


@dataclass
class OrchestratorResult:
    """Consolidated deliverables and metrics returned from MasterOrchestrator."""
    execution_id: str
    user_request: str
    success: bool
    duration_seconds: float
    healing_iterations: int
    qa_passed: bool
    artifacts: Dict[str, Any]
    summary: Dict[str, Any]
    blackboard_export: Dict[str, Any]
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "execution_id": self.execution_id,
            "user_request": self.user_request,
            "success": self.success,
            "duration_seconds": self.duration_seconds,
            "healing_iterations": self.healing_iterations,
            "qa_passed": self.qa_passed,
            "artifacts_count": len(self.artifacts),
            "summary": self.summary,
            "error": self.error,
        }


class MasterOrchestrator:
    """
    Central control plane for the Aegis Hierarchical Multi-Agent System.
    Decomposes user objectives into an execution DAG across Domain Leads,
    orchestrates parallel/sequential execution, executes self-healing remediation,
    and packages verified software deliverables.
    """

    def __init__(
        self,
        llm_router: Optional[LLMRouter] = None,
        max_healing_iterations: int = 3,
        max_workers: int = 4,
    ) -> None:
        self.llm_router = llm_router or LLMRouter()
        self.max_healing_iterations = max_healing_iterations
        self.max_workers = max_workers

        # Instantiate Domain Leads
        self.research_lead = ResearchLead(llm_router=self.llm_router)
        self.engineering_lead = EngineeringLead(llm_router=self.llm_router)
        self.qa_lead = QALead(llm_router=self.llm_router)

    def run(
        self,
        user_request: str,
        on_event: Optional[Callable[[EventType, Dict[str, Any]], None]] = None,
    ) -> OrchestratorResult:
        """
        Execute full autonomous pipeline for a given user request:
        1. Initialize Blackboard & Register Leads
        2. Phase 1: Research & Architectural RFC
        3. Phase 2: Engineering & Code Generation
        4. Phase 3: QA Verification & Self-Healing Loop
        5. Package Final Deliverables
        """
        start_time = time.time()
        blackboard = BlackboardState(
            global_task=user_request,
            max_healing_iterations=self.max_healing_iterations,
        )

        # Register UI / CLI subscriber if supplied
        if on_event:
            blackboard.subscribe("*", on_event)

        # Register Domain Leads
        self.research_lead.register(blackboard)
        self.engineering_lead.register(blackboard)
        self.qa_lead.register(blackboard)

        blackboard.notify(
            EventType.WORKFLOW_STARTED,
            {"execution_id": blackboard.execution_id, "user_request": user_request},
        )

        logger.info(f"Initiating Aegis Orchestration [{blackboard.execution_id}] for: '{user_request}'")

        try:
            # -----------------------------------------------------------------
            # Phase 1: Research & Architectural Specification
            # -----------------------------------------------------------------
            logger.info(">>> Phase 1: Research & Architecture Formulation")
            research_task = Task(
                title="System Architecture & Tech Stack Research",
                description=f"Formulate architectural RFC, stack selections, and data contracts for: {user_request}",
                domain="RESEARCH",
                priority=TaskPriority.CRITICAL,
                inputs={"user_request": user_request},
                assigned_to=self.research_lead.name,
            )
            blackboard.add_task(research_task)

            research_deliverables = self.research_lead.execute(research_task, blackboard)
            architecture_rfc = research_deliverables.get("rfc_content", "")

            # -----------------------------------------------------------------
            # Phase 2: Engineering & Implementation
            # -----------------------------------------------------------------
            logger.info(">>> Phase 2: Engineering & Codebase Generation")
            engineering_task = Task(
                title="Codebase Implementation & Assembly",
                description=f"Implement database, backend, and frontend for: {user_request}",
                domain="ENGINEERING",
                priority=TaskPriority.CRITICAL,
                dependencies=[research_task.id],
                inputs={"user_request": user_request, "architecture_rfc": architecture_rfc},
                assigned_to=self.engineering_lead.name,
            )
            blackboard.add_task(engineering_task)

            engineering_deliverables = self.engineering_lead.execute(engineering_task, blackboard)

            # -----------------------------------------------------------------
            # Phase 3: Quality Assurance & Self-Healing Remediation
            # -----------------------------------------------------------------
            logger.info(">>> Phase 3: QA Verification & Automated Audit")
            qa_task = Task(
                title="Quality Assurance & Verification Suite",
                description="Perform AST linting, test suite generation, and contract validation.",
                domain="QA",
                priority=TaskPriority.CRITICAL,
                dependencies=[engineering_task.id],
                inputs={"user_request": user_request},
                assigned_to=self.qa_lead.name,
            )
            blackboard.add_task(qa_task)

            qa_passed = self.qa_lead.verify_and_heal_if_needed(
                engineering_lead=self.engineering_lead,
                blackboard=blackboard,
            )

            if qa_passed:
                qa_task.mark_completed()
                blackboard.update_task_status(qa_task.id, TaskStatus.COMPLETED)
            else:
                qa_task.mark_failed("Max self-healing iterations reached without passing all QA gates")
                blackboard.update_task_status(qa_task.id, TaskStatus.FAILED)

            # -----------------------------------------------------------------
            # Phase 4: Final Deliverable Aggregation
            # -----------------------------------------------------------------
            duration = round(time.time() - start_time, 4)
            summary = blackboard.summary()

            blackboard.notify(
                EventType.WORKFLOW_COMPLETED,
                {
                    "execution_id": blackboard.execution_id,
                    "success": qa_passed,
                    "duration_seconds": duration,
                    "healing_iterations": blackboard.healing_iteration,
                },
            )

            result = OrchestratorResult(
                execution_id=blackboard.execution_id,
                user_request=user_request,
                success=qa_passed,
                duration_seconds=duration,
                healing_iterations=blackboard.healing_iteration,
                qa_passed=qa_passed,
                artifacts=copy.deepcopy(blackboard.artifacts),
                summary=summary,
                blackboard_export=blackboard.to_dict(),
            )
            return result

        except Exception as e:
            logger.error(f"Fatal error during Aegis orchestration: {e}", exc_info=True)
            duration = round(time.time() - start_time, 2)
            return OrchestratorResult(
                execution_id=blackboard.execution_id,
                user_request=user_request,
                success=False,
                duration_seconds=duration,
                healing_iterations=blackboard.healing_iteration,
                qa_passed=False,
                artifacts=copy.deepcopy(blackboard.artifacts),
                summary=blackboard.summary(),
                blackboard_export=blackboard.to_dict(),
                error=str(e),
            )
