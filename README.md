# Universal Service ERP Specification

## Overview

This repository is the **single source of truth (SSOT)** for the Universal Service ERP system.

It contains full system specification including:

- Business rules
- System architecture
- Module definitions
- API contracts
- Database design
- UI/UX structure
- Engineering standards
- Quality assurance rules
- AI agent behavior rules

This repository is **NOT source code**.

It is the **blueprint of the entire system**.

---

## Purpose

The purpose of this repository is to ensure:

- Every feature is clearly defined before development
- All modules follow consistent architecture
- AI agents and developers follow the same rules
- No ambiguity between business logic and implementation
- System is scalable into SaaS and multi-service platforms

---

## System Vision

This system is designed to become a:

> Universal Service Management Platform

Initially focused on:

- Phone Service Center
- Inventory Management
- Sales & Purchase System

Later expandable to:

- Laptop Service
- Printer Service
- Multi-branch Service Centers
- SaaS Platform
- Plugin-based ecosystem

---

## Core Principles

The system follows these core principles:

- Modular First Architecture
- Configuration over Hardcoding
- DRY (Don't Repeat Yourself)
- Strict Type Safety
- Single Responsibility Principle
- AI-readable documentation structure
- Fully traceable business logic
- Extensible module system

---

## Documentation Structure

All documentation is organized into "Books":

- Book 00 → Documentation System
- Book 01 → Project Foundation
- Book 02 → System Architecture
- Book 03 → Core Platform
- Book 04 → Shared Resources
- Book 05 → Modules
- Book 06 → Database
- Book 07 → API
- Book 08 → UI/UX
- Book 09 → Engineering Standards
- Book 10 → AI System Rules
- Book 11 → Quality Assurance
- Book 12 → Roadmap

Each Book contains detailed chapters and references.

---

## How to Use This Repository

### For Developers

1. Read Book 00 first
2. Understand system structure
3. Follow Engineering Standards (Book 09)
4. Implement based on Module specifications

---

### For AI Agents

AI must:

- Read Book 00 first
- Always follow Book 09 (Engineering Rules)
- Always follow Book 10 (AI Rules)
- Never generate code without reading module specification
- Always respect Quality Assurance rules (Book 11)

---

## Critical Rules

- This repository defines SYSTEM BEHAVIOR, not code implementation
- No module should be implemented without documentation
- No business logic should exist outside module specification
- Engineering rules are mandatory, not optional
- AI must NOT guess system behavior without documentation reference

---

## Status

This is an early-stage specification system.

All Books are under active development.

---

## Next Step

Start from:

👉 `books/Book-00-Documentation-System/README.md`

This is the entry point to the documentation system architecture.