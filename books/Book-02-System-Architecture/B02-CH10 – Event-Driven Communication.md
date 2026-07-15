---
document_id: B02-CH10
title: Event-Driven Communication
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
---

# Event-Driven Communication

## Purpose

This document defines how modules communicate using events.

---

# Overview

Modules may publish events when significant business actions occur.

Other modules may subscribe to these events without creating direct dependencies.

---

# Event Examples

Examples include:

- Service Order Created
- Service Order Completed
- Purchase Order Approved
- Inventory Updated
- Product Added
- Customer Registered
- Payment Received

---

# Rules

- Events represent completed business actions.
- Event names should use consistent terminology.
- Event handlers should remain independent.
- Publishing a new event should not require changes to existing modules.

---

# Benefits

Using events provides:

- Loose coupling.
- Better scalability.
- Easier integration.
- Independent module evolution.

---

# Summary

Event-driven communication enables modules to collaborate while remaining loosely coupled.