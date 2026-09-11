import { SUPABASE_CONFIG } from '../js/config/supabase.config.js';

const SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const DEFAULT_PASSWORD = String(process.env.PGM_ADMIN_DEFAULT_PASSWORD || '').trim();
const RESET_EXISTING_PASSWORDS = String(process.env.PGM_ADMIN_RESET_PASSWORDS || 'false').trim().toLowerCase() === 'true';
const DOMAIN_OVERRIDE = String(process.env.PGM_ADMIN_EMAIL_DOMAIN || '').trim().toLowerCase();

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

  for (const target of targetUsers) {
    const existing = existingUsers.find(user => normalizeEmail(user && user.email) === target.email);

    if (!existing) {
      await createAuthUser(baseUrl, target);
      created += 1;
      console.log(`[created] ${target.username} -> ${target.email} (${target.role})`);
      continue;
    }

    await updateAuthUser(baseUrl, existing.id, target, RESET_EXISTING_PASSWORDS);
    updated += 1;
    console.log(`[updated] ${target.username} -> ${target.email} (${target.role})`);
  }

  console.log('');
  console.log('Tamamlandi.');
  console.log(`Olusturulan: ${created}`);
  console.log(`Guncellenen: ${updated}`);
  console.log(`Toplam hedef: ${targetUsers.length}`);
  console.log('Not: Giris ekrani kullanici adi ister, e-posta istemez.');
}

function getBaseUrl() {
  const raw = String(process.env.SUPABASE_URL || SUPABASE_CONFIG.url || '').trim().replace(/\/+$/, '');
  if (!raw) {
    throw new Error('SUPABASE_URL veya SUPABASE_CONFIG.url bulunamadi.');
  }

  return raw.replace(/\/rest\/v1$/i, '');
}

function getEmailDomain() {
  const fromConfig = String(SUPABASE_CONFIG.adminAuthEmailDomain || '').trim().toLowerCase();
  const domain = (DOMAIN_OVERRIDE || fromConfig).replace(/^@+/, '');

  if (!domain) {
    throw new Error('adminAuthEmailDomain bos olamaz.');
  }

  return domain;
}

function getTargetUsers(emailDomain) {
  const users = Array.isArray(SUPABASE_CONFIG.adminUsers) ? SUPABASE_CONFIG.adminUsers : [];

  return users
    .map(item => {
      const username = normalizeUsername(item && item.username);
      const allowedRoles = Array.isArray(item && item.allowedRoles)
        ? item.allowedRoles.map(role => String(role || '').trim().toLowerCase()).filter(Boolean)
        : [String(item && item.role || '').trim().toLowerCase()].filter(Boolean);
      const role = allowedRoles[0] || '';

      if (!username || !role) {
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

function normalizeUsername(value) {
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
