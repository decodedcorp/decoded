# Server Setup Guide

This guide explains how to run the frontend server persistently on Mac Mini using tmux, so it continues running even after SSH disconnection until the Mac Mini is powered off or rebooted.

## T1 Summary

1. **Install dependencies**: `yarn install`
2. **Create tmux session**: `tmux new -s frontend`
3. **Run server inside session**:
   - Development: `HOST=0.0.0.0 PORT=3000 yarn dev`
   - Production: `HOST=0.0.0.0 PORT=3000 yarn start` (after `yarn build`)
4. **Detach from tmux**: Press `Ctrl + b`, then `d` - server continues running even after SSH disconnects
5. **Server stays alive** until Mac Mini powers off or reboots

---

## Step 1: Navigate to Project Directory

Make sure you're in the project root directory (where `README.md`, `app`, `specs` directories are visible):

```bash
cd /path/to/your/project
ls
```

---

## Step 2: Install Dependencies (One-time Setup)

```bash
yarn install
```

If dependencies are already installed, this will complete quickly. Otherwise, it will download all required packages.

---

## Step 3: Run Server in tmux Session

### 3-1. Check tmux Installation

On macOS, install tmux if not already installed:

```bash
brew install tmux  # One-time installation if needed
```

### 3-2. Create New Session

```bash
tmux new -s frontend
```

You'll see a green bar at the bottom of the screen, indicating you're inside a tmux session.

---

## Step 4: Run Server (Persists Until Mac Mini Shuts Down)

### Option A: Development Server Mode (Hot Reload)

**When using nginx as reverse proxy** (recommended for domain access):

```bash
HOST=127.0.0.1 PORT=3000 yarn dev
```

- `HOST=127.0.0.1`: Only accepts local connections (via nginx)
- `PORT=3000`: Internal port (nginx proxies external port 80 to this)

**When accessing directly via IP:3000** (without nginx):

```bash
HOST=0.0.0.0 PORT=3000 yarn dev
```

- `HOST=0.0.0.0`: Allows external access (other team members' PCs can connect)
- `PORT=3000`: Change to a different port if needed

### Option B: Production Server Mode

**When using nginx as reverse proxy** (recommended):

```bash
yarn build
HOST=127.0.0.1 PORT=3000 yarn start
```

**When accessing directly via IP:3000** (without nginx):

```bash
yarn build
HOST=0.0.0.0 PORT=3000 yarn start
```

Next.js follows this `build` → `start` structure by default.

---

## Step 5: Keep Server Running After SSH Disconnect (tmux Detach)

Once the server is running properly:

1. Press `Ctrl + b` (release)
2. Press `d` (detach)

You'll return to your original shell prompt and see:

```
[detached (from session frontend)]
```

In this state:

- You can `exit` or close the SSH window - the server continues running
- The server only stops when the Mac Mini reboots or powers off

To reattach to the session:

```bash
tmux attach -t frontend
```

---

## Step 6: Team Member Access

Team members can access the server via browser:

```
http://맥미니_IP:3000
```

Requirements:

- Mac Mini must be on the same network
- Port 3000 must not be blocked by Mac Mini firewall
- The page should load immediately

For future organization:

- Standardize ports (e.g., 3000/4000)
- Configure firewall settings
- Document tmux session naming conventions

---

## Alternative: Running Without tmux (Not Recommended)

For reference only:

```bash
nohup HOST=0.0.0.0 PORT=3000 yarn dev > out.log 2>&1 &
disown
```

This runs in the background but makes management, stopping, and log checking more difficult. tmux is much better for shared dev servers.

---

## Quick Reference

The essential routine:

**With nginx (recommended):**

```bash
tmux new -s frontend → HOST=127.0.0.1 PORT=3000 yarn dev → Ctrl+b, d
```

**Without nginx (direct access):**

```bash
tmux new -s frontend → HOST=0.0.0.0 PORT=3000 yarn dev → Ctrl+b, d
```

These three steps ensure the server stays alive until the Mac Mini shuts down.

---

## HTTPS Access via Domain Name

For production-like HTTPS access via a domain name (e.g., `https://decoded.dev`) instead of direct IP:3000 access, see the **[nginx + Cloudflare SSL Setup Guide](nginx-cloudflare-setup.md)**.

**Note**: When using nginx as a reverse proxy, configure Next.js to run on `127.0.0.1:3000` (internal only) instead of `0.0.0.0:3000`. The nginx guide includes instructions for this configuration.

---

## Convenience Script

You can also use the provided convenience script:

```bash
# Development mode
./scripts/start-persistent-server.sh dev

# Production mode
./scripts/start-persistent-server.sh prod
```

The script automatically:

- Checks if tmux is installed
- Checks if the `frontend` session already exists
- Creates a new session or attaches to existing one
- Runs the server with appropriate settings
- Provides detach instructions

You can customize `HOST` and `PORT` via environment variables:

```bash
HOST=0.0.0.0 PORT=4000 ./scripts/start-persistent-server.sh dev
```

---

## Updating the Dev Server

For the Mac Mini shared dev server (preview.decoded.style), use the automated update script to pull latest code, build, and restart the server:

```bash
# Update server with current branch
yarn server:dev-remote

# Update server with specific branch
yarn server:dev-remote dev
```

This single command will:

1. Pull latest changes from the specified branch (defaults to current branch)
2. Install dependencies (`yarn install`)
3. Build the application (`yarn build`)
4. Restart the tmux session `frontend-dev` running production server on PORT 3000

The script uses `git reset --hard` to ensure the server matches the remote branch exactly, making it ideal for shared dev environments where no local modifications should exist.

**Note**: The server runs in production mode (`yarn start`) for a stable preview environment accessible at preview.decoded.style.
