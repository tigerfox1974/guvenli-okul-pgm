import { showEmergencyGateOnReportEntry } from './form.js';
import { AdminApiError, fetchAdminReports, fetchAdminSummary } from './admin-api.js';
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
  getDistrictLabel,
  getDistrictOptions,
  normalizeDistrictName
} from './utils.js';

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

export function initUI() {
  initNavigation();
  initAdminFilterEvents();
  initRiskControlEvents();
  initMapControlEvents();

  document.addEventListener('reports:updated', () => {
    void renderAdminPanel();
  });

  void renderAdminPanel();
}

export async function renderAdminPanel() {
  const requestId = ++renderRequestId;
  const filters = getFilterValues();

  setPanelLoadingState(true);

  try {
    const [reportsResponse, summaryResponse] = await Promise.all([
      fetchAdminReports({
        filters,
        page: 1,
        pageSize: ADMIN_PAGE_SIZE
      }),
      fetchAdminSummary({ filters })
    ]);

    if (requestId !== renderRequestId) {
      return;
    }

    const reports = Array.isArray(reportsResponse && reportsResponse.items)
      ? reportsResponse.items
      : [];

    populateFilterOptions(reports);

    const filteredReports = applyRiskBucketFilter(reports);
    const summary = normalizeSummaryData(summaryResponse, reports);
    const hasLimitedResult = Boolean(reportsResponse && reportsResponse.hasNext) || Boolean(summary.truncated);

    currentFilteredReports = filteredReports;

    updateSummaryCards(filteredReports, summary);
    renderRegionalRiskPanel(filteredReports);
    renderReportTable(filteredReports);
    updateMapVisualization(filteredReports);
    syncMapControlUI();
    updateFilterResult(summary.totalReports, filteredReports.length, { limited: hasLimitedResult });
    syncRiskFocusUI();
  } catch (error) {
    if (requestId !== renderRequestId) {
      return;
    }

    handleAdminPanelLoadError(error);
  } finally {
    if (requestId === renderRequestId) {
      setPanelLoadingState(false);
    }
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

  const initialView = navButtons.find(button => button.classList.contains('active'))?.dataset.view
    || document.querySelector('.view.active')?.id
    || 'home';

  activateView(initialView, navButtons);
}

function activateView(viewId, navButtons) {
  if (!VIEW_IDS.includes(viewId)) return;

  VIEW_IDS.forEach(id => {
    const viewElement = document.getElementById(id);
    if (viewElement) {
      viewElement.classList.toggle('active', id === viewId);
    }
  });

  navButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.view === viewId);
  });

  if (viewId === 'report') {
    showEmergencyGateOnReportEntry();
    return;
  }

  if (viewId === 'admin') {
    void renderAdminPanel();
    requestAdminMapRefresh();
  }
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

  const riskContainers = ['regionalRiskMatrix', 'regionalRiskGrid']
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

function populateFilterOptions(reports) {
  const districtSelect = document.getElementById(FILTER_IDS.district);
  const schoolSelect = document.getElementById(FILTER_IDS.school);
  const categorySelect = document.getElementById(FILTER_IDS.category);
  const statusSelect = document.getElementById(FILTER_IDS.status);

  populateDistrictFilter(districtSelect);

  const selectedDistrict = districtSelect?.value || 'all';

  const schoolsForFilter = selectedDistrict === 'all'
    ? reports
    : reports.filter(report => report.district === selectedDistrict);
  populateSchoolSelect(schoolSelect, schoolsForFilter);

  populateSimpleSelect(
    categorySelect,
    reports.map(report => report.category).filter(Boolean),
    'Tüm kategoriler'
  );

  populateSimpleSelect(
    statusSelect,
    reports.map(report => report.status).filter(Boolean),
    'Tüm durumlar'
  );
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

function populateSimpleSelect(selectElement, values, defaultLabel) {
  if (!selectElement) return;

  const previousValue = selectElement.value || 'all';
  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'tr'));

  selectElement.innerHTML = `<option value="all">${defaultLabel}</option>${uniqueValues
    .map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join('')}`;

  selectElement.value = uniqueValues.includes(previousValue) ? previousValue : 'all';
}

