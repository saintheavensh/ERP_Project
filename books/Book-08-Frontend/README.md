# Book 08 - Frontend Architecture

This directory contains the philosophy and visual blueprints (ASCII Wireframes) for the User Interface of the Universal Service ERP.

## The Core Philosophy
**"Complex Backend, Simple Frontend"**
The underlying logic (FIFO tracking, soft deletes, dynamic JSON parsing) is handled by the API (Book-07) and Database (Book-06). The Frontend's only job is to provide an ultra-fast, minimalist, and error-proof experience for laypeople (Cashiers and Technicians).

## Technology Stack (Recommended)
* **Framework:** React / Next.js
* **Styling:** Tailwind CSS (for rapid, responsive, minimalist design)
* **Data Fetching:** React Query (for background caching and seamless API integration)
* **State Management:** Zustand (for lightweight global state)

## Wireframe Documents
* **[B08-FE-001 Frontend Principles](B08-FE-001%20Frontend%20Principles.md)**
* **[B08-FE-002 Setup Wizard Wireframes](B08-FE-002%20Setup%20Wizard%20Wireframes.md)**
* **[B08-FE-003 Cashier Intake Wireframes](B08-FE-003%20Cashier%20Intake%20Wireframes.md)**
* **[B08-FE-004 Technician Board Wireframes](B08-FE-004%20Technician%20Board%20Wireframes.md)**
* **[B08-FE-005 Manager Dashboard Wireframes](B08-FE-005%20Manager%20Dashboard%20Wireframes.md)**
