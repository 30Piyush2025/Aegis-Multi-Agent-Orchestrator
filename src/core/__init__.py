"""
Aegis Core Package
==================
Foundation layer for the Aegis Hierarchical Multi-Agent System.
"""

from .domain_lead import (
    DomainLeadBase,
    EngineeringLead,
    QALead,
    ResearchLead,
)
from .llm_router import (
    ExecutionMode,
    LLMResponse,
    LLMRouter,
    OfflineSimulator,
)
from .orchestrator import (
    MasterOrchestrator,
    OrchestratorResult,
)
from .state import (
    AgentInfo,
    AgentStatus,
    BlackboardState,
    EventType,
    Message,
    MessageType,
    Task,
    TaskPriority,
    TaskStatus,
)

__all__ = [
    # State & Blackboard
    "AgentStatus",
    "TaskStatus",
    "TaskPriority",
    "MessageType",
    "EventType",
    "Message",
    "Task",
    "AgentInfo",
    "BlackboardState",
    # LLM Routing
    "ExecutionMode",
    "LLMResponse",
    "LLMRouter",
    "OfflineSimulator",
    # Domain Leads
    "DomainLeadBase",
    "ResearchLead",
    "EngineeringLead",
    "QALead",
    # Master Orchestrator
    "MasterOrchestrator",
    "OrchestratorResult",
]
