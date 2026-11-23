"""
Aegis Core State Management & Blackboard Architecture
=====================================================
Provides centralized state tracking, inter-agent messaging, task representation,
and real-time event subscription for the Aegis Hierarchical Multi-Agent System.
"""

from __future__ import annotations

import copy
import enum
import json
import logging
import threading
import time
import uuid
from dataclasses import asdict, dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Union

logger = logging.getLogger("aegis.core.state")


class AgentStatus(str, enum.Enum):
    """Lifecycle status states for agents in the Aegis hierarchy."""
    IDLE = "IDLE"
    PLANNING = "PLANNING"
    WORKING = "WORKING"
    REVIEWING = "REVIEWING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    HEALING = "HEALING"

    def __str__(self) -> str:
        return self.value


class TaskStatus(str, enum.Enum):
    """Execution status for decomposed tasks in the DAG."""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REVISE = "REVISE"

    def __str__(self) -> str:
        return self.value


class TaskPriority(str, enum.Enum):
    """Priority levels for task scheduling."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

    def __str__(self) -> str:
        return self.value


class MessageType(str, enum.Enum):
    """Categorization of inter-agent communications."""
    TASK_ASSIGNMENT = "TASK_ASSIGNMENT"
    TASK_REPORT = "TASK_REPORT"
    REVIEW_FEEDBACK = "REVIEW_FEEDBACK"
    REMEDIATION_REQUEST = "REMEDIATION_REQUEST"
    HEALING_ALERT = "HEALING_ALERT"
    STATUS_UPDATE = "STATUS_UPDATE"
    SYSTEM_LOG = "SYSTEM_LOG"
    DELIVERABLE = "DELIVERABLE"
    BROADCAST = "BROADCAST"

    def __str__(self) -> str:
        return self.value


class EventType(str, enum.Enum):
    """Event types broadcasted to UI dashboards and listeners."""
    AGENT_STATUS_CHANGED = "AGENT_STATUS_CHANGED"
    TASK_CREATED = "TASK_CREATED"
    TASK_UPDATED = "TASK_UPDATED"
    TASK_COMPLETED = "TASK_COMPLETED"
    TASK_FAILED = "TASK_FAILED"
    MESSAGE_POSTED = "MESSAGE_POSTED"
    ARTIFACT_CREATED = "ARTIFACT_CREATED"
    HEALING_TRIGGERED = "HEALING_TRIGGERED"
    HEALING_RESOLVED = "HEALING_RESOLVED"
    WORKFLOW_STARTED = "WORKFLOW_STARTED"
    WORKFLOW_COMPLETED = "WORKFLOW_COMPLETED"
    DAG_UPDATED = "DAG_UPDATED"

    def __str__(self) -> str:
        return self.value


@dataclass
class Message:
    """Represents a discrete communication between agents or system components."""
    sender: str
    recipient: str
    content: str
    message_type: MessageType = MessageType.TASK_REPORT
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    task_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        """Convert message to serializable dictionary."""
        return {
            "id": self.id,
            "sender": self.sender,
            "recipient": self.recipient,
            "content": self.content,
            "message_type": str(self.message_type),
            "task_id": self.task_id,
            "metadata": copy.deepcopy(self.metadata),
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Message:
        """Instantiate message from dictionary."""
        msg_type = data.get("message_type", MessageType.TASK_REPORT)
        if isinstance(msg_type, str):
            try:
                msg_type = MessageType(msg_type)
            except ValueError:
                msg_type = MessageType.SYSTEM_LOG

        return cls(
            id=data.get("id", str(uuid.uuid4())),
            sender=data.get("sender", "unknown"),
            recipient=data.get("recipient", "broadcast"),
            content=data.get("content", ""),
            message_type=msg_type,
            task_id=data.get("task_id"),
            metadata=data.get("metadata", {}),
            timestamp=data.get("timestamp", time.time()),
        )


@dataclass
class Task:
    """Represents an atomic work item in the execution DAG."""
    title: str
    description: str
    domain: str  # RESEARCH, ENGINEERING, QA, ORCHESTRATION
    id: str = field(default_factory=lambda: f"TASK-{uuid.uuid4().hex[:8].upper()}")
    assigned_to: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    dependencies: List[str] = field(default_factory=list)  # list of task_ids
    inputs: Dict[str, Any] = field(default_factory=dict)
    outputs: Dict[str, Any] = field(default_factory=dict)
    artifacts: List[str] = field(default_factory=list)
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def mark_in_progress(self, agent_name: Optional[str] = None) -> None:
        """Mark task as currently executing."""
        self.status = TaskStatus.IN_PROGRESS
        if agent_name:
            self.assigned_to = agent_name
        self.updated_at = time.time()

    def mark_completed(self, outputs: Optional[Dict[str, Any]] = None, artifacts: Optional[List[str]] = None) -> None:
        """Mark task as successfully resolved."""
        self.status = TaskStatus.COMPLETED
        if outputs:
            self.outputs.update(outputs)
        if artifacts:
            for art in artifacts:
                if art not in self.artifacts:
                    self.artifacts.append(art)
        self.error = None
        self.updated_at = time.time()

    def mark_failed(self, error: str) -> None:
        """Mark task as failed and record diagnostic error message."""
        self.status = TaskStatus.FAILED
        self.error = error
        self.retry_count += 1
        self.updated_at = time.time()

    def mark_revise(self, feedback: str) -> None:
        """Mark task for remediation based on review feedback."""
        self.status = TaskStatus.REVISE
        self.error = feedback
        self.retry_count += 1
        self.updated_at = time.time()

    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary representation."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "domain": self.domain,
            "assigned_to": self.assigned_to,
            "status": str(self.status),
            "priority": str(self.priority),
            "dependencies": list(self.dependencies),
            "inputs": copy.deepcopy(self.inputs),
            "outputs": copy.deepcopy(self.outputs),
            "artifacts": list(self.artifacts),
            "error": self.error,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Task:
        """Reconstruct task from dictionary."""
        status_val = data.get("status", TaskStatus.PENDING)
        if isinstance(status_val, str):
            try:
                status_val = TaskStatus(status_val)
            except ValueError:
                status_val = TaskStatus.PENDING

        priority_val = data.get("priority", TaskPriority.MEDIUM)
        if isinstance(priority_val, str):
            try:
                priority_val = TaskPriority(priority_val)
            except ValueError:
                priority_val = TaskPriority.MEDIUM

        return cls(
            id=data.get("id", f"TASK-{uuid.uuid4().hex[:8].upper()}"),
            title=data.get("title", "Untitled Task"),
            description=data.get("description", ""),
            domain=data.get("domain", "GENERAL"),
            assigned_to=data.get("assigned_to"),
            status=status_val,
            priority=priority_val,
            dependencies=list(data.get("dependencies", [])),
            inputs=data.get("inputs", {}),
            outputs=data.get("outputs", {}),
            artifacts=list(data.get("artifacts", [])),
            error=data.get("error"),
            retry_count=data.get("retry_count", 0),
            max_retries=data.get("max_retries", 3),
            created_at=data.get("created_at", time.time()),
            updated_at=data.get("updated_at", time.time()),
        )


@dataclass
class AgentInfo:
    """Metadata tracking an agent registered in the system."""
    name: str
    role: str
    domain: str
    status: AgentStatus = AgentStatus.IDLE
    current_task_id: Optional[str] = None
    last_active: float = field(default_factory=time.time)
    metrics: Dict[str, Any] = field(default_factory=lambda: {
        "tasks_completed": 0,
        "tasks_failed": 0,
        "healings_performed": 0,
    })

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "role": self.role,
            "domain": self.domain,
            "status": str(self.status),
            "current_task_id": self.current_task_id,
            "last_active": self.last_active,
            "metrics": copy.deepcopy(self.metrics),
        }


# Type alias for event callbacks
EventCallback = Callable[[EventType, Dict[str, Any]], None]


class BlackboardState:
    """
    Thread-safe shared Blackboard that stores the global state of the
    Aegis multi-agent execution pipeline. Includes real-time pub/sub mechanism
    for UI observability (Streamlit / CLI dashboards).
    """

    def __init__(
        self,
        global_task: str = "",
        execution_id: Optional[str] = None,
        max_healing_iterations: int = 3,
    ) -> None:
        self._lock = threading.RLock()
        self.execution_id = execution_id or f"AEGIS-RUN-{uuid.uuid4().hex[:8].upper()}"
        self.global_task = global_task
        self.created_at = time.time()
        self.updated_at = time.time()

        # State storage
        self.domain_dag: Dict[str, Task] = {}
        self.agents: Dict[str, AgentInfo] = {}
        self.messages: List[Message] = []
        self.artifacts: Dict[str, Dict[str, Any]] = {}

        # Self-healing metrics
        self.healing_iteration = 0
        self.max_healing_iterations = max_healing_iterations
        self.healing_log: List[Dict[str, Any]] = []

        # Pub/Sub event listeners: event_name -> dict(sub_id -> callback)
        self._subscribers: Dict[str, Dict[str, EventCallback]] = {}

    # -------------------------------------------------------------------------
    # Event Pub/Sub Mechanism
    # -------------------------------------------------------------------------

    def subscribe(
        self,
        event_type: Union[EventType, str],
        callback: EventCallback,
    ) -> str:
        """
        Subscribe a callback to an event type or '*' for all events.
        Returns a unique subscription ID.
        """
        sub_id = str(uuid.uuid4())
        key = str(event_type)
        with self._lock:
            if key not in self._subscribers:
                self._subscribers[key] = {}
            self._subscribers[key][sub_id] = callback
        return sub_id

    def unsubscribe(self, subscription_id: str) -> bool:
        """Remove a subscriber by its subscription ID."""
        with self._lock:
            for key, subs in self._subscribers.items():
                if subscription_id in subs:
                    del subs[subscription_id]
                    return True
        return False

    def notify(self, event_type: Union[EventType, str], payload: Dict[str, Any]) -> None:
        """Notify all registered subscribers of an event (thread-safe)."""
        ev_key = str(event_type)
        callbacks_to_invoke: List[EventCallback] = []

        with self._lock:
            self.updated_at = time.time()
            # Direct subscribers
            if ev_key in self._subscribers:
                callbacks_to_invoke.extend(self._subscribers[ev_key].values())
            # Wildcard subscribers
            if "*" in self._subscribers:
                callbacks_to_invoke.extend(self._subscribers["*"].values())

        # Invoke callbacks outside lock to prevent deadlocks
        for cb in callbacks_to_invoke:
            try:
                cb(EventType(ev_key) if ev_key in EventType.__members__.values() else ev_key, payload)
            except Exception as e:
                logger.error(f"Error invoking subscriber callback for {ev_key}: {e}", exc_info=True)

    # -------------------------------------------------------------------------
    # Agent Registration & Status Tracking
    # -------------------------------------------------------------------------

    def register_agent(self, name: str, role: str, domain: str) -> AgentInfo:
        """Register an agent into the blackboard."""
        with self._lock:
            if name not in self.agents:
                agent = AgentInfo(name=name, role=role, domain=domain)
                self.agents[name] = agent
            else:
                agent = self.agents[name]
                agent.role = role
                agent.domain = domain
            agent.last_active = time.time()

        self.notify(
            EventType.AGENT_STATUS_CHANGED,
            {"agent_name": name, "status": str(agent.status), "role": role, "domain": domain},
        )
        return agent

    def set_agent_status(
        self,
        name: str,
        status: AgentStatus,
        current_task_id: Optional[str] = None,
    ) -> None:
        """Update an agent's lifecycle status."""
        with self._lock:
            if name not in self.agents:
                self.agents[name] = AgentInfo(
                    name=name,
                    role="Worker",
                    domain="GENERAL",
                    status=status,
                    current_task_id=current_task_id,
                )
            agent = self.agents[name]
            old_status = agent.status
            agent.status = status
            agent.current_task_id = current_task_id
            agent.last_active = time.time()

        self.notify(
            EventType.AGENT_STATUS_CHANGED,
            {
                "agent_name": name,
                "old_status": str(old_status),
                "new_status": str(status),
                "current_task_id": current_task_id,
            },
        )

    def get_agent(self, name: str) -> Optional[AgentInfo]:
        """Retrieve agent state."""
        with self._lock:
            return self.agents.get(name)

    # -------------------------------------------------------------------------
    # Task Management & DAG State
    # -------------------------------------------------------------------------

    def add_task(self, task: Task) -> None:
        """Add a new task into the execution DAG."""
        with self._lock:
            self.domain_dag[task.id] = task

        self.notify(
            EventType.TASK_CREATED,
            {"task_id": task.id, "title": task.title, "domain": task.domain, "priority": str(task.priority)},
        )

    def get_task(self, task_id: str) -> Optional[Task]:
        """Fetch task by ID."""
        with self._lock:
            return self.domain_dag.get(task_id)

    def update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        outputs: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        artifacts: Optional[List[str]] = None,
    ) -> Optional[Task]:
        """Update task status and trigger corresponding events."""
        with self._lock:
            task = self.domain_dag.get(task_id)
            if not task:
                logger.warning(f"Task {task_id} not found in blackboard.")
                return None

            task.status = status
            task.updated_at = time.time()

            if outputs:
                task.outputs.update(outputs)
            if error:
                task.error = error
            if artifacts:
                for art in artifacts:
                    if art not in task.artifacts:
                        task.artifacts.append(art)

            if status == TaskStatus.COMPLETED and task.assigned_to and task.assigned_to in self.agents:
                self.agents[task.assigned_to].metrics["tasks_completed"] += 1
            elif status == TaskStatus.FAILED and task.assigned_to and task.assigned_to in self.agents:
                self.agents[task.assigned_to].metrics["tasks_failed"] += 1

        # Event dispatch
        event = EventType.TASK_UPDATED
        if status == TaskStatus.COMPLETED:
            event = EventType.TASK_COMPLETED
        elif status == TaskStatus.FAILED:
            event = EventType.TASK_FAILED

        self.notify(
            event,
            {
                "task_id": task_id,
                "title": task.title,
                "domain": task.domain,
                "status": str(status),
                "error": error,
                "assigned_to": task.assigned_to,
            },
        )
        return task

    def get_ready_tasks(self, domain: Optional[str] = None) -> List[Task]:
        """
        Return tasks ready for execution:
        - Status is PENDING or REVISE
        - All declared dependencies are COMPLETED
        """
        ready: List[Task] = []
        with self._lock:
            for task in self.domain_dag.values():
                if domain and task.domain != domain:
                    continue
                if task.status not in (TaskStatus.PENDING, TaskStatus.REVISE):
                    continue

                # Check dependencies
                deps_met = True
                for dep_id in task.dependencies:
                    dep_task = self.domain_dag.get(dep_id)
                    if not dep_task or dep_task.status != TaskStatus.COMPLETED:
                        deps_met = False
                        break

                if deps_met:
                    ready.append(task)
        return ready

    def all_tasks_completed(self) -> bool:
        """Check if all tasks in the DAG are completed."""
        with self._lock:
            if not self.domain_dag:
                return False
            return all(t.status == TaskStatus.COMPLETED for t in self.domain_dag.values())

    def has_unrecoverable_failures(self) -> bool:
        """Check if any task exceeded maximum retries and permanently failed."""
        with self._lock:
            for t in self.domain_dag.values():
                if t.status == TaskStatus.FAILED and t.retry_count >= t.max_retries:
                    return True
            return False

    # -------------------------------------------------------------------------
    # Messaging
    # -------------------------------------------------------------------------

    def post_message(self, message: Message) -> None:
        """Log an inter-agent message to the blackboard and notify listeners."""
        with self._lock:
            self.messages.append(message)

        self.notify(
            EventType.MESSAGE_POSTED,
            message.to_dict(),
        )

    def get_messages(
        self,
        recipient: Optional[str] = None,
        sender: Optional[str] = None,
        task_id: Optional[str] = None,
    ) -> List[Message]:
        """Filter messages from the message log."""
        with self._lock:
            results = []
            for msg in self.messages:
                if recipient and msg.recipient != recipient and msg.recipient != "broadcast":
                    continue
                if sender and msg.sender != sender:
                    continue
                if task_id and msg.task_id != task_id:
                    continue
                results.append(msg)
            return results

    # -------------------------------------------------------------------------
    # Artifact Registry
    # -------------------------------------------------------------------------

    def record_artifact(
        self,
        name: str,
        content: Any,
        artifact_type: str = "text/markdown",
        created_by: str = "system",
        path: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Record a generated artifact (code, document, schema, test report)."""
        artifact_entry = {
            "name": name,
            "content": content,
            "type": artifact_type,
            "created_by": created_by,
            "path": path,
            "metadata": metadata or {},
            "timestamp": time.time(),
        }
        with self._lock:
            self.artifacts[name] = artifact_entry

        self.notify(
            EventType.ARTIFACT_CREATED,
            {
                "artifact_name": name,
                "type": artifact_type,
                "created_by": created_by,
                "path": path,
            },
        )
        return artifact_entry

    def get_artifact(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieve artifact by name."""
        with self._lock:
            return self.artifacts.get(name)

    # -------------------------------------------------------------------------
    # Self-Healing Loop State
    # -------------------------------------------------------------------------

    def trigger_healing(self, reason: str, failed_tasks: List[str]) -> bool:
        """
        Record a self-healing trigger. Returns True if healing can proceed,
        or False if max iterations exceeded.
        """
        with self._lock:
            if self.healing_iteration >= self.max_healing_iterations:
                logger.warning(
                    f"Max healing iterations ({self.max_healing_iterations}) reached. Cannot heal."
                )
                return False

            self.healing_iteration += 1
            entry = {
                "iteration": self.healing_iteration,
                "reason": reason,
                "failed_tasks": list(failed_tasks),
                "timestamp": time.time(),
            }
            self.healing_log.append(entry)

        self.notify(
            EventType.HEALING_TRIGGERED,
            entry,
        )
        return True

    def resolve_healing(self, iteration: int, resolution_notes: str) -> None:
        """Record successful resolution of a healing cycle."""
        with self._lock:
            for entry in self.healing_log:
                if entry.get("iteration") == iteration:
                    entry["resolved"] = True
                    entry["resolution_notes"] = resolution_notes
                    entry["resolved_at"] = time.time()

        self.notify(
            EventType.HEALING_RESOLVED,
            {"iteration": iteration, "resolution_notes": resolution_notes},
        )

    # -------------------------------------------------------------------------
    # State Serialization & Diagnostics
    # -------------------------------------------------------------------------

    def summary(self) -> Dict[str, Any]:
        """Return a structured overview of the blackboard."""
        with self._lock:
            total_tasks = len(self.domain_dag)
            completed_tasks = sum(1 for t in self.domain_dag.values() if t.status == TaskStatus.COMPLETED)
            failed_tasks = sum(1 for t in self.domain_dag.values() if t.status == TaskStatus.FAILED)
            in_progress = sum(1 for t in self.domain_dag.values() if t.status == TaskStatus.IN_PROGRESS)

            return {
                "execution_id": self.execution_id,
                "global_task": self.global_task,
                "healing_iteration": self.healing_iteration,
                "max_healing_iterations": self.max_healing_iterations,
                "tasks_count": {
                    "total": total_tasks,
                    "completed": completed_tasks,
                    "failed": failed_tasks,
                    "in_progress": in_progress,
                    "pending": total_tasks - (completed_tasks + failed_tasks + in_progress),
                },
                "agents_count": len(self.agents),
                "artifacts_count": len(self.artifacts),
                "messages_count": len(self.messages),
                "uptime_seconds": round(time.time() - self.created_at, 2),
            }

    def to_dict(self) -> Dict[str, Any]:
        """Export the entire blackboard state to a JSON-serializable dictionary."""
        with self._lock:
            return {
                "execution_id": self.execution_id,
                "global_task": self.global_task,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
                "healing_iteration": self.healing_iteration,
                "max_healing_iterations": self.max_healing_iterations,
                "healing_log": copy.deepcopy(self.healing_log),
                "domain_dag": {k: v.to_dict() for k, v in self.domain_dag.items()},
                "agents": {k: v.to_dict() for k, v in self.agents.items()},
                "messages": [m.to_dict() for m in self.messages],
                "artifacts": copy.deepcopy(self.artifacts),
                "summary": self.summary(),
            }

    def export_json(self, indent: int = 2) -> str:
        """Export blackboard state as formatted JSON string."""
        return json.dumps(self.to_dict(), indent=indent)
