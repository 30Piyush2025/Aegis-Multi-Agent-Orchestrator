"""
Aegis Static AST Code Analyzer & Security Gate
==============================================
Parses Python code using the standard library abstract syntax tree (ast) module
to verify syntax validity, identify dangerous patterns (eval, exec, command injection),
count classes and functions, measure cyclomatic complexity, and calculate a quality score.
"""

from __future__ import annotations

import ast
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple


@dataclass
class SecurityIssue:
    """Represents a potential security risk or vulnerability detected in AST scan."""
    severity: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    issue_type: str
    line_number: int
    description: str
    code_snippet: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert security issue to dictionary."""
        return {
            "severity": self.severity,
            "issue_type": self.issue_type,
            "line_number": self.line_number,
            "description": self.description,
            "code_snippet": self.code_snippet,
        }


@dataclass
class ASTAnalysisResult:
    """Comprehensive diagnostic results of an AST static code scan."""
    is_valid_syntax: bool = True
    syntax_error: Optional[str] = None
    error_line: Optional[int] = None
    num_functions: int = 0
    num_classes: int = 0
    num_lines: int = 0
    num_imports: int = 0
    cyclomatic_complexity: int = 1
    functions: List[str] = field(default_factory=list)
    classes: List[str] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    docstrings_count: int = 0
    has_type_hints: bool = False
    security_issues: List[SecurityIssue] = field(default_factory=list)
    quality_score: float = 100.0
    passed_quality_gate: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert analysis result to dictionary."""
        return {
            "is_valid_syntax": self.is_valid_syntax,
            "syntax_error": self.syntax_error,
            "error_line": self.error_line,
            "num_functions": self.num_functions,
            "num_classes": self.num_classes,
            "num_lines": self.num_lines,
            "num_imports": self.num_imports,
            "cyclomatic_complexity": self.cyclomatic_complexity,
            "functions": list(self.functions),
            "classes": list(self.classes),
            "imports": list(self.imports),
            "docstrings_count": self.docstrings_count,
            "has_type_hints": self.has_type_hints,
            "security_issues": [issue.to_dict() for issue in self.security_issues],
            "quality_score": round(self.quality_score, 2),
            "passed_quality_gate": self.passed_quality_gate,
        }

    def summary(self) -> str:
        """Formatted human-readable diagnostic report."""
        if not self.is_valid_syntax:
            return f"SYNTAX ERROR on line {self.error_line}: {self.syntax_error}"

        gate = "PASSED" if self.passed_quality_gate else "FAILED"
        issues_str = (
            f"\n  Issues ({len(self.security_issues)}): " +
            ", ".join([f"[{i.severity}] {i.description}" for i in self.security_issues[:3]])
            if self.security_issues else "None"
        )
        return (
            f"Quality Gate: [{gate}] | Score: {self.quality_score:.1f}/100 | "
            f"Functions: {self.num_functions} | Classes: {self.num_classes} | "
            f"Complexity: {self.cyclomatic_complexity} | Lines: {self.num_lines}"
            f"{issues_str}"
        )


