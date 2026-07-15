---
document_id: B05-SVC-007
title: Dynamic Intake Forms
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Dynamic Intake Forms (Widgets)

## Purpose
This document establishes the business rule for handling diverse types of devices (Phones, Laptops, Printers, Consoles, etc.) without requiring hardcoded application logic for each new device category.

---

# Business Context

A Service Center may evolve over time. Today they repair smartphones, tomorrow they might repair smartwatches or espresso machines. The system must adapt instantly.

## Principle 1: Category-Driven Forms
The Intake Form presented to the Cashier or Customer Service is **NOT** a static form. It changes dynamically based on the "Device Category" selected.
* When selecting **Smartphone**, the system requests: IMEI, Lock PIN, Battery Health.
* When selecting **Printer**, the system requests: Ink Level, Total Pages Printed.
* When selecting **Console**, the system requests: Controller Included (Yes/No), Disc Drive Status.

## Principle 2: Data Agnosticism
The Backend and Database do not care what specific data is collected. They treat these dynamic fields as a flexible payload (JSON). The responsibility of understanding and displaying these fields belongs to the Frontend "Widgets", which read the rules (Schema) from the configuration table.

## Principle 3: No Code Updates Required
The Owner/Manager can define new Device Categories and their required fields from the System Settings, which instantly updates the Intake Forms across all branches without requiring a software update or a redeployment of the ERP.
