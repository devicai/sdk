# @devicai/sdk

The official Devic SDK for TypeScript and JavaScript. Runs on your server.

```bash
npm install @devicai/sdk
```

```ts
import { Devic } from '@devicai/sdk';

const devic = new Devic({ apiKey: process.env.DEVIC_API_KEY! });

const reply = await devic.assistants.chat('support-bot', 'where is my order?');
```

## The one idea

`devic.*` speaks for your **workspace**. `devic.auth(tenantId)` speaks for **one
of your customers** inside it.

```ts
// As the workspace: what an operator configures.
await devic.assistants.list();
await devic.toolServers.create({ … });
await devic.projects.list();

// On behalf of a customer: what an end user does.
const acme = devic.auth('acme', 'user-7');
await acme.assistants.chat('support-bot', 'where is my order?');
await acme.assistants.conversations.list('support-bot');
await acme.integrations.list('support-bot');
await acme.usage.get();
```

Everything through a scope carries that customer's identity, so it cannot be
left off one call by accident — which is the failure with no symptom: the
message goes through, the answer looks right, and the conversation is filed
under your workspace instead of under your customer.

And what a customer must not do is simply not reachable from there. There is no
`acme.toolServers`, no `acme.projects`, no `acme.documents`.

## Tenant sessions — for the browser

Your page needs a credential. Sending it your API key makes the tenant a claim:
the key is readable by anyone who opens the network tab, so anyone can say they
are any of your customers.

Mint a session instead. From your server, taking the identity from **your own
login** and never from the request body:

```ts
app.post('/api/devic-session', requireLogin, async (req, res) => {
  const session = await devic
    .auth(req.user.organisationId, req.user.id)
    .session();

  res.json(session);        // { token, expiresAt, … }
});
```

Then in your page, with [`@devicai/ui`](https://www.npmjs.com/package/@devicai/ui):

```tsx
<DevicProvider
  getTenantSession={async () => {
    const r = await fetch('/api/devic-session', { credentials: 'include' });
    return r.json();
  }}
  onSessionExpired={() => location.assign('/login')}
>
  <ChatDrawer assistantId="support-bot" />
</DevicProvider>
```

A session lasts an hour by default, is confined to what an end user does, and
dies with the API key that minted it. It cannot create assistants, read your
costs, or reach another customer — whatever the page asks for.

**Without a renewal endpoint.** You do not have to expose one. Mint the session
inside your own login, give it a lifetime matching your session, and put it
wherever your page can read it:

```ts
const { token } = await devic.auth(user.org, user.id).session({
  ttlSeconds: 8 * 3600,          // up to 12 h
});
res.cookie('devic_session', token, { sameSite: 'lax' });
```

Simpler, and the only thing it trades is the window if a token is stolen — the
same one your own session cookie already accepts. Do set `onSessionExpired`:
there is nothing to renew from, so without it the widget stops answering at the
exact moment the user's login has expired too.

### Making it compulsory

All of the above is a convention until the key is unable to do anything else.
In the Devic console, an API key has an identity mode:

| Mode | What the key can do |
|---|---|
| `open` (default) | Anything it is allowed, for whichever tenant it declares beside itself. |
| `signed` | Mint tenant sessions, and nothing else. Every other `/api/v1` call with the key alone answers `401`. |

Put the SDK's key in `signed` and the mistake stops being possible: nobody can
paste that key into a page and reach a customer's data with it, because the only
thing it can do is ask for a token that pins the customer.

```ts
const devic = new Devic({ apiKey: process.env.DEVIC_API_KEY! });

await devic.auth('acme', 'user-7').session();   // the one thing it can do
await devic.assistants.list();                  // 401 — and that is the point
```

Which means a `signed` key is for exactly this: minting sessions in front of a
browser. Anything else your server does — provisioning assistants, reading
costs, running agents — needs a second key left on `open`. Two keys, two jobs.

A session cannot mint another session, so nothing that reaches the page can
widen itself back.

## What is here

| | |
|---|---|
| `devic.assistants` | assistants, chatting, conversations, feedback |
| `devic.agents` | agents, runs, approvals, costs |
| `devic.toolServers` | tool servers and their tools |
| `devic.projects` | projects, their runs and their costs |
| `devic.documents` | knowledge documents, versions, folders |
| `devic.skills` | the skill catalogue, install and uninstall |
| `devic.integrations` | the app catalogue and the **workspace's** connected accounts |
| `devic.triggers` | starting agents and assistants from app events |
| `devic.tenantSessions` | minting tokens that prove which customer is calling |
| `devic.tenants` | charging a customer for usage Devic never measured |

And on `devic.auth(tenantId, subtenantId?)`:

| | |
|---|---|
| `.assistants` / `.agents` | the same, with the customer filled in |
| `.integrations` | the apps **that customer** connected for themselves |
| `.usage` | their limits and what they have consumed |
| `.session()` | the credential for their browser |

Anything not wrapped yet is reachable on `devic.client`, which is the HTTP
client underneath.

## Charging usage Devic never measured

Not everything a customer consumes goes through Devic. A batch job in your own
product, a third-party transcription, credits you meter yourself — if they
should come out of the same allowance, add them:

```ts
const { applied, usage } = await devic.tenants.addUsage('acme-corp', {
  tokens: 1500,
  cost: 0.42,
  source: 'crm-sync',
});
```

It spends the allowance exactly like a call Devic did measure: go past a
window's ceiling this way and the next real request is refused with the same
`429`. `usage` comes back as it stands after the addition, so the allowance
left needs no second call, and every rule carries `externalConsumption` — the
part of its `current` that was added rather than measured.

`source` is a free tag (`[a-z0-9_-]`, defaults to `external`) that keeps
origins apart in the usage panel. Pass `subtenantId` to charge one end user
within the tenant.

Two things worth knowing:

- **It only adds.** Negative amounts are refused; taking consumption back off a
  tenant means resetting its counters.
- **`applied.countedTowardLimits` can be `false`** — a tenant with no plan and
  no ad-hoc rules has no allowance to spend. The usage is still recorded for
  cost reporting.

This lives on `devic`, not on `devic.auth(…)`, and the API agrees: a tenant
session is refused, which is what stops a customer writing their own usage
down. Call it from your server with a full API key.

## Errors

Every failure is a `DevicApiError` with the status code and the API's own
message:

```ts
import { DevicApiError } from '@devicai/sdk';

try {
  await devic.auth('acme').assistants.chat('support-bot', 'hola');
} catch (e) {
  if (e instanceof DevicApiError && e.statusCode === 429) {
    // the tenant is over its limit
  }
  throw e;
}
```

## Configuration

```ts
new Devic({
  apiKey: process.env.DEVIC_API_KEY!,
  baseUrl: 'https://api.devic.ai',   // default
  source: 'sdk',                     // how the API files this traffic
});
```

`source` only matters if you are building a tool on top of this package and want
its usage counted apart from your own.

The two remaining options are for callers whose credential is not a static API
key but a token that expires — an internal service passing a user's access
token, for instance:

```ts
new Devic({
  apiKey: accessToken,
  refreshToken: () => renew(),          // called after a 401, then retried once
  shouldRefreshProactively: () => isExpired(accessToken),
});
```

## Licence

MIT
