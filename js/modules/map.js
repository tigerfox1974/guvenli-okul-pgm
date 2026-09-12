import { schools } from '../data/schools.js';

let map;
let markersLayer;
let countLayer;
let heatLayer;
let mapInstance;
const DEFAULT_CENTER = [35.18, 33.36];
const DEFAULT_ZOOM = 10;
const INITIAL_LAYER_STATE = Object.freeze({
  markers: true,
  counts: true,
  heat: false
});

let layerState = { ...INITIAL_LAYER_STATE };
let lastReports = [];
let lastCountMap = new Map();

export function initMap() {
  if (mapInstance) {
    return mapInstance;
  }

  const mapElement = document.getElementById('map');
  if (!mapElement || typeof L === 'undefined') {
    return null;
  }

  map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  
  markersLayer = L.layerGroup().addTo(map);
  countLayer = L.layerGroup().addTo(map);
  heatLayer = null;

  mapInstance = map;
  
  addSchoolMarkers(schools);
  updateCountMarkers(lastCountMap);
  applyLayerVisibility();
  return map;
}

export function refreshMapAfterAdminVisible() {
  const currentMap = initMap();
  if (!currentMap) {
    return;
  }

  window.requestAnimationFrame(() => {
    currentMap.invalidateSize({ animate: false });
    updateMapVisualization(lastReports);
    window.setTimeout(() => {
      currentMap.invalidateSize({ animate: false });
      updateMapVisualization(lastReports);
    }, 120);
  });
}

export function addSchoolMarkers(schoolsData) {
  if (!markersLayer) return;

  markersLayer.clearLayers();
  schoolsData.forEach(school => {
    const marker = L.marker([school.lat, school.lng])
      .bindPopup(`<strong>${school.name}</strong><br>${school.district || school.region}`);
    markersLayer.addLayer(marker);
  });
}

export function updateMapVisualization(reports = []) {
  const currentMap = initMap();
  if (!currentMap) return;

  lastReports = Array.isArray(reports) ? reports : [];
  lastCountMap = buildCountMap(lastReports);

  updateCountMarkers(lastCountMap);
  updateHeatLayer(buildHeatPoints(lastCountMap));
  applyLayerVisibility();
}

export function updateHeatLayer(data) {
  const currentMap = initMap();
  if (!currentMap) return;

  if (heatLayer && currentMap.hasLayer(heatLayer)) {
    currentMap.removeLayer(heatLayer);
  }
  heatLayer = null;

  if (!isHeatmapAvailable()) {
    return;
  }

  const heatPoints = Array.isArray(data) ? data : [];
  if (heatPoints.length === 0) {
    return;
  }

  heatLayer = L.heatLayer(heatPoints, {
    radius: 28,
    blur: 20,
    maxZoom: 13,
    minOpacity: 0.25,
    gradient: {
      0.2: '#22c55e',
      0.45: '#facc15',
      0.7: '#f97316',
      1: '#dc2626'
    }
  });

  if (layerState.heat) {
    heatLayer.addTo(currentMap);
  }
}

export function toggleHeatLayer(visible) {
  setMapLayerVisibility({ heat: visible });
}

export function toggleMarkerLayer(visible) {
  setMapLayerVisibility({ markers: visible });
}

export function toggleCountLayer(visible) {
  setMapLayerVisibility({ counts: visible });
}

export function setMapLayerVisibility(nextState = {}) {
  layerState = {
    ...layerState,
    ...Object.fromEntries(
      Object.entries(nextState).filter(([, value]) => typeof value === 'boolean')
    )
  };

  applyLayerVisibility();
  return getMapLayerVisibility();
}

export function getMapLayerVisibility() {
  return { ...layerState };
}

export function isHeatmapAvailable() {
  return typeof L !== 'undefined' && typeof L.heatLayer === 'function';
}

export function zoomToSchool(schoolId) {
  const currentMap = initMap();
  if (!currentMap) return;

  const school = schools.find(s => s.id === schoolId);
  if (school) {
    currentMap.setView([school.lat, school.lng], 16);
  }
}

