// Yardımcı fonksiyonlar
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getStatusBadge(status) {
  const statusMap = {
    'Yeni': 'bg-blue-100 text-blue-800',
    'İnceleniyor': 'bg-yellow-100 text-yellow-800',
    'Aktarıldı': 'bg-purple-100 text-purple-800',
    'Sonuçlandı': 'bg-green-100 text-green-800',
    'Arşivlendi': 'bg-gray-100 text-gray-800',
    'Asılsız': 'bg-red-100 text-red-800'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
}

export function getCategoryColor(category) {
  const colors = {
    'Trafik güvenliği': '#dc2626',
    'Okul servisi / taşımacılık': '#f59e0b',
    'Kavga / şiddet / zorbalık': '#ef4444',
    'Uyuşturucu veya zararlı madde şüphesi': '#8b5cf6',
    'Şüpheli kişi / araç': '#f97316',
    'Okul çevresi güvenliği': '#3b82f6',
    'Kamera / aydınlatma / giriş-çıkış eksikliği': '#6366f1',
    'Siber zorbalık / sosyal medya tehdidi': '#ec4899',
    'Diğer': '#6b7280'
  };
  return colors[category] || '#6b7280';
}

const DISTRICT_DICTIONARY = Object.freeze([
  {
    value: 'Lefkoşa',
    label: 'Lefkoşa',
    aliases: ['Lefkosa']
  },
  {
    value: 'Gazimağusa',
    label: 'Gazimağusa',
    aliases: ['Gazimağusa', 'Gazimagusa', 'Magusa']
  },
  {
    value: 'Girne',
    label: 'Girne',
    aliases: []
  },
  {
    value: 'Güzelyurt',
    label: 'Güzelyurt',
    aliases: ['Guzelyurt']
  },
  {
    value: 'İskele',
    label: 'İskele',
    aliases: ['Iskele']
  },
  {
    value: 'Lefke',
    label: 'Lefke',
    aliases: []
  }
]);

const DISTRICT_LOOKUP = createDistrictLookup();
export const DISTRICT_OPTIONS = Object.freeze(
  DISTRICT_DICTIONARY.map(district => ({
    value: district.value,
    label: district.label
  }))
);

const DISTRICT_ORDER = createDistrictOrder();

// Lefke, raporlamada ayrı ilçe olarak takip edilir.
export const LEFKE_DISTRICT_POLICY = 'separate-district';

export function getDistrictOptions() {
  return DISTRICT_OPTIONS.map(option => ({ ...option }));
}

export function getDistrictValues() {
  return DISTRICT_OPTIONS.map(option => option.value);
}

export function getRegionOptions() {
  return getDistrictValues();
}

export function normalizeDistrictName(value, fallback = '') {
  if (!value || typeof value !== 'string') return fallback;

  const normalizedKey = normalizeDistrictKey(value);
  const canonicalValue = DISTRICT_LOOKUP.get(normalizedKey);
  if (canonicalValue) {
    return canonicalValue;
  }

  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return fallback || trimmed;
}

export function isCanonicalDistrict(value) {
  const district = normalizeDistrictName(value, '');
  return DISTRICT_ORDER.has(district);
}

export function compareDistrictOrder(leftDistrict, rightDistrict) {
  const left = normalizeDistrictName(leftDistrict, leftDistrict || '');
  const right = normalizeDistrictName(rightDistrict, rightDistrict || '');

  const leftOrder = DISTRICT_ORDER.get(left);
  const rightOrder = DISTRICT_ORDER.get(right);

  if (leftOrder === undefined && rightOrder === undefined) {
    return String(left).localeCompare(String(right), 'tr');
  }
  if (leftOrder === undefined) return 1;
  if (rightOrder === undefined) return -1;
  return leftOrder - rightOrder;
}

export function getDistrictLabel(value) {
  const district = normalizeDistrictName(value, '');
  const match = DISTRICT_OPTIONS.find(option => option.value === district);
  return match ? match.label : value;
}

function createDistrictLookup() {
  const lookup = new Map();

  DISTRICT_DICTIONARY.forEach(district => {
    const keys = [district.value, district.label, ...district.aliases];
    keys.forEach(key => {
      lookup.set(normalizeDistrictKey(key), district.value);
    });
  });

  return lookup;
}

function createDistrictOrder() {
  const order = new Map();
  DISTRICT_OPTIONS.forEach((option, index) => {
    order.set(option.value, index);
  });
  return order;
}

function normalizeDistrictKey(value) {
  return String(value)
    .trim()
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

export function getCategoryOptions() {
  return [
    'Trafik güvenliği',
    'Okul servisi / taşımacılık',
    'Kavga / şiddet / zorbalık',
    'Uyuşturucu veya zararlı madde şüphesi',
    'Şüpheli kişi / araç',
    'Okul çevresi güvenliği',
    'Kamera / aydınlatma / giriş-çıkış eksikliği',
    'Siber zorbalık / sosyal medya tehdidi',
    'Diğer'
  ];
}

export function getStatusOptions() {
  return ['Yeni', 'İnceleniyor', 'Aktarıldı', 'Sonuçlandı', 'Arşivlendi', 'Asılsız'];
}

export function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}