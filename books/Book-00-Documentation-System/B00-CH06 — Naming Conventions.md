---
document_id: B00-CH06
title: Naming Conventions
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
---

# Naming Conventions

## Purpose

This document defines the official naming conventions used throughout the Universal Service ERP project.

Consistent naming improves readability, communication, maintainability, and reduces ambiguity across documentation, source code, APIs, databases, and supporting resources.

Every contributor and AI agent must follow these conventions.

---

# Goals

This document aims to:

- Standardize naming across the entire project.
- Eliminate inconsistent terminology.
- Improve readability.
- Reduce misunderstandings.
- Support long-term maintainability.

---

# Non-Goals

This document does not define:

- Coding style
- Programming patterns
- Database relationships
- Business workflows

---

# General Principles

Names should be:

- Clear
- Descriptive
- Consistent
- Predictable
- Technology-independent whenever possible

Names should describe what something is, not how it is implemented.

---

# Language

All names must use English.

Do not mix English with any other language.

Good:

- Purchase Order
- Customer
- Technician
- Service Order

Avoid:

- Pembelian
- Pelanggan
- Teknisi
- Servis

---

# Abbreviations

Avoid abbreviations unless they are universally recognized.

Acceptable examples:

- API
- URL
- UUID
- SKU
- FIFO
- PDF
- JSON

Avoid project-specific abbreviations.

Bad examples:

- POH
- InvDoc
- CustReg

---

# Canonical Terminology

Every business concept must have exactly one official name.

Example:

Correct:

Purchase Order

Incorrect alternatives:

- Purchase Document
- Buying Order
- Purchase Form

The official terminology must always be used.

---

# Singular vs Plural

Use singular names for entities.

Examples:

- Customer
- Supplier
- Product
- Invoice

Plural forms should only be used when referring to collections.

---

# File Names

Markdown files should use descriptive names.

Examples:

- Purchase-Workflow.md
- Inventory-FIFO.md
- Sales-Validation.md

Avoid generic names such as:

- Notes.md
- NewFile.md
- Test.md

---

# Directory Names

Directory names should describe logical domains.

Examples:

- Business-Rules
- Workflow
- Database
- API
- Quality

Avoid ambiguous directory names.

---

# Document Titles

Document titles should be human-readable.

Example:

Inventory FIFO Workflow

instead of

Inventory Workflow 02

---

# Consistency

Once a name has been chosen, it must never change without updating all related documentation.

Do not introduce synonyms.

---

# Reserved Terminology

Certain terms are considered reserved and should always retain their defined meanings.

Examples include:

- Customer
- Supplier
- Product
- Inventory
- Batch
- Purchase Order
- Sales Order
- Service Order
- Technician
- Device
- Repair

Definitions are maintained within the project glossary.

---

# Future Expansion

New modules should adopt existing naming conventions whenever possible.

If a new business domain introduces additional terminology, it should first be documented in the Glossary before being used elsewhere.

---

# Expected Outcomes

Following these naming conventions ensures:

- Consistent communication.
- Easier maintenance.
- Better documentation quality.
- Improved AI understanding.
- Predictable implementation.

---

# References

- Project Glossary
- Writing Standards
- Documentation Philosophy

---

# Summary

Naming is one of the foundations of software quality.

Consistent terminology reduces ambiguity, improves collaboration, and enables documentation and implementation to evolve together throughout the lifetime of the project.