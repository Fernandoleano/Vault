// Vault Chrome Extension - Popup Script

const DEFAULT_SERVER = 'http://localhost:3002';

// DOM Elements
const loginView = document.getElementById('login-view');
const credentialsView = document.getElementById('credentials-view');
const settingsView = document.getElementById('settings-view');
const loginForm = document.getElementById('login-form');
const credentialsList = document.getElementById('credentials-list');
const searchInput = document.getElementById('search');
const statusEl = document.getElementById('status');

let credentials = [];
let authToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.local.get(['authToken', 'serverUrl']);
  authToken = stored.authToken;

  document.getElementById('server-url').textContent = stored.serverUrl || DEFAULT_SERVER;
  document.getElementById('server-input').value = stored.serverUrl || DEFAULT_SERVER;

  if (authToken) {
    showView('credentials');
    loadCredentials();
  } else {
    showView('login');
  }

  setupEventListeners();
});

function setupEventListeners() {
  // Login form
  loginForm.addEventListener('submit', handleLogin);

  // Search
  searchInput.addEventListener('input', filterCredentials);

  // Settings
  document.getElementById('settings-btn').addEventListener('click', () => showView('settings'));
  document.getElementById('back-btn').addEventListener('click', () => {
    showView(authToken ? 'credentials' : 'login');
  });
  document.getElementById('save-settings').addEventListener('click', saveSettings);

  // Logout & Refresh
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('refresh-btn').addEventListener('click', loadCredentials);
}

function showView(view) {
  loginView.classList.add('hidden');
  credentialsView.classList.add('hidden');
  settingsView.classList.add('hidden');

  if (view === 'login') loginView.classList.remove('hidden');
  if (view === 'credentials') credentialsView.classList.remove('hidden');
  if (view === 'settings') settingsView.classList.remove('hidden');
}

async function getServerUrl() {
  const stored = await chrome.storage.local.get(['serverUrl']);
  return stored.serverUrl || DEFAULT_SERVER;
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const serverUrl = await getServerUrl();

  try {
    const response = await fetch(`${serverUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      authToken = data.token;
      await chrome.storage.local.set({ authToken });
      showStatus('Logged in successfully!', 'success');
      showView('credentials');
      loadCredentials();
    } else {
      showStatus(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    showStatus('Cannot connect to server', 'error');
  }
}

async function loadCredentials() {
  const serverUrl = await getServerUrl();

  credentialsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch(`${serverUrl}/api/v1/credentials`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      handleLogout();
      return;
    }

    const data = await response.json();
    credentials = data.credentials || [];
    renderCredentials(credentials);
  } catch (error) {
    credentialsList.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
        <p>Cannot connect to server</p>
      </div>
    `;
  }
}

function renderCredentials(creds) {
  if (creds.length === 0) {
    credentialsList.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <p>No credentials found</p>
      </div>
    `;
    return;
  }

  credentialsList.innerHTML = creds.map(cred => `
    <div class="credential-item" data-id="${cred.id}">
      <div class="credential-icon">${getInitials(cred.title)}</div>
      <div class="credential-info">
        <div class="credential-title">${escapeHtml(cred.title)}</div>
        <div class="credential-username">${escapeHtml(cred.username)}</div>
      </div>
      <div class="credential-actions">
        <button class="action-btn fill-btn" data-action="fill" data-id="${cred.id}" title="Auto-fill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="action-btn copy-btn" data-action="copy" data-id="${cred.id}" title="Copy password">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Add event listeners
  credentialsList.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id);
      const cred = credentials.find(c => c.id === id);

      if (action === 'fill') {
        autoFillCredential(cred);
      } else if (action === 'copy') {
        copyPassword(cred);
      }
    });
  });

  // Click on item to auto-fill
  credentialsList.querySelectorAll('.credential-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const cred = credentials.find(c => c.id === id);
      autoFillCredential(cred);
    });
  });
}

function filterCredentials() {
  const query = searchInput.value.toLowerCase();
  const filtered = credentials.filter(cred =>
    cred.title.toLowerCase().includes(query) ||
    cred.username.toLowerCase().includes(query) ||
    (cred.url && cred.url.toLowerCase().includes(query))
  );
  renderCredentials(filtered);
}

async function autoFillCredential(cred) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.tabs.sendMessage(tab.id, {
      action: 'fill',
      username: cred.username,
      password: cred.password
    });

    showStatus('Credentials filled!', 'success');
    setTimeout(() => window.close(), 800);
  } catch (error) {
    showStatus('Could not fill credentials', 'error');
  }
}

async function copyPassword(cred) {
  try {
    await navigator.clipboard.writeText(cred.password);
    showStatus('Password copied!', 'success');
  } catch (error) {
    showStatus('Could not copy password', 'error');
  }
}

async function handleLogout() {
  authToken = null;
  await chrome.storage.local.remove(['authToken']);
  showView('login');
  showStatus('Logged out', 'success');
}

async function saveSettings() {
  const serverUrl = document.getElementById('server-input').value;
  await chrome.storage.local.set({ serverUrl });
  document.getElementById('server-url').textContent = serverUrl;
  showStatus('Settings saved!', 'success');
  showView(authToken ? 'credentials' : 'login');
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 2500);
}

function getInitials(title) {
  return title.substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
