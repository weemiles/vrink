import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_PROJECT_ID = 'odjnidzoerrygtaivuru';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kam5pZHpvZXJyeWd0YWl2dXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODc3NTcsImV4cCI6MjA4NzA2Mzc1N30.4a3UT7qvpJERQWhcZG8Y0oSqVxHkYVZBRCBVQKayMNI';
const DEFAULT_FUNCTION_NAME = 'make-server-0984a125';

function pickMatch(raw, patterns) {
  for (const pattern of patterns) {
    const matched = raw.match(pattern);
    if (matched?.[1]) return matched[1];
  }
  return undefined;
}

async function loadSupabaseInfoFile() {
  try {
    const infoPath = resolve(process.cwd(), 'utils/supabase/info.tsx');
    const raw = await readFile(infoPath, 'utf8');
    const projectId = pickMatch(raw, [
      /export const projectId = "([^"]+)"/,
      /const fallbackProjectId = "([^"]+)"/,
    ]);
    const anonKey = pickMatch(raw, [
      /export const publicAnonKey = "([^"]+)"/,
      /const fallbackAnonKey = "([^"]+)"/,
    ]);

    return { projectId, anonKey };
  } catch {
    return {};
  }
}

export async function resolveSupabaseConfig() {
  const fileInfo = await loadSupabaseInfoFile();
  const projectId = process.env.VITE_SUPABASE_PROJECT_ID
    || process.env.SUPABASE_PROJECT_ID
    || fileInfo.projectId
    || DEFAULT_PROJECT_ID;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY
    || fileInfo.anonKey
    || DEFAULT_ANON_KEY;
  const functionName = process.env.SUPABASE_EDGE_FUNCTION
    || process.env.VITE_SUPABASE_EDGE_FUNCTION
    || DEFAULT_FUNCTION_NAME;
  const baseUrl = `https://${projectId}.supabase.co`;
  const serverBase = `${baseUrl}/functions/v1/${functionName}`;

  return { projectId, anonKey, baseUrl, serverBase, functionName };
}
