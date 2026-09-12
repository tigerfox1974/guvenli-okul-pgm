// @ts-check
const { test, expect } = require('@playwright/test');

const ADMIN_SESSION_KEY = 'pgm-admin-auth-session-v2';

const EMPTY_PANEL_PAYLOAD = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 100,
  hasNext: false,
  summary: null,
  analytics: null,
};

function buildAdminSession() {
  return {
    userId: 'smoke-operator',
    username: 'operator',
    role: 'operator',
    roleLabel: 'PGM Operatör',
    accessToken: 'smoke-access-token',
    refreshToken: '',
    allowedRoles: ['operator'],
    expiresAtMs: Date.now() + 60 * 60 * 1000,
    issuedAt: new Date().toISOString(),
  };
}

/**
 * Salt-okunur garantisi: yazma yapabilen tüm uçlar stub'lanır, böylece testler
 * ne Supabase'e ne de deploy edilmiş serverless fonksiyonlara dokunur.
 */
async function stubReadOnlyNetwork(page) {
  await page.route('**/api/report', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok', acknowledged: true }),
  }));

  await page.route('**/api/admin/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(EMPTY_PANEL_PAYLOAD),
  }));

  await page.route('**/rest/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));

  await page.route('**/auth/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      access_token: 'smoke-access-token',
      refresh_token: 'smoke-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
    }),
  }));
}

function guardDialogs(page) {
  page.on('dialog', dialog => {
    void dialog.dismiss().catch(() => {});
  });
}

async function seedAdminSessionViaInitScript(page) {
  await page.addInitScript(([key, serialized]) => {
    try {
      window.sessionStorage.setItem(key, serialized);
    } catch (error) {
      // İlk about:blank dokümanında storage erişimi olmayabilir; yok say.
    }
  }, [ADMIN_SESSION_KEY, JSON.stringify(buildAdminSession())]);
}

async function acceptUsageTerms(page) {
  await expect(page.locator('#reportUsageTermsModal')).toBeVisible();

  await page.evaluate(() => {
    const scroller = document.querySelector('#reportUsageTermsModal .usage-terms-content');
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
    scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
  });

  await expect(page.locator('#usageTermsAcceptCheckbox')).toBeEnabled();
  await page.locator('#usageTermsAcceptCheckbox').check();
  await expect(page.locator('#usageTermsAcceptButton')).toBeEnabled();
  await page.locator('#usageTermsAcceptButton').click();
  await expect(page.locator('#reportUsageTermsModal')).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  guardDialogs(page);
});

test('index.html renders the public shell without page errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');

  await expect(page).toHaveTitle(/Güvenli Okul/);
  await expect(page.locator('header nav button[data-view="home"]')).toHaveText('Tanıtım');
  await expect(page.locator('header nav button[data-view="report"]')).toHaveText('Online Güvenli İhbar');
  await expect(page.locator('header nav button[data-view="admin"]')).toHaveText('Giriş');
  await expect(page.locator('#home')).toHaveClass(/active/);
  await expect(page.locator('form#reportForm')).toBeAttached();

  expect(pageErrors).toEqual([]);
});

test('report entry shows the emergency gate modal', async ({ page }) => {
  await page.goto('/');
  await page.locator('header nav button[data-view="report"]').click();

  await expect(page.locator('#emergencyGate')).toBeVisible();
  await expect(page.locator('#countdown')).toBeVisible();
  await expect(page.locator('#continueReport')).toBeDisabled();
  await expect(page.locator('#cancelReport')).toBeEnabled();
});

