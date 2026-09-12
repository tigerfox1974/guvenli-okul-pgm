import { AdminApiError, fetchAdminPanel, fetchAdminReports } from './admin-api.js';
import {
  fitToIsland,
  getMapLayerVisibility,
  isHeatmapAvailable,
  setMapLayerVisibility,
  updateMapVisualization,
  zoomToDistrict,
  zoomToSchool
} from './map.js';
import {
  compareDistrictOrder,
  formatDate,
  getCategoryOptions,
  getDistrictLabel,
  getDistrictOptions,
  getStatusOptions,
  normalizeDistrictName
} from './utils.js';
import { schools as MASTER_SCHOOLS } from '../data/schools.js';

const VIEW_IDS = ['home', 'report', 'admin'];
const FILTER_IDS = {
  district: 'adminDistrictFilter',
  school: 'adminSchoolFilter',
  category: 'adminCategoryFilter',
  status: 'adminStatusFilter',
  date: 'adminDateFilter'
};

const MAP_CONTROL_IDS = {
  markerSidebar: 'markerToggle',
  countSidebar: 'countToggle',
  heatSidebar: 'heatToggle',
  markerToolbar: 'mapMarkerToggle',
  countToolbar: 'mapCountToggle',
  heatToolbar: 'mapHeatToggle',
  modeText: 'mapMode'
};
const ADMIN_PAGE_SIZE = 100;
const REPORTS_UPDATED_DEBOUNCE_MS = 150;
// Sayaç/pasiflik kesinliğini bozan daraltıcı filtreler (server-side uygulanır).
const NARROWING_FILTER_KEYS = Object.freeze(['district', 'school', 'category', 'status', 'date']);

const RISK_BUCKETS = Object.freeze([
  {
    key: 'traffic',
    label: 'Trafik',
    categories: ['Trafik güvenliği']
  },
  {
    key: 'violence',
    label: 'Kavga/Zorbalık',
    categories: ['Kavga / şiddet / zorbalık']
  },
  {
    key: 'suspicious',
    label: 'Şüpheli kişi/araç',
    categories: ['Şüpheli kişi / araç']
  },
  {
    key: 'service',
    label: 'Servis',
    categories: ['Okul servisi / taşımacılık']
  },
  {
    key: 'other',
    label: 'Diğer',
    categories: null
  }
]);

const CATEGORY_TO_BUCKET = createCategoryToBucketMap();
const STATUS_ORDER = Object.freeze([
  'Yeni',
  'İnceleniyor',
  'Aktarıldı',
  'Sonuçlandı',
  'Arşivlendi',
  'Asılsız'
]);
const STATUS_META = Object.freeze({
  Yeni: { className: 'is-new', shortLabel: 'Yeni', tooltipLabel: 'yeni' },
  'İnceleniyor': { className: 'is-review', shortLabel: 'İnceleniyor', tooltipLabel: 'inceleniyor' },
  Aktarıldı: { className: 'is-forwarded', shortLabel: 'Aktarıldı', tooltipLabel: 'aktarıldı' },
  Sonuçlandı: { className: 'is-closed', shortLabel: 'Sonuçlandı', tooltipLabel: 'sonuçlandı' },
  Arşivlendi: { className: 'is-archived', shortLabel: 'Arşivlendi', tooltipLabel: 'arşivlendi' },
  Asılsız: { className: 'is-invalid', shortLabel: 'Asılsız', tooltipLabel: 'asılsız' }
});

let currentFilteredReports = [];
let activeRiskBucket = 'all';
let renderRequestId = 0;
let detailRequestId = 0;
let reportsUpdatedTimer = null;

export function initUI() {
  initNavigation();
  initAdminFilterEvents();
  initRiskControlEvents();
  initMapControlEvents();

  document.addEventListener('reports:updated', scheduleAdminPanelRender);
}

function scheduleAdminPanelRender() {
  if (!isAdminViewActive()) {
    return;
  }

  clearTimeout(reportsUpdatedTimer);
  reportsUpdatedTimer = setTimeout(() => {
    reportsUpdatedTimer = null;

    if (!isAdminViewActive()) {
      return;
    }

    void renderAdminPanel();
  }, REPORTS_UPDATED_DEBOUNCE_MS);
}

function isAdminViewActive() {
  return document.querySelector('main .view.active')?.id === 'admin';
}

export async function renderAdminPanel() {
  const requestId = ++renderRequestId;
  const filters = getFilterValues();

  setPanelLoadingState(true);

  try {
    const panelResponse = await fetchAdminPanel({
      filters,
      page: 1,
      pageSize: ADMIN_PAGE_SIZE
    });

    if (requestId !== renderRequestId) {
      return;
    }

    const reports = extractReportItems(panelResponse);
    const analytics = extractPanelAnalytics(panelResponse);

    paintAdminPanelData(reports, panelResponse, filters, analytics);
    updateSummaryCards(reports, normalizeSummaryData(panelResponse && panelResponse.summary, reports, analytics));
  } catch (error) {
    if (requestId !== renderRequestId) {
      return;
    }

    if (error instanceof AdminApiError && error.status === 404) {
      await loadAdminPanelFallback(requestId, filters);
      return;
    }

    handleAdminPanelLoadError(error);
    return;
  } finally {
    if (requestId === renderRequestId) {
      setPanelLoadingState(false);
    }
  }
}

function extractReportItems(response) {
  return Array.isArray(response && response.items) ? response.items : [];
}

// Analytics, tum filtrelenmis kayit kumesini temsil eden sunucu tarafi aggregate'tir.
// Yoksa (eski API/RPC surumu) panel kontrollu olarak sayfa verisine geri duser.
function extractPanelAnalytics(response) {
  const analytics = response && response.analytics;

  if (!analytics || typeof analytics !== 'object' || !Array.isArray(analytics.groups)) {
    return null;
  }

  return analytics;
}

