import { DevicApiClient } from './client.js';
import { Assistants } from './resources/assistants.js';
import { Agents } from './resources/agents.js';
import {
  Documents,
  Integrations,
  Projects,
  Skills,
  ToolServers,
  Triggers,
} from './resources/workspace.js';
import { TenantSessions } from './resources/tenantSessions.js';
import { TenantScope } from './tenant.js';

const DEFAULT_BASE_URL = 'https://api.devic.ai';

export interface DevicConfig {
  /** A Devic API key. Keep it on your server. */
  apiKey: string;
  /** @default 'https://api.devic.ai' */
  baseUrl?: string;
  /**
   * What the API records this traffic as. Leave it alone unless you are
   * building a tool on top of this package and want its usage counted
   * separately.
   *
   * @default 'sdk'
   */
  source?: string;
  /** Called after a 401 to obtain a new access token, then the call is retried. */
  refreshToken?: () => Promise<string>;
  /** Return true to renew the token before sending, rather than after a refusal. */
  shouldRefreshProactively?: () => boolean;
}

/**
 * The Devic API.
 *
 * ```ts
 * const devic = new Devic({ apiKey: process.env.DEVIC_API_KEY! });
 *
 * // As the workspace: everything an operator configures.
 * await devic.assistants.list();
 * await devic.toolServers.list();
 *
 * // On behalf of one of your customers.
 * const acme = devic.auth('acme', 'user-7');
 * await acme.assistants.chat('support-bot', 'where is my order?');
 * await acme.integrations.list('support-bot');
 *
 * // The credential their browser should use.
 * const { token } = await acme.session();
 * ```
 *
 * The split is the whole design: `devic.*` speaks for the workspace, and
 * `devic.auth(…)` speaks for one customer inside it. Anything that must not be
 * done on a customer's behalf simply is not reachable from the second.
 */
export class Devic {
  /** The underlying HTTP client. Exposed for what the namespaces do not cover. */
  readonly client: DevicApiClient;

  readonly assistants: Assistants;
  readonly agents: Agents;
  readonly toolServers: ToolServers;
  readonly projects: Projects;
  readonly documents: Documents;
  readonly skills: Skills;
  /** Apps connected for the WHOLE workspace. A tenant's own are on `auth(…)`. */
  readonly integrations: Integrations;
  readonly triggers: Triggers;
  /** Tokens that prove which of your customers is calling. Server-side only. */
  readonly tenantSessions: TenantSessions;

  constructor(config: DevicConfig) {
    if (!config?.apiKey) {
      throw new Error(
        'An apiKey is required. Create one in Devic under API Keys, and keep it on your server.',
      );
    }

    this.client = new DevicApiClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      source: config.source ?? 'sdk',
      refreshToken: config.refreshToken,
      shouldRefreshProactively: config.shouldRefreshProactively,
    });

    const workspace = {};
    this.assistants = new Assistants(this.client, workspace);
    this.agents = new Agents(this.client, workspace);
    this.toolServers = new ToolServers(this.client);
    this.projects = new Projects(this.client);
    this.documents = new Documents(this.client);
    this.skills = new Skills(this.client);
    this.integrations = new Integrations(this.client);
    this.triggers = new Triggers(this.client);
    this.tenantSessions = new TenantSessions(this.client);
  }

  /**
   * Acts on behalf of one of your customers.
   *
   * Takes the identity from YOUR session — the logged-in user — and never from
   * anything the browser sent. That is the whole point: from here on the tenant
   * travels with every call, and the surface narrows to what a customer is
   * allowed to do.
   *
   * ```ts
   * const acme = devic.auth(user.organisationId, user.id);
   * ```
   */
  auth(tenantId: string, subtenantId?: string): TenantScope {
    if (!tenantId) {
      throw new Error(
        'A tenantId is required: it is the identity every call through this scope acts as.',
      );
    }
    return new TenantScope(this.client, { tenantId, subtenantId });
  }
}

export default Devic;

export { DevicApiClient } from './client.js';
export type { DevicApiClientConfig } from './client.js';
export { DevicApiError } from './errors.js';
export { TenantScope } from './tenant.js';
export { Assistants } from './resources/assistants.js';
export { Agents } from './resources/agents.js';
export {
  Documents,
  Integrations,
  Projects,
  Skills,
  ToolServers,
  Triggers,
} from './resources/workspace.js';
export { TenantSessions } from './resources/tenantSessions.js';
export type {
  IssueTenantSessionInput,
  TenantSession as IssuedTenantSession,
} from './resources/tenantSessions.js';
export type { Scope } from './scope.js';
export * from './types.js';
