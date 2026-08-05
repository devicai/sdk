import type { DevicApiClient } from './client.js';
import type {
  TenantIntegration,
  TenantIntegrationAccount,
  TenantSession,
  TenantUsage,
} from './types.js';
import { Agents } from './resources/agents.js';
import { Assistants } from './resources/assistants.js';
import type { Scope } from './scope.js';

/**
 * Everything done on behalf of ONE of your customers.
 *
 * Obtained from `devic.auth(tenantId, subtenantId?)`, and the point of it is
 * that the tenant is stated once. Every call made through this object carries
 * it, so it cannot be left off one of them by accident — which is the failure
 * that has no symptom: the message goes through, the answer looks right, and
 * the conversation is filed under the workspace instead of the customer.
 *
 * What is here and what is not follows the same line the API draws. Chatting,
 * runs, the tenant's own apps and their own limits: yes. Creating assistants,
 * configuring tool servers, reading the account's costs: no — those are not a
 * tenant's to do, and they stay on `devic` itself.
 */
export class TenantScope {
  readonly tenantId: string;
  readonly subtenantId?: string;

  /** Assistants, with this tenant filled into every message. */
  readonly assistants: Assistants;
  /** Agents and their runs, likewise. */
  readonly agents: Agents;

  constructor(
    private readonly client: DevicApiClient,
    scope: Required<Pick<Scope, 'tenantId'>> & Scope,
  ) {
    this.tenantId = scope.tenantId;
    this.subtenantId = scope.subtenantId;
    this.assistants = new Assistants(client, scope);
    this.agents = new Agents(client, scope);
  }

  /**
   * Mints the credential this tenant's browser should use.
   *
   * The natural way to read it: `devic.auth(customer).session()` — the session
   * OF that customer. Hand the result to your page, where `@devicai/ui` takes
   * it from `getTenantSession` and renews it on its own.
   *
   * Give `ttlSeconds` your own session's length if you are putting the token in
   * a cookie and have nowhere to renew it from.
   */
  session(opts?: { ttlSeconds?: number }): Promise<TenantSession> {
    return this.client.issueTenantSession({
      tenantId: this.tenantId,
      subtenantId: this.subtenantId,
      ttlSeconds: opts?.ttlSeconds,
    });
  }

  /**
   * The apps THIS customer has connected for themselves — never the ones an
   * administrator connected for the whole workspace, which live on
   * `devic.integrations`.
   */
  readonly integrations = {
    /** Offered apps, each with this tenant's own accounts. */
    list: (assistantId: string): Promise<TenantIntegration[]> =>
      this.client.listTenantIntegrations(this.query(assistantId)),

    accounts: (
      app: string,
      assistantId: string,
    ): Promise<TenantIntegrationAccount[]> =>
      this.client.listTenantIntegrationAccounts(app, this.query(assistantId)),

    /**
     * The URL to send this customer's browser to in order to connect an app.
     * `returnTo` must be an origin the assistant allows.
     */
    connect: (
      app: string,
      assistantId: string,
      opts?: { returnTo?: string },
    ): Promise<{ authorizationUrl: string }> =>
      this.client.connectTenantIntegration(app, {
        ...this.query(assistantId),
        returnTo: opts?.returnTo,
      }),

    /** Revokes one of their accounts at the provider. Theirs to remove. */
    disconnect: (
      accountId: string,
      assistantId: string,
    ): Promise<{ disconnected: boolean }> =>
      this.client.disconnectTenantIntegrationAccount(
        accountId,
        this.query(assistantId),
      ),

    /** Drops the short cache of their connections, after one just changed. */
    refresh: (assistantId: string): Promise<{ refreshed: boolean }> =>
      this.client.refreshTenantIntegrations(this.query(assistantId)),
  };

  /** This customer's limits and what they have used against them. */
  readonly usage = {
    get: (): Promise<TenantUsage> =>
      this.client.getTenantUsage(this.tenantId, this.subtenantId),

    history: (opts?: {
      scope?: 'tenant' | 'subtenant';
      metric?: 'tokens' | 'cost';
      windowUnit?: 'hour' | 'day' | 'week' | 'month';
      from?: number;
      to?: number;
      limit?: number;
      skip?: number;
    }): Promise<unknown> =>
      this.client.getTenantUsageHistory(this.tenantId, {
        subtenantId: this.subtenantId,
        ...opts,
      }),
  };

  private query(assistantId: string) {
    return {
      assistantId,
      tenantId: this.tenantId,
      subtenantId: this.subtenantId,
    };
  }
}
