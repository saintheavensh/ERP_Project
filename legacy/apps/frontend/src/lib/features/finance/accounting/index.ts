// Accounting Feature Module
export { AccountingController } from "./accounting.controller.svelte";
export { AccountingService } from "./accounting.service";

// Submodules
export * from "./accounts";
export * from "./assets";
export * from "./journals";
export * from "./payables";
export * from "./register";

// Components
export { default as AccountingHeader } from "./components/AccountingHeader.svelte";
export { default as AccountingStats } from "./components/AccountingStats.svelte";
export { default as DailyTargetCard } from "./components/DailyTargetCard.svelte";
export { default as ProfitLossSection } from "./components/ProfitLossSection.svelte";
export { default as QuickLinks } from "./components/QuickLinks.svelte";
