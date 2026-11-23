"""
Aegis Hybrid Multi-Brain LLM Router
====================================
Provides unified, high-resilience routing across:
- Groq (Llama 3.3 70B) for ultra-fast, high-throughput generation
- Google Gemini for deep architectural reasoning and planning
- OpenAI (GPT-4o) for high-precision validation
- Deterministic Offline Fallback Simulator for offline development, CI/CD, and zero-key execution
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger("aegis.core.llm_router")


class ExecutionMode(str, Enum):
    """Execution mode for the LLM router."""
    AUTO = "auto"
    GROQ = "groq"
    GEMINI = "gemini"
    OPENAI = "openai"
    OFFLINE = "offline"

    def __str__(self) -> str:
        return self.value


@dataclass
class LLMResponse:
    """Standardized response from any LLM provider or offline fallback."""
    content: str
    model: str
    provider: str
    latency_ms: float
    usage: Dict[str, int] = field(default_factory=lambda: {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
    })
    success: bool = True
    error: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "model": self.model,
            "provider": self.provider,
            "latency_ms": self.latency_ms,
            "usage": self.usage,
            "success": self.success,
            "error": self.error,
        }


def _load_env_file(filepath: str = ".env") -> None:
    """Simple zero-dependency .env loader."""
    if not os.path.exists(filepath):
        # Look in current working directory and Aegis root
        alt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        if os.path.exists(alt_path):
            filepath = alt_path
        else:
            return

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        logger.debug(f"Could not read .env file: {e}")


# Initialize environment on module import
_load_env_file()


class OfflineSimulator:
    """
    Deterministic Offline Fallback Engine.
    Generates structured, production-grade responses for architecture,
    backend, frontend, database, QA verification, and self-healing.
    """

    @staticmethod
    def simulate(prompt: str, system_prompt: Optional[str] = None) -> str:
        """Analyze prompt semantics and return context-relevant synthetic artifacts."""
        p_lower = prompt.lower()
        sys_lower = (system_prompt or "").lower()

        # 1. Architecture & Tech Stack (Research Phase)
        if "research" in p_lower or "architecture" in p_lower or "tech stack" in p_lower or "rfc" in sys_lower:
            return (
                "# Architecture & System Design RFC\n\n"
                "## 1. System Topology & Architecture\n"
                "- **Pattern**: Layered Micro-Modular Architecture with Clean Architecture boundaries.\n"
                "- **API Gateway / Core**: High-concurrency async service with RESTful & WebSocket endpoints.\n"
                "- **State Management**: Distributed Blackboard pattern with Pub/Sub event bus.\n\n"
                "## 2. Technology Stack Selection\n"
                "- **Language**: Python 3.11+ / 3.14 compatible core with full type annotations.\n"
                "- **API Framework**: FastAPI / Starlette async engine for low-latency JSON RPC & REST.\n"
                "- **Database / ORM**: SQLite for local persistence with SQLAlchemy 2.0 async engine.\n"
                "- **Frontend**: Streamlit dynamic dashboard with real-time state synchronization.\n"
                "- **Testing**: PyTest with automated coverage, AST linting, and synthetic contract testing.\n\n"
                "## 3. Data Contracts & Interfaces\n"
                "```json\n"
                "{\n"
                '  "protocol_version": "1.0.0",\n'
                '  "auth_strategy": "Bearer token with scoped roles",\n'
                '  "health_check_endpoint": "/api/v1/health",\n'
                '  "event_channel": "/api/v1/events/stream"\n'
                "}\n"
                "```\n\n"
                "## 4. Non-Functional Requirements & Resilience\n"
                "- Autonomous self-healing with exponential backoff on retryable operations.\n"
                "- Circuit breaker pattern for external LLM API endpoints.\n"
                "- Maximum allowable healing cycles: 3 iterations."
            )

        # 2. Database Schema Generation
        if "database" in p_lower or "schema" in p_lower or "sql" in p_lower:
            return (
                '"""\n'
                'Database Schema & Data Access Layer\n'
                '"""\n\n'
                "import sqlite3\n"
                "from typing import Optional, List, Dict, Any\n\n"
                "SCHEMA_SQL = '''\n"
                "CREATE TABLE IF NOT EXISTS projects (\n"
                "    id TEXT PRIMARY KEY,\n"
                "    name TEXT NOT NULL,\n"
                "    description TEXT,\n"
                "    status TEXT DEFAULT 'ACTIVE',\n"
                "    created_at REAL NOT NULL\n"
                ");\n\n"
                "CREATE TABLE IF NOT EXISTS records (\n"
                "    id TEXT PRIMARY KEY,\n"
                "    project_id TEXT NOT NULL,\n"
                "    title TEXT NOT NULL,\n"
                "    payload TEXT,\n"
                "    updated_at REAL NOT NULL,\n"
                "    FOREIGN KEY (project_id) REFERENCES projects(id)\n"
                ");\n"
                "'''\n\n"
                "class DatabaseManager:\n"
                "    def __init__(self, db_path: str = ':memory:'):\n"
                "        self.db_path = db_path\n"
                "        self._init_db()\n\n"
                "    def _init_db(self) -> None:\n"
                "        with sqlite3.connect(self.db_path) as conn:\n"
                "            conn.executescript(SCHEMA_SQL)\n"
                "            conn.commit()\n\n"
                "    def create_project(self, project_id: str, name: str, description: str = '') -> Dict[str, Any]:\n"
                "        import time\n"
                "        now = time.time()\n"
                "        with sqlite3.connect(self.db_path) as conn:\n"
                "            cursor = conn.cursor()\n"
                "            cursor.execute(\n"
                "                'INSERT INTO projects (id, name, description, status, created_at) VALUES (?, ?, ?, ?, ?)',\n"
                "                (project_id, name, description, 'ACTIVE', now)\n"
                "            )\n"
                "            conn.commit()\n"
                "        return {'id': project_id, 'name': name, 'status': 'ACTIVE', 'created_at': now}\n"
            )

        # 3. Backend / API Worker Generation
        if "backend" in p_lower or "api" in p_lower or "fastapi" in p_lower or "service" in p_lower:
            return (
                '"""\n'
                'Aegis Backend API Service\n'
                '"""\n\n'
                "from typing import Dict, Any, List, Optional\n"
                "import time\n"
                "import uuid\n\n"
                "class BackendService:\n"
                "    def __init__(self, service_name: str = 'Aegis Core Backend'):\n"
                "        self.service_name = service_name\n"
                "        self.items: Dict[str, Dict[str, Any]] = {}\n"
                "        self.start_time = time.time()\n\n"
                "    def get_health(self) -> Dict[str, Any]:\n"
                "        return {\n"
                "            'service': self.service_name,\n"
                "            'status': 'HEALTHY',\n"
                "            'uptime_seconds': round(time.time() - self.start_time, 2),\n"
                "            'item_count': len(self.items),\n"
                "        }\n\n"
                "    def create_item(self, title: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:\n"
                "        item_id = f'ITEM-{uuid.uuid4().hex[:6].upper()}'\n"
                "        record = {\n"
                "            'id': item_id,\n"
                "            'title': title,\n"
                "            'metadata': metadata or {},\n"
                "            'created_at': time.time(),\n"
                "            'status': 'READY'\n"
                "        }\n"
                "        self.items[item_id] = record\n"
                "        return record\n\n"
                "    def list_items(self) -> List[Dict[str, Any]]:\n"
                "        return list(self.items.values())\n\n"
                "    def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:\n"
                "        return self.items.get(item_id)\n"
            )

        # 4. Frontend / UI Worker Generation
        if "frontend" in p_lower or "ui" in p_lower or "dashboard" in p_lower or "streamlit" in p_lower:
            return (
                '"""\n'
                'Aegis Frontend Dashboard & Visualizer\n'
                '"""\n\n'
                "import json\n"
                "from typing import Dict, Any, List\n\n"
                "class DashboardRenderer:\n"
                "    def __init__(self, title: str = 'Aegis Control Plane'):\n"
                "        self.title = title\n\n"
                "    def render_summary_card(self, data: Dict[str, Any]) -> str:\n"
                "        return (\n"
                "            f'### {self.title}\\n'\n"
                "            f'- Status: **{data.get(\"status\", \"ACTIVE\")}**\\n'\n"
                "            f'- Active Tasks: {data.get(\"active_tasks\", 0)}\\n'\n"
                "            f'- Completed: {data.get(\"completed_tasks\", 0)}\\n'\n"
                "        )\n\n"
                "    def render_agent_roster(self, agents: List[Dict[str, Any]]) -> str:\n"
                "        lines = ['| Agent | Role | Domain | Status |', '|---|---|---|---|']\n"
                "        for a in agents:\n"
                "            lines.append(f'| {a.get(\"name\")} | {a.get(\"role\")} | {a.get(\"domain\")} | {a.get(\"status\")} |')\n"
                "        return '\\n'.join(lines)\n"
            )

        # 5. QA Verification & Test Suite
        if "qa" in p_lower or "test" in p_lower or "verify" in p_lower or "audit" in p_lower:
            return (
                '"""\n'
                'Automated QA Test Suite & Verification Contracts\n'
                '"""\n\n'
                "import unittest\n\n"
                "class TestAegisDeliverables(unittest.TestCase):\n"
                "    def test_health_check_contract(self):\n"
                "        # Synthetic contract verification\n"
                "        sample_response = {'status': 'HEALTHY', 'service': 'Aegis Core'}\n"
                "        self.assertEqual(sample_response['status'], 'HEALTHY')\n"
                "        self.assertIn('service', sample_response)\n\n"
                "    def test_data_integrity(self):\n"
                "        test_item = {'id': 'ITEM-001', 'title': 'Test Item'}\n"
                "        self.assertTrue(test_item['id'].startswith('ITEM-'))\n"
                "        self.assertIsNotNone(test_item['title'])\n\n"
                "if __name__ == '__main__':\n"
                "    unittest.main()\n"
            )

        # 6. Self-Healing & Remediation
        if "healing" in p_lower or "remediat" in p_lower or "fix" in p_lower or "patch" in p_lower:
            return (
                '"""\n'
                'Self-Healing Remediation Patch\n'
                '"""\n\n'
                "# Automated defect resolution applied by Aegis Remediation Engine\n"
                "def apply_remediation_patch(source_code: str) -> str:\n"
                "    # Clean syntax defects and guarantee null safety\n"
                "    patched = source_code.replace('TODO_REMEDIATE', 'pass')\n"
                "    return patched\n"
            )

        # Default structured JSON / Plan response
        return (
            "{\n"
            '  "status": "SUCCESS",\n'
            '  "summary": "Synthesized plan for target request",\n'
            '  "recommended_actions": [\n'
            '    "Analyze architectural dependencies",\n'
            '    "Decompose implementation across domain leads",\n'
            '    "Validate deliverables against automated QA test matrix"\n'
            "  ]\n"
            "}"
        )


