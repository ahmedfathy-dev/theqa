import assert from 'node:assert/strict';
import { test } from 'node:test';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const { localData } = await import('./localData.js');
const post = (path, body) => localData(path, { method: 'POST', body });
const storageKey = 'react-portal-data-v1';
const clientEmail = 'client@example.test';
const clientPassword = 'client123';
const adminEmail = 'admin@example.test';
const adminPassword = 'admin123';
const wrongCode = (code) => (code === '000000' ? '000001' : '000000');

test('email login and password recovery work for client and admin demo accounts', async () => {
  storage.clear();

  await assert.rejects(
    post('/client/login', { email: clientEmail, password: 'wrongpass' }),
    (error) => error.status === 401,
  );
  await assert.rejects(
    post('/client/login', { email: 'not-an-email', password: 'somepass' }),
    (error) => error.status === 400,
  );
  await assert.rejects(
    post('/client/login', { email: 'new-client@example.com', password: '' }),
    (error) => error.status === 400,
  );
  await post('/client/login', { email: 'new-client@example.com', password: 'any-password' });
  const demoOverview = await localData('/client/overview');
  assert.equal(demoOverview.client.id, 'demo-client');
  assert.equal(demoOverview.client.brand_name, 'دار سُدرة');
  assert.equal(demoOverview.client.project_name, 'هوية ومتجر دار سُدرة');
  assert.equal(demoOverview.client.progress, 42);
  assert.ok(demoOverview.phases.some((phase) => phase.status === 'current'));
  assert.equal(demoOverview.updates.length, 3);
  assert.equal(demoOverview.files.length, 2);
  assert.equal(demoOverview.messages.length, 3);
  assert.equal((await localData('/client/requests')).length, 2);
  assert.equal((await localData('/client/files')).length, 2);
  await post('/client/logout', {});
  await assert.rejects(
    post('/client/login', { email: 'new-client@example.com', password: 'wrong-password' }),
    (error) => error.status === 401,
  );
  await post('/client/login', { email: 'new-client@example.com', password: 'any-password' });
  await post('/client/logout', {});

  const arbitraryEmailReset = await post('/client/password-reset', { email: 'new-client@example.com' });
  assert.match(arbitraryEmailReset.resetCode, /^\d{6}$/);
  await post('/client/password-reset/confirm', {
    email: 'new-client@example.com',
    code: arbitraryEmailReset.resetCode,
    password: 'updated-pass123',
  });
  await post('/client/login', { email: 'new-client@example.com', password: 'updated-pass123' });
  await post('/client/logout', {});

  await post('/client/login', { email: ` ${clientEmail.toUpperCase()} `, password: clientPassword });
  assert.equal((await localData('/client/overview')).client.email, clientEmail);
  await post('/client/logout', {});

  const reset = await post('/client/password-reset', { email: clientEmail });
  assert.match(reset.resetCode, /^\d{6}$/);
  assert.deepEqual(await post('/client/password-reset', { email: 'unknown@example.test' }), { ok: true, resetCode: null });
  await assert.rejects(
    post('/client/password-reset/confirm', { email: clientEmail, code: wrongCode(reset.resetCode), password: 'newclient1' }),
    /رمز الاستعادة غير صحيح/,
  );
  await assert.rejects(
    post('/client/password-reset/confirm', { email: clientEmail, code: reset.resetCode, password: 'short' }),
    /8 أحرف/,
  );
  await post('/client/password-reset/confirm', { email: clientEmail, code: reset.resetCode, password: 'newclient1' });
  await assert.rejects(
    post('/client/password-reset/confirm', { email: clientEmail, code: reset.resetCode, password: 'newclient2' }),
    /رمز الاستعادة غير صحيح/,
  );
  await assert.rejects(post('/client/login', { email: clientEmail, password: clientPassword }), (error) => error.status === 401);
  await post('/client/login', { email: clientEmail, password: 'newclient1' });
  await post('/client/logout', {});

  const expiredReset = await post('/client/password-reset', { email: clientEmail });
  const state = JSON.parse(storage.get(storageKey));
  state.auth.passwordResets[`client:${clientEmail}`].expires_at = Date.now() - 1;
  storage.set(storageKey, JSON.stringify(state));
  await assert.rejects(
    post('/client/password-reset/confirm', { email: clientEmail, code: expiredReset.resetCode, password: 'another123' }),
    /رمز الاستعادة غير صحيح/,
  );

  const lockedReset = await post('/client/password-reset', { email: clientEmail });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(
      post('/client/password-reset/confirm', { email: clientEmail, code: wrongCode(lockedReset.resetCode), password: 'another123' }),
      /رمز الاستعادة غير صحيح/,
    );
  }
  await assert.rejects(
    post('/client/password-reset/confirm', { email: clientEmail, code: lockedReset.resetCode, password: 'another123' }),
    /رمز الاستعادة غير صحيح/,
  );

  await assert.rejects(post('/admin/login', { email: adminEmail, password: 'wrongpass' }), (error) => error.status === 401);
  await post('/admin/login', { email: adminEmail, password: adminPassword });
  assert.deepEqual(await localData('/admin/me'), { ok: true });
  await post('/admin/logout', {});

  const adminReset = await post('/admin/password-reset', { email: adminEmail });
  assert.match(adminReset.resetCode, /^\d{6}$/);
  await post('/admin/password-reset/confirm', { email: adminEmail, code: adminReset.resetCode, password: 'newadmin123' });
  await assert.rejects(post('/admin/login', { email: adminEmail, password: adminPassword }), (error) => error.status === 401);
  await post('/admin/login', { email: adminEmail, password: 'newadmin123' });

  const created = await post('/admin/clients', {
    name: 'عميل جديد',
    project_name: 'مشروع تجريبي',
    email: 'new-client@example.test',
  });
  await post('/admin/logout', {});
  await post('/client/login', { email: 'new-client@example.test', password: clientPassword });
  assert.equal((await localData('/client/overview')).client.id, created.id);
  await post('/client/logout', {});

  storage.clear();
  await post('/client/login', { email: clientEmail, password: clientPassword });
  const legacyState = JSON.parse(storage.get(storageKey));
  delete legacyState.auth;
  delete legacyState.demoContentVersion;
  legacyState.clients[0].email = '';
  legacyState.clients[0].name = 'عميل تجريبي';
  legacyState.clients[0].project_name = 'الموقع الإلكتروني';
  legacyState.clients[0].progress = 25;
  delete legacyState.clients[0].brand_name;
  delete legacyState.clients[0].brand_tagline;
  delete legacyState.clients[0].brand_description;
  delete legacyState.clients[0].brand_palette;
  storage.set(storageKey, JSON.stringify(legacyState));
  await post('/client/logout', {});
  await post('/client/login', { email: clientEmail, password: clientPassword });
  const migratedOverview = await localData('/client/overview');
  assert.equal(migratedOverview.client.email, clientEmail);
  assert.equal(migratedOverview.client.brand_name, 'دار سُدرة');
  assert.equal(migratedOverview.client.project_name, 'هوية ومتجر دار سُدرة');
  assert.equal(migratedOverview.files.length, 2);
});
