const {
  buildRequestError,
  buildSupabaseEndpoint,
  buildSupabaseHeaders,
  fetchWithTimeout,
  getAdminServerConfig,
  parseRoleFromUser,
  safeReadResponseText,
  setCommonHeaders
} = require('../_shared/admin-common');

module.exports = async (req, res) => {
  setCommonHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const config = getAdminServerConfig();
  if (!config.isValid) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  try {
    const body = parseRequestBody(req);
    const username = normalizeUsername(body && body.username);
    const password = String(body && body.password || '');

    if (!username || !password) {
      res.status(400).json({ error: 'invalid_credentials_input', message: 'Kullanici adi ve sifre zorunludur.' });
      return;
    }

    const account = await findAdminUser(config, username);
    if (!account) {
      res.status(401).json({ error: 'invalid_credentials', message: 'Kullanici adi veya sifre hatali.' });
      return;
    }

    const authPayload = await signInWithSupabase(config, account.authEmail, password);
    const authRole = normalizeRole(parseRoleFromUser(authPayload && authPayload.user));

    if (!authRole || authRole !== account.role) {
      res.status(403).json({ error: 'role_mismatch', message: 'Bu kullanici icin rol yetkisi uyusmuyor.' });
      return;
    }

    res.status(200).json({
      access_token: authPayload.access_token,
      refresh_token: authPayload.refresh_token,
      expires_in: authPayload.expires_in,
      token_type: authPayload.token_type,
      user: authPayload.user,
      username: account.username,
      expectedRole: account.role
    });
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    const message = error instanceof Error ? error.message : 'unexpected_error';
    res.status(status).json({ error: 'admin_login_failed', message });
  }
};

function parseRequestBody(req) {
  if (!req) {
    return {};
  }

  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return {};
}

async function findAdminUser(config, username) {
  const endpoint = buildSupabaseEndpoint(config, config.adminUsersTable);
  const params = new URLSearchParams();

  params.set('select', 'username,auth_email,role,is_active');
  params.set('username', `eq.${username}`);
  params.set('is_active', 'eq.true');
  params.set('limit', '1');

  const response = await fetchWithTimeout(`${endpoint}?${params.toString()}`, {
    method: 'GET',
    headers: buildSupabaseHeaders(config)
  }, config.timeoutMs);

  if (!response.ok) {
    const details = await safeReadResponseText(response);
    throw buildRequestError(response.status, `admin_user_lookup_failed: ${details}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const row = rows[0] || {};
  const authEmail = String(row.auth_email || '').trim().toLowerCase();
  const role = normalizeRole(row.role);

  if (!authEmail || !role) {
    return null;
  }

  return {
    username: normalizeUsername(row.username),
    authEmail,
    role
  };
}

async function signInWithSupabase(config, email, password) {
  const response = await fetchWithTimeout(`${config.baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.authApiKey
    },
    body: JSON.stringify({ email, password })
  }, config.timeoutMs);

  const responseText = await safeReadResponseText(response);
  const body = safeParseJson(responseText);

  if (!response.ok) {
    const message = normalizeAuthFailureMessage(response.status, body, responseText);
    throw buildRequestError(response.status === 400 ? 401 : response.status, message);
  }

  if (!body || typeof body !== 'object') {
    throw buildRequestError(500, 'invalid_auth_response_shape');
  }

  return body;
}

function normalizeAuthFailureMessage(status, body, fallbackText) {
  const rawMessage = getResponseErrorMessage(body) || String(fallbackText || '').trim();
  const normalizedMessage = rawMessage.toLowerCase();

  if (status === 400 || status === 401) {
    if (normalizedMessage.includes('invalid login credentials') || normalizedMessage.includes('invalid credentials')) {
      return 'Kullanici adi veya sifre hatali.';
    }
  }

  return rawMessage || 'Kimlik dogrulama basarisiz oldu.';
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

function safeParseJson(value) {
  try {
    return JSON.parse(String(value || ''));
  } catch {
    return null;
  }
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}
