import { resolveSupabaseConfig } from './supabase-config.mjs';

const PROVIDERS = ['google', 'kakao', 'naver'];

function parseErrorMessage(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const message = payload.msg || payload.message || payload.error || '';
  return typeof message === 'string' ? message : '';
}

async function checkProvider(baseUrl, anonKey, provider) {
  const url = `${baseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent('http://localhost:4173/app')}`;
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: {
      apikey: anonKey,
    },
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location') ?? '';
    return { provider, status: 'enabled', detail: location };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message = parseErrorMessage(payload).toLowerCase();

  if (message.includes('provider is not enabled')) {
    return { provider, status: 'disabled', detail: 'provider is not enabled' };
  }

  if (message.includes('could not be found')) {
    return { provider, status: 'unsupported', detail: 'provider is not supported by this auth gateway' };
  }

  return {
    provider,
    status: `unknown(${response.status})`,
    detail: message || 'unexpected response',
  };
}

async function main() {
  const { projectId, anonKey, baseUrl } = await resolveSupabaseConfig();

  console.log(`[supabase:check:oauth] Project: ${projectId}`);
  console.log(`[supabase:check:oauth] Endpoint: ${baseUrl}/auth/v1/authorize`);

  let enabledCount = 0;

  for (const provider of PROVIDERS) {
    try {
      const result = await checkProvider(baseUrl, anonKey, provider);
      if (result.status === 'enabled') enabledCount += 1;
      console.log(`- ${provider}: ${result.status}${result.detail ? ` (${result.detail})` : ''}`);
    } catch (error) {
      console.log(`- ${provider}: error (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  console.log(`[supabase:check:oauth] Enabled providers: ${enabledCount}/${PROVIDERS.length}`);
  console.log(`[supabase:check:oauth] Dashboard: https://supabase.com/dashboard/project/${projectId}/auth/providers`);
}

main().catch((error) => {
  console.error('[supabase:check:oauth] Failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
