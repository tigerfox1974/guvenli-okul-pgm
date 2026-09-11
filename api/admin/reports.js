const {
  applyReportFilters,
  authenticateAdmin,
  buildRequestError,
  buildSupabaseEndpoint,
  buildSupabaseHeaders,
  fetchWithTimeout,
  getAdminServerConfig,
  mapSupabaseRowToReport,
  parseContentRangeTotal,
  parseListFilters,
  safeReadResponseText,
  setCommonHeaders
} = require('../_shared/admin-common');

const REPORT_SELECT_FIELDS = [
  'id',
  'district',
  'region',
  'school_id',
  'school_name',
  'category',
  'title',
  'description',
  'event_date',
  'attachments',
  'contact_name',
  'contact_phone',
  'contact_email',
  'status',
  'source',
  'client_snapshot',
  'created_at',
  'updated_at'
].join(',');

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

    const parsed = parseListFilters(req, { withPagination: true });
    if (!parsed.ok) {
      res.status(parsed.status).json({ error: parsed.code });
      return;
    }

    const result = await fetchReports(config, parsed.filters);
    res.status(200).json(result);
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    const message = error instanceof Error ? error.message : 'unexpected_error';
    res.status(status).json({ error: 'admin_reports_failed', message });
  }
};

async function fetchReports(config, filters) {
  const offset = (filters.page - 1) * filters.pageSize;
  const params = new URLSearchParams();

  params.set('select', REPORT_SELECT_FIELDS);
  params.set('order', 'created_at.desc');
  params.set('limit', String(filters.pageSize));
  params.set('offset', String(offset));

  applyReportFilters(params, filters);

  const endpoint = buildSupabaseEndpoint(config);
  const response = await fetchWithTimeout(`${endpoint}?${params.toString()}`, {
    method: 'GET',
    headers: buildSupabaseHeaders(config, {
      Prefer: 'count=exact'
    })
  }, config.timeoutMs);

  if (!response.ok) {
    const details = await safeReadResponseText(response);
    throw buildRequestError(response.status, `supabase_reports_read_failed: ${details}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw buildRequestError(500, 'invalid_reports_response_shape');
  }

  const totalCount = parseContentRangeTotal(response.headers.get('content-range'));
  const items = rows.map(mapSupabaseRowToReport).filter(Boolean);
  const effectiveTotal = Number.isFinite(totalCount) ? totalCount : items.length;

  return {
    items,
    totalCount: effectiveTotal,
    page: filters.page,
    pageSize: filters.pageSize,
    hasNext: (offset + items.length) < effectiveTotal
  };
}
