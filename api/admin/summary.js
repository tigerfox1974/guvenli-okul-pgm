const {
  authenticateAdmin,
  fetchReportSummary,
  getAdminServerConfig,
  parseListFilters,
  setCommonHeaders
} = require('../_shared/admin-common');

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

    const summary = await fetchReportSummary(config, parsed.filters);
    res.status(200).json(summary);
  } catch (error) {
    const status = error && Number.isFinite(error.status) ? error.status : 500;
    const message = error instanceof Error ? error.message : 'unexpected_error';
    res.status(status).json({ error: 'admin_summary_failed', message });
  }
};
