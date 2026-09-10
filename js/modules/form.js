import { schools } from '../data/schools.js';
import { generateId, getDistrictOptions, normalizeDistrictName } from './utils.js';
import { persistReportToSupabase, syncPendingSupabaseReports } from './supabase.js?v=20260910-1';

let selectedFiles = [];
const PUBLIC_REPORTS_STORAGE_KEY = 'pgm-public-reports-demo-v1';
const LEGACY_REPORTS_STORAGE_KEY = 'reports';
const EMERGENCY_GATE_SECONDS = 5;
const SUBMIT_NOTICE_SECONDS = 5;
let emergencyGateTimerId = null;
let submitNoticeTimerId = null;
let pendingSubmitCompletion = null;
let onlineSyncInitialized = false;

export function initForm() {
  const form = document.getElementById('reportForm');
  if (!form) return;

  const districtSelect = document.getElementById('districtSelect');
  const schoolSelect = document.getElementById('schoolSelect');
  const categorySelect = document.getElementById('categorySelect');
  const eventDateInput = document.getElementById('eventDateInput');
  const titleInput = document.getElementById('titleInput');
  const descriptionInput = document.getElementById('descriptionInput');
  const fileInput = document.getElementById('fileInput');
  const submitButton = document.getElementById('submitButton');

  if (!districtSelect || !schoolSelect || !categorySelect || !eventDateInput || !titleInput || !descriptionInput || !submitButton) {
    return;
  }

  populateDistrictSelect(districtSelect);

  initVisitorSnapshot();
  initLocationRequest();
  initSubmitNoticeModal();
  initFileUploadNoticeModal();
  initReportUsageTermsModal();
  initContactValidation();
  bootSupabaseSync();

  districtSelect.addEventListener('change', () => {
    updateSchoolList(districtSelect.value);
    categorySelect.value = '';
    eventDateInput.value = '';
    titleInput.value = '';
    descriptionInput.value = '';
    syncFormState();
  });

  schoolSelect.addEventListener('change', () => {
    categorySelect.value = '';
    eventDateInput.value = '';
    titleInput.value = '';
    descriptionInput.value = '';
    syncFormState();
  });

  categorySelect.addEventListener('change', () => {
    eventDateInput.value = '';
    titleInput.value = '';
    descriptionInput.value = '';
    syncFormState();
  });

  eventDateInput.addEventListener('input', syncFormState);
  titleInput.addEventListener('input', syncFormState);
  descriptionInput.addEventListener('input', syncFormState);

  if (fileInput) {
    blockFileUploadInteraction(fileInput);
  }

  submitButton.addEventListener('click', handleSubmit);

  form.addEventListener('submit', event => {
    event.preventDefault();
    handleSubmit();
  });

  form.addEventListener('reset', () => {
    selectedFiles = [];
    window.setTimeout(() => {
      updateSchoolList('');
      syncFormState();
      clearContactValidationErrors();
    }, 0);
  });

  updateSchoolList(districtSelect.value);
  syncFormState();
}

function populateDistrictSelect(districtSelect) {
  const options = getDistrictOptions();
  const previousDistrict = normalizeDistrictName(districtSelect.value || '', '');

  districtSelect.innerHTML = '<option value="">İlçe seçiniz</option>';

  options.forEach(option => {
    const item = document.createElement('option');
    item.value = option.value;
    item.textContent = option.label;
    districtSelect.appendChild(item);
  });

  if (previousDistrict && options.some(option => option.value === previousDistrict)) {
    districtSelect.value = previousDistrict;
  }
}

