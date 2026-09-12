import { SUPABASE_CONFIG } from '../js/config/supabase.config.js';

const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const DEFAULT_PASSWORD = String(process.env.PGM_ADMIN_DEFAULT_PASSWORD || '').trim();
const RESET_EXISTING_PASSWORDS = String(process.env.PGM_ADMIN_RESET_PASSWORDS || 'false').trim().toLowerCase() === 'true';
const DOMAIN_OVERRIDE = String(process.env.PGM_ADMIN_EMAIL_DOMAIN || '').trim().toLowerCase();
const ADMIN_USERS_TABLE = String(process.env.SUPABASE_ADMIN_USERS_TABLE || 'admin_users').trim() || 'admin_users';
const DEFAULT_EMAIL_DOMAIN = 'okul.gov.ct.tr';
const SUPPORTED_ROLES = new Set(['operator', 'supervisor']);
const DEFAULT_ADMIN_USERS = Object.freeze([
  { username: 'operator', role: 'operator' },
  { username: 'supervisor', role: 'supervisor' },
  { username: 'operator1', role: 'operator' },
  { username: 'operator2', role: 'operator' },
  { username: 'supervisor1', role: 'supervisor' },
  { username: 'supervisor2', role: 'supervisor' },
  { username: 'bolgeoperator', role: 'operator' },
  { username: 'nobetsupervisor', role: 'supervisor' }
]);

async function main() {
  if (!SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY zorunludur.');
  }

  if (!DEFAULT_PASSWORD) {
    throw new Error('PGM_ADMIN_DEFAULT_PASSWORD zorunludur.');
  }

  if (DEFAULT_PASSWORD.length < 6) {
    throw new Error('PGM_ADMIN_DEFAULT_PASSWORD en az 6 karakter olmalidir.');
  }

  const baseUrl = getBaseUrl();
  const emailDomain = getEmailDomain();
  const targetUsers = getTargetUsers(emailDomain);

  if (targetUsers.length === 0) {
    throw new Error('Olusturulacak admin kullanicisi bulunamadi. SUPABASE_CONFIG.adminUsers kontrol edin.');
  }

  const existingUsers = await listAllAuthUsers(baseUrl);

  let created = 0;
  let updated = 0;
  let mapped = 0;

  for (const target of targetUsers) {
    const existing = existingUsers.find(user => normalizeEmail(user && user.email) === target.email);

    if (!existing) {
      await createAuthUser(baseUrl, target);
      created += 1;
      console.log(`[auth-created] ${target.username} -> ${target.email} (${target.role})`);
    } else {
      await updateAuthUser(baseUrl, existing.id, target, RESET_EXISTING_PASSWORDS);
      updated += 1;
      console.log(`[auth-updated] ${target.username} -> ${target.email} (${target.role})`);
    }

    await upsertAdminDirectoryRow(baseUrl, target);
    mapped += 1;
    console.log(`[table-upserted] ${target.username} (${target.role})`);
  }

  console.log('');
  console.log('Tamamlandi.');
  console.log(`Auth olusturulan: ${created}`);
  console.log(`Auth guncellenen: ${updated}`);
  console.log(`Tablo upsert: ${mapped}`);
  console.log(`Toplam hedef: ${targetUsers.length}`);
  console.log('Not: Giris ekrani yalnizca kullanici adi + sifre ister.');
}

function getBaseUrl() {
  const raw = String(process.env.SUPABASE_URL || SUPABASE_CONFIG.url || '').trim().replace(/\/+$/, '');
  if (!raw) {
    throw new Error('SUPABASE_URL veya SUPABASE_CONFIG.url bulunamadi.');
  }

  return raw.replace(/\/rest\/v1$/i, '');
}

function getEmailDomain() {
  const domain = (DOMAIN_OVERRIDE || DEFAULT_EMAIL_DOMAIN).replace(/^@+/, '');

  if (!domain) {
    throw new Error('PGM_ADMIN_EMAIL_DOMAIN bos olamaz.');
  }

  return domain;
}

function getTargetUsers(emailDomain) {
  const users = parseAdminUsersFromEnv() || DEFAULT_ADMIN_USERS;

  return users
    .map(item => {
      const username = normalizeUsername(item && item.username);
      const allowedRoles = Array.isArray(item && item.allowedRoles)
        ? item.allowedRoles.map(role => String(role || '').trim().toLowerCase()).filter(Boolean)
        : [String(item && item.role || '').trim().toLowerCase()].filter(Boolean);
      const role = normalizeRole(allowedRoles[0] || '');

      if (!username || !role || !SUPPORTED_ROLES.has(role)) {
        return null;
      }

      return {
        username,
        role,
        allowedRoles,
        email: `${username}@${emailDomain}`,
        password: DEFAULT_PASSWORD
      };
    })
    .filter(Boolean);
}

function parseAdminUsersFromEnv() {
  const raw = String(process.env.PGM_ADMIN_USERS_JSON || '').trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    throw new Error('PGM_ADMIN_USERS_JSON gecerli bir JSON dizi olmali.');
  }
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function listAllAuthUsers(baseUrl) {
  const users = [];
  const perPage = 100;

  for (let page = 1; page <= 20; page += 1) {
    const result = await adminRequest(baseUrl, `/auth/v1/admin/users?page=${page}&per_page=${perPage}`);
    const pageUsers = Array.isArray(result && result.users) ? result.users : [];

    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      break;
    }
  }

  return users;
}

async function createAuthUser(baseUrl, target) {
  await adminRequest(baseUrl, '/auth/v1/admin/users', {
    method: 'POST',
    body: {
      email: target.email,
      password: target.password,
      email_confirm: true,
      user_metadata: {
        username: target.username,
        role: target.role,
        roles: target.allowedRoles
      },
      app_metadata: {
        role: target.role,
        roles: target.allowedRoles
      }
    }
  });
}

async function updateAuthUser(baseUrl, userId, target, resetPassword) {
  const body = {
    email_confirm: true,
    user_metadata: {
      username: target.username,
      role: target.role,
      roles: target.allowedRoles
    },
    app_metadata: {
      role: target.role,
      roles: target.allowedRoles
    }
  };

  if (resetPassword) {
    body.password = target.password;
  }

  await adminRequest(baseUrl, `/auth/v1/admin/users/${encodeURIComponent(String(userId || ''))}`, {
    method: 'PUT',
    body
  });
}

async function upsertAdminDirectoryRow(baseUrl, target) {
  const endpoint = `${baseUrl}/rest/v1/${encodeURIComponent(ADMIN_USERS_TABLE)}?on_conflict=username`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([
      {
        username: target.username,
        auth_email: target.email,
        role: target.role,
        is_active: true
      }
    ])
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`admin_users tablosuna yazma basarisiz: ${text || `HTTP ${response.status}`}`);
  }
}

async function adminRequest(baseUrl, path, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const body = safeParseJson(text);

  if (!response.ok) {
    const message = getBodyMessage(body) || text || `HTTP ${response.status}`;
    throw new Error(`Supabase admin istegi basarisiz (${method} ${path}): ${message}`);
  }

  return body;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getBodyMessage(body) {
  if (!body || typeof body !== 'object') {
    return '';
  }

  const keys = ['msg', 'message', 'error_description', 'error'];
  for (const key of keys) {
    const value = String(body[key] || '').trim();
    if (value) {
      return value;
    }
  }

  return '';
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Hata:', message);
  process.exitCode = 1;
});
