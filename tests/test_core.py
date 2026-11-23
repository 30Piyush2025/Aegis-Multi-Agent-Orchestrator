"""
Comprehensive Unit & Integration Test Suite for Aegis Core Engine
==================================================================
Tests state management, blackboard pub/sub, multi-brain routing,
domain leads, and the master orchestrator.
"""

import ast
import unittest
import sys
import os

# Add Aegis root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.core.state import (
    AgentStatus,
    TaskStatus,
    TaskPriority,
    MessageType,
    EventType,
    Message,
    Task,
    AgentInfo,
    BlackboardState,
)
from src.core.llm_router import (
    ExecutionMode,
    LLMRouter,
    LLMResponse,
    OfflineSimulator,
)
from src.core.domain_lead import (
    DomainLeadBase,
    ResearchLead,
    EngineeringLead,
    QALead,
)
from src.core.orchestrator import (
    MasterOrchestrator,
    OrchestratorResult,
)


class TestAegisState(unittest.TestCase):
    """Test suite for Aegis state models, DAG tracking, and event pub/sub."""

    def setUp(self):
        self.bb = BlackboardState(global_task="Test Task Objective", max_healing_iterations=3)

    def test_enums(self):
        self.assertEqual(str(AgentStatus.IDLE), "IDLE")
        self.assertEqual(str(AgentStatus.HEALING), "HEALING")
        self.assertEqual(str(TaskStatus.COMPLETED), "COMPLETED")
        self.assertEqual(str(MessageType.TASK_ASSIGNMENT), "TASK_ASSIGNMENT")
        self.assertEqual(str(EventType.AGENT_STATUS_CHANGED), "AGENT_STATUS_CHANGED")

    def test_message_serialization(self):
        msg = Message(
            sender="LeadAgent",
            recipient="WorkerAgent",
            content="Execute subtask A",
            message_type=MessageType.TASK_ASSIGNMENT,
            metadata={"step": 1},
        )
        msg_dict = msg.to_dict()
        self.assertEqual(msg_dict["sender"], "LeadAgent")
        self.assertEqual(msg_dict["recipient"], "WorkerAgent")
        self.assertEqual(msg_dict["message_type"], "TASK_ASSIGNMENT")

        reconstructed = Message.from_dict(msg_dict)
        self.assertEqual(reconstructed.id, msg.id)
        self.assertEqual(reconstructed.content, msg.content)
        self.assertEqual(reconstructed.message_type, MessageType.TASK_ASSIGNMENT)

    def test_task_lifecycle(self):
        task = Task(
            title="Implement Data Access Layer",
            description="Create SQLite schemas and connection pools",
            domain="ENGINEERING",
            priority=TaskPriority.HIGH,
        )
        self.assertEqual(task.status, TaskStatus.PENDING)

        task.mark_in_progress("Worker-1")
        self.assertEqual(task.status, TaskStatus.IN_PROGRESS)
        self.assertEqual(task.assigned_to, "Worker-1")

        task.mark_completed(outputs={"tables_created": 3}, artifacts=["schema.sql"])
        self.assertEqual(task.status, TaskStatus.COMPLETED)
        self.assertEqual(task.outputs["tables_created"], 3)
        self.assertIn("schema.sql", task.artifacts)

        # Failure & revise
        task.mark_revise("Missing index on foreign key")
        self.assertEqual(task.status, TaskStatus.REVISE)
        self.assertEqual(task.retry_count, 1)

        task.mark_failed("Database connection timeout")
        self.assertEqual(task.status, TaskStatus.FAILED)
        self.assertEqual(task.retry_count, 2)

    def test_blackboard_agent_tracking(self):
        agent = self.bb.register_agent(name="Lead-1", role="Architecture Lead", domain="RESEARCH")
        self.assertEqual(agent.name, "Lead-1")
        self.assertEqual(agent.status, AgentStatus.IDLE)

        self.bb.set_agent_status("Lead-1", AgentStatus.WORKING, current_task_id="TASK-01")
        retrieved = self.bb.get_agent("Lead-1")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.status, AgentStatus.WORKING)
        self.assertEqual(retrieved.current_task_id, "TASK-01")

    def test_blackboard_dag_dependencies(self):
        task_a = Task(id="TASK-A", title="Task A", description="Dep", domain="ENG")
        task_b = Task(id="TASK-B", title="Task B", description="Dep", domain="ENG", dependencies=["TASK-A"])

        self.bb.add_task(task_a)
        self.bb.add_task(task_b)

        # Task B shouldn't be ready until Task A completes
        ready_tasks = self.bb.get_ready_tasks()
        ready_ids = [t.id for t in ready_tasks]
        self.assertIn("TASK-A", ready_ids)
        self.assertNotIn("TASK-B", ready_ids)

        # Complete Task A
        self.bb.update_task_status("TASK-A", TaskStatus.COMPLETED)
        ready_after = self.bb.get_ready_tasks()
        ready_after_ids = [t.id for t in ready_after]
        self.assertIn("TASK-B", ready_after_ids)

    def test_pub_sub_events(self):
        received_events = []

        def on_event(ev_type, payload):
            received_events.append((ev_type, payload))

        sub_id = self.bb.subscribe(EventType.MESSAGE_POSTED, on_event)

        msg = Message(sender="A", recipient="B", content="Hello event bus")
        self.bb.post_message(msg)

        self.assertEqual(len(received_events), 1)
        self.assertEqual(received_events[0][0], EventType.MESSAGE_POSTED)
        self.assertEqual(received_events[0][1]["content"], "Hello event bus")

        # Test wildcard subscription
        wildcard_events = []
        self.bb.subscribe("*", lambda ev, data: wildcard_events.append(ev))

        self.bb.register_agent("Agent-X", "Worker", "ENG")
        self.assertGreaterEqual(len(wildcard_events), 1)

        # Test unsubscribe
        self.assertTrue(self.bb.unsubscribe(sub_id))

    def test_self_healing_limits(self):
        self.assertTrue(self.bb.trigger_healing("Defect 1", ["task-1"]))
        self.assertEqual(self.bb.healing_iteration, 1)
        self.assertTrue(self.bb.trigger_healing("Defect 2", ["task-1"]))
        self.assertEqual(self.bb.healing_iteration, 2)
        self.assertTrue(self.bb.trigger_healing("Defect 3", ["task-1"]))
        self.assertEqual(self.bb.healing_iteration, 3)

        # 4th attempt should exceed budget
        self.assertFalse(self.bb.trigger_healing("Defect 4", ["task-1"]))
        self.assertEqual(self.bb.healing_iteration, 3)