function updateSchoolList(district) {
  const schoolSelect = document.getElementById('schoolSelect');
  if (!schoolSelect) return;

  const normalizedDistrict = normalizeDistrictName(district, '');
  schoolSelect.innerHTML = '<option value="">Önce ilçe seçiniz</option>';

  if (!normalizedDistrict) {
    schoolSelect.disabled = true;
    updateSchoolCountLabel('', schools.length);
    return;
  }

  const filtered = schools
    .filter(school => school.district === normalizedDistrict)
    .sort((left, right) => left.name.localeCompare(right.name, 'tr'));

  schoolSelect.innerHTML = '<option value="">Okul seçiniz</option>';

  filtered.forEach(school => {
    const option = document.createElement('option');
    option.value = String(school.id);
    option.textContent = school.name;
    schoolSelect.appendChild(option);
  });

  schoolSelect.disabled = false;
  updateSchoolCountLabel(normalizedDistrict, filtered.length);
}

function updateSchoolCountLabel(district, count) {
  const schoolCountText = document.getElementById('schoolCountText');
  if (!schoolCountText) return;

  if (!district) {
    schoolCountText.textContent = `(Toplam ${schools.length} okul)`;
    return;
  }

  schoolCountText.textContent = `(${count} okul)`;
}

function handleSubmit() {
  const districtSelect = document.getElementById('districtSelect');
  const schoolSelect = document.getElementById('schoolSelect');
  const categorySelect = document.getElementById('categorySelect');
  const eventDateInput = document.getElementById('eventDateInput');
  const titleInput = document.getElementById('titleInput');
  const descriptionInput = document.getElementById('descriptionInput');
  const nameInput = document.getElementById('nameInput');
  const phoneInput = document.getElementById('phoneInput');
  const emailInput = document.getElementById('emailInput');
  const form = document.getElementById('reportForm');
  const fileInput = document.getElementById('fileInput');

  if (!districtSelect || !schoolSelect || !categorySelect || !eventDateInput || !titleInput || !descriptionInput || !form) {
    return;
  }

  const district = normalizeDistrictName(districtSelect.value.trim(), '');
  const schoolId = Number(schoolSelect.value);
  const category = categorySelect.value.trim();
  const eventDate = eventDateInput.value || '';
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!district || !schoolId || !category || !title || !description) {
    alert('Lütfen tüm zorunlu alanları doldurun.');
    return;
  }

  if (!validateContactFields()) {
    alert('Lütfen iletişim bilgilerini kontrol edin.');
    return;
  }

  const school = schools.find(item => item.id === schoolId);
  const attachments = selectedFiles.map(file => file.name);

  const report = {
    id: generateId(),
    district,
    region: district,
    schoolId,
    schoolName: school?.name || '',
    category,
    title,
    description,
    eventDate,
    attachments,
    files: attachments,
    contact: {
      name: nameInput?.value.trim() || '',
      phone: phoneInput?.value.trim() || '',
      email: emailInput?.value.trim() || ''
    },
    contactName: nameInput?.value.trim() || '',
    contactPhone: phoneInput?.value.trim() || '',
    contactEmail: emailInput?.value.trim() || '',
    status: 'Yeni',
    technicalMeta: collectVisitorSnapshot(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveReport(report);
  document.dispatchEvent(new CustomEvent('reports:updated', { detail: { report } }));
  void syncReportToCloud(report);

  showSubmitNoticeModal(() => {
    form.reset();
    selectedFiles = [];
    if (fileInput) {
      fileInput.value = '';
    }

    updateSchoolList('');
    syncFormState();
    navigateToHomeView();
  });
}

function saveReport(report) {
  const reports = getReports();
  reports.push(report);
  localStorage.setItem(PUBLIC_REPORTS_STORAGE_KEY, JSON.stringify(reports));
}

async function syncReportToCloud(report) {
  try {
    const pendingSyncResult = await syncPendingSupabaseReports();
    if (pendingSyncResult.status === 'queued') {
      console.warn('Supabase kuyruğu senkronlanamadı:', pendingSyncResult.reason);
    }

    const reportSyncResult = await persistReportToSupabase(report);
    if (reportSyncResult.status === 'queued') {
      console.warn('Bildirim Supabase kuyruğuna alındı:', reportSyncResult.reason);
    }
    if (reportSyncResult.status === 'skipped') {
      console.info('Supabase yapılandırması tamamlanmadı; bildirim local kayda yazıldı.');
    }
  } catch (error) {
    console.error('Supabase senkronizasyonunda beklenmeyen hata oluştu:', error);
  }
}

function bootSupabaseSync() {
  void syncPendingSupabaseReports();

  if (onlineSyncInitialized) {
    return;
  }

  window.addEventListener('online', () => {
    void syncPendingSupabaseReports();
  });

  onlineSyncInitialized = true;
}

export function getReports() {
  const publicRaw = localStorage.getItem(PUBLIC_REPORTS_STORAGE_KEY);
  const legacyRaw = localStorage.getItem(LEGACY_REPORTS_STORAGE_KEY);

  if (!publicRaw && legacyRaw) {
    localStorage.setItem(PUBLIC_REPORTS_STORAGE_KEY, legacyRaw);
  }

  const reports = JSON.parse(localStorage.getItem(PUBLIC_REPORTS_STORAGE_KEY) || '[]');
  if (!Array.isArray(reports)) return [];
  return reports
    .map(normalizeReport)
    .filter(Boolean);
}

function normalizeReport(report) {
  if (!report || typeof report !== 'object') return null;

  const district = normalizeDistrictName(report.district || report.region || '', '');
  const schoolId = Number(report.schoolId || report.school || 0);
  const school = schools.find(item => item.id === schoolId);
  const schoolName = report.schoolName || school?.name || '';

  const contactObject = typeof report.contact === 'object' && report.contact !== null ? report.contact : {};
  const contactName = report.contactName || contactObject.name || (typeof report.contact === 'string' ? report.contact : '');
  const contactPhone = report.contactPhone || contactObject.phone || '';
  const contactEmail = report.contactEmail || contactObject.email || '';

  const attachments = Array.isArray(report.attachments)
    ? report.attachments
    : Array.isArray(report.files)
      ? report.files
      : [];

  const technicalMeta = report.technicalMeta && typeof report.technicalMeta === 'object'
    ? report.technicalMeta
    : null;

  return {
    ...report,
    district,
    region: district,
    schoolId: Number.isFinite(schoolId) ? schoolId : 0,
    schoolName,
    category: report.category || '',
    title: report.title || '',
    description: report.description || '',
    eventDate: report.eventDate || '',
    attachments,
    files: attachments,
    contact: {
      name: contactName,
      phone: contactPhone,
      email: contactEmail
    },
    technicalMeta,
    contactName,
    contactPhone,
    contactEmail,
    status: report.status || 'Yeni',
    createdAt: report.createdAt || new Date().toISOString(),
    updatedAt: report.updatedAt || report.createdAt || new Date().toISOString()
  };
}

function syncFormState() {
  const districtSelect = document.getElementById('districtSelect');
  const schoolSelect = document.getElementById('schoolSelect');
  const categorySelect = document.getElementById('categorySelect');
  const eventDateInput = document.getElementById('eventDateInput');
  const titleInput = document.getElementById('titleInput');
  const descriptionInput = document.getElementById('descriptionInput');
  const submitButton = document.getElementById('submitButton');

  if (!districtSelect || !schoolSelect || !categorySelect || !eventDateInput || !titleInput || !descriptionInput || !submitButton) {
    return;
  }

  const hasDistrict = Boolean(districtSelect.value);
  schoolSelect.disabled = !hasDistrict;

  const hasSchool = hasDistrict && Boolean(schoolSelect.value);
  categorySelect.disabled = !hasSchool;

  const hasCategory = hasSchool && Boolean(categorySelect.value);
  eventDateInput.disabled = !hasCategory;

  titleInput.disabled = !hasCategory;

  const hasTitle = hasCategory && Boolean(titleInput.value.trim());
  descriptionInput.disabled = !hasTitle;

  const hasDescription = hasTitle && Boolean(descriptionInput.value.trim());
  setOptionalFieldsEnabled(hasDescription);

  submitButton.disabled = !hasDescription;
}

function setOptionalFieldsEnabled(enabled) {
  const optionalFields = document.querySelectorAll('[data-optional], [data-optional-file]');
  optionalFields.forEach(field => {
    field.disabled = !enabled;
  });

  if (!enabled) {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
    }
    selectedFiles = [];
  }
}