function paintAdminPanelData(reports, reportsResponse, filters = getFilterValues(), analytics = null) {
  const hasLimitedResult = Boolean(reportsResponse && reportsResponse.hasNext);
  const totalCount = Number(reportsResponse && reportsResponse.totalCount);

  // Dashboard analizleri aggregate'ten uretilir; sayfa listesi yalnizca detay/drill-down icindir.
  const aggregateGroups = analytics ? filterGroupsByRiskBucket(analytics.groups) : null;
  const filteredReports = applyRiskBucketFilter(reports);

  populateFilterOptions(reports, {
    truncated: aggregateGroups ? false : hasLimitedResult,
    filters,
    counts: analytics ? buildFilterOptionCounts(analytics.groups) : null
  });

  const reportGroups = aggregateGroups
    ? attachLocalGroupItems(aggregateGroups, filteredReports)
    : groupReports(filteredReports);
  const filteredTotal = aggregateGroups ? sumGroupCounts(aggregateGroups) : filteredReports.length;

  currentFilteredReports = aggregateGroups
    ? buildMapCountEntries(aggregateGroups)
    : filteredReports;

  renderRegionalRiskPanel(
    aggregateGroups
      ? buildRegionalEntriesFromGroups(aggregateGroups)
      : buildRegionalEntriesFromReports(filteredReports),
    filteredTotal
  );
  renderReportTable(reportGroups);
  updateMapVisualization(currentFilteredReports);
  syncMapControlUI();
  updateFilterResult(Number.isFinite(totalCount) ? totalCount : filteredTotal, filteredTotal, {
    limited: aggregateGroups ? false : hasLimitedResult
  });
  syncRiskFocusUI();
}

function filterGroupsByRiskBucket(groups) {
  if (activeRiskBucket === 'all') {
    return groups;
  }

  return groups.filter(group => getRiskBucketKey(group.categoryKey || '') === activeRiskBucket);
}

function sumGroupCounts(groups) {
  return groups.reduce((total, group) => total + (Number(group.count) || 0), 0);
}

// Harita pinleri/heatmap icin okul bazli aggregate sayilar (sayfa listesinden bagimsiz).
function buildMapCountEntries(groups) {
  const counts = new Map();

  groups.forEach(group => {
    const schoolId = Number(group.schoolId);
    if (!Number.isFinite(schoolId) || schoolId <= 0) return;
    counts.set(schoolId, (counts.get(schoolId) || 0) + (Number(group.count) || 0));
  });

  return Array.from(counts.entries()).map(([schoolId, count]) => ({ schoolId, count }));
}

// Filtre secenek sayaclari da tum filtrelenmis kumeden uretilir (risk odagi burada uygulanmaz).
function buildFilterOptionCounts(groups) {
  const school = new Map();
  const category = new Map();
  const status = new Map();

  groups.forEach(group => {
    const count = Number(group.count) || 0;
    const schoolKey = String(group.schoolId || '');
    const categoryKey = String(group.categoryKey || '');

    if (schoolKey) addWeightedCount(school, schoolKey, count);
    if (categoryKey) addWeightedCount(category, categoryKey, count);

    Object.entries(group.statusCounts || {}).forEach(([statusKey, statusCount]) => {
      if (statusKey) addWeightedCount(status, statusKey, Number(statusCount) || 0);
    });
  });

  return { school, category, status };
}

// Sayfadaki detay kayitlari aggregate gruplarina baglanir; grup mevcut sayfada tam olarak
// karsilaniyorsa drill-down icin ek istek atilmaz.
function attachLocalGroupItems(groups, reports) {
  const itemsByKey = new Map();

  reports.forEach(report => {
    const key = `${report.schoolId}-${report.category || ''}`;
    if (!itemsByKey.has(key)) {
      itemsByKey.set(key, []);
    }

    itemsByKey.get(key).push(report);
  });

  return groups
    .map(group => {
      const district = normalizeDistrictName(group.district || '', 'Belirsiz');

      return {
        ...group,
        district,
        districtLabel: getDistrictLabel(district),
        schoolName: group.schoolName || 'Bilinmeyen okul',
        category: group.category || 'Belirsiz',
        items: itemsByKey.get(group.key) || []
      };
    })
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      const districtComparison = compareDistrictOrder(left.district, right.district);
      if (districtComparison !== 0) return districtComparison;
      return left.schoolName.localeCompare(right.schoolName, 'tr');
    });
}

function addWeightedCount(counts, key, value) {
  counts.set(key, (counts.get(key) || 0) + value);
}

async function loadAdminPanelFallback(requestId, filters) {
  try {
    const reportsResponse = await fetchAdminReports({
      filters,
      page: 1,
      pageSize: ADMIN_PAGE_SIZE
    });

    if (requestId !== renderRequestId) {
      return;
    }

    const reports = extractReportItems(reportsResponse);
    paintAdminPanelData(reports, reportsResponse, filters);

    updateSummaryCards(reports, normalizeSummaryData(null, reports));
  } catch (error) {
    if (requestId !== renderRequestId) {
      return;
    }

    handleAdminPanelLoadError(error);
  }
}

function initNavigation() {
  const navButtons = Array.from(document.querySelectorAll('header nav button[data-view]'));
  const viewTriggers = Array.from(document.querySelectorAll('[data-view]'));

  viewTriggers.forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      activateView(trigger.dataset.view, navButtons);
    });
  });

  // URL hash'i panel dışına çıkarsa (elle değiştirme, geri/ileri tuşu) oturumu kapat.
  window.addEventListener('hashchange', () => {
    const view = resolveViewFromHash();
    if (view && view !== 'admin') {
      dispatchPanelExit(view);
    }
  });

  const initialView = navButtons.find(button => button.classList.contains('active'))?.dataset.view
    || document.querySelector('.view.active')?.id
    || 'home';

  activateView(initialView, navButtons);
}

function activateView(viewId, navButtons) {
  if (!VIEW_IDS.includes(viewId)) return;

  // Aktif oturum yalnızca panel (admin) görünümünde geçerlidir; admin dışına
  // çıkış otomatik logout tetikler.
  if (viewId !== 'admin') {
    dispatchPanelExit(viewId);
    return;
  }

  VIEW_IDS.forEach(id => {
    const viewElement = document.getElementById(id);
    if (viewElement) {
      viewElement.classList.toggle('active', id === viewId);
    }
  });

  navButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.view === viewId);
  });

  void renderAdminPanel();
  requestAdminMapRefresh();
}

function dispatchPanelExit(viewId) {
  document.dispatchEvent(new CustomEvent('pgm:panel-exit', {
    detail: { view: viewId }
  }));
}

