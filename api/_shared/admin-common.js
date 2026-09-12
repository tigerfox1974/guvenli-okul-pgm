const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const SUMMARY_SCAN_CHUNK_SIZE = 500;
const ALLOWED_DATE_FILTERS = new Set(['all', '7', '30', 'year']);
const DEFAULT_ALLOWED_ROLES = ['operator', 'supervisor'];

function setCommonHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

function getAdminServerConfig() {
  const rawUrl = String(process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const authApiKey = String(process.env.SUPABASE_ANON_KEY || serviceRoleKey).trim();
  const schema = String(process.env.SUPABASE_SCHEMA || 'public').trim() || 'public';
  const table = String(process.env.SUPABASE_REPORTS_TABLE || 'anonymous_reports').trim() || 'anonymous_reports';
  const adminUsersTable = String(process.env.SUPABASE_ADMIN_USERS_TABLE || 'admin_users').trim() || 'admin_users';
  const timeoutMs = Number(process.env.REPORT_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  const baseUrl = normalizeSupabaseBaseUrl(rawUrl);

  return {
    isValid: Boolean(baseUrl && serviceRoleKey && authApiKey),
    baseUrl,
    serviceRoleKey,
    authApiKey,
    schema,
    table,
    adminUsersTable,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS
  };
}

function normalizeSupabaseBaseUrl(rawUrl) {
  if (!rawUrl) return '';
  return rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
}

function getAllowedRoles() {
  const raw = String(process.env.PGM_ADMIN_ROLES || '').trim();
  if (!raw) {
    return new Set(DEFAULT_ALLOWED_ROLES);
  }

  const values = raw
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  return new Set(values.length > 0 ? values : DEFAULT_ALLOWED_ROLES);
}

function extractBearerToken(req) {
  const authHeader = req && req.headers ? req.headers.authorization || req.headers.Authorization : '';
  if (typeof authHeader !== 'string') {
    return '';
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

function parseRoleFromUser(user) {
  if (!user || typeof user !== 'object') return '';

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

async function authenticateAdmin(req, config) {
  const token = extractBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, code: 'missing_token' };
  }

  const response = await fetchWithTimeout(`${config.baseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.authApiKey,
      Authorization: `Bearer ${token}`
    }
  }, config.timeoutMs);

  if (response.status === 401 || response.status === 403) {
    return { ok: false, status: 401, code: 'invalid_token' };
  }

  if (!response.ok) {
    const details = await safeReadResponseText(response);
    throw buildRequestError(response.status, `auth_validation_failed: ${details}`);
  }

  const user = await response.json();
  const role = parseRoleFromUser(user);
  const allowedRoles = getAllowedRoles();

  if (!role || !allowedRoles.has(role)) {
    return { ok: false, status: 403, code: 'insufficient_role' };
  }

  return {
    ok: true,
    status: 200,
    token,
    role,
    user: {
      id: String(user.id || ''),
      email: String(user.email || ''),
      role
    }
  };
}

function parseListFilters(req, options = { withPagination: true }) {
  const district = normalizeFilterValue(getQueryParam(req, 'district'));
  const schoolRaw = normalizeFilterValue(getQueryParam(req, 'school'));
  const category = normalizeFilterValue(getQueryParam(req, 'category'));
  const status = normalizeFilterValue(getQueryParam(req, 'status'));
  const date = normalizeFilterValue(getQueryParam(req, 'date'));

  if (!ALLOWED_DATE_FILTERS.has(date)) {
    return { ok: false, status: 400, code: 'invalid_date_filter' };
  }

  const schoolId = parseSchoolFilterValue(schoolRaw);
  if (!schoolId.ok) {
    return { ok: false, status: 400, code: 'invalid_school_filter' };
  }

  const withPagination = options && options.withPagination !== false;
  if (!withPagination) {
    return {
      ok: true,
      filters: {
        district,
        school: schoolId.value,
        category,
        status,
        date,
        page: 1,
        pageSize: SUMMARY_SCAN_CHUNK_SIZE
      }
    };
  }

  const pageValue = Number(getQueryParam(req, 'page') || '1');
  const pageSizeValue = Number(getQueryParam(req, 'pageSize') || String(DEFAULT_PAGE_SIZE));

  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const pageSize = Number.isInteger(pageSizeValue) && pageSizeValue > 0
    ? Math.min(pageSizeValue, MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  return {
    ok: true,
    filters: {
      district,
      school: schoolId.value,
      category,
      status,
      date,
      page,
      pageSize
    }
  };
}

function parseSchoolFilterValue(raw) {
  if (raw === 'all') {
    return { ok: true, value: 'all' };
  }

  const numericValue = Number(raw);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return { ok: false, value: 'all' };
  }

  return { ok: true, value: String(numericValue) };
}

function normalizeFilterValue(value) {
  const normalized = String(value || '').trim();
  return normalized ? normalized : 'all';
}

function getQueryParam(req, key) {
  if (req && req.query) {
    const rawValue = req.query[key];
    if (typeof rawValue === 'string') {
      return rawValue;
    }
    if (Array.isArray(rawValue) && rawValue.length > 0) {
      return String(rawValue[0] || '');
    }
  }

  try {
    const parsedUrl = new URL(String(req && req.url ? req.url : ''), 'http://localhost');
    return parsedUrl.searchParams.get(key) || '';
  } catch {
    return '';
  }
}

function applyReportFilters(params, filters) {
  if (filters.district !== 'all') {
    params.append('district', `eq.${filters.district}`);
  }

  if (filters.school !== 'all') {
    params.append('school_id', `eq.${filters.school}`);
  }

  if (filters.category !== 'all') {
    params.append('category', `eq.${filters.category}`);
  }

  if (filters.status !== 'all') {
    params.append('status', `eq.${filters.status}`);
  }

  applyDateFilter(params, filters.date);
}

function applyDateFilter(params, dateFilter) {
  if (dateFilter === 'all') {
    return;
  }

  if (dateFilter === 'year') {
    const now = new Date();
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    const startOfNextYear = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1, 0, 0, 0, 0));

    params.append('created_at', `gte.${startOfYear.toISOString()}`);
    params.append('created_at', `lt.${startOfNextYear.toISOString()}`);
    return;
  }

  const days = Number(dateFilter);
  if (!Number.isFinite(days) || days <= 0) {
    return;
  }

  const sinceDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  params.append('created_at', `gte.${sinceDate.toISOString()}`);
}

function buildSupabaseEndpoint(config, tableName = config.table) {
  const normalizedTableName = String(tableName || '').trim() || config.table;
  return `${config.baseUrl}/rest/v1/${encodeURIComponent(normalizedTableName)}`;
}

function buildSupabaseRpcEndpoint(config, functionName) {
  const normalizedName = String(functionName || '').trim();
  return `${config.baseUrl}/rest/v1/rpc/${encodeURIComponent(normalizedName)}`;
}

function buildSummaryRpcArgs(filters) {
  const safeFilters = filters && typeof filters === 'object' ? filters : {};

  return {
    p_district: normalizeRpcFilterValue(safeFilters.district),
    p_school: normalizeRpcFilterValue(safeFilters.school),
    p_category: normalizeRpcFilterValue(safeFilters.category),
    p_status: normalizeRpcFilterValue(safeFilters.status),
    p_date: normalizeFilterValue(safeFilters.date)
  };
}

function normalizeRpcFilterValue(value) {
  const normalized = normalizeFilterValue(value);
  return normalized === 'all' ? null : normalized;
}

async function fetchReportSummary(config, filters) {
  const endpoint = buildSupabaseRpcEndpoint(config, 'get_report_summary');
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: buildSupabaseHeaders(config),
    body: JSON.stringify(buildSummaryRpcArgs(filters))
  }, config.timeoutMs);

  if (!response.ok) {
    const details = await safeReadResponseText(response);
    throw buildRequestError(response.status, `supabase_summary_rpc_failed: ${details}`);
  }

  const payload = await response.json();
  return normalizeSummaryPayload(payload);
}

// RPC ciktisi iki bolumden olusur:
//  - summary:   ozet kartlari (Faz 2'den beri ayni alanlar)
//  - analytics: tum filtrelenmis kayit kumesini temsil eden aggregate (Faz 3)
// `analytics` alani yoksa (eski RPC surumu) null doner; panel bu durumda kontrollu olarak
// sayfa verisine geri duser. Sayfalama yalnizca detay listesi icin kullanilir.
function normalizeSummaryPayload(payload) {
  const source = Array.isArray(payload)
    ? (payload[0] && typeof payload[0] === 'object' ? payload[0] : {})
    : (payload && typeof payload === 'object' ? payload : {});

  return {
    summary: {
      totalReports: toSafeCount(source.totalReports),
      newReports: toSafeCount(source.newReports),
      reviewedReports: toSafeCount(source.reviewedReports),
      topDistrict: String(source.topDistrict || ''),
      topCategory: String(source.topCategory || '')
    },
    analytics: normalizeAnalyticsPayload(source.analytics)
  };
}

function normalizeAnalyticsPayload(analytics) {
  if (!analytics || typeof analytics !== 'object' || Array.isArray(analytics)) {
    return null;
  }

  const cells = Array.isArray(analytics.cells) ? analytics.cells : [];
  const groups = new Map();

  cells.forEach(cell => {
    const normalizedCell = normalizeAnalyticsCell(cell);
    if (!normalizedCell) {
      return;
    }

    const existing = groups.get(normalizedCell.key);
    if (!existing) {
      groups.set(normalizedCell.key, normalizedCell);
      return;
    }

    existing.count += normalizedCell.count;
    Object.entries(normalizedCell.statusCounts).forEach(([status, count]) => {
      existing.statusCounts[status] = toSafeCount(existing.statusCounts[status]) + count;
    });
  });

  const groupList = Array.from(groups.values())
    .filter(group => group.count > 0)
    .sort((left, right) => right.count - left.count);

  const declaredTotal = toSafeCount(analytics.totalRecords);
  const computedTotal = groupList.reduce((total, group) => total + group.count, 0);

  return {
    totalRecords: declaredTotal > 0 ? declaredTotal : computedTotal,
    groups: groupList
  };
}

function normalizeAnalyticsCell(cell) {
  if (!cell || typeof cell !== 'object') {
    return null;
  }

  const count = toSafeCount(cell.count);
  if (count <= 0) {
    return null;
  }

  const rawSchoolId = Number(cell.schoolId);
  const schoolId = Number.isFinite(rawSchoolId) && rawSchoolId > 0 ? rawSchoolId : 0;
  const category = String(cell.category || '');
  const status = String(cell.status || '') || 'Yeni';

  return {
    key: `${schoolId}-${category}`,
    schoolId,
    schoolName: String(cell.schoolName || ''),
    district: String(cell.district || ''),
    category,
    count,
    statusCounts: { [status]: count }
  };
}

function toSafeCount(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function buildSupabaseHeaders(config, extraHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    'Accept-Profile': config.schema,
    'Content-Profile': config.schema,
    ...extraHeaders
  };
}

function parseContentRangeTotal(contentRangeHeader) {
  const raw = String(contentRangeHeader || '').trim();
  const match = raw.match(/\/(\d+|\*)$/);
  if (!match || match[1] === '*') {
    return null;
  }

  const total = Number(match[1]);
  return Number.isFinite(total) ? total : null;
}

function mapSupabaseRowToReport(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const schoolId = Number(row.school_id || 0);

  return {
    id: String(row.id || ''),
    district: String(row.district || row.region || ''),
    region: String(row.region || row.district || ''),
    schoolId: Number.isFinite(schoolId) ? schoolId : 0,
    schoolName: String(row.school_name || ''),
    category: String(row.category || ''),
    title: String(row.title || ''),
    description: String(row.description || ''),
    eventDate: row.event_date ? String(row.event_date) : '',
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    files: Array.isArray(row.attachments) ? row.attachments : [],
    contactName: row.contact_name ? String(row.contact_name) : '',
    contactPhone: row.contact_phone ? String(row.contact_phone) : '',
    contactEmail: row.contact_email ? String(row.contact_email) : '',
    contact: {
      name: row.contact_name ? String(row.contact_name) : '',
      phone: row.contact_phone ? String(row.contact_phone) : '',
      email: row.contact_email ? String(row.contact_email) : ''
    },
    status: String(row.status || 'Yeni'),
    source: String(row.source || 'web-anon-report'),
    technicalMeta: row.client_snapshot && typeof row.client_snapshot === 'object' ? row.client_snapshot : null,
    createdAt: row.created_at ? String(row.created_at) : '',
    updatedAt: row.updated_at ? String(row.updated_at) : ''
  };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function safeReadResponseText(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function buildRequestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = {
  applyReportFilters,
  authenticateAdmin,
  buildRequestError,
  buildSupabaseEndpoint,
  buildSupabaseRpcEndpoint,
  buildSupabaseHeaders,
  fetchReportSummary,
  fetchWithTimeout,
  getAdminServerConfig,
  mapSupabaseRowToReport,
  parseRoleFromUser,
  parseContentRangeTotal,
  parseListFilters,
  safeReadResponseText,
  setCommonHeaders
};
