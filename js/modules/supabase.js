import { SUPABASE_CONFIG } from '../config/supabase.config.js';

const SUPABASE_PENDING_STORAGE_KEY = 'pgm-supabase-pending-reports-v1';
const DEFAULT_TIMEOUT_MS = 10000;

export function isSupabaseConfigured() {
  return Boolean(getConfiguredBaseUrl() && getConfiguredAnonKey());
}

export async function persistReportToSupabase(report) {
  const row = mapReportToSupabaseRow(report);
  if (!row) {
    return { status: 'error', reason: 'invalid-report' };
  }

  if (!isSupabaseConfigured()) {
    return { status: 'skipped', reason: 'not-configured' };
  }

  try {
    await insertRow(row);
    return { status: 'synced', reportId: row.id };
  } catch (error) {
    queuePendingRow(row);
    return {
      status: 'queued',
      reportId: row.id,
      reason: normalizeErrorMessage(error)
    };
  }
}

export async function syncPendingSupabaseReports() {
  if (!isSupabaseConfigured()) {
    return { status: 'skipped', reason: 'not-configured', pendingCount: getPendingRows().length };
  }

  const pendingRows = getPendingRows();
  if (pendingRows.length === 0) {
    return { status: 'idle', pendingCount: 0 };
  }

  const stillPending = [];
  let lastErrorMessage = '';

  for (const row of pendingRows) {
    try {
      await insertRow(row);
    } catch (error) {
      if (isDuplicateInsertError(error)) {
        // If row already exists remotely, treat it as synced and drop from queue.
        continue;
      }

      stillPending.push(row);
      lastErrorMessage = normalizeErrorMessage(error);
    }
  }

  setPendingRows(stillPending);

  if (stillPending.length === 0) {
    return { status: 'synced', pendingCount: 0 };
  }

  return {
    status: 'queued',
    pendingCount: stillPending.length,
    reason: lastErrorMessage || 'sync-failed'
  };
}

function mapReportToSupabaseRow(report) {
  if (!report || typeof report !== 'object') return null;

  const id = String(report.id || '').trim();
  const district = String(report.district || report.region || '').trim();
  const region = String(report.region || report.district || '').trim();
  const schoolId = Number(report.schoolId || 0);
  const schoolName = String(report.schoolName || '').trim();
  const category = String(report.category || '').trim();
  const title = String(report.title || '').trim();
  const description = String(report.description || '').trim();

  if (!id || !district || !region || !Number.isFinite(schoolId) || schoolId <= 0 || !schoolName || !category || !title || !description) {
    return null;
  }

  const eventDate = normalizeDateValue(report.eventDate);
  const createdAt = normalizeDateValue(report.createdAt) || new Date().toISOString();
  const updatedAt = normalizeDateValue(report.updatedAt) || createdAt;

  const contact = report.contact && typeof report.contact === 'object' ? report.contact : {};

  return {
    id,
    district,
    region,
    school_id: schoolId,
    school_name: schoolName,
    category,
    title,
    description,
    event_date: eventDate,
    attachments: Array.isArray(report.attachments) ? report.attachments : [],
    contact_name: String(report.contactName || contact.name || '') || null,
    contact_phone: String(report.contactPhone || contact.phone || '') || null,
    contact_email: String(report.contactEmail || contact.email || '') || null,
    status: String(report.status || 'Yeni'),
    source: 'web-anon-report',
    client_snapshot: sanitizeSnapshot(report.technicalMeta),
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function sanitizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  return {
    device: safeString(snapshot.device),
    browser: safeString(snapshot.browser),
    os: safeString(snapshot.os),
    language: safeString(snapshot.language),
    timezone: safeString(snapshot.timezone),
    screen: safeString(snapshot.screen),
    capturedAt: normalizeDateValue(snapshot.capturedAt),
    location: snapshot.location && typeof snapshot.location === 'object'
      ? {
          latitude: Number(snapshot.location.latitude),
          longitude: Number(snapshot.location.longitude),
          accuracyMeters: Number(snapshot.location.accuracyMeters)
        }
      : null
  };
}

function safeString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function normalizeDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function queuePendingRow(row) {
  const pendingRows = getPendingRows();
  const existingIndex = pendingRows.findIndex(item => item.id === row.id);

  if (existingIndex >= 0) {
    pendingRows[existingIndex] = row;
  } else {
    pendingRows.push(row);
  }

  setPendingRows(pendingRows);
}

function getPendingRows() {
  try {
    const raw = localStorage.getItem(SUPABASE_PENDING_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'object') : [];
  } catch {
    return [];
  }
}

function setPendingRows(rows) {
  try {
    localStorage.setItem(SUPABASE_PENDING_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Keep form flow resilient when storage is unavailable.
  }
}

async function insertRow(row) {
  if (!row || typeof row !== 'object') {
    return;
  }

  const endpoint = buildInsertEndpoint();
  const schema = getConfiguredSchema();
  const headers = {
    'Content-Type': 'application/json',
    apikey: getConfiguredAnonKey(),
    Prefer: 'return=minimal',
    'Accept-Profile': schema,
    'Content-Profile': schema
  };

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify([row])
  }, getRequestTimeoutMs());

  if (response.ok) {
    return;
  }

  let details = '';
  try {
    details = await response.text();
  } catch {
    details = '';
  }

  throw new SupabaseRequestError(response.status, details);
}

function buildInsertEndpoint() {
  const baseUrl = getConfiguredBaseUrl();
  const table = encodeURIComponent(String(SUPABASE_CONFIG.reportsTable || 'anonymous_reports'));
  return `${baseUrl}/rest/v1/${table}`;
}

function getConfiguredBaseUrl() {
  const rawValue = String(SUPABASE_CONFIG.url || '').trim().replace(/\/+$/, '');
  if (!rawValue) return '';

  // Allow users to paste either project URL or Data API URL ending with /rest/v1.
  return rawValue.replace(/\/rest\/v1$/i, '');
}

function getConfiguredAnonKey() {
  return String(SUPABASE_CONFIG.anonKey || '').trim();
}

function getConfiguredSchema() {
  const schema = String(SUPABASE_CONFIG.schema || 'public').trim();
  return schema || 'public';
}

function getRequestTimeoutMs() {
  const timeout = Number(SUPABASE_CONFIG.requestTimeoutMs || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return timeout;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function normalizeErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'unknown-error';
}

function isDuplicateInsertError(error) {
  if (!(error instanceof SupabaseRequestError)) {
    return false;
  }

  if (error.status !== 409) {
    return false;
  }

  return /23505|duplicate key value|unique constraint/i.test(error.details || '');
}

class SupabaseRequestError extends Error {
  constructor(status, details) {
    super(`Supabase request failed (${status}): ${details}`);
    this.name = 'SupabaseRequestError';
    this.status = status;
    this.details = details;
  }
}