class _ASTVisitor(ast.NodeVisitor):
    """Internal AST visitor that traverses the syntax tree to inspect safety and structure."""

    DANGEROUS_FUNCTIONS = {
        "eval": ("CRITICAL", "INSECURE_EVAL", "Direct use of eval() enables arbitrary code execution."),
        "exec": ("CRITICAL", "INSECURE_EXEC", "Direct use of exec() enables arbitrary dynamic execution."),
        "compile": ("HIGH", "DYNAMIC_COMPILE", "Dynamic code compilation may bypass static safety constraints."),
        "__import__": ("MEDIUM", "DYNAMIC_IMPORT", "Dynamic module importing can lead to arbitrary code loading."),
    }

    DANGEROUS_MODULE_CALLS = {
        ("os", "system"): ("CRITICAL", "COMMAND_INJECTION", "os.system() introduces high risk of shell command injection."),
        ("os", "popen"): ("HIGH", "COMMAND_INJECTION", "os.popen() executes shell commands without argument escaping."),
        ("posix", "system"): ("CRITICAL", "COMMAND_INJECTION", "posix.system() executes raw shell commands."),
        ("pty", "spawn"): ("CRITICAL", "SHELL_SPAWN", "pty.spawn() launches an interactive shell session."),
        ("pickle", "loads"): ("HIGH", "UNSAFE_DESERIALIZATION", "pickle.loads() can execute arbitrary payload on unpickling."),
        ("pickle", "load"): ("HIGH", "UNSAFE_DESERIALIZATION", "pickle.load() from untrusted source enables code execution."),
        ("marshal", "loads"): ("HIGH", "UNSAFE_DESERIALIZATION", "marshal.loads() deserializes raw bytecode."),
    }

    SECRET_PATTERN = re.compile(r"(?i)(api[_-]?key|secret|password|auth[_-]?token|private[_-]?key)")

    def __init__(self, raw_lines: List[str]) -> None:
        self.raw_lines = raw_lines
        self.functions: List[str] = []
        self.classes: List[str] = []
        self.imports: List[str] = []
        self.security_issues: List[SecurityIssue] = []
        self.docstrings_count: int = 0
        self.type_hint_count: int = 0
        self.complexity: int = 1

    def _get_line_snippet(self, lineno: int) -> str:
        """Extract line snippet safely."""
        if 1 <= lineno <= len(self.raw_lines):
            return self.raw_lines[lineno - 1].strip()
        return ""

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        """Inspect function definitions."""
        self.functions.append(node.name)
        if ast.get_docstring(node):
            self.docstrings_count += 1

        # Check type annotations
        if node.returns or any(arg.annotation for arg in node.args.args):
            self.type_hint_count += 1

        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        """Inspect async function definitions."""
        self.functions.append(node.name)
        if ast.get_docstring(node):
            self.docstrings_count += 1
        if node.returns or any(arg.annotation for arg in node.args.args):
            self.type_hint_count += 1
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        """Inspect class definitions."""
        self.classes.append(node.name)
        if ast.get_docstring(node):
            self.docstrings_count += 1
        self.generic_visit(node)

    def visit_Import(self, node: ast.Import) -> None:
        """Track standard imports."""
        for alias in node.names:
            self.imports.append(alias.name)
            if alias.name in ("telnetlib", "posix"):
                self.security_issues.append(
                    SecurityIssue(
                        severity="MEDIUM",
                        issue_type="SUSPICIOUS_IMPORT",
                        line_number=node.lineno,
                        description=f"Import of deprecated or risky module '{alias.name}'.",
                        code_snippet=self._get_line_snippet(node.lineno),
                    )
                )
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        """Track from ... import ... imports."""
        mod = node.module or ""
        for alias in node.names:
            full_name = f"{mod}.{alias.name}" if mod else alias.name
            self.imports.append(full_name)
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        """Inspect function calls for dangerous behaviors."""
        # 1. Direct function call (e.g., eval(), exec())
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            if func_name in self.DANGEROUS_FUNCTIONS:
                sev, issue_type, desc = self.DANGEROUS_FUNCTIONS[func_name]
                self.security_issues.append(
                    SecurityIssue(
                        severity=sev,
                        issue_type=issue_type,
                        line_number=node.lineno,
                        description=desc,
                        code_snippet=self._get_line_snippet(node.lineno),
                    )
                )

        # 2. Attribute call (e.g., os.system(), subprocess.run())
        elif isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name):
                module_name = node.func.value.id
                method_name = node.func.attr
                key = (module_name, method_name)

                if key in self.DANGEROUS_MODULE_CALLS:
                    sev, issue_type, desc = self.DANGEROUS_MODULE_CALLS[key]
                    self.security_issues.append(
                        SecurityIssue(
                            severity=sev,
                            issue_type=issue_type,
                            line_number=node.lineno,
                            description=desc,
                            code_snippet=self._get_line_snippet(node.lineno),
                        )
                    )

                # Subprocess with shell=True detection
                if module_name == "subprocess" and method_name in ("run", "Popen", "call", "check_call", "check_output"):
                    for kw in node.keywords:
                        if kw.arg == "shell":
                            # Check if shell is set to True
                            if isinstance(kw.value, ast.Constant) and kw.value.value is True:
                                self.security_issues.append(
                                    SecurityIssue(
                                        severity="HIGH",
                                        issue_type="SHELL_TRUE_INJECTION",
                                        line_number=node.lineno,
                                        description="subprocess call with shell=True invites command injection.",
                                        code_snippet=self._get_line_snippet(node.lineno),
                                    )
                                )

        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> None:
        """Detect potentially hardcoded API keys and secrets."""
        for target in node.targets:
            if isinstance(target, ast.Name):
                var_name = target.id
                if self.SECRET_PATTERN.search(var_name):
                    # Check if assigned value is a non-empty string literal
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                        secret_val = node.value.value.strip()
                        # Avoid flagging placeholder strings
                        if len(secret_val) >= 16 and not any(placeholder in secret_val.lower() for placeholder in ["your_", "placeholder", "xxx", "mock", "test", "todo"]):
                            self.security_issues.append(
                                SecurityIssue(
                                    severity="MEDIUM",
                                    issue_type="HARDCODED_SECRET",
                                    line_number=node.lineno,
                                    description=f"Potential hardcoded credential or secret detected in variable '{var_name}'.",
                                    code_snippet=f"{var_name} = '***REDACTED***'",
                                )
                            )
        self.generic_visit(node)

    # Cyclomatic complexity branch points
    def visit_If(self, node: ast.If) -> None:
        self.complexity += 1
        self.generic_visit(node)

    def visit_For(self, node: ast.For) -> None:
        self.complexity += 1
        self.generic_visit(node)

    def visit_AsyncFor(self, node: ast.AsyncFor) -> None:
        self.complexity += 1
        self.generic_visit(node)

    def visit_While(self, node: ast.While) -> None:
        self.complexity += 1
        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler) -> None:
        self.complexity += 1
        self.generic_visit(node)

    def visit_With(self, node: ast.With) -> None:
        self.complexity += 1
        self.generic_visit(node)

    def visit_BoolOp(self, node: ast.BoolOp) -> None:
        self.complexity += len(node.values) - 1
        self.generic_visit(node)