export function showEmergencyGateOnReportEntry() {
  const gate = document.getElementById('emergencyGate');
  const countdown = document.getElementById('countdown');
  const continueButton = document.getElementById('continueReport');
  const cancelButton = document.getElementById('cancelReport');

  if (!gate || !countdown || !continueButton || !cancelButton) return;

  setReportInteractionLock(true);
  setModalState(gate, true);

  let seconds = EMERGENCY_GATE_SECONDS;
  countdown.textContent = String(seconds);
  continueButton.disabled = true;
  continueButton.textContent = `${seconds} saniye sonra bildirim formuna geç`;

  if (emergencyGateTimerId) {
    window.clearInterval(emergencyGateTimerId);
  }

  emergencyGateTimerId = window.setInterval(() => {
    seconds -= 1;

    if (seconds <= 0) {
      if (emergencyGateTimerId) {
        window.clearInterval(emergencyGateTimerId);
        emergencyGateTimerId = null;
      }
      countdown.textContent = '0';
      continueButton.disabled = false;
      continueButton.textContent = 'Bildirim formuna geç';
      return;
    }

    countdown.textContent = String(seconds);
    continueButton.textContent = `${seconds} saniye sonra bildirim formuna geç`;
  }, 1000);

  continueButton.onclick = () => {
    if (continueButton.disabled) return;

    setModalState(gate, false);
    showReportUsageTermsModal();
  };

  cancelButton.onclick = () => {
    if (emergencyGateTimerId) {
      window.clearInterval(emergencyGateTimerId);
      emergencyGateTimerId = null;
    }

    setModalState(gate, false);
    setReportInteractionLock(false);
    navigateToHomeView();
  };
}

