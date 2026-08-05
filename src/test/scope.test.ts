import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { withScope } from '../scope.js';

describe('withScope', () => {
  test('adds the tenant a payload left unsaid', () => {
    const out = withScope({ tenantId: 'acme' }, { message: 'hola' });
    assert.equal(out.tenantId, 'acme');
    assert.equal(out.message, 'hola');
  });

  test('adds the subtenant too', () => {
    const out = withScope(
      { tenantId: 'acme', subtenantId: 'u-7' },
      { message: 'hola' },
    );
    assert.equal(out.subtenantId, 'u-7');
  });

  test('leaves the caller’s own value alone', () => {
    // A scope is a default, not a cage: a job walking several tenants has a
    // reason to name a different one on a single call.
    const out = withScope({ tenantId: 'acme' }, { tenantId: 'other' });
    assert.equal(out.tenantId, 'other');
  });

  test('adds nothing at the workspace level', () => {
    const out = withScope({}, { message: 'hola' });
    assert.equal('tenantId' in out, false);
    assert.equal('subtenantId' in out, false);
  });

  test('does not mutate what it was given', () => {
    const payload = { message: 'hola' };
    withScope({ tenantId: 'acme' }, payload);
    assert.equal('tenantId' in payload, false);
  });

  test('works with no payload at all', () => {
    assert.deepEqual(withScope({ tenantId: 'acme' }), { tenantId: 'acme' });
  });

  test('accepts a payload sharing no field with a scope', () => {
    // The reason the generic is `object` and not `Scope`: pagination options
    // have nothing in common with an identity, and TypeScript refuses to match
    // an object type against a fully-optional one.
    const out = withScope({ tenantId: 'acme' }, { limit: 10, offset: 20 });
    assert.equal(out.limit, 10);
    assert.equal(out.tenantId, 'acme');
  });
});