function resolveViewFromHash() {
  const token = String(window.location.hash || '').replace(/^#/, '').trim().toLowerCase();

  if (token === 'admin' || token === 'panel') return 'admin';
  if (token === 'report' || token === 'ihbar') return 'report';
  if (token === '' || token === 'home' || token === 'anasayfa') return 'home';
  return null;
}

function requestAdminMapRefresh() {
  window.requestAnimationFrame(() => {
    document.dispatchEvent(new CustomEvent('pgm:admin-view-visible'));
  });
}

function initAdminFilterEvents() {
  const filterElements = Object.entries(FILTER_IDS)
    .map(([key, id]) => ({ key, element: document.getElementById(id) }))
    .filter(item => Boolean(item.element));

  filterElements.forEach(item => {
    item.element.addEventListener('change', () => {
      if (item.key === 'category' || item.key === 'district' || item.key === 'school') {
        activeRiskBucket = 'all';
      }
      void renderAdminPanel();
    });
  });

  const clearButton = document.getElementById('clearFilters');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      filterElements.forEach(item => {
        item.element.value = 'all';
      });
      activeRiskBucket = 'all';
      void renderAdminPanel();
      fitToIsland();
    });
  }
}

function initRiskControlEvents() {
  const clearRiskButton = document.getElementById('clearRiskFocus');
  if (clearRiskButton) {
    clearRiskButton.addEventListener('click', () => {
      clearRiskFocus();
      void renderAdminPanel();
      fitToIsland();
    });
  }

  const riskContainers = ['regionalRiskMatrix', 'regionalRiskGrid', 'regionalRiskFullGrid']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  riskContainers.forEach(container => {
    container.addEventListener('click', event => {
      const button = event.target.closest('[data-risk-district]');
      if (!button) return;

      const district = button.dataset.riskDistrict || 'all';
      const bucket = button.dataset.riskBucket || 'all';
      applyRiskFocus(district, bucket);
    });
  });
}

function initMapControlEvents() {
  const markerButtons = [
    document.getElementById(MAP_CONTROL_IDS.markerSidebar),
    document.getElementById(MAP_CONTROL_IDS.markerToolbar)
  ].filter(Boolean);

  const countButtons = [
    document.getElementById(MAP_CONTROL_IDS.countSidebar),
    document.getElementById(MAP_CONTROL_IDS.countToolbar)
  ].filter(Boolean);

  const heatButtons = [
    document.getElementById(MAP_CONTROL_IDS.heatSidebar),
    document.getElementById(MAP_CONTROL_IDS.heatToolbar)
  ].filter(Boolean);

  markerButtons.forEach(button => {
    button.addEventListener('click', () => {
      toggleMapLayer('markers');
    });
  });

  countButtons.forEach(button => {
    button.addEventListener('click', () => {
      toggleMapLayer('counts');
    });
  });

  if (!isHeatmapAvailable()) {
    heatButtons.forEach(button => {
      markControlUnavailable(button, `${button.textContent} (Hazır değil)`);
      button.title = 'Isı haritası bu tarayıcıda desteklenmiyor.';
    });
  } else {
    heatButtons.forEach(button => {
      button.addEventListener('click', () => {
        toggleMapLayer('heat');
      });
    });
  }

  syncMapControlUI();
}

function getFilterValues() {
  const districtValue = document.getElementById(FILTER_IDS.district)?.value || 'all';

  return {
    district: districtValue === 'all' ? 'all' : normalizeDistrictName(districtValue, ''),
    school: document.getElementById(FILTER_IDS.school)?.value || 'all',
    category: document.getElementById(FILTER_IDS.category)?.value || 'all',
    status: document.getElementById(FILTER_IDS.status)?.value || 'all',
    date: document.getElementById(FILTER_IDS.date)?.value || 'all'
  };
}

function populateFilterOptions(reports, options = {}) {
  const { truncated = false, filters = {}, counts = null } = options;
  const districtSelect = document.getElementById(FILTER_IDS.district);
  const schoolSelect = document.getElementById(FILTER_IDS.school);
  const categorySelect = document.getElementById(FILTER_IDS.category);
  const statusSelect = document.getElementById(FILTER_IDS.status);

  populateDistrictFilter(districtSelect);

  const selectedDistrict = districtSelect?.value || 'all';
  const hasNarrowingFilter = NARROWING_FILTER_KEYS.some(key => {
    const value = String(filters[key] || 'all').trim();
    return value !== '' && value !== 'all';
  });

  // Sayaç/pasiflik kuralı: yalnızca (a) tüm kayıtlar sayılabiliyorsa (server aggregate varsa
  // sayfa sınırı bunu bozmaz) ve (b) daraltıcı filtre yoksa 0 sonuçlu seçenekler pasifleştirilir.
  // Aksi halde yanlış-negatif üretmemek için dokunulmaz.
  const allowDisable = !truncated && !hasNarrowingFilter;
  const showCounts = !truncated;

  // Aggregate sayaçları geldiyse tüm filtrelenmiş küme, gelmediyse mevcut sayfa kayıtları kullanılır.
  const schoolCounts = counts && counts.school instanceof Map
    ? counts.school
    : countBy(reports, report => String(report.schoolId || ''));
  const categoryCounts = counts && counts.category instanceof Map
    ? counts.category
    : countBy(reports, report => report.category || '');
  const statusCounts = counts && counts.status instanceof Map
    ? counts.status
    : countBy(reports, report => report.status || '');

  populateSchoolSelect(schoolSelect, selectedDistrict, schoolCounts, {
    showCounts,
    allowDisable
  });

  populateCanonicalSelect(categorySelect, getCategoryOptions(), categoryCounts, {
    defaultLabel: 'Tüm kategoriler',
    showCounts,
    allowDisable
  });

  populateCanonicalSelect(statusSelect, getStatusOptions(), statusCounts, {
    defaultLabel: 'Tüm durumlar',
    showCounts,
    allowDisable
  });
}

function populateDistrictFilter(selectElement) {
  if (!selectElement) return;

  const previousValue = normalizeDistrictName(selectElement.value || '', '');
  const districtOptions = getDistrictOptions();

  selectElement.innerHTML = `<option value="all">Tümü</option>${districtOptions
    .map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join('')}`;

  selectElement.value = districtOptions.some(option => option.value === previousValue)
    ? previousValue
    : 'all';
}