class TestAegisLLMRouter(unittest.TestCase):
    """Test suite for Multi-Brain LLM Router and offline fallback."""

    def setUp(self):
        self.router = LLMRouter(mode=ExecutionMode.OFFLINE)

    def test_effective_provider(self):
        self.assertEqual(self.router.get_effective_provider(), "offline")

    def test_offline_simulator_responses(self):
        resp_arch = self.router.generate("Create research architecture RFC")
        self.assertIn("Architecture", resp_arch.content)
        self.assertEqual(resp_arch.provider, "offline")

        resp_db = self.router.generate("Write database schema SQL for users")
        self.assertIn("sqlite3", resp_db.content)

        resp_backend = self.router.generate("Generate backend API service")
        self.assertIn("BackendService", resp_backend.content)

        resp_frontend = self.router.generate("Create frontend dashboard UI")
        self.assertIn("DashboardRenderer", resp_frontend.content)

    def test_generate_json(self):
        data = self.router.generate_json("Plan domain execution")
        self.assertIsInstance(data, dict)
        self.assertIn("status", data)

    def test_ast_validity_of_offline_code(self):
        code = OfflineSimulator.simulate("backend API service")
        # Ensure simulated code is valid Python syntax
        tree = ast.parse(code)
        self.assertGreater(len(tree.body), 0)


