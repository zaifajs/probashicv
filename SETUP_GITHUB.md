# Set up GitHub (push + auto-deploy to VPS)

Follow these in order. Your app is at **/home/divsketch-cv/htdocs**; PM2 runs as the user you used (e.g. root or the site user).

**If the app is not on the VPS yet:** do the **one-time setup** in **GITHUB_ACTIONS.md** (section 1) first (clone, `backend/.env`, npm ci, build, copy to cv.divsketch.com, prisma migrate, `pm2 start ecosystem.config.cjs`, pm2 save, pm2 startup). Then do the steps below so each push to `main` deploys via Actions.

---

## Step 1: Push your code to GitHub

On your **Mac** (in the project folder):

```bash
cd /Users/huzaifa/Sites/marketplace/probashicv
git add .
git status   # ensure no .env is listed
git commit -m "Initial commit"
```

Create a **new repo** on GitHub (e.g. **probashicv**), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/probashicv.git
git branch -M main
git push -u origin main
```

Use your GitHub username. If the repo is private, use a **Personal Access Token** instead of your password when Git asks.

---

## Step 2: On the VPS – deploy key (so VPS can pull + Actions can SSH)

SSH into the server. Run as the **same user that runs PM2** (e.g. root, or the user that owns `/home/divsketch-cv/htdocs`).

**2a. Create a key:**

```bash
ssh-keygen -t ed25519 -C "deploy@probashicv" -f ~/.ssh/github_deploy -N ""
chmod 600 ~/.ssh/github_deploy
```

**2b. Add the PUBLIC key to GitHub (so the VPS can pull):**

- GitHub → your repo → **Settings** → **Deploy keys** → **Add deploy key**
- Title: `VPS deploy`
- Key: paste the output of `cat ~/.ssh/github_deploy.pub` (from the VPS)
- Check **Allow read access**. Save.

**2c. Add the same PUBLIC key to the VPS (so GitHub Actions can SSH in):**

```bash
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
```

**2d. Use this key for Git when pulling from GitHub:**

```bash
mkdir -p ~/.ssh
cat >> ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  StrictHostKeyChecking no
EOF
chmod 600 ~/.ssh/config
```

**2e. Get the PRIVATE key for Step 3:**

```bash
cat ~/.ssh/github_deploy
```

Copy the **entire** output (including `-----BEGIN ... KEY-----` and `-----END ... KEY-----`). You’ll paste it in GitHub Secrets in Step 3.

---

## Step 3: GitHub Actions secrets

In your GitHub repo:

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** for each:

| Name         | Value |
|--------------|--------|
| `VPS_HOST`   | `cv.divsketch.com` or `72.62.38.204` |
| `VPS_USER`   | The user you used in Step 2 (e.g. `root`) |
| `VPS_SSH_KEY`| The **private** key you copied in Step 2e (full content, including BEGIN/END lines) |

---

## Step 4: Make sure htdocs is a git repo (if you didn’t clone)

If the app on the VPS was **not** cloned from GitHub (e.g. you uploaded it), turn it into a repo and set `origin`:

```bash
cd /home/divsketch-cv/htdocs
git init
git remote add origin https://github.com/YOUR_USERNAME/probashicv.git
git fetch origin
git reset --hard origin/main
# or: git branch -M main && git pull origin main
```

After this, `git pull origin main` should work from **htdocs**.

---

## Step 5: Test deploy

- **Option A:** Push a small change from your Mac to `main`; the **Deploy to VPS** workflow should run.
- **Option B:** GitHub → repo → **Actions** → **Deploy to VPS** → **Run workflow** → **Run workflow**.

Check the run log. If it’s green, the VPS has the latest code, build is in **cv.divsketch.com/**, and PM2 has restarted (or started via **ecosystem.config.cjs** with NODE_ENV=production).

---

## Quick reference

| What              | Where |
|-------------------|--------|
| Repo              | https://github.com/YOUR_USERNAME/probashicv |
| Actions           | Repo → **Actions** tab |
| Secrets           | Repo → **Settings** → **Secrets and variables** → **Actions** |
| Deploy key (public)| Repo → **Settings** → **Deploy keys** |
| App path on VPS   | /home/divsketch-cv/htdocs |
| PM2 app name      | probashicv (started via **ecosystem.config.cjs**) |

For what the workflow runs on each deploy, see **GITHUB_ACTIONS.md** → “What the workflow does”.