function countBy(items, getKey) {
  const counts = new Map();

  (Array.isArray(items) ? items : []).forEach(item => {
    const key = getKey(item);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return counts;
}

function buildSelectOption(value, label, count, { showCounts, isDisabled }) {
  const optionLabel = showCounts ? `${label} (${count})` : label;
  const disabledAttr = isDisabled ? ' disabled' : '';
  const classAttr = isDisabled ? ' class="is-empty"' : '';

  return `<option value="${escapeHtml(value)}"${classAttr}${disabledAttr}>${escapeHtml(optionLabel)}</option>`;
}

function populateCanonicalSelect(selectElement, canonicalValues, counts, options = {}) {
  if (!selectElement) return;

  const {
    defaultLabel = 'Tümü',
    showCounts = true,
    allowDisable = false
  } = options;
  const countMap = counts instanceof Map ? counts : new Map();
  const previousValue = String(selectElement.value || 'all');
  const values = Array.from(new Set((canonicalValues || []).filter(Boolean)));

  const optionsMarkup = values
    .map(value => {
      const count = Number(countMap.get(value)) || 0;
      return buildSelectOption(value, value, count, {
        showCounts,
        isDisabled: allowDisable && count === 0
      });
    })
    .join('');

  selectElement.innerHTML = `<option value="all">${escapeHtml(defaultLabel)}</option>${optionsMarkup}`;

  const previousCount = Number(countMap.get(previousValue)) || 0;
  const canRestorePrevious = values.includes(previousValue)
    && !(allowDisable && previousCount === 0);

  selectElement.value = canRestorePrevious ? previousValue : 'all';
}

function populateSchoolSelect(selectElement, selectedDistrict, counts, options = {}) {
  if (!selectElement) return;

  const { showCounts = true, allowDisable = false } = options;
  const countMap = counts instanceof Map ? counts : new Map();
  const previousValue = String(selectElement.value || 'all');
  const districtFilter = String(selectedDistrict || 'all') === 'all'
    ? 'all'
    : normalizeDistrictName(selectedDistrict, 'all');

  // Okul seçenekleri yüklenen rapora göre değil, master listeden üretilir; ilçe seçimiyle daraltılır.
  const schoolOptions = MASTER_SCHOOLS
    .filter(school => districtFilter === 'all'
      || normalizeDistrictName(school.district, 'all') === districtFilter)
    .map(school => ({
      id: String(school.id),
      name: school.name || 'Bilinmeyen okul'
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'tr'));

  const optionsMarkup = schoolOptions
    .map(school => {
      const count = Number(countMap.get(school.id)) || 0;
      return buildSelectOption(school.id, school.name, count, {
        showCounts,
        isDisabled: allowDisable && count === 0
      });
    })
    .join('');

  selectElement.innerHTML = `<option value="all">Tüm okullar</option>${optionsMarkup}`;

  const previousCount = Number(countMap.get(previousValue)) || 0;
  const canRestorePrevious = schoolOptions.some(school => school.id === previousValue)
    && !(allowDisable && previousCount === 0);

  selectElement.value = canRestorePrevious ? previousValue : 'all';
}

function applyRiskBucketFilter(reports) {
  if (activeRiskBucket === 'all') {
    return reports;
  }

  return reports.filter(report => getRiskBucketKey(report.category) === activeRiskBucket);
}

function normalizeSummaryData(summaryData, reports, analytics = null) {
  const safeData = summaryData && typeof summaryData === 'object' ? summaryData : {};
  const aggregateGroups = analytics && Array.isArray(analytics.groups) ? analytics.groups : null;

  // Ozet kartlari sirayla: RPC ozeti -> server aggregate -> (son care) sayfa kayitlari.
  const fallback = aggregateGroups
    ? summarizeAnalyticsGroups(aggregateGroups)
    : {
      totalReports: reports.length,
      newReports: reports.filter(report => report.status === 'Yeni').length,
      reviewedReports: reports.filter(report => report.status !== 'Yeni').length,
      topDistrict: getMostFrequent(
        reports,
        report => normalizeDistrictName(report.district || report.region || '', '')
      ),
      topCategory: getMostFrequent(reports, report => report.category || '')
    };

  return {
    totalReports: toSummaryCount(safeData.totalReports, fallback.totalReports),
    newReports: toSummaryCount(safeData.newReports, fallback.newReports),
    reviewedReports: toSummaryCount(safeData.reviewedReports, fallback.reviewedReports),
    topDistrict: String(safeData.topDistrict || fallback.topDistrict || ''),
    topCategory: String(safeData.topCategory || fallback.topCategory || '')
  };
}

function toSummaryCount(value, fallbackValue) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallbackValue;
}

function summarizeAnalyticsGroups(groups) {
  const districtCounts = new Map();
  const categoryCounts = new Map();

  let totalReports = 0;
  let newReports = 0;

  groups.forEach(group => {
    const count = Number(group.count) || 0;
    totalReports += count;

    Object.entries(group.statusCounts || {}).forEach(([status, value]) => {
      if (status === 'Yeni') {
        newReports += Number(value) || 0;
      }
    });

    addWeightedCount(districtCounts, normalizeDistrictName(group.district || '', ''), count);
    addWeightedCount(categoryCounts, String(group.categoryKey || ''), count);
  });

  return {
    totalReports,
    newReports,
    reviewedReports: Math.max(totalReports - newReports, 0),
    topDistrict: getTopWeightedValue(districtCounts),
    topCategory: getTopWeightedValue(categoryCounts)
  };
}

function getTopWeightedValue(counts) {
  let topValue = '';
  let topCount = 0;

  counts.forEach((count, value) => {
    if (!value || count <= topCount) return;
    topCount = count;
    topValue = value;
  });

  return topValue;
}

function updateSummaryCards(reports, summary) {
  const totalReports = Number(summary && summary.totalReports);
  const newReports = Number(summary && summary.newReports);
  const reviewedReports = Number(summary && summary.reviewedReports);
  const topDistrict = String(summary && summary.topDistrict || '');
  const topCategory = String(summary && summary.topCategory || '');

  const totalElement = document.getElementById('summaryTotalReports');
  const newElement = document.getElementById('summaryNewReports');
  const reviewElement = document.getElementById('summaryReviewReports');
  const topDistrictElement = document.getElementById('summaryTopDistrict');
  const topCategoryElement = document.getElementById('summaryTopCategory');

  if (totalElement) totalElement.textContent = String(Number.isFinite(totalReports) ? totalReports : reports.length);
  if (newElement) newElement.textContent = String(Number.isFinite(newReports) ? newReports : 0);
  if (reviewElement) reviewElement.textContent = String(Number.isFinite(reviewedReports) ? reviewedReports : 0);
  if (topDistrictElement) topDistrictElement.textContent = topDistrict ? getDistrictLabel(topDistrict) : '-';
  if (topCategoryElement) topCategoryElement.textContent = topCategory || '-';
}

function getMostFrequent(items, getValue) {
  if (!items || items.length === 0) return '';

  const counts = new Map();
  items.forEach(item => {
    const value = getValue(item);
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

// Gruplanmis tablo server aggregate gruplarindan cizilir (aggregate yoksa sayfa kayitlarindan).
function renderReportTable(groups) {
  const tbody = document.getElementById('adminReportRows');
  if (!tbody) return;

  const groupedReports = Array.isArray(groups) ? groups : [];

  if (groupedReports.length === 0) {
    tbody.innerHTML = '<tr><td class="empty-row" colspan="5">Filtrelere uygun bildirim bulunamadı.</td></tr>';
    renderDetailPanel([], null);
    return;
  }

  tbody.innerHTML = groupedReports
    .map(group => {
      const statusBadges = renderStatusBadges(group.statusCounts);
      return `
        <tr class="report-group-row" data-school-id="${group.schoolId}" data-group-key="${group.key}">
          <td>${escapeHtml(group.schoolName)}</td>
          <td>${escapeHtml(group.districtLabel)}</td>
          <td>${escapeHtml(group.category)}</td>
          <td>${group.count}</td>
          <td>${statusBadges}</td>
        </tr>
      `;
    })
    .join('');

  tbody.querySelectorAll('tr[data-group-key]').forEach(row => {
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', 'Detayları ve harita odağını aç');

    row.addEventListener('click', () => {
      const key = row.dataset.groupKey;
      const selectedGroup = groupedReports.find(group => group.key === key);
      if (!selectedGroup) return;

      setActiveGroupRow(row, tbody);
      zoomToSchool(selectedGroup.schoolId);
      void renderGroupDetail(selectedGroup);
    });

    row.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        row.click();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }

      event.preventDefault();
      const rows = Array.from(tbody.querySelectorAll('tr[data-group-key]'));
      const currentIndex = rows.indexOf(row);
      if (currentIndex < 0) return;

      const nextIndex = event.key === 'ArrowDown'
        ? Math.min(currentIndex + 1, rows.length - 1)
        : Math.max(currentIndex - 1, 0);

      rows[nextIndex]?.focus();
    });
  });

  const firstRow = tbody.querySelector('tr[data-group-key]');
  if (firstRow) {
    setActiveGroupRow(firstRow, tbody);
  }

  void renderGroupDetail(groupedReports[0]);
}

// Drill-down detay listesi sayfali `items` verisinden beslenir: grup mevcut sayfada tam olarak
// karsilaniyorsa ek istek atilmaz, aksi halde grubun kayitlari sayfali olarak cekilir.
async function renderGroupDetail(group) {
  if (!group) return;

  const requestId = ++detailRequestId;
  const localItems = Array.isArray(group.items) ? group.items : [];
  const groupCount = Number(group.count) || 0;

  if (localItems.length > 0 && localItems.length >= groupCount) {
    renderDetailPanel(localItems, group);
    return;
  }

  renderDetailPanel(localItems, group, { loading: true });

  try {
    const detailItems = await fetchGroupDetailItems(group);

    if (requestId !== detailRequestId) {
      return;
    }

    const itemsToRender = detailItems.length > 0 ? detailItems : localItems;
    const truncated = groupCount > 0 && itemsToRender.length < groupCount;

    renderDetailPanel(itemsToRender, group, { truncated });
  } catch {
    if (requestId !== detailRequestId) {
      return;
    }

    renderDetailPanel(localItems, group, {
      truncated: groupCount > 0 && localItems.length < groupCount
    });
  }
}

async function fetchGroupDetailItems(group) {
  const categoryKey = String(group.categoryKey || '');
  const schoolId = Number(group.schoolId) || 0;
  const expectedCount = Number(group.count) || 0;

  const filters = {
    ...getFilterValues(),
    school: schoolId > 0 ? String(schoolId) : 'all',
    category: categoryKey
  };

  const collected = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await fetchAdminReports({
      filters,
      page,
      pageSize: ADMIN_PAGE_SIZE
    });

    const items = extractReportItems(response);
    if (!Array.isArray(items) || items.length === 0) {
      break;
    }

    collected.push(...items.filter(item => (
      Number(item.schoolId) === schoolId && String(item.category || '') === categoryKey
    )));

    hasNext = Boolean(response && response.hasNext);

    if (expectedCount > 0 && collected.length >= expectedCount) {
      break;
    }

    page += 1;
  }

  return collected;
}

function renderRegionalRiskPanel(regionalEntries, totalRecords = 0) {
  const matrixBody = document.getElementById('regionalRiskMatrix');
  const riskGrid = document.getElementById('regionalRiskGrid');
  const fullGrid = document.getElementById('regionalRiskFullGrid');

  if (!matrixBody || !riskGrid) return;

  const districtRows = createRegionalRows(regionalEntries);
  updateRegionalRiskStats(totalRecords);

  if (districtRows.length === 0) {
    matrixBody.innerHTML = '<tr><td class="empty-row" colspan="7">Filtrelere uygun risk kaydı bulunamadı.</td></tr>';
    riskGrid.innerHTML = '<div class="empty-row">Risk dağılımı oluştuğunda odak kartları burada gösterilir.</div>';
    if (fullGrid) {
      fullGrid.innerHTML = '<div class="empty-row">Filtrelere uygun risk kaydı bulunamadı.</div>';
    }
    return;
  }

  matrixBody.innerHTML = districtRows
    .map(row => {
      const bucketCells = RISK_BUCKETS
        .map(bucket => {
          const count = row.bucketCounts[bucket.key] || 0;
          const intensity = row.total > 0 ? count / row.total : 0;
          return `<td>${renderRiskCountButton(row.district, bucket.key, count, intensity)}</td>`;
        })
        .join('');

      return `
        <tr data-risk-row="${escapeHtml(row.district)}">
          <td>${renderRiskDistrictButton(row.district, row.total)}</td>
          ${bucketCells}
          <td class="risk-total-cell">${row.total}</td>
        </tr>
      `;
    })
    .join('');

  const highlightItems = buildRiskHighlights(districtRows);
  riskGrid.innerHTML = highlightItems.length > 0
    ? highlightItems
      .map(item => renderRiskCard(item))
      .join('')
    : '<div class="empty-row">Risk dağılımı oluştuğunda odak kartları burada gösterilir.</div>';

  if (fullGrid) {
    fullGrid.innerHTML = districtRows
      .map(row => renderRiskDistrictCard(row))
      .join('');
  }
}

function groupReports(reports) {
  const groups = new Map();

  reports.forEach(report => {
    const key = `${report.schoolId}-${report.category}`;
    const district = normalizeDistrictName(report.district || report.region || '', 'Belirsiz');

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        schoolId: report.schoolId,
        schoolName: report.schoolName || 'Bilinmeyen okul',
        district,
        districtLabel: getDistrictLabel(district),
        category: report.category || 'Belirsiz',
        categoryKey: report.category || '',
        count: 0,
        statusCounts: {},
        items: []
      });
    }

    const target = groups.get(key);
    target.count += 1;
    target.items.push(report);

    const status = report.status || 'Belirsiz';
    target.statusCounts[status] = (target.statusCounts[status] || 0) + 1;
  });

  return Array.from(groups.values()).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    const districtComparison = compareDistrictOrder(left.district, right.district);
    if (districtComparison !== 0) return districtComparison;
    return left.schoolName.localeCompare(right.schoolName, 'tr');
  });
}

