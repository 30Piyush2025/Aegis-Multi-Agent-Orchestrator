"""
Aegis Atomic Worker Base Class & Data Contracts
================================================
Defines BaseWorker abstract class, lifecycle states, WorkerResult contracts,
and integration bridges with the Aegis Blackboard State and Execution Tools.
"""

from __future__ import annotations

import copy
import enum
import logging
import os
import sys
import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple, Union

# Import Tools
from src.tools.ast_scanner import ASTAnalysisResult, ASTScanner
from src.tools.code_runner import CodeRunner, ExecutionResult
from src.tools.web_researcher import WebResearcher

# Safe imports from core state
try:
    from src.core.state import (
        AgentStatus,
        BlackboardState,
        EventType,
        Message,
        MessageType,
        Task,
        TaskStatus,
    )
except ImportError:
    # Standalone mock fallbacks if imported outside package context
    class AgentStatus(str, enum.Enum):  # type: ignore
        IDLE = "IDLE"
        PLANNING = "PLANNING"
        WORKING = "WORKING"
        REVIEWING = "REVIEWING"
        COMPLETED = "COMPLETED"
        FAILED = "FAILED"
        HEALING = "HEALING"

    class TaskStatus(str, enum.Enum):  # type: ignore
        PENDING = "PENDING"
        IN_PROGRESS = "IN_PROGRESS"
        BLOCKED = "BLOCKED"
        COMPLETED = "COMPLETED"
        FAILED = "FAILED"
        REVISE = "REVISE"

    class MessageType(str, enum.Enum):  # type: ignore
        TASK_ASSIGNMENT = "TASK_ASSIGNMENT"
        TASK_REPORT = "TASK_REPORT"
        REVIEW_FEEDBACK = "REVIEW_FEEDBACK"
        REMEDIATION_REQUEST = "REMEDIATION_REQUEST"
        HEALING_ALERT = "HEALING_ALERT"
        STATUS_UPDATE = "STATUS_UPDATE"
        SYSTEM_LOG = "SYSTEM_LOG"
        DELIVERABLE = "DELIVERABLE"
        BROADCAST = "BROADCAST"

    Task = Any  # type: ignore
    BlackboardState = Any  # type: ignore
    Message = Any  # type: ignore
    EventType = Any  # type: ignore

logger = logging.getLogger("aegis.workers")


class WorkerStatus(str, enum.Enum):
    """Execution status for atomic workers."""
    IDLE = "IDLE"
    WORKING = "WORKING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    HEALING = "HEALING"

    def __str__(self) -> str:
        return self.value


