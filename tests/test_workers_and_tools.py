"""
Unit and Integration Tests for Aegis Execution Tools & Atomic Workers
=====================================================================
Validates CodeRunner, ASTScanner, WebResearcher, BaseWorker, BackendWorker,
FrontendWorker, DatabaseWorker, TestRunnerWorker, SecurityWorker, and
Blackboard state synchronization.
"""

import os
import sys
import unittest

from src.core.state import BlackboardState, Task, TaskStatus
from src.tools.code_runner import CodeRunner
from src.tools.ast_scanner import ASTScanner
from src.tools.web_researcher import WebResearcher
from src.workers.backend_worker import BackendWorker
from src.workers.frontend_worker import FrontendWorker
from src.workers.db_worker import DatabaseWorker
from src.workers.qa_worker import TestRunnerWorker, SecurityWorker


class TestAegisTools(unittest.TestCase):
    """Test suite for Aegis execution and static analysis tools."""

    def setUp(self) -> None:
        self.runner = CodeRunner(default_timeout=5)
        self.scanner = ASTScanner()
        self.researcher = WebResearcher()

    def test_code_runner_valid(self) -> None:
        """CodeRunner executes valid python code and captures output."""
        res = self.runner.run_code("print('Hello Aegis')")
        self.assertTrue(res.success)
        self.assertEqual(res.returncode, 0)
        self.assertEqual(res.stdout.strip(), "Hello Aegis")

    def test_code_runner_syntax_error(self) -> None:
        """CodeRunner catches pre-flight syntax error safely."""
        res = self.runner.run_code("def broken(:")
        self.assertFalse(res.success)
        self.assertEqual(res.returncode, 1)
        self.assertIn("SyntaxError", res.stderr)

    def test_ast_scanner_clean_code(self) -> None:
        """ASTScanner gives 100 quality score for clean documented code."""
        code = '''
def calculate_metric(value: float, scale: float = 1.0) -> float:
    """Calculate scaled metric."""
    return value * scale
'''
        res = self.scanner.scan_code(code)
        self.assertTrue(res.is_valid_syntax)
        self.assertTrue(res.passed_quality_gate)
        self.assertEqual(res.quality_score, 100.0)
        self.assertIn("calculate_metric", res.functions)

    def test_ast_scanner_dangerous_patterns(self) -> None:
        """ASTScanner detects eval and os.system security risks."""
        insecure_code = '''
import os

def run_user_cmd(cmd: str):
    os.system(cmd)
    return eval(cmd)
'''
        res = self.scanner.scan_code(insecure_code)
        self.assertFalse(res.passed_quality_gate)
        self.assertLess(res.quality_score, 70.0)
        issue_types = [i.issue_type for i in res.security_issues]
        self.assertIn("COMMAND_INJECTION", issue_types)
        self.assertIn("INSECURE_EVAL", issue_types)

    def test_web_researcher_offline_fallback(self) -> None:
        """WebResearcher queries offline knowledge base seamlessly."""
        res = self.researcher.search("fastapi endpoints")
        self.assertGreater(len(res.findings), 0)
        self.assertGreater(len(res.recommended_patterns), 0)


class TestAegisAtomicWorkers(unittest.TestCase):
    """Test suite for Tier-3 Atomic Workers and Blackboard synchronization."""

    def setUp(self) -> None:
        self.state = BlackboardState(global_task="Microservice Integration Test")

    def test_backend_worker_execution(self) -> None:
        """BackendWorker produces valid FastAPI/Pydantic code with high AST score."""
        worker = BackendWorker()
        task = Task(title="User API", description="User management service", domain="ENGINEERING")
        self.state.add_task(task)

        res = worker.execute_task(task, state=self.state)
        self.assertEqual(res.status, "SUCCESS")
        self.assertGreaterEqual(res.quality_score, 70.0)
        self.assertTrue(os.path.exists(res.file_path))

    def test_frontend_worker_execution(self) -> None:
        """FrontendWorker produces valid Streamlit UI code."""
        worker = FrontendWorker()
        task = Task(title="Admin Console", description="Streamlit dashboard", domain="ENGINEERING")
        self.state.add_task(task)

        res = worker.execute_task(task, state=self.state)
        self.assertEqual(res.status, "SUCCESS")
        self.assertTrue(os.path.exists(res.file_path))

    def test_database_worker_execution(self) -> None:
        """DatabaseWorker creates SQLite repository and passes in-memory test."""
        worker = DatabaseWorker()
        task = Task(title="Catalog Schema", description="Product catalog schema", domain="ENGINEERING")
        self.state.add_task(task)

        res = worker.execute_task(task, state=self.state)
        self.assertEqual(res.status, "SUCCESS")
        self.assertTrue(os.path.exists(res.file_path))

    def test_test_runner_and_security_workers(self) -> None:
        """QA and Security workers verify deliverables and generate reports."""
        target_code = "def add(a: int, b: int) -> int:\n    return a + b\n"

        # TestRunner
        qa_worker = TestRunnerWorker()
        qa_task = Task(title="Add Function Tests", description="Unit tests", domain="QA", inputs={"code": target_code})
        self.state.add_task(qa_task)
        qa_res = qa_worker.execute_task(qa_task, state=self.state)
        self.assertEqual(qa_res.status, "SUCCESS")
        self.assertTrue(qa_res.metadata.get("tests_passed"))

        # SecurityWorker
        sec_worker = SecurityWorker()
        sec_task = Task(title="Security Scan", description="AST scan", domain="QA", inputs={"code": target_code})
        self.state.add_task(sec_task)
        sec_res = sec_worker.execute_task(sec_task, state=self.state)
        self.assertEqual(sec_res.status, "SUCCESS")
        self.assertEqual(sec_res.metadata.get("risk_level"), "LOW")


if __name__ == "__main__":
    unittest.main(verbosity=2)