function initReportUsageTermsModal() {
  const checkbox = document.getElementById('usageTermsAcceptCheckbox');
  const acceptButton = document.getElementById('usageTermsAcceptButton');

  if (!checkbox || !acceptButton) return;

  checkbox.addEventListener('change', () => {
    acceptButton.disabled = !checkbox.checked;
  });

  acceptButton.addEventListener('click', () => {
    if (acceptButton.disabled) return;

    const usageTermsModal = document.getElementById('reportUsageTermsModal');
    if (!usageTermsModal) {
      setReportInteractionLock(false);
      return;
    }

    setModalState(usageTermsModal, false);
    setReportInteractionLock(false);
    focusFirstReportField();
  });
}

function showReportUsageTermsModal() {
  const usageTermsModal = document.getElementById('reportUsageTermsModal');
  const checkbox = document.getElementById('usageTermsAcceptCheckbox');
  const acceptButton = document.getElementById('usageTermsAcceptButton');

  if (!usageTermsModal || !checkbox || !acceptButton) {
    setReportInteractionLock(false);
    focusFirstReportField();
    return;
  }

  checkbox.checked = false;
  acceptButton.disabled = true;
  setModalState(usageTermsModal, true);

  window.requestAnimationFrame(() => {
    checkbox.focus();
  });
}

function focusFirstReportField() {
  const firstField = document.getElementById('districtSelect');
  if (!firstField) return;

  window.requestAnimationFrame(() => {
    firstField.focus();
  });
}

function setReportInteractionLock(locked) {
  const reportView = document.getElementById('report');
  if (!reportView) return;

  reportView.classList.toggle('report-locked', locked);

  if (locked) {
    reportView.setAttribute('inert', '');
    return;
  }

  reportView.removeAttribute('inert');
  syncFormState();
}

