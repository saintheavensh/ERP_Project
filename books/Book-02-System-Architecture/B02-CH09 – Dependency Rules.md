---
document_id: B02-CH09
title: Dependency Rules
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
---

# Dependency Rules

## Purpose

This document defines dependency rules between layers, modules, and shared components.

---

# Rules

- Modules may depend on the Core Platform.
- The Core Platform must not depend on business modules.
- Shared components must not depend on business modules.
- Circular dependencies are prohibited.
- Direct database access between modules is prohibited.
- Dependencies should be explicit and minimal.

---

# Dependency Direction

Allowed:

Module → Core Platform

Module → Shared Components

Module → Public Interface of another Module

Not Allowed:

Core Platform → Module

Module → Internal implementation of another Module

Module → Database of another Module

---

# Summary

Clear dependency rules maintain modularity and prevent architectural degradation.