const crypto = require('node:crypto');

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_PER_IP = 5;
const RATE_LIMIT_MAX_PER_FINGERPRINT = 3;
const DUPLICATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_LINK_MARKER_COUNT = 3;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_SECURITY_EVENTS_TABLE = 'security_events';
const DEFAULT_RATE_LIMIT_RPC = 'consume_report_rate_limit';
let canonicalDataPromise = null;

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

  const config = getServerConfig();
  if (!config.isValid) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  const requestIp = extractRequestIp(req);
  const userAgent = normalizeText(req.headers['user-agent'] || '', 300) || 'unknown';
  const routePath = normalizeText(req.url || '/api/report', 240) || '/api/report';
  const ipHash = buildIpKey(requestIp, config.hashSalt);

  let payload;
  try {
    payload = parseJsonBody(req.body);
  } catch {
    await tryLogSecurityEvent(config, {
      eventType: 'invalid_payload',
      reason: 'invalid_json_body',
      route: routePath,
      userAgent,
      ipHash,
      metadata: {
        stage: 'parse_json'
      }
    });
    res.status(400).json({ error: 'invalid_json_body' });
    return;
  }

  const canonicalData = await loadCanonicalData();
  const sanitized = sanitizeIncomingRow(payload && payload.row, canonicalData);
  if (!sanitized.ok) {
    await tryLogSecurityEvent(config, {
      eventType: 'invalid_payload',
      reason: sanitized.reason,
      route: routePath,
      userAgent,
      ipHash,
      metadata: {
        stage: 'sanitize_row'
      }
    });
    res.status(422).json({ error: 'invalid_report_payload', reason: sanitized.reason });
    return;
  }

  await logSanitizationWarnings(config, sanitized, { routePath, userAgent, ipHash });

  const fingerprintSource = buildFingerprintSource(userAgent, sanitized.row.client_snapshot);
  const fingerprintHash = buildFingerprintKey(fingerprintSource, config.hashSalt);

  try {
    const ipDecision = await consumeSharedRateLimit(config, {
      scope: 'ip',
      key: ipHash,
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxCount: RATE_LIMIT_MAX_PER_IP
    });
    if (!ipDecision.allowed) {
      await tryLogSecurityEvent(config, {
        eventType: 'rate_limit_block',
        reason: 'rate_limit_ip',
        route: routePath,
        userAgent,
        ipHash,
        fingerprintHash,
        reportId: sanitized.row.id,
        metadata: {
          retryAfterSeconds: ipDecision.retryAfterSeconds,
          windowMs: RATE_LIMIT_WINDOW_MS,
          maxPerIp: RATE_LIMIT_MAX_PER_IP,
          store: 'supabase'
        }
      });
      res.setHeader('Retry-After', String(ipDecision.retryAfterSeconds));
      res.status(429).json({ error: 'rate_limit_ip', message: 'Kisa surede cok fazla gonderim yapildi. Lutfen daha sonra tekrar deneyin.' });
      return;
    }

    const fingerprintDecision = await consumeSharedRateLimit(config, {
      scope: 'fingerprint',
      key: fingerprintHash,
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxCount: RATE_LIMIT_MAX_PER_FINGERPRINT
    });

    if (!fingerprintDecision.allowed) {
      await tryLogSecurityEvent(config, {
        eventType: 'rate_limit_block',
        reason: 'rate_limit_fingerprint',
        route: routePath,
        userAgent,
        ipHash,
        fingerprintHash,
        reportId: sanitized.row.id,
        metadata: {
          retryAfterSeconds: fingerprintDecision.retryAfterSeconds,
          windowMs: RATE_LIMIT_WINDOW_MS,
          maxPerFingerprint: RATE_LIMIT_MAX_PER_FINGERPRINT,
          store: 'supabase'
        }
      });
      res.setHeader('Retry-After', String(fingerprintDecision.retryAfterSeconds));
      res.status(429).json({ error: 'rate_limit_fingerprint', message: 'Kisa surede tekrarlayan gonderim algilandi. Lutfen daha sonra tekrar deneyin.' });
      return;
    }
  } catch (error) {
    await tryLogSecurityEvent(config, {
      eventType: 'submit_error',
      reason: 'rate_limit_check_failed',
      route: routePath,
      userAgent,
      ipHash,
      fingerprintHash,
      reportId: sanitized.row.id,
      metadata: {
        status: error && Number.isFinite(error.status) ? error.status : null
      }
    });

    const status = error && Number.isFinite(error.status) ? error.status : 500;
    res.status(status).json({ error: 'submit_failed', message: 'rate_limit_check_failed' });
    return;
  }

  try {
    const duplicateExists = await hasRecentDuplicateSubmission(config, sanitized.row);
    if (duplicateExists) {
      await tryLogSecurityEvent(config, {
        eventType: 'duplicate_block',
        reason: 'duplicate_submission',
        route: routePath,
        userAgent,
        ipHash,
        fingerprintHash,
        reportId: sanitized.row.id,
        metadata: {
          schoolId: sanitized.row.school_id,
          category: sanitized.row.category
        }
      });
      res.status(409).json({ error: 'duplicate_submission', message: 'Ayni icerikte bir bildirim kisa sure icinde gonderildi. Lutfen 15 dakika sonra tekrar deneyin.' });
      return;
    }

    await insertReport(config, sanitized.row);
    res.status(201).json({ status: 'accepted', reportId: sanitized.row.id });
  } catch (error) {
    await tryLogSecurityEvent(config, {
      eventType: 'submit_error',
      reason: 'submit_failed',
      route: routePath,
      userAgent,
      ipHash,
      fingerprintHash,
      reportId: sanitized.row.id,
      metadata: {
        status: error && Number.isFinite(error.status) ? error.status : null
      }
    });

    const status = error && Number.isFinite(error.status) ? error.status : 500;
    const message = error instanceof Error ? error.message : 'unexpected_error';
    res.status(status).json({ error: 'submit_failed', message });
  }
};

function setCommonHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

function getServerConfig() {
  const rawUrl = String(process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const schema = String(process.env.SUPABASE_SCHEMA || 'public').trim() || 'public';
  const table = String(process.env.SUPABASE_REPORTS_TABLE || 'anonymous_reports').trim() || 'anonymous_reports';
  const securityEventsTable = String(process.env.SUPABASE_SECURITY_EVENTS_TABLE || DEFAULT_SECURITY_EVENTS_TABLE).trim() || DEFAULT_SECURITY_EVENTS_TABLE;
  const rateLimitRpc = String(process.env.SUPABASE_RATE_LIMIT_RPC || DEFAULT_RATE_LIMIT_RPC).trim() || DEFAULT_RATE_LIMIT_RPC;
  const hashSalt = String(process.env.REPORT_SECURITY_SALT || process.env.VERCEL_URL || 'pgm-default-salt').trim();
  const timeoutMs = Number(process.env.REPORT_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  const baseUrl = normalizeSupabaseBaseUrl(rawUrl);

  return {
    isValid: Boolean(baseUrl && serviceRoleKey),
    baseUrl,
    serviceRoleKey,
    schema,
    table,
    securityEventsTable,
    rateLimitRpc,
    hashSalt,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS
  };
}

function normalizeSupabaseBaseUrl(rawUrl) {
  if (!rawUrl) return '';
  return rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
}

function parseJsonBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  if (Buffer.isBuffer(body)) {
    return JSON.parse(body.toString('utf8'));
  }

  return JSON.parse(String(body));
}

function sanitizeIncomingRow(rawRow, canonicalData) {
  if (!rawRow || typeof rawRow !== 'object') {
    return { ok: false, reason: 'missing_row' };
  }

  const id = normalizeText(rawRow.id, 80);
  const district = normalizeText(rawRow.district, 120);
  const region = normalizeText(rawRow.region, 120);
  const schoolId = Number(rawRow.school_id || 0);
  const schoolName = normalizeText(rawRow.school_name, 200);
  const category = normalizeText(rawRow.category, 120);
  const title = normalizeText(rawRow.title, MAX_TITLE_LENGTH);
  const description = normalizeText(rawRow.description, MAX_DESCRIPTION_LENGTH);

  if (!id || !district || !region || !Number.isFinite(schoolId) || schoolId <= 0 || !schoolName || !category || !title || !description) {
    return { ok: false, reason: 'required_fields_missing' };
  }

  const canonicalSchool = canonicalData.getCanonicalSchoolById(schoolId);
  if (!canonicalSchool) {
    return { ok: false, reason: 'unknown_school' };
  }

  if (!canonicalData.isCanonicalCategory(category)) {
    return { ok: false, reason: 'unknown_category' };
  }

  const canonicalDistrict = canonicalSchool.district || canonicalSchool.region || '';
  const clientDistrict = canonicalData.normalizeDistrictName(district, '');
  const clientRegion = canonicalData.normalizeDistrictName(region, '');
  if (clientDistrict !== canonicalDistrict || clientRegion !== canonicalDistrict) {
    return { ok: false, reason: 'district_school_mismatch' };
  }

  // Istemci tarafindan gelen okul etiketine guvenilmez; kanonik ad, kabul edilen
  // school_id'den turetilir (satir asagida `canonicalSchool.name` olarak yazilir).
  // Eski veya yerellesmis bir etiket satiri reddetmek icin kullanilmaz; yalnizca
  // gozlemlenebilirlik icin kayit altina alinir.
  const warnings = [];
  if (normalizeComparableText(schoolName) !== normalizeComparableText(canonicalSchool.name)) {
    warnings.push({
      code: 'school_name_mismatch',
      schoolId,
      clientSchoolName: schoolName,
      canonicalSchoolName: canonicalSchool.name
    });
  }

  const linkMarkerCount = countLinkMarkers(title) + countLinkMarkers(description);
  if (linkMarkerCount > MAX_LINK_MARKER_COUNT) {
    return { ok: false, reason: 'too_many_links' };
  }

  const createdAt = normalizeDateValue(rawRow.created_at) || new Date().toISOString();
  const updatedAt = normalizeDateValue(rawRow.updated_at) || createdAt;

  const row = {
    id,
    district: canonicalDistrict,
    region: canonicalDistrict,
    school_id: schoolId,
    school_name: canonicalSchool.name,
    category,
    title,
    description,
    event_date: normalizeDateValue(rawRow.event_date),
    attachments: sanitizeAttachments(rawRow.attachments),
    contact_name: normalizeNullableText(rawRow.contact_name, 160),
    contact_phone: normalizeNullableText(rawRow.contact_phone, 40),
    contact_email: normalizeNullableText(rawRow.contact_email, 254),
    status: 'Yeni',
    source: 'web-anon-report',
    client_snapshot: sanitizeSnapshot(rawRow.client_snapshot),
    created_at: createdAt,
    updated_at: updatedAt
  };

  return { ok: true, row, warnings };
}

async function loadCanonicalData() {
  if (!canonicalDataPromise) {
    canonicalDataPromise = import('../js/data/canonical-source.mjs');
  }

  return canonicalDataPromise;
}

function normalizeText(value, maxLength) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.slice(0, maxLength);
}

