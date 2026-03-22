# nginx + Cloudflare SSL Setup Guide

This guide explains how to set up nginx as a reverse proxy with Cloudflare to enable domain name access (e.g., `preview.decoded.style`) instead of direct IP:3000 access. Initially configured for HTTP, with HTTPS support available via Cloudflare Origin certificates.

## Overview

The setup enables:

- **Domain name access** via domain name (e.g., `http://preview.decoded.style`, later `https://preview.decoded.style`)
- **End-to-end encryption** between browser ↔ Cloudflare ↔ Mac Mini
- **Standard ports** (80/443) instead of custom port 3000
- **Production-ready structure** that can be reused when migrating to a dedicated server

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Domain name registered and added to Cloudflare
- [ ] Cloudflare DNS A record configured (pointing to your Mac Mini's public IP)
- [ ] Mac Mini's public IP address (e.g., `222.109.163.45`)
- [ ] Mac Mini's internal IP address (e.g., `192.168.0.20`)
- [ ] Access to router admin panel for port forwarding
- [ ] Homebrew installed on Mac Mini
- [ ] Next.js server running on port 3000 (internal)

## Step 1: Router Port Forwarding

Configure your router to forward external ports 80 and 443 to your Mac Mini's internal IP.

### 1-1. Find Mac Mini's Internal IP

On Mac Mini, check the network settings:

```bash
# Option 1: System Settings
# System Settings → Network → IP Address

# Option 2: Terminal
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Example output: `192.168.0.20`

### 1-2. Configure Router Port Forwarding

Access your router's admin panel (usually `192.168.1.1` or `192.168.0.1`) and add these port forwarding rules:

| External Port | Internal IP  | Internal Port | Protocol |
| ------------- | ------------ | ------------- | -------- |
| 80            | 192.168.0.20 | 80            | TCP      |
| 443           | 192.168.0.20 | 443           | TCP      |

**Note**: Replace `192.168.0.20` with your Mac Mini's actual internal IP address.

After configuration:

- External requests to `http://your-public-ip:80` → Mac Mini port 80
- External requests to `https://your-public-ip:443` → Mac Mini port 443

## Step 2: Install nginx

Install nginx using Homebrew:

```bash
brew install nginx
```

### 2-1. Verify Installation

Check nginx installation paths:

```bash
# Intel Mac
nginx -V 2>&1 | grep -i "configure arguments" | grep -o "\-\-prefix=[^ ]*"
# Usually: /usr/local/etc/nginx/

# Apple Silicon (M1/M2/M3)
# Usually: /opt/homebrew/etc/nginx/
```

### 2-2. Start nginx

```bash
# Start nginx service (auto-start on boot)
brew services start nginx

# Or start manually
nginx
```

### 2-3. Verify nginx is Running

Visit `http://222.109.163.45` (your public IP) in a browser. You should see the default nginx welcome page.

If you see "Welcome to nginx!", nginx is working correctly.

**Note**: The initial configuration uses HTTP (port 80) only. HTTPS (port 443) can be added later with Cloudflare Origin Certificate. This allows you to get the basic setup working first, then add SSL/TLS encryption.

## Step 3: Configure nginx for Next.js

### 3-1. Copy Configuration Template

Copy the nginx configuration template from the project:

```bash
# Navigate to project directory
cd /path/to/decoded-app

# Copy template to nginx servers directory
# For Intel Mac:
sudo cp nginx/preview.decoded.style.conf /usr/local/etc/nginx/servers/

# For Apple Silicon (M1/M2/M3):
sudo cp nginx/preview.decoded.style.conf /opt/homebrew/etc/nginx/servers/
```

**Note**: The configuration file is set up for `preview.decoded.style`. If you're using a different domain, edit the configuration file:

```bash
# For Intel Mac:
sudo nano /usr/local/etc/nginx/servers/preview.decoded.style.conf

# For Apple Silicon:
sudo nano /opt/homebrew/etc/nginx/servers/preview.decoded.style.conf
```

Replace all occurrences of `preview.decoded.style` with your actual domain name.

### 3-3. Verify nginx Configuration Includes Servers Directory

Check the main nginx configuration file:

```bash
# For Intel Mac:
cat /usr/local/etc/nginx/nginx.conf | grep "include"

# For Apple Silicon:
cat /opt/homebrew/etc/nginx/nginx.conf | grep "include"
```

You should see a line like:

```
include servers/*;
```

If not present, add it inside the `http { ... }` block:

```bash
# For Intel Mac:
sudo nano /usr/local/etc/nginx/nginx.conf

# For Apple Silicon:
sudo nano /opt/homebrew/etc/nginx/nginx.conf
```

Add this line inside the `http { ... }` block:

```
include servers/*;
```

### 3-4. Test Configuration

Before reloading, test the configuration syntax:

```bash
sudo nginx -t
```

Expected output:

```
nginx: the configuration file /usr/local/etc/nginx/nginx.conf syntax is ok
nginx: configuration file /usr/local/etc/nginx/nginx.conf test is successful
```

If there are errors, fix them before proceeding.

## Step 4: Cloudflare Origin Certificate

Generate and install Cloudflare Origin certificate to enable HTTPS between Cloudflare and Mac Mini.

### 4-1. Generate Origin Certificate

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. Go to **SSL/TLS** → **Origin Server**
4. Click **Create Certificate**
5. Select **"Let Cloudflare generate a private key and a CSR"**
6. Configure:
   - **Hostnames**: `preview.decoded.style` (or `*.decoded.style` for wildcard)
   - **Private key type**: RSA (2048)
   - **Certificate Validity**: 15 years (default)
7. Click **Create**
8. Copy both:
   - **Origin Certificate** (the `.crt` content)
   - **Private Key** (the `.key` content)

### 4-2. Install Certificate on Mac Mini

Create SSL directory and save certificate files:

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Save Origin Certificate
sudo nano /etc/nginx/ssl/preview.decoded.style.crt
# Paste the Origin Certificate content, save and exit (Ctrl+X, Y, Enter)

# Save Private Key
sudo nano /etc/nginx/ssl/preview.decoded.style.key
# Paste the Private Key content, save and exit

# Set proper permissions
sudo chmod 600 /etc/nginx/ssl/preview.decoded.style.crt
sudo chmod 600 /etc/nginx/ssl/preview.decoded.style.key
```

**Important**: Replace `preview.decoded.style` with your actual domain name in file paths.

### 4-3. Update nginx Configuration

Ensure the nginx configuration file has the correct certificate paths:

```bash
# For Intel Mac:
sudo nano /usr/local/etc/nginx/servers/preview.decoded.style.conf

# For Apple Silicon:
sudo nano /opt/homebrew/etc/nginx/servers/preview.decoded.style.conf
```

Verify these lines match your certificate file paths (when HTTPS is enabled):

```
ssl_certificate     /etc/nginx/ssl/preview.decoded.style.crt;
ssl_certificate_key /etc/nginx/ssl/preview.decoded.style.key;
```

### 4-4. Reload nginx

After installing certificates:

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo nginx -s reload
```

## Step 5: Configure Cloudflare SSL Mode

Set Cloudflare SSL/TLS encryption mode to "Full (strict)" for end-to-end encryption.

1. In Cloudflare Dashboard, go to **SSL/TLS** → **Overview**
2. Set **SSL/TLS encryption mode** to **"Full (strict)"**
3. Save changes

This ensures:

- Browser ↔ Cloudflare: HTTPS (Cloudflare's certificate)
- Cloudflare ↔ Mac Mini: HTTPS (Origin certificate)

## Step 6: Verify Setup

### 6-1. Test HTTP Redirect

Visit `http://preview.decoded.style` (replace with your domain). The Next.js application should load correctly.

### 6-2. Test HTTPS Access (when enabled)

After setting up Cloudflare Origin Certificate and enabling HTTPS, visit `https://preview.decoded.style`. You should see:

- ✅ Green padlock in browser (valid SSL)
- ✅ Next.js application loads correctly
- ✅ No SSL certificate errors

### 6-3. Test Next.js Features

Verify that Next.js features work correctly:

- Page navigation
- API routes (if any)
- WebSocket connections (HMR in dev mode)

## Step 7: Update Next.js Server Configuration

When using nginx, Next.js should run on `localhost:3000` (internal only). Update your server startup:

### Development Mode

```bash
# In tmux session
HOST=127.0.0.1 PORT=3000 yarn dev
```

Note: Changed from `HOST=0.0.0.0` to `HOST=127.0.0.1` to only accept local connections (via nginx).

### Production Mode

```bash
# Build first
yarn build

# Start server
HOST=127.0.0.1 PORT=3000 yarn start
```

### Update Startup Script

You may want to update `scripts/start-persistent-server.sh` to use `127.0.0.1` instead of `0.0.0.0` when nginx is configured, or add an environment variable to control this.

## Troubleshooting

### nginx Won't Start

```bash
# Check nginx error log
tail -f /usr/local/var/log/nginx/error.log
# or
tail -f /opt/homebrew/var/log/nginx/error.log

# Check if port 80/443 is already in use
sudo lsof -i :80
sudo lsof -i :443
```

### SSL Certificate Errors

- Verify certificate files exist: `ls -la /etc/nginx/ssl/`
- Check file permissions: `sudo chmod 600 /etc/nginx/ssl/*`
- Verify certificate paths in nginx config match actual file paths
- Test certificate: `openssl x509 -in /etc/nginx/ssl/preview.decoded.style.crt -text -noout`

### 502 Bad Gateway

- Ensure Next.js is running on port 3000: `lsof -i :3000`
- Check nginx error log for proxy connection errors
- Verify `proxy_pass` URL in nginx config: `http://127.0.0.1:3000`

### Domain Not Resolving

- Verify Cloudflare DNS A record points to correct IP
- Check DNS propagation: `dig preview.decoded.style` or `nslookup preview.decoded.style`
- Ensure Cloudflare proxy is enabled (orange cloud icon)

### Port Forwarding Not Working

- Verify router port forwarding rules
- Check Mac Mini firewall: System Settings → Network → Firewall
- Test internal access: `curl http://localhost` (should show nginx welcome page)
- Test external access: `curl http://222.109.163.45` (should show nginx welcome page)

## Security Considerations

### Firewall Configuration

Consider restricting access to port 3000 to localhost only:

```bash
# macOS Firewall (System Settings → Network → Firewall)
# Only allow connections from localhost to port 3000
```

### IP Restrictions (Optional)

For dev environments, you may want to restrict access:

1. **Cloudflare Firewall Rules**: Block access from certain countries/IPs
2. **nginx Basic Auth**: Add HTTP authentication
3. **IP Whitelist**: Restrict access to specific IP addresses

### robots.txt

Add `robots.txt` to prevent search engine indexing of dev environment:

```bash
# In Next.js public folder
echo "User-agent: *\nDisallow: /" > public/robots.txt
```

## Maintenance

### Renewing Origin Certificate

Cloudflare Origin certificates are valid for 15 years. When renewal is needed:

1. Generate new certificate in Cloudflare Dashboard
2. Replace certificate files in `/etc/nginx/ssl/`
3. Reload nginx: `sudo nginx -s reload`

### Updating Domain

If you need to change the domain:

1. Update Cloudflare DNS A record
2. Generate new Origin certificate for new domain
3. Update nginx configuration file
4. Update certificate file paths
5. Reload nginx

### Monitoring

Monitor nginx and Next.js logs:

```bash
# nginx access log
tail -f /usr/local/var/log/nginx/access.log

# nginx error log
tail -f /usr/local/var/log/nginx/error.log

# Next.js logs (if using pm2)
pm2 logs decoded-frontend
```

## Quick Reference

### Essential Commands

```bash
# Start nginx
brew services start nginx
# or
sudo nginx

# Stop nginx
brew services stop nginx
# or
sudo nginx -s stop

# Reload nginx (after config changes)
sudo nginx -t && sudo nginx -s reload

# Check nginx status
brew services list | grep nginx

# Test configuration
sudo nginx -t

# View nginx processes
ps aux | grep nginx
```

### File Locations

**Intel Mac:**

- Config: `/usr/local/etc/nginx/nginx.conf`
- Servers: `/usr/local/etc/nginx/servers/`
- Logs: `/usr/local/var/log/nginx/`

**Apple Silicon (M1/M2/M3):**

- Config: `/opt/homebrew/etc/nginx/nginx.conf`
- Servers: `/opt/homebrew/etc/nginx/servers/`
- Logs: `/opt/homebrew/var/log/nginx/`

**SSL Certificates:**

- `/etc/nginx/ssl/` (same for both architectures)

## Next Steps

After completing this setup:

1. ✅ Verify HTTPS access works
2. ✅ Update Next.js server to use `127.0.0.1:3000` (internal only)
3. ✅ Consider setting up monitoring/logging
4. ✅ Document your actual domain name and IP addresses
5. ✅ Set up automated backups of nginx configuration

For production deployment, this same structure can be reused on a Linux server with minimal changes.
