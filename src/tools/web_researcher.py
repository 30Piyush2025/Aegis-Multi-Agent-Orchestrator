"""
Aegis Web Researcher & Reference Retrieval Tool
================================================
Provides research capabilities with live web search fallback and a comprehensive,
deterministic enterprise knowledge base for Python architectures, frameworks,
best practices, and production code templates.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger("aegis.tools.researcher")


@dataclass
class ResearchResult:
    """Standardized research findings returned to agents."""
    query: str
    source: str  # "LIVE_WEB", "KNOWLEDGE_BASE", "HYBRID"
    findings: List[Dict[str, Any]] = field(default_factory=list)
    summary: str = ""
    recommended_patterns: List[str] = field(default_factory=list)
    code_templates: Dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert findings to dictionary representation."""
        return {
            "query": self.query,
            "source": self.source,
            "findings": self.findings,
            "summary": self.summary,
            "recommended_patterns": self.recommended_patterns,
            "code_templates": self.code_templates,
        }


class WebResearcher:
    """
    Search and reference retrieval engine with online search fallback and
    an offline deterministic knowledge base for modern Python application stacks.
    """

    KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
        "fastapi": {
            "title": "FastAPI Modern Async REST API Standard",
            "summary": "High-performance Python web framework utilizing Pydantic models for validation and OpenAPI generation.",
            "patterns": [
                "Use Pydantic BaseModel for request and response validation.",
                "Use APIRouter for modular endpoint separation.",
                "Inject database sessions via Depends() yield generator.",
                "Raise HTTPException with explicit status_code for business errors.",
            ],
            "templates": {
                "api_endpoint": (
                    "from fastapi import FastAPI, HTTPException, status, Depends\n"
                    "from pydantic import BaseModel, Field\n"
                    "from typing import List, Optional\n\n"
                    "app = FastAPI(title='Aegis Microservice API', version='1.0.0')\n\n"
                    "class ItemCreate(BaseModel):\n"
                    "    name: str = Field(..., min_length=1, max_length=100)\n"
                    "    description: Optional[str] = None\n"
                    "    price: float = Field(..., gt=0.0)\n\n"
                    "class ItemResponse(ItemCreate):\n"
                    "    id: int\n\n"
                    "@app.get('/health', tags=['Health'])\n"
                    "def health_check():\n"
                    "    return {'status': 'healthy', 'service': 'backend-api'}\n"
                )
            },
        },
        "flask": {
            "title": "Flask Enterprise Microframework Pattern",
            "summary": "Lightweight WSGI web framework suited for microservices, CLI integrations, and embedded tooling.",
            "patterns": [
                "Structure applications with Blueprints for domain modularity.",
                "Use jsonify for dictionary JSON serialization.",
                "Handle custom errors via @app.errorhandler decorator.",
            ],
            "templates": {
                "flask_app": (
                    "from flask import Flask, jsonify, request\n\n"
                    "app = Flask(__name__)\n\n"
                    "@app.route('/health', methods=['GET'])\n"
                    "def health():\n"
                    "    return jsonify({'status': 'healthy', 'service': 'flask-api'}), 200\n"
                )
            },
        },
        "streamlit": {
            "title": "Streamlit Interactive Mission Control UI",
            "summary": "Python framework for rapid creation of reactive dashboards, data visualizers, and multi-agent monitoring consoles.",
            "patterns": [
                "Set page config at the very beginning with st.set_page_config(layout='wide').",
                "Store persistent cross-run state in st.session_state.",
                "Organize dashboard into st.tabs or st.columns for clean ergonomics.",
                "Display KPI metrics using st.metric with delta indicators.",
            ],
            "templates": {
                "dashboard": (
                    "import streamlit as st\n\n"
                    "st.set_page_config(page_title='Aegis Mission Control', layout='wide')\n"
                    "st.title('🛡️ Aegis Multi-Agent Orchestrator')\n"
                    "col1, col2, col3 = st.columns(3)\n"
                    "col1.metric('Agents Active', '5', '+2')\n"
                    "col2.metric('Tasks Succeeded', '12', '100%')\n"
                    "col3.metric('Self-Healing Cycles', '1', 'Resolved')\n"
                )
            },
        },
        "database": {
            "title": "SQLite & SQLAlchemy 2.0 ORM Standard",
            "summary": "Thread-safe relational persistence layer utilizing SQLite connection pools and SQLAlchemy declarative mapping.",
            "patterns": [
                "Use SQLAlchemy DeclarativeBase with mapped_column or Column.",
                "Wrap transactions in context managers to guarantee rollback on exception.",
                "Define foreign key constraints and create indexed lookup columns.",
            ],
            "templates": {
                "sqlite_repo": (
                    "import sqlite3\n"
                    "from typing import List, Dict, Any, Optional\n\n"
                    "class DatabaseRepository:\n"
                    "    def __init__(self, db_path: str = ':memory:'):\n"
                    "        self.db_path = db_path\n"
                    "        self.init_schema()\n\n"
                    "    def get_connection(self) -> sqlite3.Connection:\n"
                    "        conn = sqlite3.connect(self.db_path)\n"
                    "        conn.row_factory = sqlite3.Row\n"
                    "        return conn\n\n"
                    "    def init_schema(self) -> None:\n"
                    "        with self.get_connection() as conn:\n"
                    "            conn.execute('''\n"
                    "                CREATE TABLE IF NOT EXISTS records (\n"
                    "                    id INTEGER PRIMARY KEY AUTOINCREMENT,\n"
                    "                    title TEXT NOT NULL,\n"
                    "                    status TEXT DEFAULT 'pending',\n"
                    "                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n"
                    "                )\n"
                    "            ''')\n"
                    "            conn.commit()\n"
                )
            },
        },
        "pytest": {
            "title": "Pytest Automated Suite & Verification Pattern",
            "summary": "Industry standard Python test runner for unit tests, fixtures, parameterization, and assertion reporting.",
            "patterns": [
                "Name test functions starting with test_ for automatic discovery.",
                "Use @pytest.fixture for dependency injection and setup/teardown.",
                "Use pytest.raises(ExpectedException) for negative test assertions.",
                "Structure tests into Arrange-Act-Assert (AAA) blocks.",
            ],
            "templates": {
                "test_suite": (
                    "import pytest\n\n"
                    "def test_success_case():\n"
                    "    # Arrange\n"
                    "    data = {'val': 42}\n"
                    "    # Act\n"
                    "    result = data['val'] * 2\n"
                    "    # Assert\n"
                    "    assert result == 84\n\n"
                    "def test_boundary_empty():\n"
                    "    assert len([]) == 0\n"
                )
            },
        },
        "security": {
            "title": "OWASP Secure Coding Principles for Python",
            "summary": "Defensive development patterns to prevent SQL injection, shell command injection, and data leakage.",
            "patterns": [
                "Never pass unescaped user input to raw SQL strings; always use parameterized queries.",
                "Never pass shell=True to subprocess functions when handling external input.",
                "Avoid eval() and exec(); use ast.literal_eval() for safe string-to-object parsing.",
                "Sanitize secrets by pulling from environment variables rather than hardcoding in source.",
            ],
            "templates": {
                "safe_eval": (
                    "import ast\n\n"
                    "def safe_parse_literal(raw_str: str):\n"
                    "    \"\"\"Safely parse literal expressions without executing code.\"\"\"\n"
                    "    try:\n"
                    "        return ast.literal_eval(raw_str)\n"
                    "    except (ValueError, SyntaxError) as e:\n"
                    "        return None\n"
                )
            },
        },
    }

    def __init__(self, request_timeout: float = 2.0) -> None:
        self.request_timeout = request_timeout

    def _query_live_web(self, query: str) -> List[Dict[str, Any]]:
        """
        Attempt a live HTTP request (e.g., Wikipedia API or public query)
        with strict timeout. Fails gracefully to empty list if network is down.
        """
        try:
            encoded = urllib.parse.quote_plus(query)
            url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={encoded}&limit=3&namespace=0&format=json"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "AegisMultiAgent/1.0 (Enterprise Researcher)"},
            )
            with urllib.request.urlopen(req, timeout=self.request_timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    # OpenSearch format: [query, [titles], [descriptions], [urls]]
                    if len(data) >= 4:
                        results = []
                        titles = data[1]
                        descriptions = data[2]
                        urls = data[3]
                        for i in range(len(titles)):
                            results.append({
                                "title": titles[i],
                                "snippet": descriptions[i] if i < len(descriptions) else "",
                                "url": urls[i] if i < len(urls) else "",
                            })
                        return results
        except Exception:
            # Network is down, connection refused, or timeout - completely expected in sandboxes
            pass
        return []

    def search(self, query: str, max_results: int = 5) -> ResearchResult:
        """
        Perform a search query. Combines live web search with deterministic
        offline knowledge base fallback.
        """
        q_lower = query.lower()
        live_findings = self._query_live_web(query)

        matched_keys = []
        for key in self.KNOWLEDGE_BASE:
            if key in q_lower:
                matched_keys.append(key)

        # Fallback to general matches if no exact match
        if not matched_keys:
            if any(term in q_lower for term in ["api", "rest", "backend", "endpoint", "route"]):
                matched_keys.append("fastapi")
            elif any(term in q_lower for term in ["ui", "frontend", "dashboard", "view", "interface"]):
                matched_keys.append("streamlit")
            elif any(term in q_lower for term in ["sql", "model", "schema", "table", "database"]):
                matched_keys.append("database")
            elif any(term in q_lower for term in ["test", "qa", "pytest", "assertion", "mock"]):
                matched_keys.append("pytest")
            elif any(term in q_lower for term in ["security", "vuln", "inject", "cwe", "owasp"]):
                matched_keys.append("security")
            else:
                matched_keys.append("fastapi")

        findings: List[Dict[str, Any]] = []
        recommended_patterns: List[str] = []
        code_templates: Dict[str, str] = {}

        # Add live findings if present
        if live_findings:
            findings.extend(live_findings[:max_results])

        # Add knowledge base findings
        for key in matched_keys:
            kb = self.KNOWLEDGE_BASE[key]
            findings.append({
                "title": kb["title"],
                "snippet": kb["summary"],
                "url": f"https://docs.aegis.internal/knowledge/{key}",
            })
            recommended_patterns.extend(kb["patterns"])
            code_templates.update(kb.get("templates", {}))

        source = "HYBRID" if live_findings else "KNOWLEDGE_BASE"
        summary = (
            f"Retrieved {len(findings)} references for '{query}'. "
            f"Identified {len(recommended_patterns)} architectural best practice patterns."
        )

        return ResearchResult(
            query=query,
            source=source,
            findings=findings[:max_results],
            summary=summary,
            recommended_patterns=recommended_patterns,
            code_templates=code_templates,
        )

    def get_technology_specs(self, tech_name: str) -> Dict[str, Any]:
        """Fetch curated specifications for a given technology name."""
        key = tech_name.lower().strip()
        return self.KNOWLEDGE_BASE.get(
            key,
            {
                "title": f"Generic Specification for {tech_name}",
                "summary": "Enterprise Python standard pattern.",
                "patterns": ["Follow PEP 8 naming conventions.", "Include type annotations.", "Handle exceptions explicitly."],
                "templates": {},
            },
        )

    def get_code_template(self, category: str, template_name: str) -> str:
        """Fetch a specific code template by category and template key."""
        cat_data = self.KNOWLEDGE_BASE.get(category.lower())
        if cat_data and "templates" in cat_data:
            return cat_data["templates"].get(template_name, "")
        return ""