function normalizeComparableText(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr')
    .normalize('NFC')
    .replace(/\s+/g, ' ');
}

function normalizeNullableText(value, maxLength) {
  const text = normalizeText(value, maxLength);
  return text || null;
}

function normalizeDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function countLinkMarkers(text) {
  const matches = String(text || '').match(/https?:\/\/|www\./gi);
  return Array.isArray(matches) ? matches.length : 0;
}

function sanitizeAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => normalizeText(item, 200))
    .filter(Boolean)
    .slice(0, 10);
}

function sanitizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const location = snapshot.location && typeof snapshot.location === 'object'
    ? {
        latitude: Number(snapshot.location.latitude),
        longitude: Number(snapshot.location.longitude),
        accuracyMeters: Number(snapshot.location.accuracyMeters)
      }
    : null;

  return {
    device: normalizeNullableText(snapshot.device, 80),
    browser: normalizeNullableText(snapshot.browser, 120),
    os: normalizeNullableText(snapshot.os, 80),
    language: normalizeNullableText(snapshot.language, 32),
    timezone: normalizeNullableText(snapshot.timezone, 64),
    screen: normalizeNullableText(snapshot.screen, 40),
    capturedAt: normalizeDateValue(snapshot.capturedAt),
    location: location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyMeters: Number.isFinite(location.accuracyMeters) ? location.accuracyMeters : null
        }
      : null
  };
}

