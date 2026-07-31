// R1.5A — which roles may OPEN which page.
//
// ⚠️ READ THIS BEFORE EDITING: this file is *not* a security boundary.
// The backend's `requirePermission` is the only real gate. This exists so a
// role that the backend would refuse gets an honest redirect instead of a
// blank page full of zeros — the owner's uji-R1 finding C7/C8, where a cashier
// could open /settings and /finance and the app simply pretended there was no
// data. A page that lies about being empty is worse than one that says "no".
//
// The binding rule (from tahap-b-peran-dan-qc.md R2.2): every entry below must
// point at a real backend permission. If a rule here has no backend
// counterpart, the design is wrong — fix the backend, not this table.

/** Route prefix → the backend permission that actually guards its data. */
const RESTRICTED: { prefix: string; permission: string; roles: readonly string[] }[] = [
  {
    // /finance landing shows revenue, COGS and estimated profit; the ledger and
    // payables pages under it show the whole book and supplier debt.
    // Backend: requirePermission('finance.view_reports') on every GET in
    // routes/finance.ts. Cashier keeps the AR tile on their own dashboard,
    // which reads /finance/receivables (gated on pos.process_payment instead).
    prefix: '/finance',
    permission: 'finance.view_reports',
    roles: ['Super Admin', 'Manager'],
  },
  {
    // Company profile, branches, users & roles, printers, payment methods.
    // Backend: settings.manage_company / branch.manage / user.manage /
    // printer.manage / payment.manage — none of which Manager is granted.
    prefix: '/settings',
    permission: 'settings.manage_company',
    roles: ['Super Admin'],
  },
  {
    // Flow designer changes how EVERY ticket moves. Backend: flow.manage,
    // admin-only by the same reasoning as printer.manage.
    prefix: '/flows',
    permission: 'flow.manage',
    roles: ['Super Admin'],
  },
  {
    // R1.5B — intake belongs to the counter, not the bench. Backend:
    // requirePermission('ticket.create') on POST /v1/tickets/intake, which
    // Technician no longer holds. The button is hidden on /tickets too; this
    // covers someone typing the address, the same hole as C7/C8.
    prefix: '/tickets/intake',
    permission: 'ticket.create',
    roles: ['Super Admin', 'Manager', 'Cashier'],
  },
];

/**
 * The MOST SPECIFIC matching rule, not the first.
 *
 * Longest-prefix wins so that adding a broad `/tickets` rule later can never
 * silently shadow the narrower `/tickets/intake` one and hand a technician
 * back a page this file just took away.
 */
function ruleFor(pathname: string) {
  return RESTRICTED
    .filter((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

/**
 * True if `roleName` may open `pathname`.
 *
 * Unknown roles (including the seeded `'no-role'` case) get the narrowest
 * view rather than an error — same rule as R2.2's `ticketSectionsFor`.
 */
export function canAccessRoute(roleName: string | null | undefined, pathname: string): boolean {
  const rule = ruleFor(pathname);
  if (!rule) return true;
  if (!roleName) return false;
  return rule.roles.includes(roleName);
}

/** The permission a refusal is attributable to — for the redirect message. */
export function requiredPermissionFor(pathname: string): string | null {
  return ruleFor(pathname)?.permission ?? null;
}
