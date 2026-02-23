import { resolveSupabaseConfig } from './supabase-config.mjs';

function buildAuthHeaders(anonKey) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

async function checkHealth(serverBase, anonKey) {
  const response = await fetch(`${serverBase}/health`, {
    headers: buildAuthHeaders(anonKey),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`health check failed (${response.status}): ${body}`);
  }
  const body = await response.json();
  if (body.status !== 'ok') {
    throw new Error(`health response is unexpected: ${JSON.stringify(body)}`);
  }
}

async function checkSignupPath(serverBase, anonKey) {
  const response = await fetch(`${serverBase}/signup`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(anonKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'not-an-email',
      password: 'Temp1234!',
      name: 'ConnectionCheck',
    }),
  });

  const body = await response.json().catch(() => ({}));
  // A 400 validation response proves that /signup route is reachable and running.
  if (response.status !== 400 || typeof body.error !== 'string') {
    throw new Error(`signup route check failed (${response.status}): ${JSON.stringify(body)}`);
  }
}

async function main() {
  const { projectId, anonKey, serverBase } = await resolveSupabaseConfig();

  await checkHealth(serverBase, anonKey);
  await checkSignupPath(serverBase, anonKey);

  console.log('[supabase:check] Connected');
  console.log(`[supabase:check] Project: ${projectId}`);
  console.log(`[supabase:check] Edge Function: ${serverBase}`);
}

main().catch((error) => {
  console.error('[supabase:check] Failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
