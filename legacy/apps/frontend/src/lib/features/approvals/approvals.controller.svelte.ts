import { approvalsService } from './services/approvals.service';
import type { Approval, ApprovalStats, ApprovalType } from './types/approvals.types';
import { toast } from "svelte-sonner";

export function createApprovalsController() {
    let pendingApprovals = $state<Approval[]>([]);
    let approvalHistory = $state<Approval[]>([]);
    let stats = $state<ApprovalStats>({ pending: 0, approved: 0, rejected: 0, totalAmount: 0 });
    let loading = $state(false);
    let error = $state<string | null>(null);
    let selectedApproval = $state<Approval | null>(null);

    // Filters
    let typeFilter = $state<ApprovalType | 'ALL'>('ALL');
    let dateRange = $state<{ start: Date; end: Date }>({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
    });

    // Computed filtering of history (client-side for basic needs, or can refetch from server)
    let filteredHistory = $derived(
        approvalHistory.filter(a =>
            (typeFilter === 'ALL' || a.type === typeFilter)
        )
    );

    async function loadPendingApprovals() {
        loading = true;
        try {
            pendingApprovals = await approvalsService.getPendingApprovals();
        } catch (e: any) {
            error = e.message || "Failed to load pending approvals";
            toast.error(error!);
        } finally {
            loading = false;
        }
    }

    async function loadApprovalHistory() {
        loading = true;
        try {
            approvalHistory = await approvalsService.getApprovalHistory();
        } catch (e: any) {
            error = e.message || "Failed to load approval history";
            toast.error(error!);
        } finally {
            loading = false;
        }
    }

    async function loadStats() {
        try {
            stats = await approvalsService.getApprovalStats();
        } catch (e: any) {
            error = e.message || "Failed to load stats";
            console.error(error);
        }
    }

    async function approve(id: string, notes?: string) {
        loading = true;
        try {
            const updated = await approvalsService.approve(id, notes);
            pendingApprovals = pendingApprovals.filter(a => a.id !== id);
            approvalHistory = [updated, ...approvalHistory];
            toast.success("Transaction Approved");
            await loadStats();
        } catch (e: any) {
            error = e.message || "Failed to approve";
            toast.error(error!);
        } finally {
            loading = false;
            selectedApproval = null;
        }
    }

    async function reject(id: string, reason: string) {
        loading = true;
        try {
            const updated = await approvalsService.reject(id, reason);
            pendingApprovals = pendingApprovals.filter(a => a.id !== id);
            approvalHistory = [updated, ...approvalHistory];
            toast.success("Transaction Rejected");
            await loadStats();
        } catch (e: any) {
            error = e.message || "Failed to reject";
            toast.error(error!);
        } finally {
            loading = false;
            selectedApproval = null;
        }
    }

    return {
        // State Getters
        get pendingApprovals() { return pendingApprovals; },
        get approvalHistory() { return approvalHistory; },
        get filteredHistory() { return filteredHistory; },
        get stats() { return stats; },
        get loading() { return loading; },
        get error() { return error; },
        get selectedApproval() { return selectedApproval; },

        // State Setters & Filters
        get typeFilter() { return typeFilter; },
        set typeFilter(value) { typeFilter = value; },
        get dateRange() { return dateRange; },
        set dateRange(value) { dateRange = value; },
        setSelectedApproval: (a: Approval | null) => selectedApproval = a,

        // Actions
        loadPendingApprovals,
        loadApprovalHistory,
        loadStats,
        approve,
        reject
    };
}