function renderStatusBadges(statusCounts) {
  const knownEntries = STATUS_ORDER
    .filter(status => Number(statusCounts[status]) > 0)
    .map(status => [status, Number(statusCounts[status])]);

  const unknownEntries = Object.entries(statusCounts)
    .filter(([status, count]) => Number(count) > 0 && !STATUS_ORDER.includes(status))
    .sort((left, right) => left[0].localeCompare(right[0], 'tr'));

  const entries = [...knownEntries, ...unknownEntries];
  if (entries.length === 0) {
    return '<span class="hint">Durum bilgisi yok</span>';
  }

  return `<div class="status-badges">${entries
    .map(([status, count]) => renderStatusBadge(status, count))
    .join('')}</div>`;
}

function renderStatusBadge(status, count) {
  const meta = STATUS_META[status] || {
    className: 'is-unknown',
    shortLabel: status,
    tooltipLabel: status
  };
  const tooltip = `${count} ${meta.tooltipLabel}`;

  return `<span class="status-pill ${meta.className}" title="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}">${count} ${escapeHtml(meta.shortLabel)}</span>`;
}

function setActiveGroupRow(activeRow, tbody) {
  tbody.querySelectorAll('tr[data-group-key]').forEach(row => {
    row.classList.toggle('is-active', row === activeRow);
    row.setAttribute('aria-pressed', row === activeRow ? 'true' : 'false');
  });
}