export function zoomToDistrict(district) {
  const currentMap = initMap();
  if (!currentMap) return;

  const districtSchools = schools.filter(school => school.district === district || school.region === district);
  if (districtSchools.length === 0) {
    fitToIsland();
    return;
  }

  if (districtSchools.length === 1) {
    currentMap.setView([districtSchools[0].lat, districtSchools[0].lng], 13);
    return;
  }

  const bounds = L.latLngBounds(districtSchools.map(school => [school.lat, school.lng]));
  currentMap.fitBounds(bounds, { padding: [24, 24], maxZoom: 12, animate: true });
}

export function fitToIsland() {
  const currentMap = initMap();
  if (!currentMap || typeof L === 'undefined') return;

  const bounds = L.latLngBounds(schools.map(school => [school.lat, school.lng]));
  currentMap.fitBounds(bounds, { padding: [24, 24], maxZoom: DEFAULT_ZOOM, animate: true });
}

export function getMap() {
  return mapInstance;
}

function applyLayerVisibility() {
  const currentMap = mapInstance;
  if (!currentMap) return;

  if (markersLayer) {
    if (layerState.markers && !currentMap.hasLayer(markersLayer)) {
      currentMap.addLayer(markersLayer);
    }
    if (!layerState.markers && currentMap.hasLayer(markersLayer)) {
      currentMap.removeLayer(markersLayer);
    }
  }

  if (countLayer) {
    if (layerState.counts && !currentMap.hasLayer(countLayer)) {
      currentMap.addLayer(countLayer);
    }
    if (!layerState.counts && currentMap.hasLayer(countLayer)) {
      currentMap.removeLayer(countLayer);
    }
  }

  if (layerState.heat) {
    if (!heatLayer) {
      updateHeatLayer(buildHeatPoints(lastCountMap));
    }
    if (heatLayer && !currentMap.hasLayer(heatLayer)) {
      currentMap.addLayer(heatLayer);
    }
  } else if (heatLayer && currentMap.hasLayer(heatLayer)) {
    currentMap.removeLayer(heatLayer);
  }
}

// Panel artik okul bazli aggregate sayilar gonderir ({ schoolId, count });
// tekil kayitlarda count alani olmadigi icin 1 olarak sayilir (geriye donuk uyumlu).
function buildCountMap(reports) {
  const countMap = new Map();

  reports.forEach(report => {
    const schoolId = Number(report.schoolId);
    if (!Number.isFinite(schoolId) || schoolId <= 0) return;

    const weight = Number(report && report.count);
    const increment = Number.isFinite(weight) && weight > 0 ? weight : 1;
    countMap.set(schoolId, (countMap.get(schoolId) || 0) + increment);
  });

  return countMap;
}

function updateCountMarkers(countMap) {
  if (!countLayer || typeof L === 'undefined') return;

  countLayer.clearLayers();

  schools.forEach(school => {
    const count = countMap.get(school.id) || 0;
    if (count === 0) return;

    const icon = L.divIcon({
      className: 'report-count-icon',
      html: `<span class="count-marker ${getCountMarkerClass(count)}">${count}</span>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    L.marker([school.lat, school.lng], { icon, interactive: false }).addTo(countLayer);
  });
}

function getCountMarkerClass(count) {
  if (count >= 8) return 'high';
  if (count >= 4) return 'medium';
  return 'low';
}

function buildHeatPoints(countMap) {
  const entries = Array.from(countMap.entries()).filter(([, count]) => count > 0);
  if (entries.length === 0) return [];

  const maxCount = Math.max(...entries.map(([, count]) => count), 1);

  return entries
    .map(([schoolId, count]) => {
      const school = schools.find(item => item.id === schoolId);
      if (!school) return null;

      const intensity = Math.max(0.2, Math.min(count / maxCount, 1));
      return [school.lat, school.lng, intensity];
    })
    .filter(Boolean);
}