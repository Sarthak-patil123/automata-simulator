"""
Standalone Lightweight HTTP Server for Automata Learning Studio.
Uses Python's standard library only (zero external pip dependencies).
Serves the REST API and the luxurious frontend.
"""

import os
import json
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from backend.api import AutomataMLService

service = AutomataMLService()
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")


class AutomataRequestHandler(BaseHTTPRequestHandler):

    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200, "text/plain")

    def _read_json_body(self):
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len == 0:
            return {}
        body_bytes = self.rfile.read(content_len)
        try:
            return json.loads(body_bytes.decode("utf-8"))
        except Exception:
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/presets":
            try:
                presets = service.get_preset_languages()
                self._set_headers(200)
                self.wfile.write(json.dumps(presets).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        # Serve static frontend files
        if path == "/" or path == "":
            file_path = os.path.join(FRONTEND_DIR, "index.html")
        else:
            clean_path = path.lstrip("/")
            file_path = os.path.join(FRONTEND_DIR, clean_path)

        if os.path.exists(file_path) and os.path.isfile(file_path):
            mime, _ = mimetypes.guess_type(file_path)
            mime = mime or "application/octet-stream"
            self._set_headers(200, mime)
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            # Fallback to index.html for SPA
            index_path = os.path.join(FRONTEND_DIR, "index.html")
            if os.path.exists(index_path):
                self._set_headers(200, "text/html")
                with open(index_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self._set_headers(404, "text/plain")
                self.wfile.write(b"404 Not Found")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_json_body()

        try:
            if path == "/api/dataset/preprocess-csv":
                raw_csv = body.get("csv_text", "")
                res = service.preprocess_csv(raw_csv)
                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))

            elif path == "/api/dataset/generate":
                res = service.generate_data(
                    preset_index=body.get("preset_index", 1),
                    num_positive=body.get("num_positive", 30),
                    num_negative=body.get("num_negative", 30),
                    max_length=body.get("max_length", 10),
                    noise_rate=body.get("noise_rate", 0.0),
                    sampling_strategy=body.get("sampling_strategy", "random"),
                    seed=body.get("seed", 42),
                )
                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))

            elif path == "/api/model/train":
                res = service.train_model(
                    session_id=body.get("session_id", ""),
                    model_type=body.get("model_type", "dfa"),
                    positive_strings=body.get("positive_strings", []),
                    negative_strings=body.get("negative_strings", []),
                    alphabet=body.get("alphabet", None),
                )
                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))

            elif path == "/api/hitl/answer":
                res = service.answer_hitl_query(
                    session_id=body.get("session_id", ""),
                    is_accepted=bool(body.get("is_accepted", False)),
                )
                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))

            elif path == "/api/hitl/skip":
                res = service.skip_hitl(
                    session_id=body.get("session_id", ""),
                )
                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))

            elif path == "/api/hitl/confirm":
                res = service.confirm_hitl_conjecture(
                    session_id=body.get("session_id", ""),
                    counterexample=body.get("counterexample", None),
                    expected_label=body.get("expected_label", None),
                )
                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))

            elif path == "/api/model/simulate":
                res = service.simulate(
                    session_id=body.get("session_id", ""),
                    test_string=body.get("test_string", ""),
                )
                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))

            elif path == "/api/ablation/run":
                res = service.run_ablation(
                    preset_index=body.get("preset_index", 4),
                    study_type=body.get("study_type", "sample_size"),
                    learner_type=body.get("learner_type", "rpni"),
                )
                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))

            else:
                self._set_headers(404)
                self.wfile.write(
                    json.dumps({"error": f"Endpoint {path} not found"}).encode("utf-8")
                )

        except Exception as e:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))


def run_server(port=8000):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, AutomataRequestHandler)
    print(f"\n==================================================================")
    print(f" AURELIA Automata Inference Studio running at http://localhost:{port}")
    print(f" Press Ctrl+C to terminate.")
    print(f"==================================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()


if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
