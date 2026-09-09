import { schools } from '../data/schools.js';
import { generateId, getDistrictOptions, normalizeDistrictName } from './utils.js';

let selectedFiles = [];
const PUBLIC_REPORTS_STORAGE_KEY = 'pgm-public-reports-demo-v1';
const LEGACY_REPORTS_STORAGE_KEY = 'reports';
const EMERGENCY_GATE_SECONDS = 5;
let emergencyGateTimerId = null;

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
    fileInput.addEventListener('change', () => {
      selectedFiles = Array.from(fileInput.files || []);
    });
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
  const schoolHint = document.getElementById('schoolHint');
  if (!schoolSelect) return;

  schoolSelect.innerHTML = '<option value="">Önce ilçe seçiniz</option>';

  if (!district) {
    schoolSelect.disabled = true;
    if (schoolHint) {
      schoolHint.textContent = 'Okul listesi seçilen ilçeye göre gösterilir.';
    }
    return;
  }

  const normalizedDistrict = normalizeDistrictName(district, '');
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

  if (schoolHint) {
    schoolHint.textContent = filtered.length > 0
      ? `${filtered.length} okul listelendi.`
      : 'Bu ilçe için okul verisi bulunamadı.';
  }
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveReport(report);

  alert('Bildiriminiz başarıyla gönderildi. Teşekkürler!');

  form.reset();
  selectedFiles = [];
  if (fileInput) {
    fileInput.value = '';
  }

  updateSchoolList('');
  syncFormState();

  document.dispatchEvent(new CustomEvent('reports:updated', { detail: { report } }));
}

function saveReport(report) {
  const reports = getReports();
  reports.push(report);
  localStorage.setItem(PUBLIC_REPORTS_STORAGE_KEY, JSON.stringify(reports));
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

  if (!gate || !countdown || !continueButton) return;

  setReportInteractionLock(true);
  gate.hidden = false;
  gate.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

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

    gate.hidden = true;
    gate.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setReportInteractionLock(false);
  };
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
  setText('visitorLanguage', navigator.language || '-');
  setText('visitorTimezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '-');
  setText('visitorScreen', `${window.screen.width}x${window.screen.height}`);
  setText('visitorTime', new Date().toLocaleString('tr-TR'));
  setText('visitorLocation', 'İzin istenmedi');
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
      locationButton.textContent = 'Konum İzni İste';
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

        locationButton.textContent = 'Konum İzni İste';
        locationButton.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
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

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}