class LLMRouter:
    """
    Multi-Brain Hybrid LLM Router.
    Routes queries to Groq, Gemini, OpenAI, or falls back to the deterministic
    OfflineSimulator when keys are omitted or endpoints are unreachable.
    """

    def __init__(
        self,
        mode: Union[ExecutionMode, str] = ExecutionMode.AUTO,
        groq_api_key: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        default_groq_model: str = "llama-3.3-70b-versatile",
        default_gemini_model: str = "gemini-2.0-flash",
        default_openai_model: str = "gpt-4o",
        timeout_seconds: float = 12.0,
    ) -> None:
        self.mode = ExecutionMode(mode) if isinstance(mode, str) else mode
        self.groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY", "")
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY", "")

        self.default_groq_model = default_groq_model
        self.default_gemini_model = default_gemini_model
        self.default_openai_model = default_openai_model
        self.timeout_seconds = timeout_seconds

        # Check explicit environment override
        env_mode = os.getenv("AEGIS_EXECUTION_MODE")
        if env_mode:
            try:
                self.mode = ExecutionMode(env_mode.lower())
            except ValueError:
                pass

    def get_effective_provider(self) -> str:
        """Determine which provider will be used based on keys and mode."""
        if self.mode == ExecutionMode.OFFLINE:
            return "offline"
        if self.mode == ExecutionMode.GROQ and self.groq_api_key:
            return "groq"
        if self.mode == ExecutionMode.GEMINI and self.gemini_api_key:
            return "gemini"
        if self.mode == ExecutionMode.OPENAI and self.openai_api_key:
            return "openai"

        # In AUTO mode: Groq -> Gemini -> OpenAI -> Offline
        if self.groq_api_key:
            return "groq"
        if self.gemini_api_key:
            return "gemini"
        if self.openai_api_key:
            return "openai"

        return "offline"

    # -------------------------------------------------------------------------
    # Core Generation Pipeline
    # -------------------------------------------------------------------------

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        preferred_provider: Optional[str] = None,
    ) -> LLMResponse:
        """
        Execute completion with multi-brain resilience and automatic fallback.
        """
        provider = preferred_provider or self.get_effective_provider()
        start_time = time.time()

        # Offline fallback branch
        if provider == "offline":
            return self._call_offline(prompt, system_prompt, start_time)

        # Groq branch
        if provider == "groq":
            try:
                return self._call_groq(prompt, system_prompt, temperature, max_tokens, start_time)
            except Exception as e:
                logger.warning(f"Groq execution failed ({e}). Falling back to next available provider.")
                return self._fallback_chain(prompt, system_prompt, skip="groq", start_time=start_time)

        # Gemini branch
        if provider == "gemini":
            try:
                return self._call_gemini(prompt, system_prompt, temperature, max_tokens, start_time)
            except Exception as e:
                logger.warning(f"Gemini execution failed ({e}). Falling back to next available provider.")
                return self._fallback_chain(prompt, system_prompt, skip="gemini", start_time=start_time)

        # OpenAI branch
        if provider == "openai":
            try:
                return self._call_openai(prompt, system_prompt, temperature, max_tokens, start_time)
            except Exception as e:
                logger.warning(f"OpenAI execution failed ({e}). Falling back to next available provider.")
                return self._fallback_chain(prompt, system_prompt, skip="openai", start_time=start_time)

        # Default fallback
        return self._call_offline(prompt, system_prompt, start_time)

    def _fallback_chain(
        self,
        prompt: str,
        system_prompt: Optional[str],
        skip: str,
        start_time: float,
    ) -> LLMResponse:
        """Attempt alternative providers before dropping back to offline simulator."""
        if skip != "groq" and self.groq_api_key:
            try:
                return self._call_groq(prompt, system_prompt, 0.7, 4096, start_time)
            except Exception:
                pass

        if skip != "gemini" and self.gemini_api_key:
            try:
                return self._call_gemini(prompt, system_prompt, 0.7, 4096, start_time)
            except Exception:
                pass

        if skip != "openai" and self.openai_api_key:
            try:
                return self._call_openai(prompt, system_prompt, 0.7, 4096, start_time)
            except Exception:
                pass

        # Guaranteed fallback
        return self._call_offline(prompt, system_prompt, start_time)

    # -------------------------------------------------------------------------
    # Provider Implementations (Zero External Dependencies)
    # -------------------------------------------------------------------------

    def _call_offline(
        self,
        prompt: str,
        system_prompt: Optional[str],
        start_time: float,
    ) -> LLMResponse:
        """Generate response via deterministic OfflineSimulator."""
        content = OfflineSimulator.simulate(prompt, system_prompt)
        latency = round((time.time() - start_time) * 1000, 2)
        return LLMResponse(
            content=content,
            model="aegis-deterministic-sim-v1",
            provider="offline",
            latency_ms=latency,
            usage={
                "prompt_tokens": len(prompt.split()),
                "completion_tokens": len(content.split()),
                "total_tokens": len(prompt.split()) + len(content.split()),
            },
            success=True,
        )

    def _call_groq(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
        start_time: float,
    ) -> LLMResponse:
        """Invoke Groq API using stdlib urllib."""
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY is not configured.")

        url = "https://api.groq.com/openai/v1/chat/completions"
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.default_groq_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.groq_api_key}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            latency = round((time.time() - start_time) * 1000, 2)

            return LLMResponse(
                content=content,
                model=self.default_groq_model,
                provider="groq",
                latency_ms=latency,
                usage={
                    "prompt_tokens": usage.get("prompt_tokens", 0),
                    "completion_tokens": usage.get("completion_tokens", 0),
                    "total_tokens": usage.get("total_tokens", 0),
                },
                success=True,
                raw=data,
            )

    def _call_openai(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
        start_time: float,
    ) -> LLMResponse:
        """Invoke OpenAI API using stdlib urllib."""
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")

        url = "https://api.openai.com/v1/chat/completions"
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.default_openai_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_api_key}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            latency = round((time.time() - start_time) * 1000, 2)

            return LLMResponse(
                content=content,
                model=self.default_openai_model,
                provider="openai",
                latency_ms=latency,
                usage={
                    "prompt_tokens": usage.get("prompt_tokens", 0),
                    "completion_tokens": usage.get("completion_tokens", 0),
                    "total_tokens": usage.get("total_tokens", 0),
                },
                success=True,
                raw=data,
            )

    def _call_gemini(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int,
        start_time: float,
    ) -> LLMResponse:
        """Invoke Gemini API using stdlib urllib."""
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.default_gemini_model}:generateContent?key={self.gemini_api_key}"
        )

        parts = []
        if system_prompt:
            parts.append({"text": f"SYSTEM INSTRUCTION: {system_prompt}\n\n"})
        parts.append({"text": prompt})

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("No candidates returned from Gemini API.")
            content = candidates[0]["content"]["parts"][0]["text"]
            latency = round((time.time() - start_time) * 1000, 2)

            return LLMResponse(
                content=content,
                model=self.default_gemini_model,
                provider="gemini",
                latency_ms=latency,
                usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                success=True,
                raw=data,
            )

    # -------------------------------------------------------------------------
    # Specialized High-Level Helpers
    # -------------------------------------------------------------------------

    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generate and parse JSON output from the router."""
        enriched_sys = (system_prompt or "") + "\nRespond strictly in valid JSON format. Do not add markdown code fences."
        resp = self.generate(prompt=prompt, system_prompt=enriched_sys.strip())

        raw_text = resp.content.strip()
        # Strip potential markdown fences if present
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```[a-zA-Z]*\n?", "", raw_text)
            raw_text = re.sub(r"\n?```$", "", raw_text)
            raw_text = raw_text.strip()

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Fallback regex extraction of json object
            match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            return {"raw_content": raw_text, "parse_error": "Failed to parse JSON"}

    def generate_plan(self, goal: str, domain: str) -> Dict[str, Any]:
        """Generate structured task breakdown for a domain."""
        prompt = (
            f"You are the Lead Architect for the {domain} domain.\n"
            f"Decompose the following system goal into structured, executable steps:\n"
            f"Goal: {goal}\n\n"
            f"Provide a JSON object with: domain, phases, tasks (title, description, dependencies)."
        )
        return self.generate_json(prompt)

    def generate_code(self, spec: str, language: str = "python") -> str:
        """Generate source code based on a functional specification."""
        prompt = (
            f"Generate complete, robust, production-grade {language} code matching this spec:\n"
            f"{spec}\n\n"
            f"Include complete type hints, error handling, and docstrings."
        )
        resp = self.generate(prompt=prompt)
        return resp.content

    def review_code(self, code: str, requirements: str) -> Dict[str, Any]:
        """Perform static analysis and code review against requirements."""
        prompt = (
            f"Review the following implementation against the requirements.\n"
            f"Requirements: {requirements}\n\n"
            f"Code:\n{code}\n\n"
            f"Return JSON with: passed (bool), defect_count (int), issues (list of strings), recommendations (list of strings)."
        )
        return self.generate_json(prompt)
