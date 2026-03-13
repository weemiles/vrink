import { resolveSupabaseConfig } from './supabase-config.mjs';

function authHeaders(anonKey) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

function buildTestUser() {
  const nonce = Date.now().toString(36);
  return {
    email: `keepin-e2e-${nonce}@example.com`,
    password: `Keepin!${nonce}`,
    name: 'E2E Check',
  };
}

async function signUp(serverBase, anonKey, testUser) {
  const response = await fetch(`${serverBase}/signup`, {
    method: 'POST',
    headers: {
      ...authHeaders(anonKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testUser),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`signup failed (${response.status}): ${JSON.stringify(body)}`);
  }

  if (!body?.user?.id) {
    throw new Error(`signup response missing user id: ${JSON.stringify(body)}`);
  }
}

async function signIn(authBase, anonKey, testUser) {
  const response = await fetch(`${authBase}/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`signin failed (${response.status}): ${JSON.stringify(body)}`);
  }

  if (!body?.access_token) {
    throw new Error(`signin response missing access token: ${JSON.stringify(body)}`);
  }

  return body.access_token;
}

async function checkProtectedProfile(serverBase, anonKey, accessToken, testUser) {
  const response = await fetch(`${serverBase}/profile`, {
    headers: {
      ...authHeaders(anonKey),
      'x-user-token': accessToken,
    },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`profile check failed (${response.status}): ${JSON.stringify(body)}`);
  }

  if (body?.profile?.email !== testUser.email) {
    throw new Error(`profile email mismatch: expected ${testUser.email}, got ${body?.profile?.email}`);
  }
}

async function deleteAccount(serverBase, anonKey, accessToken) {
  const response = await fetch(`${serverBase}/account`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(anonKey),
      'x-user-token': accessToken,
    },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`account delete failed (${response.status}): ${JSON.stringify(body)}`);
  }
}

async function main() {
  const { projectId, anonKey, baseUrl, serverBase } = await resolveSupabaseConfig();
  const authBase = `${baseUrl}/auth/v1`;
  const testUser = buildTestUser();

  console.log(`[supabase:check:auth] Project: ${projectId}`);
  console.log(`[supabase:check:auth] Test user: ${testUser.email}`);

  let accessToken = null;
  try {
    await signUp(serverBase, anonKey, testUser);
    console.log('- signup -> OK');

    accessToken = await signIn(authBase, anonKey, testUser);
    console.log('- signin -> OK');

    await checkProtectedProfile(serverBase, anonKey, accessToken, testUser);
    console.log('- protected /profile -> OK');
  } finally {
    if (accessToken) {
      await deleteAccount(serverBase, anonKey, accessToken);
      console.log('- cleanup /account -> OK');
    } else {
      console.log('- cleanup skipped (no access token)');
    }
  }

  console.log('[supabase:check:auth] Email auth flow check passed');
}

main().catch((error) => {
  console.error('[supabase:check:auth] Failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
