# Project Guidelines Enforcement

When working on this project (Universal-Service-ERP-Specification), every AI agent MUST:

1. **Strictly adhere to the rules in `CLAUDE.md`**. This file contains the foundational project structure, git workflows, tech stack requirements, and mandatory instructions. Do NOT deviate from it.
2. **Always refer to the `specification/` folder as the Single Source of Truth**. Any architectural decisions, coding standards (such as `coding-guidelines.md`), and API definitions must be strictly followed to ensure code uniformity and prevent errors.
3. **Verify Before Committing**: Before making any git commit or finalizing a task, always verify that the code compiles, has no TypeScript/syntax errors, and runs correctly.
4. **Strict Typing Rules**: Strive for maximum type safety. Avoid using `any` or `unknown` types unless absolutely necessary. Ensure all generated code is free from TypeScript compiler errors.
5. **Follow Phase Progression**: Follow the steps in `PHASES.md` linearly and update the checklist as tasks are completed.
