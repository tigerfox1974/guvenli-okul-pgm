import { SUPABASE_CONFIG } from '../config/supabase.config.js';

const ADMIN_SESSION_KEY = 'pgm-admin-auth-session-v2';
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_PAGE_SIZE = 100;
const OPERATOR_ROLES = new Set(['operator', 'supervisor']);
const ADMIN_USER_DIRECTORY = createAdminUserDirectory(SUPABASE_CONFIG.adminUsers);

export class AdminApiError extends Error {
  constructor(code, message, status = 0, details = '') {
    super(message);
    this.name = 'AdminApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function signInAdmin(username, password) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = String(password || '');

  if (!normalizedUsername || !normalizedPassword) {
    throw new AdminApiError('invalid_credentials', 'Kullanıcı adı ve şifre zorunludur.', 400);
  }

  if (ADMIN_USER_DIRECTORY.size === 0) {
    throw new AdminApiError('admin_users_not_configured', 'Admin kullanıcı eşlemesi yapılandırılmadı.', 500);
  }

  const account = ADMIN_USER_DIRECTORY.get(normalizedUsername);
  if (!account) {
    throw new AdminApiError('invalid_credentials', 'Kullanıcı adı veya şifre hatalı.', 401);
  }

  const payload = await requestAuthToken('password', {
    email: account.email,
    password: normalizedPassword
  });

  const session = mapAuthPayloadToSession(payload, account);
  saveStoredAdminSession(session);
  return session;
}

export async function ensureValidAdminSession() {
  const currentSession = loadStoredAdminSession();
  if (!hasOperatorAccess(currentSession)) {
    return null;
  }

  if (!isSessionExpired(currentSession)) {
    return currentSession;
  }

  if (!currentSession.refreshToken) {
    clearStoredAdminSession();
    return null;
  }

  try {
    const payload = await requestAuthToken('refresh_token', {
      refresh_token: currentSession.refreshToken
    });

    const refreshedSession = mapAuthPayloadToSession(payload, {
      username: currentSession.username,
      allowedRoles: currentSession.allowedRoles
    });
    saveStoredAdminSession(refreshedSession);
    return refreshedSession;
  } catch {
    clearStoredAdminSession();
    return null;
  }
}

export async function fetchAdminReports({ filters = {}, page = 1, pageSize = 100 } = {}) {
  const session = await requireAdminSession();
  const normalizedPageSize = Math.min(Math.max(Number(pageSize) || 1, 1), MAX_PAGE_SIZE);
  const normalizedPage = Math.max(Number(page) || 1, 1);

  const query = new URLSearchParams();
  query.set('district', normalizeFilterValue(filters.district));
  query.set('school', normalizeFilterValue(filters.school));
  query.set('category', normalizeFilterValue(filters.category));
  query.set('status', normalizeFilterValue(filters.status));
  query.set('date', normalizeFilterValue(filters.date));
  query.set('page', String(normalizedPage));
  query.set('pageSize', String(normalizedPageSize));

  return requestAdminApi(`/api/admin/reports?${query.toString()}`, session.accessToken);
}

export async function fetchAdminSummary({ filters = {} } = {}) {
  const session = await requireAdminSession();

  const query = new URLSearchParams();
  query.set('district', normalizeFilterValue(filters.district));
  query.set('school', normalizeFilterValue(filters.school));
  query.set('category', normalizeFilterValue(filters.category));
  query.set('status', normalizeFilterValue(filters.status));
  query.set('date', normalizeFilterValue(filters.date));

  return requestAdminApi(`/api/admin/summary?${query.toString()}`, session.accessToken);
}

export function loadStoredAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!hasOperatorAccess(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredAdminSession(session) {
  if (!session || typeof session !== 'object') {
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearStoredAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function hasOperatorAccess(session) {
  return Boolean(
    session
    && typeof session === 'object'
    && OPERATOR_ROLES.has(String(session.role || '').trim().toLowerCase())
    && String(session.accessToken || '').trim()
  );
}

export function getRoleLabel(role) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (normalizedRole === 'operator') {
    return 'PGM Operatör';
  }

  if (normalizedRole === 'supervisor') {
    return 'PGM Süpervizör';
  }

  return 'PGM Yetkili';
}

function normalizeFilterValue(value) {
  const normalized = String(value || '').trim();
  return normalized || 'all';
}

async function requireAdminSession() {
  const session = await ensureValidAdminSession();
  if (!hasOperatorAccess(session)) {
    throw new AdminApiError('unauthorized', 'Admin oturumu bulunamadı.', 401);
  }

  return session;
}

async function requestAdminApi(path, accessToken) {
  const response = await fetchWithTimeout(path, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }, getRequestTimeoutMs());

  if (response.status === 401 || response.status === 403) {
    clearStoredAdminSession();
    const code = response.status === 401 ? 'unauthorized' : 'forbidden';
    throw new AdminApiError(code, 'Panel yetkilendirmesi başarısız.', response.status);
  }

  const body = await safeReadResponseJson(response);

  if (!response.ok) {
    const message = getResponseErrorMessage(body) || 'Admin isteği başarısız oldu.';
    throw new AdminApiError('request_failed', message, response.status, JSON.stringify(body || {}));
  }

  return body;
}

async function requestAuthToken(grantType, payload) {
  const baseUrl = getConfiguredBaseUrl();
  const anonKey = getConfiguredAnonKey();

  if (!baseUrl || !anonKey) {
    throw new AdminApiError('supabase_not_configured', 'Supabase ayarları eksik.');
  }

  const response = await fetchWithTimeout(`${baseUrl}/auth/v1/token?grant_type=${encodeURIComponent(grantType)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey
    },
    body: JSON.stringify(payload)
  }, getRequestTimeoutMs());

  const body = await safeReadResponseJson(response);

  if (!response.ok) {
    const message = getAuthErrorMessage(body, response.status);
    throw new AdminApiError('auth_failed', message, response.status, JSON.stringify(body || {}));
  }

  return body;
}

function getAuthErrorMessage(body, status) {
  const rawMessage = String(getResponseErrorMessage(body) || '').trim();
  const normalizedMessage = rawMessage.toLowerCase();

  if (status === 400 || status === 401) {
    if (
      normalizedMessage.includes('invalid login credentials')
      || normalizedMessage.includes('invalid credentials')
      || normalizedMessage.includes('email not confirmed')
    ) {
      return 'Kullanıcı adı veya şifre hatalı.';
    }
  }

  return rawMessage || 'Kimlik doğrulama başarısız oldu.';
}

function mapAuthPayloadToSession(payload, account = null) {
  const accessToken = String(payload && payload.access_token || '').trim();
  const refreshToken = String(payload && payload.refresh_token || '').trim();
  const user = payload && typeof payload.user === 'object' ? payload.user : {};

  const role = extractRoleFromUser(user);
  const allowedRoles = normalizeAllowedRoles(account && account.allowedRoles);

  if (!role || !OPERATOR_ROLES.has(role)) {
    throw new AdminApiError('forbidden_role', 'Bu hesap panel için yetkili değil.', 403);
  }

  if (allowedRoles.size > 0 && !allowedRoles.has(role)) {
    throw new AdminApiError('forbidden_role', 'Bu kullanıcı adı için rol yetkisi uyuşmuyor.', 403);
  }

  if (!accessToken) {
    throw new AdminApiError('invalid_auth_payload', 'Erişim anahtarı alınamadı.');
  }

  const expiresInSeconds = Number(payload && payload.expires_in || 0);
  const expiresAtMs = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? Date.now() + (expiresInSeconds * 1000)
    : Date.now() + (60 * 60 * 1000);

  const username = String(account && account.username || '').trim().toLowerCase() || extractUsernameFromUser(user);

  return {
    userId: String(user.id || ''),
    username,
    role,
    roleLabel: getRoleLabel(role),
    accessToken,
    refreshToken,
    allowedRoles: Array.from(allowedRoles),
    expiresAtMs,
    issuedAt: new Date().toISOString()
  };
}

function extractUsernameFromUser(user) {
  if (!user || typeof user !== 'object') {
    return '';
  }

  const appMetadata = user.app_metadata && typeof user.app_metadata === 'object' ? user.app_metadata : {};
  const userMetadata = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};

  const candidates = [
    userMetadata.username,
    userMetadata.preferred_username,
    appMetadata.username,
    user.email ? String(user.email).split('@')[0] : ''
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUsername(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function normalizeAllowedRoles(values) {
  if (!Array.isArray(values)) {
    return new Set();
  }

  const normalized = values
    .map(value => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  return new Set(normalized);
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function createAdminUserDirectory(adminUsers) {
  if (!Array.isArray(adminUsers)) {
    return new Map();
  }

  const directory = new Map();
  const emailDomain = normalizeEmailDomain(SUPABASE_CONFIG.adminAuthEmailDomain);

  adminUsers.forEach(item => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const username = normalizeUsername(item.username);
    const email = resolveAdminLoginEmail(item, username, emailDomain);
    const allowedRoles = Array.isArray(item.allowedRoles)
      ? item.allowedRoles
      : [item.role];

    if (!username || !email) {
      return;
    }

    directory.set(username, {
      username,
      email,
      allowedRoles: Array.from(normalizeAllowedRoles(allowedRoles))
    });
  });

  return directory;
}

function resolveAdminLoginEmail(item, username, emailDomain) {
  const explicitEmail = String(item && item.email || '').trim().toLowerCase();
  if (explicitEmail) {
    return explicitEmail;
  }

  if (!username || !emailDomain) {
    return '';
  }

  return `${username}@${emailDomain}`;
}

function normalizeEmailDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '');
}

function extractRoleFromUser(user) {
  if (!user || typeof user !== 'object') {
    return '';
  }

  const appMetadata = user.app_metadata && typeof user.app_metadata === 'object' ? user.app_metadata : {};
  const userMetadata = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};

  const candidates = [
    appMetadata.role,
    Array.isArray(appMetadata.roles) ? appMetadata.roles[0] : '',
    userMetadata.role,
    Array.isArray(userMetadata.roles) ? userMetadata.roles[0] : '',
    user.role
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate || '').trim().toLowerCase();
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function isSessionExpired(session) {
  const expiresAtMs = Number(session && session.expiresAtMs || 0);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
    return true;
  }

  return Date.now() >= (expiresAtMs - 20 * 1000);
}

function getConfiguredBaseUrl() {
  const rawValue = String(SUPABASE_CONFIG.url || '').trim().replace(/\/+$/, '');
  if (!rawValue) return '';
  return rawValue.replace(/\/rest\/v1$/i, '');
}

function getConfiguredAnonKey() {
  return String(SUPABASE_CONFIG.anonKey || '').trim();
}

function getRequestTimeoutMs() {
  const configuredTimeout = Number(SUPABASE_CONFIG.requestTimeoutMs || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(configuredTimeout) || configuredTimeout <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return configuredTimeout;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function safeReadResponseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getResponseErrorMessage(body) {
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
