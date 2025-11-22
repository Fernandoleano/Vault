// Vault Chrome Extension - Background Service Worker

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    // Can't programmatically open popup, but we can show a notification
    chrome.action.openPopup().catch(() => {
      // Popup can't be opened programmatically in most cases
      // User needs to click the extension icon
    });
  }
  return true;
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default server URL
    chrome.storage.local.set({
      serverUrl: 'http://localhost:3002'
    });
  }
});

// Context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'vault-fill',
    title: 'Fill with Vault',
    contexts: ['editable']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'vault-fill') {
    // Open the popup
    chrome.action.openPopup();
  }
});
