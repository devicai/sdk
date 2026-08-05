/**
 * Who a call acts on behalf of.
 *
 * Empty at the top level, where the caller is the workspace itself. Filled in
 * by `devic.auth(tenantId)`, and from then on carried into every call made
 * through that scope, so a tenant is stated once instead of on every line —
 * which is also the only way to be sure it was not forgotten on one of them.
 */
export interface Scope {
  tenantId?: string;
  subtenantId?: string;
}

/**
 * Adds the scope's identity to a payload, leaving anything the caller set
 * alone.
 *
 * The caller wins on purpose: a scope is a default, not a cage. Code that has
 * a reason to name a different tenant on one call — a background job walking
 * several — should be able to, and the API will refuse it anyway if the
 * credential is a tenant session rather than an API key.
 */
export function withScope<T extends object>(
  scope: Scope,
  payload?: T,
): T & Scope {
  // `T extends object` rather than `T extends Scope`: a payload of pagination
  // options shares no field with Scope, and TypeScript rejects an object type
  // with nothing in common with a fully-optional one. The intersection in the
  // return type is what callers actually get.
  const merged = { ...(payload ?? ({} as T)) } as T & Scope;
  if (scope.tenantId !== undefined && merged.tenantId === undefined) {
    merged.tenantId = scope.tenantId;
  }
  if (scope.subtenantId !== undefined && merged.subtenantId === undefined) {
    merged.subtenantId = scope.subtenantId;
  }
  return merged;
}
