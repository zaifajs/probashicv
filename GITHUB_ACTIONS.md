# Deploy with GitHub Actions

Push to `main` (or run the workflow manually) and the app is deployed to your VPS automatically. For the order of steps (push repo, deploy key, secrets), see **SETUP_GITHUB.md**.

---

## Prerequisites

- Repo is on **GitHub** and you’ve pushed at least one commit to **`main`**.
- You have a **VPS** with SSH access (this project: **72.62.38.204**, domain **cv.divsketch.com** already set up in CloudPanel as a Node app).

---

## One-time setup

### 1. Set up the app on the VPS (once)

SSH into the server and do the **first-time** deploy by hand (see **STEPS.md Part B** for full steps). Summary:

```bash
# On the VPS (CloudPanel site divsketch-cv, app root = htdocs)
cd /home/divsketch-cv/htdocs
git clone https://github.com/YOUR_USERNAME/probashicv.git .
```
If `htdocs` already has files, clone to a temp folder and copy the repo contents into `htdocs`.

Create `backend/.env` with **production** values (use `*_PROD` vars; see `backend/.env.example`). Also set **`DATABASE_URL`** to the same value as **`DATABASE_URL_PROD`** so `prisma migrate deploy` in the workflow works:

```bash
nano backend/.env
# Add: DATABASE_URL_PROD, DATABASE_URL (same value), JWT_SECRET_PROD, OPENAI_API_KEY_PROD, FRONTEND_URL_PROD
```

Then:

```bash
npm ci
npm run build
cp -r frontend/dist/* cv.divsketch.com/
cd backend && npx prisma generate && npx prisma migrate deploy && cd ..
mkdir -p backend/uploads && chmod 755 backend/uploads
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
(The workflow also copies the build to **cv.divsketch.com/** so static files are served from the domain folder; proxy `/api` and `/uploads` to Node in CloudPanel.)

(Optional) Nginx + SSL: see **STEPS.md** Part B steps 8–9.

---

### 2. Let the VPS pull from GitHub

GitHub Actions will SSH into the VPS and run `git pull`. The server must be able to pull from your repo.

**Option A – One key for SSH + Git pull (recommended)**

Use a single key so that (1) GitHub Actions can SSH into the VPS and (2) the VPS can `git pull` from GitHub.

On the VPS (as the user that runs the app, e.g. `ubuntu`):

```bash
ssh-keygen -t ed25519 -C "deploy@probashicv" -f ~/.ssh/github_deploy -N ""
chmod 600 ~/.ssh/github_deploy
```

Add the **public** key in two places:

1. **GitHub Deploy key** (so the VPS can pull): repo → **Settings** → **Deploy keys** → **Add deploy key**. Paste `cat ~/.ssh/github_deploy.pub`. Read-only is enough.
2. **VPS authorized_keys** (so GitHub Actions can SSH in): `cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys`

So the VPS can pull (GitHub trusts this key), and the runner can SSH in (VPS trusts this key). Use the **private** key in step 3 as `VPS_SSH_KEY`:

```bash
cat ~/.ssh/github_deploy
```

Paste that full output (including `-----BEGIN ... KEY-----` and `-----END ... KEY-----`) into the **VPS_SSH_KEY** secret in GitHub.

Tell the VPS to use this key for GitHub when running `git pull`:

```bash
mkdir -p ~/.ssh
cat >> ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  StrictHostKeyChecking no
EOF
chmod 600 ~/.ssh/config
```

**Option B – Existing SSH key**

If you already SSH into the VPS with a key (e.g. from your Mac), put that key’s **private** content in `VPS_SSH_KEY`. The VPS user must still be able to `git pull` (e.g. add a deploy key for that user as above, or use HTTPS + a Personal Access Token).

---

### 3. Add GitHub Actions secrets

In your GitHub repo:

1. Go to **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** for each:

| Secret        | Example value        | Description |
|---------------|----------------------|-------------|
| `VPS_HOST`    | `cv.divsketch.com` or `72.62.38.204` | VPS hostname or IP (no `https://`) |
| `VPS_USER`    | `ubuntu`             | SSH user that runs the app |
| `VPS_SSH_KEY` | *(see below)*        | Full **private** SSH key content |

For **VPS_SSH_KEY**:

- If you used **Option A** (deploy key): paste the output of `cat ~/.ssh/github_deploy` from the VPS (the private key, including BEGIN/END lines).
- If you used **Option B**: paste the private key you use to SSH into the VPS (e.g. from your Mac: `cat ~/.ssh/your_vps_key`).

Do **not** add the `.pub` key; use the **private** key. One line break at the end is fine.

---

### 4. (Optional) Change app path or PM2 name

The workflow assumes:

- App directory: **`/home/divsketch-cv/htdocs`**
- PM2 app name: **`probashicv`**

To change them, edit **`.github/workflows/deploy.yml`** and update the path and the `pm2 restart probashicv || pm2 start ecosystem.config.cjs` line.

---

## Deploying

- **On every push to `main`:** The **Deploy to VPS** workflow runs and deploys.
- **Manual run:** **Actions** tab → **Deploy to VPS** → **Run workflow** → **Run workflow**.

Check the run on the **Actions** tab. If it fails, open the job and read the log (the SSH step shows the server output).

---

## What the workflow does

1. Triggers on **push to `main`** or **workflow_dispatch** (manual).
2. Connects to the VPS via SSH using `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
3. On the server it runs:
   - `cd /home/divsketch-cv/htdocs`
   - `git pull origin main`
   - `npm ci`
   - `npm run build`
   - `cp -r frontend/dist/* cv.divsketch.com/` (static files in domain folder)
   - `cd backend && npx prisma generate && npx prisma migrate deploy`
   - `pm2 restart probashicv || pm2 start ecosystem.config.cjs` (start uses NODE_ENV=production)
   - `pm2 save`
   - `pm2 status`

So each deploy: pull latest code, install deps, build frontend, copy to **cv.divsketch.com/**, run migrations, restart (or start) the Node app with **ecosystem.config.cjs** so NODE_ENV=production is set.
