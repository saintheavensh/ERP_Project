---
document_id: B00-CH07
title: Document Template
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
---

# Document Template

## Purpose

This document defines the standard structure used by all documentation within the Universal Service ERP Documentation Library.

A standardized template ensures consistency, improves readability, simplifies maintenance, and enables both human contributors and AI agents to navigate documentation efficiently.

---

# Goals

This document aims to:

- Standardize document structure.
- Improve document consistency.
- Simplify document creation.
- Reduce missing information.
- Improve AI readability.

---

# Non-Goals

This document does not define:

- Business rules
- API specifications
- Database schemas
- Coding standards
- Project architecture

---

# Design Principles

Every document should:

- Have a clear purpose.
- Cover a single topic.
- Follow the same structure.
- Be easy to navigate.
- Minimize ambiguity.
- Be implementation-ready.

A reader should immediately understand:

- What the document describes.
- Why it exists.
- What it does not cover.
- How it relates to other documents.

---

# Standard Document Structure

Unless otherwise specified, every document should follow the structure below.

## 1. Metadata

Every document begins with YAML Front Matter.

Example:

```yaml
---
document_id:
title:
version:
last_updated:
author:
---
```

Metadata identifies the document and provides essential information for documentation management.

---

## 2. Title

Every document begins with a single H1 heading.

Example:

```
# Purchase Workflow
```

Only one H1 heading is allowed.

---

## 3. Purpose

Describes why the document exists.

This section should answer:

> Why should this document exist?

---

## 4. Goals

Lists the objectives of the document.

Goals define what the document intends to accomplish.

---

## 5. Non-Goals

Clearly defines what is intentionally excluded.

This prevents misunderstanding and scope creep.

---

## 6. Main Content

The primary content of the document.

Depending on document type, this may include:

- Business Rules
- Workflows
- API Contracts
- Database Design
- UI Specifications
- Security Requirements
- Validation Rules
- Error Handling
- Reports
- Configuration

The structure should be logical and organized.

---

## 7. References

References point to related documentation.

References should avoid duplication.

Whenever possible, documents should reference authoritative sources instead of repeating information.

---

## 8. Summary

Summarizes the key points covered by the document.

The summary should reinforce the most important concepts.

---

# Optional Sections

Certain document types may include additional sections.

Examples:

- Assumptions
- Dependencies
- Risks
- Constraints
- Examples
- Diagrams
- Wireframes
- Business Scenarios
- Acceptance Criteria
- Frequently Asked Questions

Optional sections should only be included when they add value.

---

# Section Ordering

Sections should appear in a logical order.

Readers should naturally progress from understanding the purpose to understanding the implementation details.

Avoid placing technical details before introducing the problem they solve.

---

# Document Size

Large subjects should be divided into multiple documents.

A document should remain focused on a single responsibility.

Avoid creating excessively long documents covering unrelated topics.

---

# Cross References

When related information exists elsewhere:

Reference it.

Do not duplicate it.

This supports the Single Source of Truth (SSOT) principle.

---

# Consistency

All documents should:

- Use the same terminology.
- Use the same writing style.
- Follow the same heading hierarchy.
- Follow the same metadata format.

Consistency improves maintainability.

---

# Expected Outcomes

Using a standard document template provides:

- Faster documentation creation.
- Consistent documentation quality.
- Easier maintenance.
- Better AI understanding.
- Improved navigation.
- Reduced duplication.

---

# References

- B00-CH01 Documentation Philosophy
- B00-CH05 Writing Standards
- B00-CH06 Naming Conventions

---

# Summary

A standardized document template establishes consistency across the entire documentation library.

Every document should follow this template unless a specialized document type explicitly defines its own structure.