function extractRequestIp(req) {
  const forwardedHeader = req.headers['x-forwarded-for'];
  if (typeof forwardedHeader === 'string' && forwardedHeader.trim()) {
    const firstIp = forwardedHeader.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return 'unknown';
}

function buildIpKey(ip, salt) {
  return createSha256(`${salt}|ip|${ip}`);
}

function buildFingerprintKey(source, salt) {
  return createSha256(`${salt}|fp|${source}`);
}

function buildFingerprintSource(userAgent, snapshot) {
  const parts = [
    normalizeText(userAgent, 300),
    normalizeNullableText(snapshot && snapshot.device, 80),
    normalizeNullableText(snapshot && snapshot.browser, 120),
    normalizeNullableText(snapshot && snapshot.os, 80),
    normalizeNullableText(snapshot && snapshot.language, 32),
    normalizeNullableText(snapshot && snapshot.timezone, 64),
    normalizeNullableText(snapshot && snapshot.screen, 40)
  ];

  return parts.map(part => part || '-').join('|');
}

function createSha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

async function hasRecentDuplicateSubmission(config, row) {
  const sinceIso = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
  const endpoint = buildSupabaseEndpoint(config);
  const url = `${endpoint}?select=id&school_id=eq.${row.school_id}&title=eq.${encodeURIComponent(row.title)}&description=eq.${encodeURIComponent(row.description)}&created_at=gte.${encodeURIComponent(sinceIso)}&limit=1`;

  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: buildSupabaseHeaders(config, {
      Prefer: 'count=exact'
    })
  }, config.timeoutMs);

  if (!response.ok) {
    const details = await safeReadResponseText(response);
    throw buildRequestError(response.status, `duplicate_check_failed: ${details}`);
  }

  const data = await response.json();
  return Array.isArray(data) && data.length > 0;
}

async function consumeSharedRateLimit(config, options) {
  const endpoint = buildSupabaseRpcEndpoint(config, config.rateLimitRpc);
  const windowSeconds = Math.max(1, Math.ceil(Number(options.windowMs || 0) / 1000));
  const maxCount = Math.max(1, Number(options.maxCount || 0));
  const scope = normalizeText(options.scope, 40);
  const key = normalizeText(options.key, 160);
  const bucketKey = `${scope}:${key}`;

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: buildSupabaseHeaders(config),
    body: JSON.stringify({
      p_bucket_key: bucketKey,
      p_scope: scope,
      p_window_seconds: windowSeconds,
      p_max_count: maxCount
    })
  }, config.timeoutMs);

  if (!response.ok) {
    const details = await safeReadResponseText(response);
    throw buildRequestError(response.status, `rate_limit_check_failed: ${details}`);
  }

  const payload = await response.json();
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row !== 'object') {
    throw buildRequestError(500, 'rate_limit_check_failed: empty_response');
  }

  return {
    allowed: Boolean(row.allowed),
    retryAfterSeconds: Math.max(0, Number(row.retry_after_seconds) || 0),
    requestCount: Math.max(0, Number(row.request_count) || 0),
    resetAt: normalizeNullableText(row.reset_at, 80)
  };
}

