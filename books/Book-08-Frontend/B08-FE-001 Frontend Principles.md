---
document_id: B08-FE-001
title: Frontend Architecture Principles
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Frontend Architecture Principles

## Purpose
This document establishes the UI/UX philosophy and technical standards for the Frontend application. The goal is to create a robust, complex backend that is entirely hidden behind an interface so simple a layperson can use it without training.

---

# 1. Design Philosophy: "Less is More"

* **Minimalist Interface:** Remove all unnecessary borders, dense tables, and cluttered navigation.
* **Focal Points:** Every screen must have ONE clear primary action (e.g., a massive blue "Start Repair" button).
* **Color Psychology:** 
  * Red for urgent/blocking tasks (e.g., Waiting for Parts, High Priority Queue).
  * Green for completed/revenue-generating tasks (e.g., Paid, Passed QC).
  * Neutral/White for everything else to reduce cognitive load.

---

# 2. Technical Standards

## Framework
* **React / Next.js:** The industry standard for building highly interactive, component-driven Single Page Applications (SPAs).
* **Tailwind CSS:** For rapid, responsive styling. It allows developers to build modern, clean interfaces instantly.

## State Management & Data Fetching
* **React Query (TanStack Query):** Handles all asynchronous data fetching, caching, and background synchronization with the API (Book-07). It ensures the UI never freezes while waiting for network responses.
* **Zustand / Context API:** For lightweight global UI state (e.g., Is the sidebar open? Who is the logged-in user?).

## Mobile-First Responsiveness
* The application must be 100% usable on a tablet (iPad) since many cashiers and technicians prefer touchscreens over keyboards.
* Complex tables must automatically collapse into card-based lists on smaller screens.
