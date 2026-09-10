import { initForm, showEmergencyGateOnReportEntry } from './modules/form.js?v=20260910-3';

const ADMIN_SESSION_KEY = 'pgm-demo-admin-session-v1';
const VIEW_ROUTE_TOKENS = Object.freeze({
  home: 'anasayfa',
  report: 'ihbar',
  admin: 'panel'
});
const ROUTE_VIEW_MAP = Object.freeze({
  anasayfa: 'home',
  home: 'home',
  ihbar: 'report',
  report: 'report',
  panel: 'admin',
  admin: 'admin'
});
const OPERATOR_ROLES = new Set(['operator', 'supervisor']);
const DEMO_ACCOUNTS = Object.freeze([
  {
    role: 'operator',
    username: 'demo.operator',
    password: 'PGM-Operator-2026',
    roleLabel: 'PGM Operatör'
  },
  {
    role: 'supervisor',
    username: 'demo.supervisor',
    password: 'PGM-Supervisor-2026',
    roleLabel: 'PGM Süpervizör'
  }
]);

let authSession = loadAuthSession();
let publicNavigationController = null;
let operatorRuntime = null;

document.addEventListener('DOMContentLoaded', function() {
  initForm();
  initAdminGate();
  initPublicNavigation();
  initMobileNav();
  applyAuthStateOnLoad();

  console.log('Güvenli Okul PGM başlatıldı.');
});

function initPublicNavigation() {
  publicNavigationController = new AbortController();
  const { signal } = publicNavigationController;

  window.addEventListener('hashchange', () => {
    const requestedView = getViewFromUrl();
    if (!requestedView) return;

    const activeView = getActiveViewId();
    if (requestedView === activeView) return;

    if (requestedView === 'admin' && !hasOperatorAccess(authSession)) {
      showPublicView('admin', { syncUrl: false });
      setAuthMessage('PGM paneli demo rol doğrulaması gerektirir. Lütfen operatör girişi yapın.', false);
      return;
    }

    showPublicView(requestedView, { syncUrl: false });
  }, { signal });

  const viewButtons = Array.from(document.querySelectorAll('[data-view]'));
  viewButtons.forEach(button => {
    button.addEventListener('click', event => {
      const targetView = button.dataset.view;
      if (!targetView) return;

      event.preventDefault();

      if (targetView === 'admin' && !hasOperatorAccess(authSession)) {
        showPublicView('admin', { syncUrl: true });
        setAuthMessage('PGM paneli demo rol doğrulaması gerektirir. Lütfen operatör girişi yapın.', false);
        return;
      }

      showPublicView(targetView, { syncUrl: true });
    }, { signal });
  });

  const firstView = getViewFromUrl() || document.querySelector('.view.active')?.id || 'home';
  if (firstView === 'admin' && !hasOperatorAccess(authSession)) {
    showPublicView('home', { syncUrl: true, replaceUrl: true });
    return;
  }

  showPublicView(firstView, { syncUrl: true, replaceUrl: true });
}

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('primaryNav');

  if (!toggle || !nav) return;

  const setOpen = isOpen => {
    nav.classList.toggle('nav-open', isOpen);
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  toggle.addEventListener('click', event => {
    event.stopPropagation();
    setOpen(!nav.classList.contains('nav-open'));
  });

  nav.addEventListener('click', event => {
    if (event.target.closest('button[data-view]')) {
      setOpen(false);
    }
  });

  document.addEventListener('click', event => {
    if (!nav.classList.contains('nav-open')) return;
    if (event.target.closest('header')) return;

    setOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });
}

function showPublicView(viewId, options = {}) {
  const { syncUrl = true, replaceUrl = false } = options;
  const views = Array.from(document.querySelectorAll('main .view'));
  const navButtons = Array.from(document.querySelectorAll('header nav button[data-view]'));

  views.forEach(view => {
    view.classList.toggle('active', view.id === viewId);
  });

  navButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.view === viewId);
  });

  if (syncUrl) {
    syncUrlWithView(viewId, replaceUrl);
  }

  if (viewId === 'report') {
    showEmergencyGateOnReportEntry();
  }
}

function getActiveViewId() {
  return document.querySelector('main .view.active')?.id || 'home';
}

