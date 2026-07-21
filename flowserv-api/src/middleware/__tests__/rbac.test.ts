import { describe, it, expect } from 'vitest';
import { evaluateRbac } from '../rbac';

describe('evaluateRbac', () => {
  it('allows a role with the granted permission, in either mode', () => {
    // Arrange
    const reportResult = evaluateRbac({ roleName: 'Cashier', hasGrant: true, mode: 'report' });
    const enforceResult = evaluateRbac({ roleName: 'Cashier', hasGrant: true, mode: 'enforce' });
    // Assert
    expect(reportResult).toEqual({ wouldDeny: false, block: false });
    expect(enforceResult).toEqual({ wouldDeny: false, block: false });
  });

  it('Super Admin bypasses the check even with no grant at all', () => {
    // Arrange — this is the escape hatch: without it, a catalog mistake
    // leaves nobody able to repair the catalog (H12).
    const result = evaluateRbac({ roleName: 'Super Admin', hasGrant: false, mode: 'enforce' });
    // Assert
    expect(result).toEqual({ wouldDeny: false, block: false });
  });

  it('report mode logs a missing grant but does not block', () => {
    // Arrange — Stage 2: discover missing grants before they can lock anyone out
    const result = evaluateRbac({ roleName: 'Cashier', hasGrant: false, mode: 'report' });
    // Assert
    expect(result).toEqual({ wouldDeny: true, block: false });
  });

  it('enforce mode blocks a missing grant (403 PERMISSION_DENIED)', () => {
    // Arrange
    const result = evaluateRbac({ roleName: 'Cashier', hasGrant: false, mode: 'enforce' });
    // Assert
    expect(result).toEqual({ wouldDeny: true, block: true });
  });
});
