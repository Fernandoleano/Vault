// Vault Chrome Extension - Content Script
// Handles auto-fill on web pages

const DEFAULT_SERVER = 'http://localhost:3002';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fill') {
    const autoSubmit = message.autoSubmit !== false; // Default to true
    fillCredentials(message.username, message.password, autoSubmit);
    sendResponse({ success: true });
  }
  if (message.action === 'hideSmartPopup') {
    hideSmartPopup();
    sendResponse({ success: true });
  }
  return true;
});

// Check for matching credentials when page loads
async function checkForMatchingCredentials() {
  const currentUrl = window.location.href;
  const currentDomain = window.location.hostname;

  // Skip certain pages
  if (currentDomain === 'localhost' ||
      currentDomain.includes('chrome.google.com') ||
      currentDomain.includes('extensions')) {
    return;
  }

  // Get stored auth token
  const stored = await chrome.storage.local.get(['authToken', 'serverUrl']);
  if (!stored.authToken) {
    console.log('Vault: Not logged in');
    return;
  }

  const serverUrl = stored.serverUrl || DEFAULT_SERVER;

  try {
    // Use the domain for matching
    const response = await fetch(`${serverUrl}/api/v1/credentials/for_url?url=${encodeURIComponent(currentUrl)}`, {
      headers: {
        'Authorization': `Bearer ${stored.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('Vault: API error', response.status);
      return;
    }

    const data = await response.json();
    const matchingCredentials = data.credentials || [];

    console.log('Vault: Found', matchingCredentials.length, 'matching credentials for', currentDomain);

    if (matchingCredentials.length > 0) {
      // Check if there's a password field or if it might appear later
      waitForPasswordFieldAndShow(matchingCredentials);
    }
  } catch (error) {
    console.log('Vault: Could not check for credentials', error);
  }
}

// Wait for password field to appear (for SPAs like Netflix)
function waitForPasswordFieldAndShow(credentials) {
  let attempts = 0;
  const maxAttempts = 10;

  const checkAndShow = () => {
    const hasPasswordField = document.querySelector('input[type="password"]');
    if (hasPasswordField) {
      console.log('Vault: Password field found, showing popup');
      showSmartPopup(credentials);
      return;
    }

    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(checkAndShow, 500);
    } else {
      // Show anyway if we have matching credentials for this domain
      console.log('Vault: No password field found, but showing popup anyway');
      showSmartPopup(credentials);
    }
  };

  checkAndShow();
}

function showSmartPopup(credentials) {
  // Remove existing popup
  hideSmartPopup();

  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'vault-smart-popup';
  popup.innerHTML = `
    <div class="vault-popup-header">
      <div class="vault-popup-logo">
        <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
          <rect x="10" y="30" width="80" height="60" rx="8" fill="#6366f1"/>
          <circle cx="50" cy="60" r="8" fill="#c7d2fe"/>
        </svg>
        <span>Vault</span>
      </div>
      <button class="vault-popup-close" id="vault-popup-close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="vault-popup-credentials">
      ${credentials.map(cred => `
        <div class="vault-popup-item" data-username="${escapeHtml(cred.username)}" data-password="${escapeHtml(cred.password)}">
          <div class="vault-popup-item-icon">${cred.title.substring(0, 2).toUpperCase()}</div>
          <div class="vault-popup-item-info">
            <div class="vault-popup-item-title">${escapeHtml(cred.title)}</div>
            <div class="vault-popup-item-username">${escapeHtml(cred.username)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.id = 'vault-smart-popup-styles';
  style.textContent = `
    #vault-smart-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 280px;
      background: linear-gradient(135deg, #0f0f23, #1a1a3e);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: vaultPopupSlideIn 0.3s ease;
      overflow: hidden;
    }

    @keyframes vaultPopupSlideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .vault-popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(99, 102, 241, 0.2);
      background: rgba(99, 102, 241, 0.1);
    }

    .vault-popup-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #e0e7ff;
      font-weight: 600;
      font-size: 14px;
    }

    .vault-popup-close {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .vault-popup-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e0e7ff;
    }

    .vault-popup-credentials {
      padding: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .vault-popup-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .vault-popup-item:hover {
      background: rgba(99, 102, 241, 0.2);
    }

    .vault-popup-item-icon {
      width: 32px;
      height: 32px;
      background: #6366f1;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .vault-popup-item-info {
      flex: 1;
      min-width: 0;
    }

    .vault-popup-item-title {
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .vault-popup-item-username {
      font-size: 11px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(popup);

  // Add event listeners
  document.getElementById('vault-popup-close').addEventListener('click', hideSmartPopup);

  popup.querySelectorAll('.vault-popup-item').forEach(item => {
    item.addEventListener('click', () => {
      const username = item.dataset.username;
      const password = item.dataset.password;
      fillCredentials(username, password, true);
      hideSmartPopup();
    });
  });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    hideSmartPopup();
  }, 10000);
}

function hideSmartPopup() {
  const popup = document.getElementById('vault-smart-popup');
  const style = document.getElementById('vault-smart-popup-styles');
  if (popup) popup.remove();
  if (style) style.remove();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function fillCredentials(username, password, autoSubmit = true) {
  // Find username/email fields
  const usernameSelectors = [
    'input[type="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][name*="login"]',
    'input[type="text"][id*="user"]',
    'input[type="text"][id*="email"]',
    'input[type="text"][id*="login"]',
    'input[name="username"]',
    'input[name="email"]',
    'input[name="login"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="text"]'
  ];

  // Find password fields
  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[name="pass"]',
    'input[autocomplete="current-password"]'
  ];

  // Try to fill username
  let usernameFilled = false;
  for (const selector of usernameSelectors) {
    const fields = document.querySelectorAll(selector);
    for (const field of fields) {
      if (isVisible(field) && !field.disabled && !field.readOnly) {
        fillField(field, username);
        usernameFilled = true;
        break;
      }
    }
    if (usernameFilled) break;
  }

  // Try to fill password
  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    const fields = document.querySelectorAll(selector);
    for (const field of fields) {
      if (isVisible(field) && !field.disabled && !field.readOnly) {
        fillField(field, password);
        passwordFilled = true;
        break;
      }
    }
    if (passwordFilled) break;
  }

  // Show visual feedback
  if (usernameFilled || passwordFilled) {
    showFillNotification('Credentials filled by Vault');

    // Auto-submit the form if enabled
    if (autoSubmit) {
      setTimeout(() => {
        clickSubmitButton();
      }, 500);
    }
  }
}

function clickSubmitButton() {
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[name="login"]',
    'button[name="signin"]',
    'button[name="sign-in"]',
    'button[id*="login"]',
    'button[id*="signin"]',
    'button[id*="sign-in"]',
    'button[class*="login"]',
    'button[class*="signin"]',
    'button[class*="sign-in"]',
    'button[class*="submit"]',
    'input[value*="Sign" i]',
    'input[value*="Log" i]',
    'button',
    'a[role="button"]'
  ];

  for (const selector of submitSelectors) {
    try {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (!isVisible(button)) continue;

        const text = (button.textContent || button.value || '').toLowerCase();
        const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();

        const loginKeywords = ['sign in', 'signin', 'log in', 'login', 'submit', 'continue', 'next', 'enter'];
        const isLoginButton = loginKeywords.some(keyword =>
          text.includes(keyword) || ariaLabel.includes(keyword)
        );

        if (isLoginButton || button.type === 'submit') {
          button.click();
          showFillNotification('Signing in...');
          return true;
        }
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  // Fallback: submit form directly
  const forms = document.querySelectorAll('form');
  for (const form of forms) {
    const hasPasswordField = form.querySelector('input[type="password"]');
    if (hasPasswordField && isVisible(form)) {
      form.submit();
      showFillNotification('Signing in...');
      return true;
    }
  }

  return false;
}

function fillField(field, value) {
  field.focus();
  field.value = '';
  field.value = value;

  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

  field.style.transition = 'box-shadow 0.3s ease';
  field.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.4)';

  setTimeout(() => {
    field.style.boxShadow = '';
  }, 1000);
}

function isVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function showFillNotification(message) {
  const existing = document.getElementById('vault-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'vault-notification';
  notification.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 100 100" fill="none" style="margin-right: 8px;">
      <rect x="10" y="30" width="80" height="60" rx="8" fill="#6366f1"/>
      <circle cx="50" cy="60" r="8" fill="#c7d2fe"/>
    </svg>
    <span>${message}</span>
  `;

  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #1e1b4b, #312e81);
    color: #e0e7ff;
    padding: 12px 20px;
    border-radius: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    z-index: 2147483647;
    animation: vaultSlideIn 0.3s ease;
    border: 1px solid rgba(99, 102, 241, 0.3);
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes vaultSlideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes vaultSlideOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(20px); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'vaultSlideOut 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// Run when page loads (with a small delay to ensure DOM is ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkForMatchingCredentials, 1000);
  });
} else {
  setTimeout(checkForMatchingCredentials, 1000);
}

// Also check when URL changes (for SPAs)
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(checkForMatchingCredentials, 1000);
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});
