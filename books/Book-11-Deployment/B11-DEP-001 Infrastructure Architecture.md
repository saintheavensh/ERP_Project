---
document_id: B11-DEP-001
title: Infrastructure Architecture
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Infrastructure Architecture

## Purpose
Defines the recommended Cloud Providers to host the application. The architecture favors Serverless/Edge computing to minimize server maintenance overhead for the Owner.

---

# 1. Frontend Hosting (React / Next.js)

**Recommended Provider:** Vercel or Cloudflare Pages.
* **Why:** Both provide global Content Delivery Networks (CDN). When a cashier accesses the app, the UI loads instantly from a server closest to their city, not from a single centralized server.
* **Maintenance:** Zero. Scales automatically.

# 2. Backend API Hosting (Hono)

**Recommended Provider:** Cloudflare Workers or Vercel Edge Functions.
* **Why:** Hono is specifically designed to run on the Edge. Unlike traditional Node.js servers (which have cold starts and high memory usage), Edge functions execute in milliseconds and scale infinitely based on traffic spikes.

# 3. Database Hosting (PostgreSQL)

**Recommended Provider:** Supabase or Neon.tech.
* **Why Supabase:** Provides built-in Row-Level Security (RLS) and authentication perfectly suited for our Multi-Branch requirements (See `B09-SEC-004`).
* **Why Neon:** Serverless PostgreSQL that separates compute and storage, making it highly scalable for heavy read/write operations (like our FIFO inventory logic).