async function insertReport(config, row) {
  const endpoint = buildSupabaseEndpoint(config);
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: buildSupabaseHeaders(config, {
      Prefer: 'return=minimal'
    }),
    body: JSON.stringify([row])
  }, config.timeoutMs);

  if (response.ok) {
    return;
  }

  const details = await safeReadResponseText(response);
  if (response.status === 409 && /23505|duplicate key value|unique constraint/i.test(details)) {
    return;
  }

  throw buildRequestError(response.status, `insert_failed: ${details}`);
}

async function logSecurityEvent(config, event) {
  if (!config || !config.securityEventsTable) {
    return;
  }

  const eventType = normalizeText(event && event.eventType, 64);
  if (!eventType) {
    return;
  }

  const row = {
    event_type: eventType,
    reason: normalizeNullableText(event && event.reason, 120),
    route: normalizeText(event && event.route, 240) || '/api/report',
    user_agent: normalizeNullableText(event && event.userAgent, 300),
    ip_hash: normalizeNullableText(event && event.ipHash, 128),
    fingerprint_hash: normalizeNullableText(event && event.fingerprintHash, 128),
    report_id: normalizeNullableText(event && event.reportId, 80),
    metadata: sanitizeEventMetadata(event && event.metadata),
    created_at: new Date().toISOString()
  };

  const endpoint = buildSupabaseEndpoint(config, config.securityEventsTable);
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: buildSupabaseHeaders(config, {
      Prefer: 'return=minimal'
    }),
    body: JSON.stringify([row])
  }, config.timeoutMs);

  if (response.ok) {
    return;
  }

  const details = await safeReadResponseText(response);
  console.warn('security event log failed', response.status, details ? details.slice(0, 240) : '');
}

async function tryLogSecurityEvent(config, event) {
  try {
    await logSecurityEvent(config, event);
  } catch {
    // Logging failures must never block report processing.
  }
}

async function logSanitizationWarnings(config, sanitized, context) {
  const warnings = Array.isArray(sanitized && sanitized.warnings) ? sanitized.warnings : [];
  if (warnings.length === 0) {
    return;
  }

  for (const warning of warnings) {
    await tryLogSecurityEvent(config, {
      eventType: warning.code || 'sanitization_warning',
      reason: 'school_name_replaced_with_canonical',
      route: context.routePath,
      userAgent: context.userAgent,
      ipHash: context.ipHash,
      reportId: sanitized.row && sanitized.row.id,
      metadata: {
        stage: 'sanitize_row',
        school_id: warning.schoolId,
        client_school_name: warning.clientSchoolName,
        canonical_school_name: warning.canonicalSchoolName
      }
    });
  }
}

function sanitizeEventMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const sanitized = {};
  const entries = Object.entries(metadata).slice(0, 12);
  for (const [key, value] of entries) {
    const normalizedKey = normalizeText(key, 64);
    if (!normalizedKey) {
      continue;
    }

    if (value === null) {
      sanitized[normalizedKey] = null;
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[normalizedKey] = value;
      continue;
    }

    sanitized[normalizedKey] = normalizeText(value, 240);
  }

  return sanitized;
}

function buildSupabaseEndpoint(config, tableName = config.table) {
  const normalizedTableName = String(tableName || '').trim() || config.table;
  return `${config.baseUrl}/rest/v1/${encodeURIComponent(normalizedTableName)}`;
}

function buildSupabaseRpcEndpoint(config, functionName) {
  const normalizedName = String(functionName || '').trim();
  return `${config.baseUrl}/rest/v1/rpc/${encodeURIComponent(normalizedName)}`;
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
