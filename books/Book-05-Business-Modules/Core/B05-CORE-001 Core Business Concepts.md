---
document_id: B05-CORE-001
title: Core Business Concepts
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Core Business Concepts

## Purpose

This document outlines the foundation, business philosophy, and core principles of the Universal Service ERP project. It serves as the guiding vision for all subsequent business module designs and technical implementations.

---

# Project Information

## Project Name
Universal Service ERP

## Project Type
Enterprise Resource Planning System

## Industry Focus
**Primary:**
* Mobile Phone Service Center

**Secondary:**
* Spare Part Store
* Mobile Phone Sales
* Mobile Accessories Sales

---

# Project Vision

The system is designed to become a complete operational platform capable of supporting the entire lifecycle of a mobile phone service business.

The platform should be usable by:
* Single Technician Shops
* Small Repair Shops
* Medium Service Centers
* Multi Branch Service Centers
* Enterprise Service Operations

... without requiring fundamental redesign of business workflows.

---

# Core Philosophy

## Philosophy 1: Business Workflow First
The system must adapt to real-world operations.
Real business workflows take priority over software convenience. The system should not force employees to change how they actually work just to satisfy database limitations.

## Philosophy 2: Speed Matters
Technicians and cashiers should spend more time repairing devices or serving customers than doing data entry.
The system should minimize mandatory fields during operational processes and allow deferred data entry where appropriate.

## Philosophy 3: Historical Data Must Survive
Data deletion should be heavily restricted.
The system must preserve historical records, service history, and audit trails permanently. Canceled, rejected, or failed repairs are still valuable business records that inform future decisions and customer relations.

## Philosophy 4: Customer / Device Independence
Customers and devices are distinct, independent entities. 
A customer may own multiple devices, and a device may change owners over its lifetime. The system must track device history independently from its current owner while maintaining a clear picture of who is currently responsible for the device.
