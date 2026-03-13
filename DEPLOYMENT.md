# Running ProbashiCV on a VPS

This guide covers deploying the app on a Linux VPS (Ubuntu/Debian). You can run everything on **one server** (Node serves API + frontend) or use **Nginx** in front for SSL and static files.

**This project:** Production domain **cv.divsketch.com** at the root; server IP **72.62.38.204**, managed with **CloudPanel**. The domain is already set up in CloudPanel as a **Node app** — run the app on the port CloudPanel proxies to (e.g. 4000). For other setups, see the Nginx config below.

## Requirements

- **Node.js** 18+ and **npm**
- **PostgreSQL** 14+
- (Optional) **Nginx** for HTTPS and reverse proxy
- (Optional) **PM2** to keep the Node process running

---

## 1. Server setup

### Install Node.js (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createuser --interactive   # create a user, e.g. probashicv
sudo -u postgres createdb probashicv        # create database (same name as user or specify owner)
```

---

## 2. Clone and install

```bash
cd /var/www   # or your preferred directory
git clone <your-repo-url> probashicv
cd probashicv
npm install
```

---

## 3. Backend environment (one .env, two sets of vars)

Use **one** `backend/.env` file (gitignored) with **`_LOCAL`** and **`_PROD`** suffixes. The app picks by `NODE_ENV`:

- **No `NODE_ENV`** or **`NODE_ENV=development`** → uses `*_LOCAL`.
- **`NODE_ENV=production`** → uses `*_PROD`.

No need for two branches or two env files. Copy `backend/.env.example` to `backend/.env` and set your values.

Example `backend/.env` (do not commit):

```env
# Local
DATABASE_URL_LOCAL="postgresql://user@localhost:5432/probashicv?schema=public"
FRONTEND_URL_LOCAL="http://localhost:5173"
# Production
DATABASE_URL_PROD="postgresql://user:password@localhost:5432/probashicv?schema=public"
JWT_SECRET_PROD="your-long-random-secret"
OPENAI_API_KEY_PROD="sk-..."
FRONTEND_URL_PROD="https://cv.divsketch.com"
```

On the VPS you can have only the `_PROD` vars in `.env` and run with `NODE_ENV=production`.

---

## 4. Database migrations

From the project root:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..
```

Ensure `DATABASE_URL` in `backend/.env` is correct before running these.

---

## 5. Build frontend

Frontend env is mode-based (Vite):

| Mode        | Committed file              | Used when      |
|-------------|-----------------------------|----------------|
| Development | `frontend/.env.development` | `npm run dev`  |
| Production  | `frontend/.env.production`  | `npm run build`|

- **Development:** `VITE_API_URL=http://localhost:4000` (in `.env.development`).
- **Production:** `VITE_API_URL=` (same-origin; in `.env.production`). No extra env needed for build.

From repo root:

```bash
npm run build
```

Build output is `frontend/dist`. The backend serves it when `NODE_ENV=production` and the app is run from the monorepo root.

---

## 6. Run the backend (production)

### Option A: Single server (Node serves API + frontend)

From repo root, with `frontend/dist` already built:

```bash
NODE_ENV=production npm run start
```

Or from `backend`:

```bash
cd backend
NODE_ENV=production node src/server.js
```

The app will serve:

- API on `http://localhost:4000` (or your `PORT`)
- Frontend from `frontend/dist` for all other routes (SPA fallback)

Use a process manager so it keeps running (see PM2 below).

### Option B: Frontend and backend separately

- Run only the backend: `NODE_ENV=production npm run start` (or from `backend`: `node src/server.js`).
- Serve the built frontend with Nginx (or another web server) from `frontend/dist`, and point `VITE_API_URL` to your backend URL when you built.

---

## 6.1 PDF download (Chromium on the server)

PDF generation uses Puppeteer and needs a Chromium/Chrome binary on the server. If **Download PDF** returns 500 in production, install Chromium and point the app to it.

**On the VPS (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
# or on some systems: sudo apt-get install -y chromium
```

Then in `backend/.env` on the server, set (optional but recommended):

```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

If the binary is elsewhere, run `which chromium-browser` or `which chromium` and set that path. The app also checks `/usr/bin/chromium` and `/usr/bin/google-chrome-stable` automatically. Restart the Node app (e.g. `pm2 restart probashicv`) after installing Chromium or changing the env.

---

## 7. Keep the app running: PM2

Install PM2 and start the backend:

```bash
npm install -g pm2
# From repo root, so backend can serve frontend/dist when NODE_ENV=production
cd /home/divsketch-cv/htdocs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # follow the command it prints to enable startup on boot
```

If you run from `backend` only (no frontend served by Node):

```bash
cd backend
NODE_ENV=production pm2 start src/server.js --name "probashicv"
pm2 save
pm2 startup
```

---

## 8. Reverse proxy with Nginx (recommended for HTTPS)

Example Nginx config for **single-server** (one Node process serving API + frontend):

```nginx
# App at root of cv.divsketch.com (no subdirectory)
server {
    listen 80;
    server_name cv.divsketch.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then enable SSL with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cv.divsketch.com
```

This example uses **cv.divsketch.com**; change the `server_name` and certbot `-d` flag if you use a different domain.

---

## 9. Uploads and persistence

- Backend stores uploads in the `uploads/` directory (relative to where the backend runs). Use an absolute path or ensure this directory exists and is writable.
- For PM2, run from the monorepo root so `backend/uploads` (or your configured path) is correct. Create it if needed:

```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

---

## 10. Checklist

| Step | Action |
|------|--------|
| 1 | Node 18+ and PostgreSQL installed |
| 2 | Repo cloned, `npm install` at root |
| 3 | `backend/.env` with `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `FRONTEND_URL` |
| 4 | `npx prisma generate` and `npx prisma migrate deploy` in `backend` |
| 5 | `npm run build` (frontend); for same-origin API use empty `VITE_API_URL` |
| 6 | `NODE_ENV=production npm run start` or PM2 |
| 7 | (Optional) Nginx proxy and SSL with Certbot |
| 8 | `backend/uploads` exists and is writable |

After that, open **https://cv.divsketch.com** (or `http://72.62.38.204:4000` if testing without Nginx/CloudPanel).