function initVisitorSnapshot() {
  setText('visitorDevice', /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) ? 'Mobil' : 'Masaustu');
  setText('visitorBrowser', detectBrowser(navigator.userAgent));
  setText('visitorOs', detectOs(navigator.userAgent));
  setText('visitorLanguage', getPreferredLanguage());
  setText('visitorTimezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '-');
  setText('visitorScreen', `${window.screen.width}x${window.screen.height}`);
  setText('visitorTime', new Date().toLocaleString('tr-TR'));
  setText('visitorLocation', 'Konum izni verilmedi');
  setText('visitorAccuracy', '-');

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setText('visitorTime', new Date().toLocaleString('tr-TR'));
    }
  });

  window.addEventListener('focus', () => {
    setText('visitorTime', new Date().toLocaleString('tr-TR'));
  });
}

function initLocationRequest() {
  const locationButton = document.getElementById('locationButton');
  if (!locationButton) return;

  locationButton.addEventListener('click', () => {
    const locationField = document.getElementById('visitorLocation');
    const accuracyField = document.getElementById('visitorAccuracy');

    locationButton.disabled = true;
    locationButton.textContent = 'Konum izni bekleniyor...';

    if (!navigator.geolocation) {
      if (locationField) {
        locationField.textContent = 'Tarayıcı konumu desteklemiyor';
      }
      locationButton.disabled = false;
      locationButton.textContent = 'Konum İzni Ver';
      return;
    }

    if (locationField) {
      locationField.textContent = 'Konum alınıyor...';
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude.toFixed(5);
        const longitude = position.coords.longitude.toFixed(5);
        const accuracy = Math.round(position.coords.accuracy);

        if (locationField) {
          locationField.textContent = `${latitude}, ${longitude}`;
        }
        if (accuracyField) {
          accuracyField.textContent = `${accuracy} m`;
        }

        locationButton.textContent = 'Konumu Yenile';
        locationButton.disabled = false;
      },
      () => {
        if (locationField) {
          locationField.textContent = 'Konum izni verilmedi';
        }
        if (accuracyField) {
          accuracyField.textContent = '-';
        }

        locationButton.textContent = 'Konum İzni Ver';
        locationButton.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function getPreferredLanguage() {
  const candidateLanguages = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language || ''];

  const turkishLanguage = candidateLanguages.find(language =>
    typeof language === 'string' && language.toLowerCase().startsWith('tr')
  );

  if (!turkishLanguage) {
    return 'tr-TR';
  }

  return turkishLanguage.toLowerCase() === 'tr' ? 'tr-TR' : turkishLanguage;
}

function blockFileUploadInteraction(fileInput) {
  fileInput.addEventListener('click', event => {
    event.preventDefault();
    showFileUploadNoticeModal();
  });

  fileInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    showFileUploadNoticeModal();
  });

  fileInput.addEventListener('change', () => {
    fileInput.value = '';
    selectedFiles = [];
  });
}

function initSubmitNoticeModal() {
  const continueButton = document.getElementById('submitContinueButton');
  if (!continueButton) return;

  continueButton.addEventListener('click', () => {
    if (continueButton.disabled) return;

    const modal = document.getElementById('reportSubmitNoticeModal');
    if (submitNoticeTimerId) {
      window.clearInterval(submitNoticeTimerId);
      submitNoticeTimerId = null;
    }

    if (modal) {
      setModalState(modal, false);
    }

    const completion = pendingSubmitCompletion;
    pendingSubmitCompletion = null;
    if (typeof completion === 'function') {
      completion();
    }
  });
}

function showSubmitNoticeModal(onComplete) {
  const modal = document.getElementById('reportSubmitNoticeModal');
  const countdown = document.getElementById('submitCountdown');
  const continueButton = document.getElementById('submitContinueButton');

  if (!modal || !countdown || !continueButton) {
    if (typeof onComplete === 'function') {
      onComplete();
    }
    return;
  }

  pendingSubmitCompletion = typeof onComplete === 'function' ? onComplete : null;

  let seconds = SUBMIT_NOTICE_SECONDS;
  countdown.textContent = String(seconds);
  continueButton.disabled = true;
  continueButton.textContent = `${seconds} saniye sonra tanıtım ekranına git`;
  setModalState(modal, true);

  if (submitNoticeTimerId) {
    window.clearInterval(submitNoticeTimerId);
    submitNoticeTimerId = null;
  }

  submitNoticeTimerId = window.setInterval(() => {
    seconds -= 1;

    if (seconds <= 0) {
      if (submitNoticeTimerId) {
        window.clearInterval(submitNoticeTimerId);
        submitNoticeTimerId = null;
      }
      countdown.textContent = '0';
      continueButton.disabled = false;
      continueButton.textContent = 'Tanıtım Ekranına Git';
      return;
    }

    countdown.textContent = String(seconds);
    continueButton.textContent = `${seconds} saniye sonra tanıtım ekranına git`;
  }, 1000);
}

function initFileUploadNoticeModal() {
  const modal = document.getElementById('fileUploadNoticeModal');
  const closeButton = document.getElementById('fileUploadNoticeClose');
  if (!modal || !closeButton) return;

  closeButton.addEventListener('click', () => {
    setModalState(modal, false);
  });

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      setModalState(modal, false);
    }
  });
}

