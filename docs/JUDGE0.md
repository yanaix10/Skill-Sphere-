# Judge0 Setup & Operating Guide

This guide describes how to run and configure **Judge0 Community Edition (CE)** to evaluate player code in Coding Duel.

---

## 1. Version & Security Requirements
* **Minimum Version:** Judge0 CE **v1.13.1** or newer.
* Older versions (e.g., v1.13.0 and below) have known privilege escalation and cgroup isolation vulnerabilities. Never use outdated versions in any accessible environment.

---

## 2. Host OS Requirements (Linux Only)
* Judge0 execution isolate (`isolate`) is **Linux-only**.
* It relies on kernel features such as namespaces and **cgroup v1**.

### Ubuntu 22.04 LTS Setup
Ubuntu 22.04 uses cgroup v2 by default. Judge0's isolation sandbox requires cgroup v1.
To enable cgroup v1 on your host:

1. Edit `/etc/default/grub`:
   ```bash
   sudo nano /etc/default/grub
   ```
2. Find the line starting with `GRUB_CMDLINE_LINUX` and add `systemd.unified_cgroup_hierarchy=0`:
   ```bash
   GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"
   ```
3. Update GRUB and reboot the machine:
   ```bash
   sudo update-grub
   sudo reboot
   ```
4. Verify cgroup v1 is active:
   ```bash
   ls /sys/fs/cgroup/memory
   ```
   *(If this file/directory exists, cgroup v1 is active).*

---

## 3. Ubuntu 24.04, WSL2, and Windows Hosts
* **WSL2 / Windows:** Due to custom Microsoft WSL2 kernel differences and systemd cgroup limitations, running a local Judge0 daemon inside WSL2 often encounters isolate container errors (`isolate: initialization error`).
* **Alternative:** Use a hosted Judge0 provider (e.g. RapidAPI or a cloud VM running Ubuntu 22.04) or use `RUNNER=mock` during local UI development.

---

## 4. Running Locally via Docker Compose
Use the included [`docker-compose.judge0.yml`](file:///home/naitik/Projects/Skill-Sphere-/docker-compose.judge0.yml):

```bash
docker compose -f docker-compose.judge0.yml up -d
```

### Checking Status
```bash
curl http://localhost:2358/languages
```

### Environment Configuration
Configure your `.env`:
```env
RUNNER=judge0
JUDGE0_URL=http://localhost:2358
JUDGE0_MAX_CONCURRENCY=4
```
