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

And on `devic.auth(tenantId, subtenantId?)`:

| | |
|---|---|
| `.assistants` / `.agents` | the same, with the customer filled in |
| `.integrations` | the apps **that customer** connected for themselves |
| `.usage` | their limits and what they have consumed |
| `.session()` | the credential for their browser |

Anything not wrapped yet is reachable on `devic.client`, which is the HTTP
client underneath.

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
});
```

## Licence

MIT
