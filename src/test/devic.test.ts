import assert from 'node:assert/strict';
import { test, describe, mock } from 'node:test';
import { Devic } from '../index.js';

/**
 * What is checked here is the SDK's own behaviour — what it puts on the wire —
 * rather than the API's, which is verified against a running backend.
 */
function withFetch(handler: (url: string, init?: RequestInit) => unknown) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fake = mock.method(globalThis, 'fetch', async (url: any, init: any) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      status: 200,
      json: async () => handler(String(url), init),
    } as Response;
  });
  return { calls, restore: () => fake.mock.restore() };
}

const devic = () => new Devic({ apiKey: 'k', baseUrl: 'https://api.test' });

describe('Devic', () => {
  test('refuses to be built without a key, and says where to get one', () => {
    assert.throws(
      () => new Devic({ apiKey: '' }),
      /apiKey is required.*API Keys/s,
    );
  });

  test('refuses an empty tenant, which would silently mean "the workspace"', () => {
    assert.throws(() => devic().auth(''), /tenantId is required/);
  });

  test('reports itself as the sdk, so its usage is not counted as the CLI’s', async () => {
    const f = withFetch(() => []);
    await devic().assistants.list();
    assert.equal(
      (f.calls[0].init?.headers as Record<string, string>)['devic-api-source'],
      'sdk',
    );
    f.restore();
  });

  test('lets a tool built on top claim its own source', async () => {
    const f = withFetch(() => []);
    await new Devic({ apiKey: 'k', baseUrl: 'https://api.test', source: 'cli' })
      .assistants.list();
    assert.equal(
      (f.calls[0].init?.headers as Record<string, string>)['devic-api-source'],
      'cli',
    );
    f.restore();
  });
});

describe('acting for one tenant', () => {
  test('a message carries the tenant without being told', async () => {
    const f = withFetch(() => []);
    await devic().auth('acme', 'u-7').assistants.chat('bot', 'hola');

    const body = JSON.parse(f.calls[0].init!.body as string);
    assert.equal(body.message, 'hola');
    assert.equal(body.tenantId, 'acme');
    assert.equal(body.subtenantId, 'u-7');
    f.restore();
  });

  test('a message from the workspace carries no tenant', async () => {
    const f = withFetch(() => []);
    await devic().assistants.chat('bot', 'hola');

    const body = JSON.parse(f.calls[0].init!.body as string);
    assert.equal('tenantId' in body, false);
    f.restore();
  });

  test('listing conversations filters by the tenant', async () => {
    const f = withFetch(() => ({ histories: [] }));
    await devic().auth('acme').assistants.conversations.list('bot');

    assert.match(f.calls[0].url, /tenantId=acme/);
    f.restore();
  });

  test('starting a run carries the tenant', async () => {
    const f = withFetch(() => ({}));
    await devic().auth('acme', 'u-7').agents.runs.start('agt-1', 've y hazlo');

    const body = JSON.parse(f.calls[0].init!.body as string);
    assert.equal(body.message, 've y hazlo');
    assert.equal(body.tenantId, 'acme');
    f.restore();
  });

  test('its own apps are asked for as that tenant', async () => {
    const f = withFetch(() => []);
    await devic().auth('acme', 'u-7').integrations.list('bot');

    assert.match(f.calls[0].url, /assistantId=bot/);
    assert.match(f.calls[0].url, /tenantId=acme/);
    assert.match(f.calls[0].url, /subtenantId=u-7/);
    f.restore();
  });

  test('its usage is read without naming the tenant twice', async () => {
    const f = withFetch(() => ({ usage: [] }));
    await devic().auth('acme').usage.get();

    assert.equal(f.calls[0].url, 'https://api.test/api/v1/tenant-usage/acme');
    f.restore();
  });

  test('a subtenant scope reads the subtenant’s own usage', async () => {
    const f = withFetch(() => ({ usage: [] }));
    await devic().auth('acme', 'u-7').usage.get();

    assert.match(f.calls[0].url, /\/tenant-usage\/acme\/subtenants\/u-7$/);
    f.restore();
  });

  test('session() mints for the scope it was taken from', async () => {
    const f = withFetch(() => ({ token: 't' }));
    await devic().auth('acme', 'u-7').session({ ttlSeconds: 28800 });

    assert.equal(f.calls[0].url, 'https://api.test/api/v1/tenant-sessions');
    const body = JSON.parse(f.calls[0].init!.body as string);
    assert.deepEqual(body, {
      tenantId: 'acme',
      subtenantId: 'u-7',
      ttlSeconds: 28800,
    });
    f.restore();
  });

  test('scopes do not leak into each other', async () => {
    const f = withFetch(() => []);
    const d = devic();
    const a = d.auth('acme');
    const b = d.auth('other');

    await a.assistants.chat('bot', 'uno');
    await b.assistants.chat('bot', 'dos');

    assert.equal(JSON.parse(f.calls[0].init!.body as string).tenantId, 'acme');
    assert.equal(JSON.parse(f.calls[1].init!.body as string).tenantId, 'other');
    f.restore();
  });
});

describe('what a tenant scope deliberately cannot reach', () => {
  test('workspace configuration is not on it', () => {
    const acme = devic().auth('acme') as unknown as Record<string, unknown>;
    for (const forbidden of [
      'toolServers',
      'projects',
      'documents',
      'skills',
      'triggers',
      'tenantSessions',
    ]) {
      assert.equal(
        acme[forbidden],
        undefined,
        `${forbidden} must not be reachable on behalf of a tenant`,
      );
    }
  });

  test('but the workspace itself has them', () => {
    const d = devic() as unknown as Record<string, unknown>;
    for (const present of [
      'toolServers',
      'projects',
      'documents',
      'skills',
      'triggers',
      'integrations',
      'tenantSessions',
    ]) {
      assert.notEqual(d[present], undefined, `${present} is missing`);
    }
  });
});