@dataclass
class WorkerResult:
    """Standardized output produced by an atomic execution worker."""
    worker_name: str
    task_id: str
    status: str  # "SUCCESS", "FAILED", "HEALING_REQUIRED"
    output_code: str = ""
    file_path: str = ""
    stdout: str = ""
    stderr: str = ""
    execution_time: float = 0.0
    errors: List[str] = field(default_factory=list)
    quality_score: float = 100.0
    ast_metrics: Dict[str, Any] = field(default_factory=dict)
    artifacts: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary representation."""
        return {
            "worker_name": self.worker_name,
            "task_id": self.task_id,
            "status": self.status,
            "output_code": self.output_code,
            "file_path": self.file_path,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "execution_time": round(self.execution_time, 4),
            "errors": list(self.errors),
            "quality_score": round(self.quality_score, 2),
            "ast_metrics": copy.deepcopy(self.ast_metrics),
            "artifacts": list(self.artifacts),
            "metadata": copy.deepcopy(self.metadata),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> WorkerResult:
        """Instantiate WorkerResult from dictionary."""
        return cls(
            worker_name=data.get("worker_name", "unknown_worker"),
            task_id=data.get("task_id", "unknown_task"),
            status=data.get("status", "FAILED"),
            output_code=data.get("output_code", ""),
            file_path=data.get("file_path", ""),
            stdout=data.get("stdout", ""),
            stderr=data.get("stderr", ""),
            execution_time=data.get("execution_time", 0.0),
            errors=list(data.get("errors", [])),
            quality_score=data.get("quality_score", 100.0),
            ast_metrics=dict(data.get("ast_metrics", {})),
            artifacts=list(data.get("artifacts", [])),
            metadata=dict(data.get("metadata", {})),
        )


class BaseWorker(ABC):
    """
    Abstract Base Class for all Aegis Atomic Execution Workers.
    Provides execution sandboxing, static AST verification, research retrieval,
    and automatic blackboard lifecycle synchronization.
    """

    def __init__(
        self,
        name: str,
        role: str,
        domain: str = "ENGINEERING",
        output_dir: Optional[str] = None,
        code_runner: Optional[CodeRunner] = None,
        ast_scanner: Optional[ASTScanner] = None,
        web_researcher: Optional[WebResearcher] = None,
    ) -> None:
        self.name = name
        self.role = role
        self.domain = domain
        self.status = WorkerStatus.IDLE

        # Project output storage
        self.output_dir = output_dir or os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "generated_code")
        )
        os.makedirs(self.output_dir, exist_ok=True)

        # Execution and analysis tools
        self.code_runner = code_runner or CodeRunner()
        self.ast_scanner = ast_scanner or ASTScanner()
        self.web_researcher = web_researcher or WebResearcher()

    def log(self, message: str, level: str = "INFO") -> None:
        """Emit formatted log message."""
        lvl = getattr(logging, level.upper(), logging.INFO)
        logger.log(lvl, f"[{self.name} | {self.role}] {message}")

    def validate_code(self, code: str) -> Tuple[bool, ASTAnalysisResult]:
        """Validate code syntax and security gates using ASTScanner."""
        result = self.ast_scanner.scan_code(code)
        return result.passed_quality_gate, result

    def save_artifact(
        self,
        filename: str,
        content: str,
        subdir: Optional[str] = None,
    ) -> str:
        """Write generated code or artifact to the persistent workspace."""
        target_dir = os.path.join(self.output_dir, subdir) if subdir else self.output_dir
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, filename)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        self.log(f"Artifact saved: {file_path}")
        return file_path

    # -------------------------------------------------------------------------
    # Blackboard Lifecycle Helpers
    # -------------------------------------------------------------------------

    def _sync_start(
        self,
        task_id: str,
        state: Optional[BlackboardState],
    ) -> None:
        """Update status to WORKING on worker and blackboard."""
        self.status = WorkerStatus.WORKING
        if state is not None:
            try:
                state.register_agent(name=self.name, role=self.role, domain=self.domain)
                state.set_agent_status(
                    name=self.name,
                    status=AgentStatus.WORKING,
                    current_task_id=task_id,
                )
                task = state.get_task(task_id)
                if task:
                    task.mark_in_progress(agent_name=self.name)
            except Exception as e:
                self.log(f"Blackboard start synchronization warning: {e}", level="WARNING")

    def _sync_finish(
        self,
        task_id: str,
        result: WorkerResult,
        state: Optional[BlackboardState],
    ) -> None:
        """Update status on worker and blackboard on task completion."""
        self.status = WorkerStatus.SUCCESS if result.status == "SUCCESS" else WorkerStatus.FAILED
        if state is not None:
            try:
                target_status = AgentStatus.COMPLETED if result.status == "SUCCESS" else AgentStatus.FAILED
                state.set_agent_status(
                    name=self.name,
                    status=target_status,
                    current_task_id=None,
                )

                # Post task report message
                msg_content = (
                    f"Task {task_id} {result.status.lower()} by {self.name}.\n"
                    f"Quality score: {result.quality_score:.1f}/100\n"
                    f"Artifacts: {', '.join(result.artifacts) if result.artifacts else 'None'}"
                )
                try:
                    state.post_message(
                        Message(
                            sender=self.name,
                            recipient="lead",
                            content=msg_content,
                            message_type=MessageType.TASK_REPORT,
                            task_id=task_id,
                            metadata={"quality_score": result.quality_score},
                        )
                    )
                except Exception:
                    pass

                # Update task in DAG
                t_status = TaskStatus.COMPLETED if result.status == "SUCCESS" else TaskStatus.FAILED
                state.update_task_status(
                    task_id=task_id,
                    status=t_status,
                    outputs={"output_code": result.output_code, "metrics": result.ast_metrics},
                    error=result.errors[0] if result.errors else None,
                    artifacts=result.artifacts,
                )

                # Record artifacts
                if result.file_path and os.path.exists(result.file_path):
                    state.record_artifact(
                        name=os.path.basename(result.file_path),
                        content=result.output_code,
                        artifact_type="text/x-python",
                        created_by=self.name,
                        path=result.file_path,
                        metadata=result.ast_metrics,
                    )
            except Exception as e:
                self.log(f"Blackboard finish synchronization warning: {e}", level="WARNING")

    # -------------------------------------------------------------------------
    # Core Abstract Interface
    # -------------------------------------------------------------------------

    @abstractmethod
    def execute_task(
        self,
        task_spec: Union[Task, Dict[str, Any]],
        state: Optional[BlackboardState] = None,
    ) -> WorkerResult:
        """
        Execute an atomic engineering or analysis task.
        Must be implemented by concrete worker subclasses.
        """
        raise NotImplementedError("Subclasses must implement execute_task")

    def heal(
        self,
        task_spec: Union[Task, Dict[str, Any]],
        error_context: Dict[str, Any],
        state: Optional[BlackboardState] = None,
    ) -> WorkerResult:
        """
        Closed-loop self-healing hook called when a task fails validation or testing.
        Subclasses can override to inspect errors and patch generated code.
        """
        self.status = WorkerStatus.HEALING
        self.log(f"Entering self-healing cycle for error: {error_context.get('error', 'unknown')}")
        # Default fallback re-runs execute_task with error context attached to spec
        spec_dict = task_spec.to_dict() if hasattr(task_spec, "to_dict") else dict(task_spec)
        spec_dict["remediation_context"] = error_context
        return self.execute_task(spec_dict, state=state)
