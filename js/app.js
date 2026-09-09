import { initForm, showEmergencyGateOnReportEntry } from './modules/form.js';

const ADMIN_SESSION_KEY = 'pgm-demo-admin-session-v1';
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
  applyAuthStateOnLoad();

  console.log('Güvenli Okul PGM başlatıldı.');
});

function initPublicNavigation() {
  publicNavigationController = new AbortController();
  const { signal } = publicNavigationController;

  const viewButtons = Array.from(document.querySelectorAll('[data-view]'));
  viewButtons.forEach(button => {
    button.addEventListener('click', event => {
      const targetView = button.dataset.view;
      if (!targetView) return;

      event.preventDefault();

      if (targetView === 'admin' && !hasOperatorAccess(authSession)) {
        showPublicView('admin');
        setAuthMessage('PGM paneli demo rol doğrulaması gerektirir. Lütfen operatör girişi yapın.', false);
        return;
      }

      showPublicView(targetView);
    }, { signal });
  });

  const firstView = document.querySelector('.view.active')?.id || 'home';
  if (firstView === 'admin' && !hasOperatorAccess(authSession)) {
    showPublicView('home');
    return;
  }

  showPublicView(firstView);
}

function showPublicView(viewId) {
  const views = Array.from(document.querySelectorAll('main .view'));
  const navButtons = Array.from(document.querySelectorAll('header nav button[data-view]'));

  views.forEach(view => {
    view.classList.toggle('active', view.id === viewId);
  });

  navButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.view === viewId);
  });

  if (viewId === 'report') {
    showEmergencyGateOnReportEntry();
  }
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