class TestAegisDomainLeads(unittest.TestCase):
    """Test suite for ResearchLead, EngineeringLead, and QALead."""

    def setUp(self):
        self.router = LLMRouter(mode=ExecutionMode.OFFLINE)
        self.bb = BlackboardState(global_task="Build Microservice")

    def test_research_lead_lifecycle(self):
        lead = ResearchLead(llm_router=self.router)
        lead.register(self.bb)

        task = Task(title="Design System", description="Plan microservice", domain="RESEARCH")
        self.bb.add_task(task)

        deliverables = lead.execute(task, self.bb)
        self.assertEqual(deliverables["status"], "APPROVED")
        self.assertIn("ARCHITECTURE.md", self.bb.artifacts)

    def test_engineering_lead_lifecycle(self):
        lead = EngineeringLead(llm_router=self.router)
        lead.register(self.bb)

        task = Task(title="Build Codebase", description="Implement service", domain="ENGINEERING")
        self.bb.add_task(task)

        deliverables = lead.execute(task, self.bb)
        self.assertEqual(deliverables["status"], "READY_FOR_QA")
        self.assertGreaterEqual(deliverables["modules_count"], 1)

    def test_qa_lead_verification_and_healing(self):
        eng_lead = EngineeringLead(llm_router=self.router)
        qa_lead = QALead(llm_router=self.router)
        eng_lead.register(self.bb)
        qa_lead.register(self.bb)

        # Inject an engineering artifact with valid syntax
        self.bb.record_artifact(
            name="backend.py",
            content="def health():\n    return {'status': 'ok'}\n",
            artifact_type="text/x-python",
            created_by="EngineeringLead",
        )

        passed = qa_lead.verify_and_heal_if_needed(eng_lead, self.bb)
        self.assertTrue(passed)
        self.assertIn("QA_REPORT.md", self.bb.artifacts)

    def test_qa_healing_loop_on_syntax_defect(self):
        eng_lead = EngineeringLead(llm_router=self.router)
        qa_lead = QALead(llm_router=self.router)
        eng_lead.register(self.bb)
        qa_lead.register(self.bb)

        # Inject a defect with broken syntax
        self.bb.record_artifact(
            name="faulty_module.py",
            content="def broken_func(\n    # unclosed parentheses syntax error\n",
            artifact_type="text/x-python",
            created_by="FaultyWorker",
        )

        passed = qa_lead.verify_and_heal_if_needed(eng_lead, self.bb)
        # Verify self-healing was activated
        self.assertGreater(self.bb.healing_iteration, 0)
        self.assertIn("QA_REPORT.md", self.bb.artifacts)

    def test_blackboard_export_json(self):
        json_str = self.bb.export_json()
        self.assertIsInstance(json_str, str)
        self.assertIn("execution_id", json_str)
        self.assertIn("domain_dag", json_str)

    def test_llm_router_graceful_fallback_on_network_error(self):
        # Force groq mode with dummy key to test fallback
        faulty_router = LLMRouter(
            mode=ExecutionMode.GROQ,
            groq_api_key="invalid_dummy_key",
            timeout_seconds=0.5,
        )
        # Should gracefully fall back to offline simulation without throwing exception
        resp = faulty_router.generate("Create architecture RFC")
        self.assertTrue(resp.success)
        self.assertIsNotNone(resp.content)


class TestAegisMasterOrchestrator(unittest.TestCase):
    """Integration test suite for the MasterOrchestrator end-to-end execution."""

    def test_end_to_end_orchestration(self):
        router = LLMRouter(mode=ExecutionMode.OFFLINE)
        orchestrator = MasterOrchestrator(llm_router=router, max_healing_iterations=3)

        events_caught = []

        def tracker(ev_type, payload):
            events_caught.append(ev_type)

        result = orchestrator.run(
            user_request="Build high-performance real-time telemetry streaming service",
            on_event=tracker,
        )

        self.assertTrue(result.success)
        self.assertTrue(result.qa_passed)
        self.assertGreaterEqual(result.duration_seconds, 0)
        self.assertIn(EventType.WORKFLOW_STARTED, events_caught)
        self.assertIn(EventType.WORKFLOW_COMPLETED, events_caught)

        # Verify produced artifacts
        self.assertIn("ARCHITECTURE.md", result.artifacts)
        self.assertIn("QA_REPORT.md", result.artifacts)
        self.assertTrue(any(k.endswith(".py") for k in result.artifacts.keys()))

        # Check exportable dictionary
        res_dict = result.to_dict()
        self.assertEqual(res_dict["success"], True)
        self.assertGreaterEqual(res_dict["artifacts_count"], 3)


if __name__ == "__main__":
    unittest.main()
