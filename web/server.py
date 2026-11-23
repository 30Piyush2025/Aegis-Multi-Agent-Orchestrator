#!/usr/bin/env python3
"""
Aegis Atelier Web Studio Server
================================
Zero-dependency, production-grade HTTP application server powered by Python's
standard library. Serves the bespoke human-crafted frontend and provides REST
APIs for Office/Spreadsheet operations, Academic study guides, Creator media,
Visual design suites, Universal natural language requests, and Aegis Code Orchestration.
"""

from __future__ import annotations

import base64
import http.server
import json
import logging
import os
import socketserver
import sys
import urllib.parse
from typing import Any, Dict

# Set up project path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)

from src.core.orchestrator import MasterOrchestrator
from src.services.character_art_service import CharacterArtService
from src.services.creator_service import CreatorService
from src.services.design_service import DesignService
from src.services.office_service import OfficeDataEngine
from src.services.student_service import StudentService
from src.services.universal_service import UniversalService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("aegis.atelier.server")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
PORT = int(os.environ.get("PORT", 8080))


class AtelierRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handles static web requests and REST API endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self) -> None:
        """Handle GET requests: static assets, index.html, health checks."""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ["/", "/index.html"]:
            self.send_file(os.path.join(STATIC_DIR, "index.html"), "text/html; charset=utf-8")
        elif path == "/styles.css":
            self.send_file(os.path.join(STATIC_DIR, "styles.css"), "text/css; charset=utf-8")
        elif path == "/app.js":
            self.send_file(os.path.join(STATIC_DIR, "app.js"), "application/javascript; charset=utf-8")
        elif path in ["/api/health", "/health"]:
            self.send_json({"status": "HEALTHY", "engine": "Aegis Atelier v1.0.0", "craft": "तारों से नहीं, मोहब्बत से होती है।"})
        else:
            # Fallback to default static file handler
            super().do_GET()

    def do_POST(self) -> None:
        """Handle REST API endpoints."""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b""
            body_json = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception as e:
            self.send_json({"error": f"Invalid JSON payload: {e}"}, status_code=400)
            return

        try:
            if path == "/api/office/transform":
                self.handle_office_transform(body_json)
            elif path == "/api/office/export-xlsx":
                self.handle_office_export_xlsx(body_json)
            elif path == "/api/student/assist":
                self.handle_student_assist(body_json)
            elif path == "/api/creator/script":
                self.handle_creator_script(body_json)
            elif path == "/api/design/suite":
                self.handle_design_suite(body_json)
            elif path == "/api/character-art":
                self.handle_character_art(body_json)
            elif path == "/api/code/orchestrate":
                self.handle_code_orchestrate(body_json)
            elif path == "/api/universal/execute":
                self.handle_universal_execute(body_json)
            else:
                self.send_json({"error": f"Endpoint not found: {path}"}, status_code=404)
        except Exception as e:
            logger.error(f"Error handling {path}: {e}", exc_info=True)
            self.send_json({"error": str(e), "success": False}, status_code=500)

    # -------------------------------------------------------------------------
    # Route Handlers
    # -------------------------------------------------------------------------

    def handle_office_transform(self, body: Dict[str, Any]) -> None:
        """Process Excel / CSV tables and apply natural language instructions."""
        raw_data = body.get("data", "")
        instruction = body.get("instruction", "Format clean table")
        file_meta = body.get("file")

        headers, rows = [], []
        if file_meta and file_meta.get("is_xlsx") and file_meta.get("base64"):
            file_bytes = base64.b64decode(file_meta["base64"])
            headers, rows = OfficeDataEngine.parse_xlsx(file_bytes)
        elif raw_data:
            headers, rows = OfficeDataEngine.parse_csv(raw_data)
        elif file_meta and file_meta.get("text"):
            headers, rows = OfficeDataEngine.parse_csv(file_meta["text"])

        if not headers and not rows:
            self.send_json({"success": False, "error": "No tabular data could be parsed from input."}, status_code=400)
            return

        result = OfficeDataEngine.apply_transformation(headers, rows, instruction)
        self.send_json(result)

    def handle_office_export_xlsx(self, body: Dict[str, Any]) -> None:
        """Export headers and rows into fully valid Microsoft Excel (.xlsx) file bytes."""
        headers = body.get("headers", [])
        rows = body.get("rows", [])
        xlsx_bytes = OfficeDataEngine.to_xlsx_bytes(headers, rows)

        self.send_response(200)
        self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.send_header("Content-Disposition", 'attachment; filename="refined_dataset.xlsx"')
        self.send_header("Content-Length", str(len(xlsx_bytes)))
        self.end_headers()
        self.wfile.write(xlsx_bytes)

    def handle_student_assist(self, body: Dict[str, Any]) -> None:
        """Generate academic concept breakdowns and problem breakdowns."""
        topic = body.get("topic", "First Principles")
        level = body.get("level", "College")
        result = StudentService.generate_concept_breakdown(topic, level)
        self.send_json(result)

    def handle_creator_script(self, body: Dict[str, Any]) -> None:
        """Generate video scripts, viral hooks, and thumbnail concepts."""
        topic = body.get("topic", "Modern Craft")
        fmt = body.get("format", "YouTube Longform")
        result = CreatorService.generate_video_package(topic, fmt)
        self.send_json(result)

    def handle_design_suite(self, body: Dict[str, Any]) -> None:
        """Generate color palettes, retouching recipes, and camera prompts."""
        theme = body.get("theme", "Artisan Studio")
        result = DesignService.generate_design_suite(theme)
        self.send_json(result)

    def handle_character_art(self, body: Dict[str, Any]) -> None:
        """Generate 3D character concepts, wireframe lining, and Octane/Midjourney prompts."""
        concept = body.get("concept", "Cybernetic Nomad")
        style = body.get("style", "Cinematic 3D Realism")
        result = CharacterArtService.generate_character_suite(concept, style)
        self.send_json(result)

    def handle_code_orchestrate(self, body: Dict[str, Any]) -> None:
        """Dispatch full Aegis multi-agent pipeline and return verified deliverables."""
        objective = body.get("objective", "Build standard backend service")
        orchestrator = MasterOrchestrator()
        result = orchestrator.run(user_request=objective)
        self.send_json(result.to_dict())

    def handle_universal_execute(self, body: Dict[str, Any]) -> None:
        """Universal custom request handler."""
        req = body.get("request", "")
        result = UniversalService.execute_request(req)
        self.send_json(result)

    # -------------------------------------------------------------------------
    # Helper Methods
    # -------------------------------------------------------------------------

    def send_json(self, data: Dict[str, Any], status_code: int = 200) -> None:
        """Send standardized JSON response."""
        json_bytes = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(json_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json_bytes)

    def send_file(self, file_path: str, content_type: str) -> None:
        """Send static file content."""
        if not os.path.exists(file_path):
            self.send_error(404, "File not found")
            return
        with open(file_path, "rb") as f:
            content = f.read()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """Multi-threaded HTTP Server for handling concurrent requests without blocking."""
    daemon_threads = True
    allow_reuse_address = True


def start_server(port: int = PORT) -> None:
    """Launch Aegis Atelier HTTP Server."""
    server_address = ("0.0.0.0", port)
    httpd = ThreadedHTTPServer(server_address, AtelierRequestHandler)
    logger.info(f"✨ Aegis Atelier Server running on http://localhost:{port}")
    print(f"✨ Aegis Atelier Web Studio running at: http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping server gracefully...")
        httpd.server_close()


if __name__ == "__main__":
    port_arg = PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port_arg = int(sys.argv[1])
    start_server(port_arg)
