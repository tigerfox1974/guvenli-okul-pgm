const {
  applyReportFilters,
  authenticateAdmin,
  buildRequestError,
  buildSupabaseEndpoint,
  buildSupabaseHeaders,
  fetchWithTimeout,
  getAdminServerConfig,
  getSummaryLimits,
  parseListFilters,
  safeReadResponseText,
  setCommonHeaders
} = require('../_shared/admin-common');

const SUMMARY_SELECT_FIELDS = 'district,region,category,status';

module.exports = async (req, res) => {
  setCommonHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const config = getAdminServerConfig();
  if (!config.isValid) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  try {
    const auth = await authenticateAdmin(req, config);
    if (!auth.ok) {
      res.status(auth.status).json({ error: auth.code });
      return;
    }

    const parsed = parseListFilters(req, { withPagination: false });
    if (!parsed.ok) {
      res.status(parsed.status).json({ error: parsed.code });
      return;
    }

    const summary = await fetchSummary(config, parsed.filters);
    res.status(200).json(summary);
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    const message = error instanceof Error ? error.message : 'unexpected_error';
    res.status(status).json({ error: 'admin_summary_failed', message });
  }
};

async function fetchSummary(config, filters) {
  const endpoint = buildSupabaseEndpoint(config);
  const { chunkSize, maxRows } = getSummaryLimits();

  const rows = [];
  let offset = 0;
  let truncated = false;

  while (offset < maxRows) {
    const params = new URLSearchParams();
    params.set('select', SUMMARY_SELECT_FIELDS);
    params.set('order', 'created_at.desc');
    params.set('limit', String(chunkSize));
    params.set('offset', String(offset));

    applyReportFilters(params, filters);

    const response = await fetchWithTimeout(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: buildSupabaseHeaders(config)
    }, config.timeoutMs);

    if (!response.ok) {
      const details = await safeReadResponseText(response);
      throw buildRequestError(response.status, `supabase_summary_read_failed: ${details}`);
    }

    const chunk = await response.json();
    if (!Array.isArray(chunk)) {
      throw buildRequestError(500, 'invalid_summary_response_shape');
    }

    rows.push(...chunk);

    if (chunk.length < chunkSize) {
      break;
    }

    offset += chunkSize;
  }

  if (rows.length >= maxRows) {
    truncated = true;
  }

  const totalReports = rows.length;
  const newReports = rows.filter(row => String(row && row.status || '') === 'Yeni').length;
  const reviewedReports = rows.filter(row => String(row && row.status || '') !== 'Yeni').length;

  const topDistrict = getMostFrequent(rows, row => String(row && (row.district || row.region) || '').trim());
  const topCategory = getMostFrequent(rows, row => String(row && row.category || '').trim());

  return {
    totalReports,
    newReports,
    reviewedReports,
    topDistrict,
    topCategory,
    truncated
  };
}

function getMostFrequent(items, getValue) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  const counts = new Map();

  items.forEach(item => {
    const value = String(getValue(item) || '').trim();
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  let maxCount = 0;
  let maxValue = '';

  counts.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      maxValue = value;
    }
  });

  return maxValue;
}
