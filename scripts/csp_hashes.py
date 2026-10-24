#!/usr/bin/env python3
"""
Write dist/vercel.json: vercel.json with every inline script hashed into the CSP.

The Content-Security-Policy in vercel.json deliberately leaves out
'unsafe-inline' from script-src, so each inline <script> that ships (the
Vercel Analytics stub on every page, Blowfish's medium-zoom init on /blogs/
pages) has to be allowed by its sha256 hash. Those bytes come out of Hugo and
the theme and can change with any Blowfish bump, so the hashes are computed
from the built pages on every build rather than kept by hand. A hand-kept list
would go stale silently, and the browser would just refuse to run the script.

Usage (called by scripts/build.sh after dist/ is assembled):
  python3 scripts/csp_hashes.py vercel.json dist
"""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path

SCRIPT = re.compile(r"<script\b([^>]*)>(.*?)</script>", re.S | re.I)
SRC_ATTR = re.compile(r"(?:^|\s)src\s*=", re.I)
TYPE_ATTR = re.compile(r"""(?:^|\s)type\s*=\s*["']?([^"'\s>]+)""", re.I)
# Script types the browser executes. Anything else, like the
# application/ld+json blocks Hugo emits, is a data block that CSP ignores.
EXECUTABLE_TYPES = {"", "text/javascript", "application/javascript", "module"}


def inline_script_hashes(dist):
    hashes = set()
    for page in sorted(dist.rglob("*.html")):
        for attrs, body in SCRIPT.findall(page.read_text(encoding="utf-8")):
            if SRC_ATTR.search(attrs) or not body.strip():
                continue
            script_type = TYPE_ATTR.search(attrs)
            if (script_type.group(1).lower() if script_type else "") not in EXECUTABLE_TYPES:
                continue
            digest = hashlib.sha256(body.encode("utf-8")).digest()
            hashes.add("'sha256-%s'" % base64.b64encode(digest).decode("ascii"))
    return sorted(hashes)


def main(config_path, dist_path):
    config = json.loads(Path(config_path).read_text(encoding="utf-8"))
    hashes = inline_script_hashes(Path(dist_path))

    patched = False
    for rule in config.get("headers", []):
        for header in rule["headers"]:
            if header["key"].lower() != "content-security-policy":
                continue
            directives = [d.strip() for d in header["value"].split(";") if d.strip()]
            for i, directive in enumerate(directives):
                if directive.split()[0] == "script-src":
                    directives[i] = " ".join([directive] + hashes)
                    patched = True
            header["value"] = "; ".join(directives)

    if not patched:
        sys.exit("✗ %s has no Content-Security-Policy script-src directive to patch" % config_path)

    out = Path(dist_path) / "vercel.json"
    out.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    print("  CSP allows %d inline script hash(es) → %s" % (len(hashes), out))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: csp_hashes.py <vercel.json> <dist dir>")
    main(sys.argv[1], sys.argv[2])