function getViewFromUrl() {
  const hashToken = String(window.location.hash || '').replace(/^#/, '').trim().toLowerCase();
  const pageToken = new URLSearchParams(window.location.search).get('page');
  const normalizedPageToken = String(pageToken || '').trim().toLowerCase();
  const routeToken = hashToken || normalizedPageToken;

  return ROUTE_VIEW_MAP[routeToken] || null;
}

function syncUrlWithView(viewId, replaceUrl) {
  const targetToken = VIEW_ROUTE_TOKENS[viewId] || VIEW_ROUTE_TOKENS.home;
  const targetHash = `#${targetToken}`;

  if (window.location.hash.toLowerCase() === targetHash.toLowerCase()) {
    return;
  }

  const url = `${window.location.pathname}${window.location.search}${targetHash}`;
  if (replaceUrl) {
    window.history.replaceState(null, '', url);
    return;
  }

  window.location.hash = targetHash;
}

function initAdminGate() {
  const authForm = document.getElementById('adminAuthForm');
  const logoutButton = document.getElementById('adminLogoutButton');

  if (authForm) {
    authForm.addEventListener('submit', handleAdminLogin);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      window.location.reload();
    });
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();

  const roleSelect = document.getElementById('adminRoleSelect');
  const usernameInput = document.getElementById('adminUsernameInput');
  const passwordInput = document.getElementById('adminPasswordInput');

  if (!roleSelect || !usernameInput || !passwordInput) {
    return;
  }

  const selectedRole = roleSelect.value;
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!OPERATOR_ROLES.has(selectedRole)) {
    setAuthMessage('Seçilen rol yalnızca halka açık bildirim içindir. Operatör veya süpervizör seçin.', true);
    return;
  }

  const account = DEMO_ACCOUNTS.find(item => item.role === selectedRole && item.username === username);
  if (!account || account.password !== password) {
    setAuthMessage('Demo giriş bilgileri doğrulanamadı. Kullanıcı adı, rol veya şifreyi kontrol edin.', true);
    return;
  }

  authSession = {
    role: account.role,
    roleLabel: account.roleLabel,
    username: account.username,
    issuedAt: new Date().toISOString()
  };

  saveAuthSession(authSession);
  await enableOperatorRuntime({ openAdminView: true });
  setAuthMessage(`${account.roleLabel} demo oturumu açıldı.`, false);
}

function applyAuthStateOnLoad() {
  if (hasOperatorAccess(authSession)) {
    enableOperatorRuntime({ openAdminView: false });
    return;
  }

  applyAdminVisibility(false);
}

async function enableOperatorRuntime(options = { openAdminView: false }) {
  applyAdminVisibility(true);

  if (!operatorRuntime) {
    const [{ initUI }, { refreshMapAfterAdminVisible }] = await Promise.all([
      import('./modules/ui.js?v=20260910-1'),
      import('./modules/map.js?v=20260910-1')
    ]);

    operatorRuntime = {
      initUI,
      refreshMapAfterAdminVisible,
      initialized: false
    };

    document.addEventListener('pgm:admin-view-visible', () => {
      if (operatorRuntime?.refreshMapAfterAdminVisible) {
        operatorRuntime.refreshMapAfterAdminVisible();
      }
    });
  }

  if (!operatorRuntime.initialized) {
    if (publicNavigationController) {
      publicNavigationController.abort();
      publicNavigationController = null;
    }

    operatorRuntime.initUI();
    operatorRuntime.initialized = true;
  }

  if (options.openAdminView) {
    const adminButton = document.querySelector('header nav button[data-view="admin"]');
    if (adminButton) {
      adminButton.click();
    }
  }
}

function applyAdminVisibility(isAuthorized) {
  const authForm = document.getElementById('adminAuthForm');
  const authMessage = document.getElementById('adminAuthMessage');
  const sessionBox = document.getElementById('adminSessionBox');
  const sessionText = document.getElementById('adminSessionText');
  const dashboard = document.getElementById('adminDashboard');

  if (dashboard) {
    dashboard.hidden = !isAuthorized;
    dashboard.setAttribute('aria-hidden', isAuthorized ? 'false' : 'true');
  }

  if (authForm) {
    authForm.hidden = isAuthorized;
  }

  if (sessionBox) {
    sessionBox.hidden = !isAuthorized;
  }

  if (sessionText) {
    sessionText.textContent = isAuthorized && authSession
      ? `${authSession.roleLabel} olarak giriş yapıldı: ${authSession.username}`
      : '';
  }

  if (authMessage && !isAuthorized) {
    authMessage.textContent = 'Demo hesaplar: demo.operator / PGM-Operator-2026 ve demo.supervisor / PGM-Supervisor-2026';
    authMessage.classList.remove('notice');
  }
}

function setAuthMessage(message, isError) {
  const authMessage = document.getElementById('adminAuthMessage');
  if (!authMessage) return;

  authMessage.textContent = message;
  authMessage.classList.toggle('notice', Boolean(isError));
}

function hasOperatorAccess(session) {
  return Boolean(session && OPERATOR_ROLES.has(session.role));
}

function saveAuthSession(session) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

function loadAuthSession() {
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!hasOperatorAccess(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}