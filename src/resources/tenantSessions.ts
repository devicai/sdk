import type { DevicApiClient } from '../client.js';

export interface IssueTenantSessionInput {
  tenantId: string;
  subtenantId?: string;
  /**
   * How long the session lives, in seconds. Clamped by the API into 60 s–12 h,
   * so asking for a year gets twelve hours rather than an error.
   *
   * Match it to your own session when you hand the token straight to the
   * browser with nothing to renew it from.
   *
   * @default 3600
   */
  ttlSeconds?: number;
}

export interface TenantSession {
  token: string;
  tokenType: 'tenant-session';
  tenantId: string;
  subtenantId?: string;
  /** Seconds. */
  expiresIn: number;
  /** Epoch milliseconds. */
  expiresAt: number;
}

/**
 * Tokens that PROVE which of your customers is calling.
 *
 * An API key says who the workspace is; it says nothing about which of your
 * users is at the keyboard. Send a key to a browser and the tenant beside it is
 * a claim anyone can edit — so one customer can read another's conversations.
 * A session carries the tenant in a signed claim instead, expires, and can only
 * do what an end user does.
 *
 * **Call this from your server, never from a browser.** The API refuses a
 * request that looks like one, because a page able to mint its own session
 * could mint one for anybody, which is the impersonation this exists to stop.
 * Take the tenant from your own login, never from the request body.
 */
export class TenantSessions {
  constructor(private readonly client: DevicApiClient) {}

  issue(input: IssueTenantSessionInput): Promise<TenantSession> {
    return this.client.issueTenantSession(input);
  }
}