function renderDetailPanel(items, group, options = {}) {
  const { loading = false, truncated = false } = options;
  const intro = document.getElementById('detailIntro');
  const list = document.getElementById('detailList');
  const mapButton = document.getElementById('detailMapButton');

  if (!list || !intro || !mapButton) return;

  if (!group) {
    intro.textContent = 'Ana tablodan bir okul/kategori grubuna tıklayın; bağlı tekil bildirimler burada listelenir.';
    list.setAttribute('aria-busy', 'true');
    list.innerHTML = '<div class="empty-row">Henüz grup seçilmedi.</div>';
    list.setAttribute('aria-busy', 'false');
    mapButton.disabled = true;
    mapButton.setAttribute('aria-disabled', 'true');
    mapButton.onclick = null;
    return;
  }

  const detailItems = Array.isArray(items) ? items : [];

  intro.textContent = `${group.schoolName} - ${group.category} grubunda ${group.count} bildirim var.`;
  mapButton.disabled = false;
  mapButton.setAttribute('aria-disabled', 'false');
  mapButton.onclick = () => zoomToSchool(group.schoolId);

  list.setAttribute('aria-busy', loading ? 'true' : 'false');

  if (loading) {
    list.innerHTML = '<div class="empty-row">Detay kayıtları yükleniyor...</div>';
    return;
  }

  if (detailItems.length === 0) {
    list.innerHTML = '<div class="empty-row">Bu grup için listelenecek detay kaydı bulunamadı.</div>';
    return;
  }

  const truncationNotice = truncated
    ? `<div class="empty-row">Sunucudan yalnızca ${detailItems.length} kayıt alınabildi; grubun toplam ${group.count} kaydının tamamı listelenemedi.</div>`
    : '';

  list.innerHTML = truncationNotice + detailItems
    .map(item => {
      return `
        <article class="detail-item">
          <h3>${escapeHtml(item.title || 'Başlık yok')}</h3>
          <p>${escapeHtml(item.description || 'Açıklama girilmemiş.')}</p>
          <p class="hint detail-meta">Durum: ${escapeHtml(item.status || 'Belirsiz')} | Olay: ${escapeHtml(item.eventDate || '-')} | Kayıt: ${escapeHtml(formatDate(item.createdAt))}</p>
        </article>
      `;
    })
    .join('');
}

function updateFilterResult(totalCount, filteredCount, options = {}) {
  const { limited = false } = options;
  const resultElement = document.getElementById('filterResult');
  if (!resultElement) return;

  if (totalCount === 0) {
    resultElement.textContent = 'Henüz panelde gösterilecek bildirim yok.';
    announcePanelState('Panelde bildirilecek kayıt bulunmuyor.');
    return;
  }

  if (limited && activeRiskBucket === 'all') {
    resultElement.textContent = `Toplam ${totalCount} bildirimin ilk ${filteredCount} kaydı listeleniyor.`;
    announcePanelState(`${totalCount} bildirimin ilk ${filteredCount} kaydı listeleniyor.`);
    return;
  }

  if (filteredCount === totalCount) {
    resultElement.textContent = `Toplam ${totalCount} bildirim listeleniyor.${getRiskFocusLabel()}`;
    announcePanelState(`${filteredCount} bildirim listeleniyor.`);
    return;
  }

  resultElement.textContent = `Toplam ${totalCount} bildirimin ${filteredCount} adedi filtrelere uyuyor.${getRiskFocusLabel()}`;
  announcePanelState(`${filteredCount} bildirim filtrelere uyuyor.`);
}

function setPanelLoadingState(isLoading) {
  const resultElement = document.getElementById('filterResult');
  if (resultElement && isLoading) {
    resultElement.textContent = 'Panel verileri yükleniyor...';
  }

  const detailList = document.getElementById('detailList');
  if (detailList) {
    detailList.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }
}

function handleAdminPanelLoadError(error) {
  currentFilteredReports = [];
  updateSummaryCards([], {
    totalReports: 0,
    newReports: 0,
    reviewedReports: 0,
    topDistrict: '',
    topCategory: ''
  });
  renderRegionalRiskPanel([], 0);
  renderReportTable([]);
  updateMapVisualization([]);
  syncMapControlUI();
  syncRiskFocusUI();

  const message = getAdminLoadErrorMessage(error);
  const resultElement = document.getElementById('filterResult');
  if (resultElement) {
    resultElement.textContent = message;
  }
  announcePanelState(message);

  if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
    document.dispatchEvent(new CustomEvent('pgm:admin-auth-invalid', {
      detail: {
        code: error.code,
        status: error.status
      }
    }));
  }
}

