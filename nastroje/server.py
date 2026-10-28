"""Spustí hru na http://localhost:8123 bez ukládání do mezipaměti prohlížeče,
takže po každé úpravě (úroveň, nastavení) stačí obnovit stránku.

Použití (ze složky Hra):  python3 nastroje/server.py
"""
import functools
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
SLOZKA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "hra")


class BezMezipameti(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    handler = functools.partial(BezMezipameti, directory=SLOZKA)
    with http.server.ThreadingHTTPServer(("", PORT), handler) as s:
        print(f"Hra běží na http://localhost:{PORT}  (ukončit: Ctrl+C)")
        s.serve_forever()
