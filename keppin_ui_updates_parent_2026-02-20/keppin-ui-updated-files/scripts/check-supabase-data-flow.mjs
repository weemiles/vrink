import { resolveSupabaseConfig } from './supabase-config.mjs';

function baseHeaders(anonKey) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

function userHeaders(anonKey, accessToken, json = false) {
  return {
    ...baseHeaders(anonKey),
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    'x-user-token': accessToken,
  };
}

function buildTestUser() {
  const nonce = Date.now().toString(36);
  return {
    email: `keppin-data-${nonce}@example.com`,
    password: `Keppin!${nonce}`,
    name: 'Data Flow Check',
  };
}

function todayYmd() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function signUp(serverBase, anonKey, user) {
  const response = await fetch(`${serverBase}/signup`, {
    method: 'POST',
    headers: {
      ...baseHeaders(anonKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`signup failed (${response.status}): ${JSON.stringify(payload)}`);
  }
}

async function signIn(authBase, anonKey, user) {
  const response = await fetch(`${authBase}/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    throw new Error(`signin failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload.access_token;
}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${url} failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

function makeContacts() {
  const today = todayYmd();
  const [, month, day] = today.split('-');
  const birthdayToday = `1997-${month}-${day}`;
  return [
    {
      id: 'ct-1',
      name: '김테스트',
      relationship: '친구',
      age: 29,
      birthday: birthdayToday,
      birthdayDday: 0,
      birthdayUnknown: false,
      lastContact: '2025-12-01',
      contactGap: 81,
      birthdayGiftDone: false,
      familyStatus: '미혼',
      closeness: '매우 친함',
      memo: 'E2E 테스트 연락처 1',
      phone: '010-1111-2222',
      avatarColor: '#616161',
      isFavorite: true,
      groupIds: ['grp-1'],
      tags: ['tag-1'],
    },
    {
      id: 'ct-2',
      name: '박테스트',
      relationship: '가족',
      age: 35,
      birthday: '1991-11-01',
      birthdayDday: 254,
      birthdayUnknown: false,
      lastContact: today,
      contactGap: 0,
      birthdayGiftDone: false,
      familyStatus: '기혼·자녀 없음',
      closeness: '가족',
      memo: 'E2E 테스트 연락처 2',
      phone: '010-3333-4444',
      avatarColor: '#737373',
      isFavorite: false,
      groupIds: ['grp-1'],
      tags: ['tag-1'],
    },
  ];
}

async function runDataFlow(serverBase, authBase, anonKey) {
  const testUser = buildTestUser();
  let accessToken = null;

  console.log(`[supabase:check:data] Project: ${new URL(serverBase).hostname.split('.')[0]}`);
  console.log(`[supabase:check:data] Test user: ${testUser.email}`);

  try {
    await signUp(serverBase, anonKey, testUser);
    console.log('- signup -> OK');

    accessToken = await signIn(authBase, anonKey, testUser);
    console.log('- signin -> OK');

    const contacts = makeContacts();
    await requestJson(`${serverBase}/contacts`, {
      method: 'PUT',
      headers: userHeaders(anonKey, accessToken, true),
      body: JSON.stringify({ contacts }),
    });
    const contactsGet = await requestJson(`${serverBase}/contacts`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!Array.isArray(contactsGet.contacts) || contactsGet.contacts.length !== contacts.length) {
      throw new Error(`contacts mismatch: ${JSON.stringify(contactsGet)}`);
    }
    console.log('- contacts put/get -> OK');

    await requestJson(`${serverBase}/custom-relationships`, {
      method: 'PUT',
      headers: userHeaders(anonKey, accessToken, true),
      body: JSON.stringify({
        customRelationships: [{ value: '동호회', color: '#616161' }],
        hiddenDefaults: ['군대'],
      }),
    });
    const customRelGet = await requestJson(`${serverBase}/custom-relationships`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!Array.isArray(customRelGet.customRelationships)) {
      throw new Error(`custom relationships mismatch: ${JSON.stringify(customRelGet)}`);
    }
    console.log('- custom relationships put/get -> OK');

    const groups = [{ id: 'grp-1', name: 'VIP', color: '#616161', emoji: '⭐', createdAt: Date.now() }];
    await requestJson(`${serverBase}/contact-groups`, {
      method: 'PUT',
      headers: userHeaders(anonKey, accessToken, true),
      body: JSON.stringify({ groups }),
    });
    const groupsGet = await requestJson(`${serverBase}/contact-groups`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!Array.isArray(groupsGet.groups) || groupsGet.groups.length !== 1) {
      throw new Error(`contact groups mismatch: ${JSON.stringify(groupsGet)}`);
    }
    console.log('- contact groups put/get -> OK');

    const tags = [{ id: 'tag-1', label: '중요', color: '#616161', createdAt: Date.now() }];
    await requestJson(`${serverBase}/tags`, {
      method: 'PUT',
      headers: userHeaders(anonKey, accessToken, true),
      body: JSON.stringify({ tags }),
    });
    const tagsGet = await requestJson(`${serverBase}/tags`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!Array.isArray(tagsGet.tags) || tagsGet.tags.length !== 1) {
      throw new Error(`tags mismatch: ${JSON.stringify(tagsGet)}`);
    }
    console.log('- tags put/get -> OK');

    const templates = [
      {
        id: 'tpl-1',
        occasion: 'birthday',
        message: '{name}님 생일 축하해요!',
        targetTags: ['친구', '가족'],
        sendTime: '09:00',
        enabled: true,
        createdAt: Date.now(),
      },
    ];
    await requestJson(`${serverBase}/tagged-templates`, {
      method: 'PUT',
      headers: userHeaders(anonKey, accessToken, true),
      body: JSON.stringify({ templates }),
    });
    const templatesGet = await requestJson(`${serverBase}/tagged-templates`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!Array.isArray(templatesGet.templates) || templatesGet.templates.length !== 1) {
      throw new Error(`templates mismatch: ${JSON.stringify(templatesGet)}`);
    }
    console.log('- tagged templates put/get -> OK');

    const autoMessagePrefs = [
      {
        contactId: 'ct-1',
        enabled: true,
        occasions: {
          birthday: true,
          seollal: false,
          chuseok: false,
          christmas: false,
          newYear: false,
          parentsDay: false,
          teachersDay: false,
          valentine: false,
          whiteDay: false,
          childrenDay: false,
        },
        customMessages: { birthday: '{name}님 생일 축하합니다!' },
        sendTime: '09:00',
      },
    ];
    await requestJson(`${serverBase}/auto-messages`, {
      method: 'PUT',
      headers: userHeaders(anonKey, accessToken, true),
      body: JSON.stringify({ prefs: autoMessagePrefs, sentIds: ['msg-seed-1'] }),
    });
    const autoGet = await requestJson(`${serverBase}/auto-messages`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!Array.isArray(autoGet.prefs) || autoGet.prefs.length !== 1) {
      throw new Error(`auto messages mismatch: ${JSON.stringify(autoGet)}`);
    }
    console.log('- auto messages put/get -> OK');

    const today = todayYmd();
    await requestJson(`${serverBase}/interaction-logs`, {
      method: 'POST',
      headers: userHeaders(anonKey, accessToken, true),
      body: JSON.stringify({
        contactId: 'ct-1',
        type: 'message',
        note: '테스트 로그',
        date: today,
      }),
    });
    const logsGet = await requestJson(`${serverBase}/interaction-logs?contactId=ct-1`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!Array.isArray(logsGet.logs) || logsGet.logs.length < 1) {
      throw new Error(`interaction logs mismatch: ${JSON.stringify(logsGet)}`);
    }
    console.log('- interaction logs post/get -> OK');

    const statsGet = await requestJson(`${serverBase}/stats`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!statsGet?.stats || statsGet.stats.totalContacts !== 2) {
      throw new Error(`stats mismatch: ${JSON.stringify(statsGet)}`);
    }
    console.log('- stats -> OK');

    await requestJson(`${serverBase}/notifications/generate`, {
      method: 'POST',
      headers: userHeaders(anonKey, accessToken, true),
      body: JSON.stringify({
        contacts,
        scheduledMessages: [
          {
            contactId: 'ct-1',
            contactName: '김테스트',
            occasion: 'birthday',
            message: '축하해요!',
            scheduledDate: today,
          },
        ],
      }),
    });
    const notifGet = await requestJson(`${serverBase}/notifications`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (!Array.isArray(notifGet.notifications)) {
      throw new Error(`notifications mismatch: ${JSON.stringify(notifGet)}`);
    }
    console.log('- notifications generate/get -> OK');

    const exportGet = await requestJson(`${serverBase}/contacts/export`, {
      headers: userHeaders(anonKey, accessToken),
    });
    if (typeof exportGet.csv !== 'string' || !exportGet.csv.includes('김테스트')) {
      throw new Error(`contacts export mismatch: ${JSON.stringify(exportGet)}`);
    }
    console.log('- contacts export -> OK');
  } finally {
    if (accessToken) {
      await requestJson(`${serverBase}/account`, {
        method: 'DELETE',
        headers: userHeaders(anonKey, accessToken),
      });
      console.log('- cleanup /account -> OK');
    } else {
      console.log('- cleanup skipped (no access token)');
    }
  }

  console.log('[supabase:check:data] Data flow check passed');
}

async function main() {
  const { baseUrl, serverBase, anonKey } = await resolveSupabaseConfig();
  const authBase = `${baseUrl}/auth/v1`;

  await runDataFlow(serverBase, authBase, anonKey);
}

main().catch((error) => {
  console.error('[supabase:check:data] Failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
