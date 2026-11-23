"""
Aegis Code Execution Tool (Sandbox Runner)
=========================================
Provides safe Python code execution in isolated subprocesses and temporary
environments. Captures stdout, stderr, execution time, and return codes with
strict timeouts and environment sanitation.
"""

from __future__ import annotations

import os
import sys
import time
import tempfile
import subprocess
import shutil
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union


@dataclass
class ExecutionResult:
    """Represents the outcome of a sandboxed code execution."""
    stdout: str = ""
    stderr: str = ""
    returncode: int = 0
    execution_time: float = 0.0
    success: bool = True
    timed_out: bool = False
    error_message: Optional[str] = None
    file_path: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to serializable dictionary."""
        return {
            "stdout": self.stdout,
            "stderr": self.stderr,
            "returncode": self.returncode,
            "execution_time": round(self.execution_time, 4),
            "success": self.success,
            "timed_out": self.timed_out,
            "error_message": self.error_message,
            "file_path": self.file_path,
        }

    def summary(self) -> str:
        """Formatted human-readable summary."""
        status = "PASSED" if self.success else ("TIMED OUT" if self.timed_out else "FAILED")
        return (
            f"Execution [{status}] in {self.execution_time:.3f}s (code: {self.returncode})\n"
            f"STDOUT ({len(self.stdout)} chars):\n{self.stdout[:500]}\n"
            f"STDERR ({len(self.stderr)} chars):\n{self.stderr[:500]}"
        )


class CodeRunner:
    """
    Subprocess-isolated sandbox runner for generated Python code and test suites.
    Enforces timeout limits, clean environments, and temporary directory cleanup.
    """

    def __init__(
        self,
        default_timeout: int = 15,
        base_workdir: Optional[str] = None,
        python_executable: Optional[str] = None,
    ) -> None:
        self.default_timeout = default_timeout
        self.base_workdir = base_workdir or tempfile.gettempdir()
        self.python_executable = python_executable or sys.executable or "python3"

    def _sanitize_env(self, custom_env: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Build a sanitized environment preventing secret leakage while preserving system paths."""
        env = {}
        # Safe variables to inherit
        safe_keys = {
            "PATH", "LANG", "LC_ALL", "TERM", "USER", "HOME", "SHELL",
            "LD_LIBRARY_PATH", "TMPDIR", "TEMP", "TMP"
        }
        for k in safe_keys:
            if k in os.environ:
                env[k] = os.environ[k]

        # Ensure project root is in PYTHONPATH so workers can import src modules
        project_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..")
        )
        existing_pythonpath = os.environ.get("PYTHONPATH", "")
        env["PYTHONPATH"] = (
            f"{project_root}:{existing_pythonpath}" if existing_pythonpath else project_root
        )
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        env["PYTHONUNBUFFERED"] = "1"

        if custom_env:
            env.update(custom_env)

        return env

    def run_code(
        self,
        code: str,
        timeout: Optional[int] = None,
        env: Optional[Dict[str, str]] = None,
        cwd: Optional[str] = None,
        filename: str = "main.py",
    ) -> ExecutionResult:
        """
        Execute python code string inside an isolated temporary directory.
        Performs syntax compilation check before launching subprocess.
        """
        timeout = timeout or self.default_timeout

        # Step 1: Pre-execution syntax validation
        try:
            compile(code, filename, "exec")
        except SyntaxError as e:
            return ExecutionResult(
                stdout="",
                stderr=f"SyntaxError: {e.msg} (line {e.lineno})\n  {e.text or ''}",
                returncode=1,
                execution_time=0.001,
                success=False,
                timed_out=False,
                error_message=f"Pre-flight syntax error on line {e.lineno}: {e.msg}",
            )

        # Step 2: Isolated directory execution
        temp_dir = tempfile.mkdtemp(prefix="aegis_sandbox_", dir=self.base_workdir)
        script_path = os.path.join(temp_dir, filename)

        try:
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            exec_env = self._sanitize_env(env)
            target_cwd = cwd or temp_dir

            start_time = time.perf_counter()
            try:
                proc = subprocess.run(
                    [self.python_executable, script_path],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    env=exec_env,
                    cwd=target_cwd,
                )
                elapsed = time.perf_counter() - start_time

                return ExecutionResult(
                    stdout=proc.stdout or "",
                    stderr=proc.stderr or "",
                    returncode=proc.returncode,
                    execution_time=elapsed,
                    success=(proc.returncode == 0),
                    timed_out=False,
                    file_path=script_path,
                )

            except subprocess.TimeoutExpired as e:
                elapsed = time.perf_counter() - start_time
                stdout_captured = e.stdout.decode("utf-8", errors="replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
                stderr_captured = e.stderr.decode("utf-8", errors="replace") if isinstance(e.stderr, bytes) else (e.stderr or "")

                return ExecutionResult(
                    stdout=stdout_captured,
                    stderr=stderr_captured + f"\nProcess timed out after {timeout} seconds.",
                    returncode=124,
                    execution_time=elapsed,
                    success=False,
                    timed_out=True,
                    error_message=f"Execution timed out after {timeout} seconds",
                    file_path=script_path,
                )

        finally:
            # Cleanup temporary sandbox directory
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass

    def run_file(
        self,
        file_path: str,
        args: Optional[List[str]] = None,
        timeout: Optional[int] = None,
        cwd: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
    ) -> ExecutionResult:
        """Execute an existing Python file in a controlled subprocess."""
        timeout = timeout or self.default_timeout

        if not os.path.isfile(file_path):
            return ExecutionResult(
                stdout="",
                stderr=f"FileNotFoundError: Target file '{file_path}' does not exist.",
                returncode=2,
                execution_time=0.0,
                success=False,
                error_message=f"File not found: {file_path}",
            )

        cmd = [self.python_executable, file_path]
        if args:
            cmd.extend(args)

        exec_env = self._sanitize_env(env)
        target_cwd = cwd or os.path.dirname(os.path.abspath(file_path))

        start_time = time.perf_counter()
        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=exec_env,
                cwd=target_cwd,
            )
            elapsed = time.perf_counter() - start_time

            return ExecutionResult(
                stdout=proc.stdout or "",
                stderr=proc.stderr or "",
                returncode=proc.returncode,
                execution_time=elapsed,
                success=(proc.returncode == 0),
                timed_out=False,
                file_path=file_path,
            )
        except subprocess.TimeoutExpired as e:
            elapsed = time.perf_counter() - start_time
            stdout_str = e.stdout.decode("utf-8", errors="replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
            stderr_str = e.stderr.decode("utf-8", errors="replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
            return ExecutionResult(
                stdout=stdout_str,
                stderr=stderr_str + f"\nProcess timed out after {timeout} seconds.",
                returncode=124,
                execution_time=elapsed,
                success=False,
                timed_out=True,
                error_message=f"Execution timed out after {timeout} seconds",
                file_path=file_path,
            )

    def run_pytest(
        self,
        test_path: str,
        extra_args: Optional[List[str]] = None,
        timeout: int = 30,
        cwd: Optional[str] = None,
    ) -> ExecutionResult:
        """
        Execute pytest against a test file or test directory.
        Falls back to python unittest if pytest module is not installed.
        """
        exec_env = self._sanitize_env()
        target_cwd = cwd or (os.path.dirname(os.path.abspath(test_path)) if os.path.isfile(test_path) else test_path)

        # Check if pytest is available via python -m pytest
        has_pytest = False
        try:
            check = subprocess.run(
                [self.python_executable, "-c", "import pytest"],
                capture_output=True,
                timeout=5,
                env=exec_env,
            )
            has_pytest = (check.returncode == 0)
        except Exception:
            has_pytest = False

        if has_pytest:
            cmd = [self.python_executable, "-m", "pytest", test_path, "-v", "--tb=short"]
            if extra_args:
                cmd.extend(extra_args)
        else:
            # Fallback to standard library unittest
            if os.path.isfile(test_path):
                cmd = [self.python_executable, test_path]
            else:
                cmd = [self.python_executable, "-m", "unittest", "discover", "-s", test_path, "-v"]

        start_time = time.perf_counter()
        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=exec_env,
                cwd=target_cwd,
            )
            elapsed = time.perf_counter() - start_time

            return ExecutionResult(
                stdout=proc.stdout or "",
                stderr=proc.stderr or "",
                returncode=proc.returncode,
                execution_time=elapsed,
                success=(proc.returncode == 0),
                timed_out=False,
                file_path=test_path,
            )
        except subprocess.TimeoutExpired as e:
            elapsed = time.perf_counter() - start_time
            stdout_str = e.stdout.decode("utf-8", errors="replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
            stderr_str = e.stderr.decode("utf-8", errors="replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
            return ExecutionResult(
                stdout=stdout_str,
                stderr=stderr_str + f"\nPytest timed out after {timeout} seconds.",
                returncode=124,
                execution_time=elapsed,
                success=False,
                timed_out=True,
                error_message=f"Test run timed out after {timeout} seconds",
                file_path=test_path,
            )
