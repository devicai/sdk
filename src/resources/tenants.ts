import type { DevicApiClient } from '../client.js';
import type { AddTenantUsageInput, AddedTenantUsage } from '../types.js';

/**
 * Administrative actions on the tenants inside your workspace.
 *
 * Deliberately not reachable from `devic.auth(…)`: these are things you do
 * ABOUT a customer, not things the customer does. The API draws the same line —
 * a tenant session is refused here — which is what keeps a customer from
 * writing their own usage down.
 */
export class Tenants {
  constructor(private readonly c: DevicApiClient) {}

  /**
   * Charges a tenant for consumption Devic never measured.
   *
   * The case this exists for: work your own product did — a batch job, a
   * third-party transcription, credits you meter yourself — that should come
   * out of the same allowance the customer already sees in Devic. It spends
   * quota exactly like a call Devic measured, so going past a window's ceiling
   * this way refuses the next real request too.
   *
   * ```ts
   * const { applied, usage } = await devic.tenants.addUsage('acme-corp', {
   *   tokens: 1500,
   *   cost: 0.42,
   *   source: 'crm-sync',
   * });
   * ```
   *
   * `usage` comes back as it stands AFTER the addition, so the remaining
   * allowance needs no second call. Check `applied.countedTowardLimits`: a
   * tenant with no plan and no ad-hoc rules has no allowance to spend, and the
   * addition is only recorded for cost reporting.
   *
   * It only adds. To take consumption back off a tenant, reset its counters.
   */
  async addUsage(
    tenantId: string,
    input: AddTenantUsageInput,
  ): Promise<AddedTenantUsage> {
    // Async so a bad argument comes back as a rejected promise like any other
    // failure of this call: a throw from a method that returns one slips past
    // the caller's .catch().
    if (!tenantId) {
      throw new Error('A tenantId is required: it is who the usage is charged to.');
    }
    return this.c.addTenantUsage(tenantId, input);
  }
}
