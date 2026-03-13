#!/bin/bash
# Run on the VPS to see what's installed for ProbashiCV.
# Usage: bash check-server.sh   or   chmod +x check-server.sh && ./check-server.sh

echo "=========================================="
echo "  ProbashiCV – server requirements check"
echo "=========================================="
echo ""

check() {
  if command -v "$1" &>/dev/null; then
    echo "  OK   $2"
    "$1" "$3" 2>/dev/null || true
  else
    echo "  MISS $2"
  fi
  echo ""
}

echo "1. Node.js (need 18+)"
check node "Node.js" "--version"
echo "2. npm"
check npm "npm" "--version"
echo "3. Git"
check git "Git" "--version"
echo "4. PostgreSQL client (for prisma migrate)"
if command -v psql &>/dev/null; then
  echo "  OK   PostgreSQL (psql)"
  psql --version 2>/dev/null || true
else
  echo "  MISS PostgreSQL (psql)"
fi
echo ""
echo "5. PostgreSQL server (running?)"
if systemctl is-active --quiet postgresql 2>/dev/null || pg_isready -q 2>/dev/null; then
  echo "  OK   PostgreSQL is running"
else
  echo "  ??   Check: sudo systemctl status postgresql  or  pg_isready -h localhost"
fi
echo ""
echo "6. PM2 (optional, for keeping Node app running)"
check pm2 "PM2" "--version"
echo "7. Nginx (often installed with CloudPanel)"
if command -v nginx &>/dev/null; then
  echo "  OK   Nginx"
  nginx -v 2>&1 || true
else
  echo "  (optional) Nginx – CloudPanel may manage it"
fi
echo ""
echo "=========================================="
echo "  App path check"
echo "=========================================="
if [ -d "/home/divsketch-cv/htdocs" ]; then
  echo "  OK   /home/divsketch-cv/htdocs exists"
  [ -f "/home/divsketch-cv/htdocs/package.json" ] && echo "  OK   package.json found" || echo "  ??   package.json not found (clone repo?)"
  [ -d "/home/divsketch-cv/htdocs/backend" ] && echo "  OK   backend/ found" || echo "  ??   backend/ not found"
  [ -d "/home/divsketch-cv/htdocs/frontend" ] && echo "  OK   frontend/ found" || echo "  ??   frontend/ not found"
  [ -d "/home/divsketch-cv/htdocs/cv.divsketch.com" ] && echo "  OK   cv.divsketch.com/ exists" || echo "  ??   cv.divsketch.com/ not found (create it: mkdir -p cv.divsketch.com)"
else
  echo "  ??   /home/divsketch-cv/htdocs not found"
fi
echo ""
echo "Done."
