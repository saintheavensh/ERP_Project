# Phase 6: Dynamic Forms Transition

This file tracks the areas of the codebase that are currently hardcoded for Phase 3 and must be refactored into a fully dynamic system in Phase 6.

## What is currently hardcoded?
In Phase 3, the "Ticket Detail" page renders specific forms (like Diagnosis Form, Approval Form, Repair Form) based on the `nodeType` or hardcoded strings of the `currentNodeId` / node name. 

For example, when a ticket is in a node named "Diagnosis", the UI explicitly renders a hardcoded Svelte component for Diagnosis.

## Files to refactor in Phase 6:
1. `flowserv-web/src/routes/(app)/tickets/[id]/+page.svelte`
   - **Current state**: Uses `{#if}` or `{#match}` statements to render specific form components based on the current Node.
   - **Target state**: Should fetch a JSON schema from the backend (defined in the `FlowTemplate` or a new `NodeForms` table) and dynamically render fields (inputs, selects, file uploads) using a dynamic form renderer (e.g., iterating through an array of field definitions).

2. `flowserv-api/src/routes/tickets.ts`
   - **Current state**: The `POST /v1/tickets/:id/transition` endpoint might accept a generic JSON payload, but the backend doesn't strictly validate the payload schema against a database-defined form definition.
   - **Target state**: Before executing `FlowEngine.executeTransition`, the backend should load the dynamic form schema for the `currentNodeId` and validate that the submitted payload matches the required fields and constraints.

## Goal for Phase 6
The system should allow a Super Admin to go to "Settings > Flow Templates", create a new node, and visually drag-and-drop form fields to create a custom form for that node without touching any source code.
