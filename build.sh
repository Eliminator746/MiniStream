#!/usr/bin/env bash
# Render Build Script — installs backend + frontend deps, builds React SPA
set -o errexit

# 1. Install system dep needed by python-magic on Linux
apt-get update && apt-get install -y libmagic1

# 2. Backend: install Python dependencies
pip install -r requirements.txt

# 3. Copy secret file to frontend folder so Vite picks it up at build time
cp /etc/secrets/.env.production frontend/.env.production

# 4. Frontend: install Node deps + build production bundle
cd frontend
npm install
npm run build