function getAdminLoadErrorMessage(error) {
  if (error instanceof AdminApiError) {
    if (error.status === 401) {
      return 'Admin oturumu geçersiz. Lütfen yeniden giriş yapın.';
    }

    if (error.status === 403) {
      return 'Bu hesap panel erişim rolüne sahip değil.';
    }

    if (error.code === 'request_failed') {
      return 'Panel verileri alınamadı. Sunucu yanıtı başarısız oldu.';
    }

    return error.message || 'Panel verileri alınamadı.';
  }

  return 'Panel verileri yüklenemedi. Lütfen tekrar deneyin.';
}

function announcePanelState(message) {
  const announcer = document.getElementById('adminAnnouncer');
  if (!announcer) return;

  announcer.textContent = message;
}

function getRiskFocusLabel() {
  if (activeRiskBucket === 'all') return '';
  const bucket = RISK_BUCKETS.find(item => item.key === activeRiskBucket);
  if (!bucket) return '';
  return ` Risk odağı: ${bucket.label}.`;
}

function applyRiskFocus(district, bucket) {
  const districtSelect = document.getElementById(FILTER_IDS.district);
  const schoolSelect = document.getElementById(FILTER_IDS.school);
  const categorySelect = document.getElementById(FILTER_IDS.category);

  if (!districtSelect || !schoolSelect || !categorySelect) return;

  const normalizedDistrict = district === 'all' ? 'all' : normalizeDistrictName(district, district);
  districtSelect.value = normalizedDistrict;
  schoolSelect.value = 'all';
  categorySelect.value = 'all';
  activeRiskBucket = bucket || 'all';

  void renderAdminPanel();

  if (normalizedDistrict === 'all') {
    fitToIsland();
  } else {
    zoomToDistrict(normalizedDistrict);
  }
}

function clearRiskFocus() {
  const districtSelect = document.getElementById(FILTER_IDS.district);
  const schoolSelect = document.getElementById(FILTER_IDS.school);
  const categorySelect = document.getElementById(FILTER_IDS.category);

  if (districtSelect) districtSelect.value = 'all';
  if (schoolSelect) schoolSelect.value = 'all';
  if (categorySelect) categorySelect.value = 'all';
  activeRiskBucket = 'all';
}

function syncRiskFocusUI() {
  const districtFilter = document.getElementById(FILTER_IDS.district)?.value || 'all';
  const selectedDistrict = districtFilter === 'all'
    ? 'all'
    : normalizeDistrictName(districtFilter, 'all');
  const selectedBucket = activeRiskBucket || 'all';

  document.querySelectorAll('[data-risk-district][data-risk-bucket]').forEach(button => {
    const buttonDistrict = normalizeDistrictName(button.dataset.riskDistrict || 'all', 'all');
    const buttonBucket = button.dataset.riskBucket || 'all';

    const hasExplicitFocus = selectedDistrict !== 'all' || selectedBucket !== 'all';
    const districtMatches = selectedDistrict === 'all' || buttonDistrict === selectedDistrict;
    const bucketMatches = selectedBucket === 'all' || buttonBucket === selectedBucket;
    const isSelected = hasExplicitFocus && districtMatches && bucketMatches;

    button.classList.toggle('is-selected', isSelected);
    button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  document.querySelectorAll('tr[data-risk-row]').forEach(row => {
    const rowDistrict = normalizeDistrictName(row.dataset.riskRow || 'all', 'all');
    const rowMatches = selectedDistrict !== 'all' && rowDistrict === selectedDistrict;
    row.classList.toggle('is-row-selected', rowMatches);
  });
}

function createRegionalRows(entries) {
  const districtOptions = getDistrictOptions();
  const rowMap = new Map(
    districtOptions.map(option => [option.value, createRegionalRow(option.value)])
  );

  (Array.isArray(entries) ? entries : []).forEach(entry => {
    const district = entry.district || 'Belirsiz';
    if (!rowMap.has(district)) {
      rowMap.set(district, createRegionalRow(district));
    }

    const row = rowMap.get(district);
    row.total += entry.count;
    row.bucketCounts[entry.bucketKey] += entry.count;
  });

  return Array.from(rowMap.values())
    .filter(row => row.total > 0)
    .sort((left, right) => {
      if (right.total !== left.total) return right.total - left.total;
      return compareDistrictOrder(left.district, right.district);
    });
}

// Aggregate yoksa (fallback) bolgesel girisler sayfa kayitlarindan uretilir.
function buildRegionalEntriesFromReports(reports) {
  return reports.map(report => ({
    district: normalizeDistrictName(report.district || report.region || '', 'Belirsiz'),
    bucketKey: getRiskBucketKey(report.category),
    count: 1
  }));
}

// Aggregate varsa bolgesel girisler tum filtrelenmis kumeyi temsil eden gruplardan uretilir.
function buildRegionalEntriesFromGroups(groups) {
  return groups.map(group => ({
    district: normalizeDistrictName(group.district || '', 'Belirsiz'),
    bucketKey: getRiskBucketKey(group.categoryKey || ''),
    count: Number(group.count) || 0
  }));
}

function createRegionalRow(district) {
  return {
    district,
    total: 0,
    bucketCounts: {
      traffic: 0,
      violence: 0,
      suspicious: 0,
      service: 0,
      other: 0
    }
  };
}

function renderRiskDistrictButton(district, total) {
  const label = getDistrictLabel(district);
  return `<button type="button" class="risk-cell risk-cell-district" data-risk-district="${escapeHtml(district)}" data-risk-bucket="all" aria-label="${escapeHtml(label)} ilçesi, toplam ${total} bildirim"><span>${escapeHtml(label)}</span><span class="risk-total-cell">${total}</span></button>`;
}

function renderRiskCountButton(district, bucket, count, intensity = 0, options = {}) {
  const { includeLabel = false } = options;
  const bucketLabel = RISK_BUCKETS.find(item => item.key === bucket)?.label || 'Kategori';
  const districtLabel = getDistrictLabel(district);

  if (count === 0) {
    if (includeLabel) {
      return `<span class="risk-zero" aria-label="${escapeHtml(districtLabel)} ${escapeHtml(bucketLabel)}: 0 bildirim">${escapeHtml(bucketLabel)}: 0</span>`;
    }

    return `<span class="risk-zero" aria-label="${escapeHtml(districtLabel)} ${escapeHtml(bucketLabel)}: 0 bildirim">0</span>`;
  }

  const bucketTitle = includeLabel
    ? `<span class="hint">${escapeHtml(bucketLabel)}</span>`
    : '';
  return `<button type="button" class="risk-cell" data-risk-district="${escapeHtml(district)}" data-risk-bucket="${escapeHtml(bucket)}" aria-label="${escapeHtml(districtLabel)} ${escapeHtml(bucketLabel)}: ${count} bildirim">${bucketTitle}<span>${count}</span></button>`;
}

function renderRiskDistrictCard(row) {
  const districtLabel = getDistrictLabel(row.district);

  return `
    <article class="risk-card" aria-label="${escapeHtml(districtLabel)} ilçesi toplam ${row.total} bildirim">
      ${renderRiskDistrictButton(row.district, row.total)}
      ${RISK_BUCKETS
        .map(bucket => ({ bucket, count: row.bucketCounts[bucket.key] || 0 }))
        .filter(item => item.count > 0)
        .map(({ bucket, count }) => renderRiskCountButton(
          row.district,
          bucket.key,
          count,
          row.total > 0 ? count / row.total : 0,
          { includeLabel: true }
        ))
        .join('')}
    </article>
  `;
}

function renderRiskCard(item) {
  const districtLabel = getDistrictLabel(item.district);
  return `
    <button type="button" class="risk-card" data-risk-district="${escapeHtml(item.district)}" data-risk-bucket="${escapeHtml(item.bucket)}" aria-label="${escapeHtml(districtLabel)} ${escapeHtml(item.bucketLabel)}: ${item.count} bildirim">
      <span class="risk-card-head">
        <span>${escapeHtml(districtLabel)} · ${escapeHtml(item.bucketLabel)}</span>
        <strong>${item.count}</strong>
      </span>
    </button>
  `;
}

function updateRegionalRiskStats(totalRecords) {
  const totalElement = document.getElementById('regionalStatTotal');
  const districtElement = document.getElementById('regionalStatDistrict');
  const categoryElement = document.getElementById('regionalStatCategory');

  if (totalElement) {
    const total = Number(totalRecords);
    totalElement.textContent = String(Number.isFinite(total) && total >= 0 ? total : 0);
  }

  if (districtElement) {
    const districtFilter = document.getElementById(FILTER_IDS.district)?.value || 'all';
    districtElement.textContent = districtFilter === 'all'
      ? 'Tümü'
      : getDistrictLabel(normalizeDistrictName(districtFilter, districtFilter));
  }

  if (categoryElement) {
    const bucket = RISK_BUCKETS.find(item => item.key === activeRiskBucket);
    categoryElement.textContent = bucket ? bucket.label : 'Tümü';
  }
}

function buildRiskHighlights(rows) {
  const highlights = [];

  rows.forEach(row => {
    RISK_BUCKETS.forEach(bucket => {
      const count = row.bucketCounts[bucket.key] || 0;
      if (count <= 0) return;

      highlights.push({
        district: row.district,
        bucket: bucket.key,
        bucketLabel: bucket.label,
        count
      });
    });
  });

  return highlights
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      const districtCompare = compareDistrictOrder(left.district, right.district);
      if (districtCompare !== 0) return districtCompare;
      return left.bucketLabel.localeCompare(right.bucketLabel, 'tr');
    })
    .slice(0, 8);
}

