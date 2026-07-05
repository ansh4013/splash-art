// ==================== API Configuration ====================
const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
let token = localStorage.getItem('adminToken');

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showDashboard();
    loadArtworks();
  } else {
    showLogin();
  }

  // Setup form event listeners
  setupEventListeners();
});

/**
 * Setup all event listeners for forms
 */
function setupEventListeners() {
  const loginForm = document.getElementById('loginForm');
  const uploadForm = document.getElementById('uploadForm');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', handleUpload);
  }

  // Close forms on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      resetMessages();
    }
  });
}

/**
 * Show login section and hide dashboard
 */
function showLogin() {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');

  if (loginSection) loginSection.style.display = 'flex';
  if (dashboardSection) dashboardSection.style.display = 'none';
}

/**
 * Show dashboard and hide login section
 */
function showDashboard() {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');

  if (loginSection) loginSection.style.display = 'none';
  if (dashboardSection) dashboardSection.style.display = 'block';

  const username = localStorage.getItem('adminUsername');
  const adminNameElement = document.getElementById('adminName');
  if (adminNameElement) {
    adminNameElement.textContent = `Welcome, ${escapeHtml(username)}!`;
  }
}

/**
 * Handle admin login
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
  e.preventDefault();

  const