class ASTScanner:
    """
    Static code analyzer providing quality scoring, syntax verification,
    and security vulnerability detection for Python source code.
    """

    def scan_code(self, code: str) -> ASTAnalysisResult:
        """
        Analyze Python code string. Returns ASTAnalysisResult with complete metrics
        and quality gate status.
        """
        raw_lines = code.splitlines()
        num_lines = len(raw_lines)

        # 1. Parse Abstract Syntax Tree
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return ASTAnalysisResult(
                is_valid_syntax=False,
                syntax_error=f"{e.msg} on line {e.lineno}",
                error_line=e.lineno,
                num_lines=num_lines,
                quality_score=0.0,
                passed_quality_gate=False,
            )

        # 2. Traverse Tree with Auditor Visitor
        visitor = _ASTVisitor(raw_lines)
        visitor.visit(tree)

        # 3. Calculate Code Quality Score (0 to 100)
        score = 100.0

        # Penalties for security issues
        for issue in visitor.security_issues:
            if issue.severity == "CRITICAL":
                score -= 35.0
            elif issue.severity == "HIGH":
                score -= 20.0
            elif issue.severity == "MEDIUM":
                score -= 10.0
            elif issue.severity == "LOW":
                score -= 5.0

        # Penalties for excessive cyclomatic complexity
        if visitor.complexity > 15:
            score -= min(15.0, (visitor.complexity - 15) * 1.5)

        # Documentation health
        total_entities = len(visitor.functions) + len(visitor.classes)
        if total_entities > 0:
            doc_ratio = visitor.docstrings_count / total_entities
            if doc_ratio < 0.4:
                score -= 10.0
            elif doc_ratio < 0.7:
                score -= 5.0

        # Type hint bonus / penalty
        if visitor.functions and visitor.type_hint_count > 0:
            score += min(5.0, (visitor.type_hint_count / len(visitor.functions)) * 5.0)

        # Clamp between 0.0 and 100.0
        score = max(0.0, min(100.0, score))

        # 4. Determine Quality Gate
        has_critical = any(i.severity == "CRITICAL" for i in visitor.security_issues)
        passed_gate = (score >= 70.0) and not has_critical

        return ASTAnalysisResult(
            is_valid_syntax=True,
            syntax_error=None,
            error_line=None,
            num_functions=len(visitor.functions),
            num_classes=len(visitor.classes),
            num_lines=num_lines,
            num_imports=len(visitor.imports),
            cyclomatic_complexity=visitor.complexity,
            functions=visitor.functions,
            classes=visitor.classes,
            imports=visitor.imports,
            docstrings_count=visitor.docstrings_count,
            has_type_hints=(visitor.type_hint_count > 0),
            security_issues=visitor.security_issues,
            quality_score=score,
            passed_quality_gate=passed_gate,
        )

    def scan_file(self, file_path: str) -> ASTAnalysisResult:
        """Scan a Python file from disk."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return self.scan_code(content)
        except FileNotFoundError:
            return ASTAnalysisResult(
                is_valid_syntax=False,
                syntax_error=f"File not found: {file_path}",
                quality_score=0.0,
                passed_quality_gate=False,
            )
        except Exception as e:
            return ASTAnalysisResult(
                is_valid_syntax=False,
                syntax_error=f"Unable to read file: {e}",
                quality_score=0.0,
                passed_quality_gate=False,
            )