function getRiskBucketKey(category) {
  return CATEGORY_TO_BUCKET.get(category) || 'other';
}

function createCategoryToBucketMap() {
  const map = new Map();

  RISK_BUCKETS.forEach(bucket => {
    if (!Array.isArray(bucket.categories)) return;
    bucket.categories.forEach(category => {
      map.set(category, bucket.key);
    });
  });

  return map;
}

function toggleMapLayer(layerKey) {
  const currentState = getMapLayerVisibility();
  const nextState = !currentState[layerKey];

  setMapLayerVisibility({ [layerKey]: nextState });
  updateMapVisualization(currentFilteredReports);
  syncMapControlUI();
}

function syncMapControlUI() {
  const state = getMapLayerVisibility();

  const markerSidebar = document.getElementById(MAP_CONTROL_IDS.markerSidebar);
  const countSidebar = document.getElementById(MAP_CONTROL_IDS.countSidebar);
  const heatSidebar = document.getElementById(MAP_CONTROL_IDS.heatSidebar);
  const markerToolbar = document.getElementById(MAP_CONTROL_IDS.markerToolbar);
  const countToolbar = document.getElementById(MAP_CONTROL_IDS.countToolbar);
  const heatToolbar = document.getElementById(MAP_CONTROL_IDS.heatToolbar);
  const modeText = document.getElementById(MAP_CONTROL_IDS.modeText);

  if (markerSidebar) markerSidebar.textContent = state.markers ? 'Okul Pinlerini Gizle' : 'Okul Pinlerini Göster';
  if (countSidebar) countSidebar.textContent = state.counts ? 'Olay Sayılarını Gizle' : 'Olay Sayılarını Göster';
  if (heatSidebar && !heatSidebar.disabled) heatSidebar.textContent = state.heat ? 'Isı Haritasını Kapat' : 'Isı Haritasını Aç';

  if (markerToolbar) markerToolbar.classList.toggle('active', state.markers);
  if (countToolbar) countToolbar.classList.toggle('active', state.counts);
  if (heatToolbar && !heatToolbar.disabled) heatToolbar.classList.toggle('active', state.heat);

  if (markerSidebar) markerSidebar.setAttribute('aria-pressed', state.markers ? 'true' : 'false');
  if (countSidebar) countSidebar.setAttribute('aria-pressed', state.counts ? 'true' : 'false');
  if (heatSidebar) heatSidebar.setAttribute('aria-pressed', state.heat ? 'true' : 'false');
  if (markerToolbar) markerToolbar.setAttribute('aria-pressed', state.markers ? 'true' : 'false');
  if (countToolbar) countToolbar.setAttribute('aria-pressed', state.counts ? 'true' : 'false');
  if (heatToolbar) heatToolbar.setAttribute('aria-pressed', state.heat ? 'true' : 'false');

  if (modeText) {
    modeText.textContent = createMapModeText(state);
  }
}

function createMapModeText(state) {
  const parts = [];

  if (state.markers) parts.push('okul pinleri');
  if (state.counts) parts.push('olay sayıları');
  if (state.heat) parts.push('renkli ısı haritası');

  if (parts.length === 0) {
    return 'Harita katmanları kapalı';
  }

  return `${parts.join(' + ')} görünümü`;
}

function markControlUnavailable(control, label) {
  control.disabled = true;
  control.classList.add('is-unavailable');
  control.setAttribute('aria-disabled', 'true');
  control.setAttribute('aria-pressed', 'false');
  control.textContent = label;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}