function showFileUploadNoticeModal() {
  const modal = document.getElementById('fileUploadNoticeModal');
  if (!modal) return;

  setModalState(modal, true);
}

function navigateToHomeView() {
  const homeTrigger = document.querySelector('header nav button[data-view="home"]')
    || document.querySelector('[data-view="home"]');

  if (homeTrigger) {
    homeTrigger.click();
    return;
  }

  const homeView = document.getElementById('home');
  const reportView = document.getElementById('report');
  if (homeView) {
    homeView.classList.add('active');
  }
  if (reportView) {
    reportView.classList.remove('active');
  }
}

function setModalState(modalElement, isVisible) {
  if (!modalElement) return;

  modalElement.hidden = !isVisible;
  modalElement.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  syncBodyModalState();
}

function syncBodyModalState() {
  const modalIds = ['emergencyGate', 'reportSubmitNoticeModal', 'fileUploadNoticeModal', 'reportUsageTermsModal'];
  const hasVisibleModal = modalIds.some(id => {
    const modal = document.getElementById(id);
    return Boolean(modal && !modal.hidden && modal.getAttribute('aria-hidden') === 'false');
  });

  document.body.classList.toggle('modal-open', hasVisibleModal);
}

function detectBrowser(userAgent) {
  if (/Edg\//.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/Chrome\//.test(userAgent)) return 'Google Chrome';
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
  if (/Firefox\//.test(userAgent)) return 'Mozilla Firefox';
  return 'Bilinmiyor';
}

function detectOs(userAgent) {
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Android/.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Mac OS X/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Bilinmiyor';
}

function collectVisitorSnapshot() {
  const locationText = readText('visitorLocation');
  const accuracyText = readText('visitorAccuracy');

  return {
    device: readText('visitorDevice'),
    browser: readText('visitorBrowser'),
    os: readText('visitorOs'),
    language: readText('visitorLanguage'),
    timezone: readText('visitorTimezone'),
    screen: readText('visitorScreen'),
    capturedAt: new Date().toISOString(),
    location: parseLocationSnapshot(locationText, accuracyText)
  };
}

function parseLocationSnapshot(locationText, accuracyText) {
  if (!locationText || locationText === 'Konum izni verilmedi' || locationText === 'Konum alınıyor...') {
    return null;
  }

  const [latitudeText, longitudeText] = locationText.split(',').map(value => value.trim());
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const accuracyMeters = Number.parseInt(String(accuracyText || '').replace(/[^\d]/g, ''), 10);

  return {
    latitude,
    longitude,
    accuracyMeters: Number.isFinite(accuracyMeters) ? accuracyMeters : null
  };
}

function readText(id) {
  const element = document.getElementById(id);
  if (!element || typeof element.textContent !== 'string') {
    return '';
  }

  return element.textContent.trim();
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}
