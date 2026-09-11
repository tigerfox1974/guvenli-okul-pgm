import { initForm, showEmergencyGateOnReportEntry } from './modules/form.js';
import {
  clearStoredAdminSession,
  ensureValidAdminSession,
  hasOperatorAccess,
  loadStoredAdminSession,
  signInAdmin
} from './modules/admin-api.js';

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
const DEFAULT_AUTH_HINT = 'PGM paneli için yetkili kullanıcı adı ve şifrenizle giriş yapın.';

let authSession = loadStoredAdminSession();
let publicNavigationController = null;
let operatorRuntime = null;

document.addEventListener('DOMContentLoaded', function() {
  initForm();
  initAdminGate();
  initPublicNavigation();
  initMobileNav();
  initAdminAuthEventHandlers();
  void applyAuthStateOnLoad();

  console.log('Güvenli Okul PGM başlatıldı.');
});

function initAdminAuthEventHandlers() {
  document.addEventListener('pgm:admin-auth-invalid', () => {
    clearStoredAdminSession();
    authSession = null;
    applyAdminVisibility(false);
    showPublicView('admin', { syncUrl: false });
    setAuthMessage('Oturum süresi doldu veya yetkiniz kaldırıldı. Lütfen tekrar giriş yapın.', true);
  });
}

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
      setAuthMessage(DEFAULT_AUTH_HINT, false);
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
        setAuthMessage(DEFAULT_AUTH_HINT, false);
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
  const logoutButtons = [
    document.getElementById('adminLogoutButton'),
    document.getElementById('navLogoutButton')
  ].filter(Boolean);

  if (authForm) {
    authForm.addEventListener('submit', handleAdminLogin);
  }

  logoutButtons.forEach(button => {
    button.addEventListener('click', handleAdminLogout);
  });
}

function handleAdminLogout() {
  clearStoredAdminSession();
  authSession = null;
  applyAdminVisibility(false);
  window.location.hash = `#${VIEW_ROUTE_TOKENS.home}`;
  window.location.reload();
}

async function handleAdminLogin(event) {
  event.preventDefault();

  const usernameInput = document.getElementById('adminUsernameInput');
  const passwordInput = document.getElementById('adminPasswordInput');
  const loginButton = document.getElementById('adminLoginButton');

  if (!usernameInput || !passwordInput) {
    return;
  }

  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (loginButton) {
    loginButton.disabled = true;
  }

  try {
    authSession = await signInAdmin(username, password);
    await enableOperatorRuntime({ openAdminView: true });
    setAuthMessage(`${authSession.roleLabel} oturumu açıldı: ${authSession.username}`, false);
  } catch (error) {
    authSession = null;
    const errorMessage = error instanceof Error && error.message
      ? error.message
      : 'Giriş sırasında beklenmeyen bir hata oluştu.';
    setAuthMessage(errorMessage, true);
  } finally {
    if (loginButton) {
      loginButton.disabled = false;
    }
  }
}

async function applyAuthStateOnLoad() {
  authSession = await ensureValidAdminSession();

  if (hasOperatorAccess(authSession)) {
    await enableOperatorRuntime({ openAdminView: false });
    return;
  }

  applyAdminVisibility(false);
}

async function enableOperatorRuntime(options = { openAdminView: false }) {
  applyAdminVisibility(true);

  if (!operatorRuntime) {
    const [{ initUI }, { refreshMapAfterAdminVisible }] = await Promise.all([
      import('./modules/ui.js'),
      import('./modules/map.js')
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
  const demoBanner = document.getElementById('adminDemoBanner');
  const authGate = document.getElementById('adminAuthGate');

  if (demoBanner) {
    demoBanner.hidden = isAuthorized;
  }

  if (authGate) {
    authGate.hidden = isAuthorized;
  }

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
      ? `${authSession.roleLabel} olarak giriş yapıldı: ${authSession.username || '-'}`
      : '';
  }

  updateNavAuthButtons(isAuthorized);

  if (authMessage && !isAuthorized) {
    authMessage.textContent = DEFAULT_AUTH_HINT;
    authMessage.classList.remove('notice');
  }
}

function updateNavAuthButtons(isAuthorized) {
  const loginButton = document.querySelector('header nav button[data-view="admin"]');
  const logoutButton = document.getElementById('navLogoutButton');

  if (loginButton) {
    loginButton.hidden = isAuthorized;
  }

  if (logoutButton) {
    logoutButton.hidden = !isAuthorized;
  }
}

function setAuthMessage(message, isError) {
  const authMessage = document.getElementById('adminAuthMessage');
  if (!authMessage) return;

  authMessage.textContent = message;
  authMessage.classList.toggle('notice', Boolean(isError));
}
