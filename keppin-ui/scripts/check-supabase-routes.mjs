import { resolveSupabaseConfig } from './supabase-config.mjs';

function headers(anonKey, withJson = false) {
  const base = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
  if (!withJson) return base;
  return { ...base, 'Content-Type': 'application/json' };
}

const TESTS = [
  { method: 'GET', path: '/health', expected: [200] },
  {
    method: 'POST',
    path: '/signup',
    expected: [400],
    body: { email: 'not-an-email', password: 'Temp1234!', name: 'RouteCheck' },
  },

  { method: 'GET', path: '/profile', expected: [401] },
  { method: 'PUT', path: '/profile', expected: [401], body: {} },
  { method: 'POST', path: '/profile/avatar', expected: [401] },
  { method: 'DELETE', path: '/profile/avatar', expected: [401] },
  { method: 'GET', path: '/contacts', expected: [401] },
  { method: 'PUT', path: '/contacts', expected: [401], body: { contacts: [] } },
  { method: 'GET', path: '/custom-relationships', expected: [401] },
  {
    method: 'PUT',
    path: '/custom-relationships',
    expected: [401],
    body: { customRelationships: [], hiddenDefaults: [] },
  },
  { method: 'GET', path: '/auto-messages', expected: [401] },
  { method: 'PUT', path: '/auto-messages', expected: [401], body: { prefs: [] } },
  { method: 'GET', path: '/tagged-templates', expected: [401] },
  { method: 'PUT', path: '/tagged-templates', expected: [401], body: { templates: [] } },
  { method: 'GET', path: '/contact-groups', expected: [401] },
  { method: 'PUT', path: '/contact-groups', expected: [401], body: { groups: [] } },
  { method: 'GET', path: '/notifications', expected: [401] },
  {
    method: 'POST',
    path: '/notifications/generate',
    expected: [401],
    body: { contacts: [], scheduledMessages: [] },
  },
  { method: 'PUT', path: '/notifications/read', expected: [401], body: {} },
  { method: 'DELETE', path: '/notifications', expected: [401] },
  { method: 'DELETE', path: '/notifications/test-id', expected: [401] },
  { method: 'GET', path: '/notification-settings', expected: [401] },
  { method: 'PUT', path: '/notification-settings', expected: [401], body: {} },
  { method: 'GET', path: '/interaction-logs', expected: [401] },
  { method: 'POST', path: '/interaction-logs', expected: [401], body: {} },
  { method: 'PUT', path: '/interaction-logs', expected: [401], body: { logs: [] } },
  { method: 'DELETE', path: '/interaction-logs/test-id', expected: [401] },
  { method: 'GET', path: '/stats', expected: [401] },
  { method: 'GET', path: '/tags', expected: [401] },
  { method: 'PUT', path: '/tags', expected: [401], body: { tags: [] } },
  { method: 'GET', path: '/contacts/export', expected: [401] },
  { method: 'DELETE', path: '/account', expected: [401] },
];

async function runTest(baseUrl, anonKey, test) {
  const url = `${baseUrl}${test.path}`;
  const useJson = test.body !== undefined;
  const response = await fetch(url, {
    method: test.method,
    headers: headers(anonKey, useJson),
    body: test.body !== undefined ? JSON.stringify(test.body) : undefined,
  });
  return response.status;
}

async function main() {
  const { projectId, anonKey, serverBase: baseUrl } = await resolveSupabaseConfig();

  console.log(`[supabase:check:routes] Project: ${projectId}`);
  console.log(`[supabase:check:routes] Base: ${baseUrl}`);

  let failCount = 0;

  for (const test of TESTS) {
    const status = await runTest(baseUrl, anonKey, test);
    const ok = test.expected.includes(status);
    if (!ok) failCount += 1;
    console.log(
      `- ${test.method.padEnd(6)} ${test.path.padEnd(28)} -> ${String(status).padEnd(3)} ${ok ? 'OK' : `FAIL (expected ${test.expected.join('/')})`}`,
    );
  }

  if (failCount > 0) {
    throw new Error(`route check failed: ${failCount} case(s)`);
  }

  console.log('[supabase:check:routes] All route checks passed');
}

main().catch((error) => {
  console.error('[supabase:check:routes] Failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