function populateSchoolSelect(selectElement, reports) {
  if (!selectElement) return;

  const previousValue = selectElement.value || 'all';
  const schoolMap = new Map();

  reports.forEach(report => {
    if (!report.schoolId || !report.schoolName) return;
    schoolMap.set(String(report.schoolId), report.schoolName);
  });

  const schoolOptions = Array.from(schoolMap.entries())
    .sort((left, right) => left[1].localeCompare(right[1], 'tr'))
    .map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`)
    .join('');

  selectElement.innerHTML = `<option value="all">Tüm okullar</option>${schoolOptions}`;
  selectElement.value = schoolMap.has(previousValue) ? previousValue : 'all';
}

function applyRiskBucketFilter(reports) {
  if (activeRiskBucket === 'all') {
    return reports;
  }

  return reports.filter(report => getRiskBucketKey(report.category) === activeRiskBucket);
}

function normalizeSummaryData(summaryData, reports) {
  const safeData = summaryData && typeof summaryData === 'object' ? summaryData : {};

  const fallbackTopDistrict = getMostFrequent(
    reports,
    report => normalizeDistrictName(report.district || report.region || '', '')
  );
  const fallbackTopCategory = getMostFrequent(reports, report => report.category || '');

  const totalReports = Number(safeData.totalReports);
  const newReports = Number(safeData.newReports);
  const reviewedReports = Number(safeData.reviewedReports);

  return {
    totalReports: Number.isFinite(totalReports) ? totalReports : reports.length,
    newReports: Number.isFinite(newReports)
      ? newReports
      : reports.filter(report => report.status === 'Yeni').length,
    reviewedReports: Number.isFinite(reviewedReports)
      ? reviewedReports
      : reports.filter(report => report.status !== 'Yeni').length,
    topDistrict: String(safeData.topDistrict || fallbackTopDistrict || ''),
    topCategory: String(safeData.topCategory || fallbackTopCategory || ''),
    truncated: Boolean(safeData.truncated)
  };
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

function renderReportTable(reports) {
  const tbody = document.getElementById('adminReportRows');
  if (!tbody) return;

  if (reports.length === 0) {
    tbody.innerHTML = '<tr><td class="empty-row" colspan="5">Filtrelere uygun bildirim bulunamadı.</td></tr>';
    renderDetailPanel([]);
    return;
  }

  const groupedReports = groupReports(reports);

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
      renderDetailPanel(selectedGroup.items, selectedGroup);
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

  renderDetailPanel(groupedReports[0].items, groupedReports[0]);
}

function renderRegionalRiskPanel(reports) {
  const matrixBody = document.getElementById('regionalRiskMatrix');
  const riskGrid = document.getElementById('regionalRiskGrid');

  if (!matrixBody || !riskGrid) return;

  const districtRows = createRegionalRows(reports);
  if (districtRows.length === 0) {
    matrixBody.innerHTML = '<tr><td class="empty-row" colspan="7">Filtrelere uygun risk kaydı bulunamadı.</td></tr>';
    riskGrid.innerHTML = '<div class="empty-row">Risk dağılımı oluştuğunda odak kartları burada gösterilir.</div>';
    return;
  }

  matrixBody.innerHTML = districtRows
    .map(row => {
      const bucketCells = RISK_BUCKETS
        .map(bucket => {
          const count = row.bucketCounts[bucket.key] || 0;
          return `<td>${renderRiskCountButton(row.district, bucket.key, count)}</td>`;
        })
        .join('');

      return `
        <tr>
          <td>${renderRiskDistrictButton(row.district, row.total)}</td>
          ${bucketCells}
          <td>${row.total}</td>
        </tr>
      `;
    })
    .join('');

  const highlightItems = buildRiskHighlights(districtRows);
  riskGrid.innerHTML = highlightItems.length > 0
    ? highlightItems
      .map(item => {
        return `
          <button type="button" class="secondary risk-focus-button" data-risk-district="${escapeHtml(item.district)}" data-risk-bucket="${escapeHtml(item.bucket)}">
            ${escapeHtml(getDistrictLabel(item.district))} - ${escapeHtml(item.bucketLabel)} (${item.count})
          </button>
        `;
      })
      .join('')
    : '<div class="empty-row">Risk dağılımı oluştuğunda odak kartları burada gösterilir.</div>';
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

function renderDetailPanel(items, group) {
  const intro = document.getElementById('detailIntro');
  const list = document.getElementById('detailList');
  const mapButton = document.getElementById('detailMapButton');

  if (!list || !intro || !mapButton) return;

  if (!items || items.length === 0 || !group) {
    intro.textContent = 'Ana tablodan bir okul/kategori grubuna tıklayın; bağlı tekil bildirimler burada listelenir.';
    list.setAttribute('aria-busy', 'true');
    list.innerHTML = '<div class="empty-row">Henüz grup seçilmedi.</div>';
    list.setAttribute('aria-busy', 'false');
    mapButton.disabled = true;
    mapButton.setAttribute('aria-disabled', 'true');
    mapButton.onclick = null;
    return;
  }

  intro.textContent = `${group.schoolName} - ${group.category} grubunda ${group.count} bildirim var.`;
  mapButton.disabled = false;
  mapButton.setAttribute('aria-disabled', 'false');
  mapButton.onclick = () => zoomToSchool(group.schoolId);

  list.setAttribute('aria-busy', 'true');
  list.innerHTML = items
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
  list.setAttribute('aria-busy', 'false');
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
  renderRegionalRiskPanel([]);
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
}

function createRegionalRows(reports) {
  const districtOptions = getDistrictOptions();
  const rowMap = new Map(
    districtOptions.map(option => [option.value, createRegionalRow(option.value)])
  );

  reports.forEach(report => {
    const district = normalizeDistrictName(report.district || report.region || '', 'Belirsiz');
    if (!rowMap.has(district)) {
      rowMap.set(district, createRegionalRow(district));
    }

    const row = rowMap.get(district);
    row.total += 1;
    row.bucketCounts[getRiskBucketKey(report.category)] += 1;
  });

  return Array.from(rowMap.values())
    .filter(row => row.total > 0)
    .sort((left, right) => {
      if (right.total !== left.total) return right.total - left.total;
      return compareDistrictOrder(left.district, right.district);
    });
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
  return `<button type="button" class="secondary risk-chip" data-risk-district="${escapeHtml(district)}" data-risk-bucket="all">${escapeHtml(label)} (${total})</button>`;
}

function renderRiskCountButton(district, bucket, count) {
  if (count === 0) {
    return '<span class="hint risk-zero">0</span>';
  }

  const bucketLabel = RISK_BUCKETS.find(item => item.key === bucket)?.label || 'Kategori';
  return `<button type="button" class="secondary risk-chip" data-risk-district="${escapeHtml(district)}" data-risk-bucket="${escapeHtml(bucket)}">${escapeHtml(bucketLabel)}: ${count}</button>`;
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