test('report step flow unlocks progressively and reaches the submit notice modal', async ({ page }) => {
  await page.clock.install();
  await stubReadOnlyNetwork(page);
  await page.goto('/');

  await page.locator('header nav button[data-view="report"]').click();

  // Acil durum kapısı: 5 saniyelik zorunlu geri sayım.
  await expect(page.locator('#emergencyGate')).toBeVisible();
  await page.clock.fastForward(6000);
  await expect(page.locator('#continueReport')).toBeEnabled();
  await page.locator('#continueReport').click();

  // Kullanım esasları kapısı.
  await acceptUsageTerms(page);

  const district = page.locator('#districtSelect');
  const school = page.locator('#schoolSelect');
  const category = page.locator('#categorySelect');
  const title = page.locator('#titleInput');
  const description = page.locator('#descriptionInput');
  const submit = page.locator('#submitButton');

  await expect(district).toBeEnabled();
  await expect(school).toBeDisabled();
  await expect(category).toBeDisabled();
  await expect(title).toBeDisabled();
  await expect(description).toBeDisabled();
  await expect(submit).toBeDisabled();

  await district.selectOption({ index: 1 });
  await expect(school).toBeEnabled();
  await expect(school.locator('option')).not.toHaveCount(1);
  await expect(category).toBeDisabled();

  await school.selectOption({ index: 1 });
  await expect(category).toBeEnabled();
  await expect(title).toBeDisabled();

  await category.selectOption({ index: 1 });
  await expect(title).toBeEnabled();
  await expect(description).toBeDisabled();

  await title.fill('Okul çıkışında tehlikeli araç yoğunluğu');
  await expect(description).toBeEnabled();
  await expect(submit).toBeDisabled();

  await description.fill('Okul çıkış saatlerinde servis aracı yoğunluğu giriş çıkışı zorlaştırıyor.');
  await expect(submit).toBeEnabled();

  // Minimum gönderim gecikmesi (4s) formun kilidi açıldığı andan sayılır; ilerlet.
  await page.clock.fastForward(5000);
  await submit.click();

  await expect(page.locator('#reportSubmitNoticeModal')).toBeVisible();
  await expect(page.locator('#submitContinueButton')).toBeDisabled();
});

test('admin login gate is shown to anonymous visitors', async ({ page }) => {
  await page.goto('/');
  await page.locator('header nav button[data-view="admin"]').click();

  await expect(page.locator('#admin')).toHaveClass(/active/);
  await expect(page.locator('#adminAuthForm')).toBeVisible();
  await expect(page.locator('#adminLoginButton')).toBeVisible();
  await expect(page.locator('#adminDashboard')).toBeHidden();
});

test('admin core filters render and react to selection', async ({ page }) => {
  await stubReadOnlyNetwork(page);
  await seedAdminSessionViaInitScript(page);

  await page.goto('/#panel');

  await expect(page.locator('#adminDashboard')).toBeVisible();

  const districtFilter = page.locator('#adminDistrictFilter');
  const statusFilter = page.locator('#adminStatusFilter');
  const categoryFilter = page.locator('#adminCategoryFilter');

  // 1 "Tümü" yer tutucusu + 6 kanonik ilçe, ve 1 + 6 durum.
  await expect(districtFilter.locator('option')).toHaveCount(7);
  await expect(statusFilter.locator('option')).toHaveCount(7);
  await expect(categoryFilter.locator('option')).not.toHaveCount(1);

  await districtFilter.selectOption({ index: 1 });
  await expect(districtFilter).toHaveValue('Lefkoşa');

  await page.locator('#clearFilters').click();
  await expect(districtFilter).toHaveValue('all');
  await expect(statusFilter).toHaveValue('all');
});

test('admin map layer toggles switch layer visibility', async ({ page }) => {
  await stubReadOnlyNetwork(page);
  await seedAdminSessionViaInitScript(page);

  await page.goto('/#panel');

  await expect(page.locator('#adminDashboard')).toBeVisible();

  const markerToggle = page.locator('#mapMarkerToggle');
  const countToggle = page.locator('#mapCountToggle');
  const heatToggle = page.locator('#mapHeatToggle');

  await expect(markerToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(countToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(heatToggle).toHaveAttribute('aria-pressed', 'false');

  await markerToggle.click();
  await expect(markerToggle).toHaveAttribute('aria-pressed', 'false');

  await heatToggle.click();
  await expect(heatToggle).toHaveAttribute('aria-pressed', 'true');
});


