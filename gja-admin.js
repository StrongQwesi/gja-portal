// ── HTML SANITIZATION & SECURITY ──
const sanitizeHTML = (str) => {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(str).replace(/[&<>"']/g, m => map[m]);
};

const sanitizeInput = (str) => {
  return sanitizeHTML(str.trim());
};

// ══════════════════════════════════════ ADMIN LOGIN & DASHBOARD ══════════════════════════════════════

// WARNING: In production, NEVER store credentials in code. Use a secure backend.
const ADMIN_CONFIG = {
  // SECURITY NOTE: These credentials should be stored securely on a backend server.
  // Contact your administrator to change credentials.
  CREDENTIALS: [
    { email: 'admin@gja.org', password: 'GJAPass123' }
  ],
  AUTH_KEY: 'gja_admin_auth',
  MEMBERS_KEY: 'gja_members_data'
};

// ── PAGE ROUTING ──
function switchPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById('page-' + pageName);
  if (targetPage) {
    targetPage.classList.add('active');
    // Move focus to main content
    const mainContent = targetPage.querySelector('h1, h2, .login-card');
    if (mainContent) mainContent.focus();
  }
  window.scrollTo({ top: 0 });
}

// ── ADMIN LOGIN ──
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = sanitizeInput(document.getElementById('adminEmail').value);
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('loginError');

  // Clear previous error
  errorEl.style.display = 'none';
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.style.display = 'block';
    errorEl.textContent = 'Please enter both email and password.';
    return;
  }

  const isValid = ADMIN_CONFIG.CREDENTIALS.some(c => c.email === email && c.password === password);

  if (isValid) {
    const token = btoa(email + ':' + Date.now());
    localStorage.setItem(ADMIN_CONFIG.AUTH_KEY, token);
    localStorage.setItem('gja_admin_email', email);
    document.getElementById('adminName').textContent = email.split('@')[0];
    switchPage('dashboard');
    loadMembersData();
  } else {
    errorEl.style.display = 'block';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = 'Invalid credentials. Try: admin@gja.org / GJAPass123';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminEmail').focus();
  }
});

// ── CHECK ADMIN AUTH ──
function checkAdminAuth() {
  const token = localStorage.getItem(ADMIN_CONFIG.AUTH_KEY);
  if (!token) return false;
  const age = Date.now() - parseInt(atob(token).split(':')[1]);
  return age < 24 * 60 * 60 * 1000; // 24 hour session
}

// ── LOGOUT ──
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem(ADMIN_CONFIG.AUTH_KEY);
  localStorage.removeItem('gja_admin_email');
  switchPage('login');
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').style.display = 'none';
});

// ── DASHBOARD: LOAD MEMBERS ──
function loadMembersData() {
  const formData = getFormDataFromSheet();
  localStorage.setItem(ADMIN_CONFIG.MEMBERS_KEY, JSON.stringify(formData));
  renderMembersTable(formData);
  updateDashboardStats(formData);
}

// Get members from localStorage (shared with registration portal)
function getFormDataFromSheet() {
  const saved = localStorage.getItem(ADMIN_CONFIG.MEMBERS_KEY);
  return saved ? JSON.parse(saved) : [];
}

// ── DASHBOARD: RENDER TABLE ──
function renderMembersTable(members = []) {
  const tbody = document.getElementById('membersTableBody');
  if (!members || members.length === 0) {
    tbody.innerHTML = '<div class="table-empty" role="status">No members found.</div>';
    return;
  }

  tbody.innerHTML = members.map(m => `
    <div class="table-row">
      <div class="member-name">${sanitizeHTML(m.fname)} ${sanitizeHTML(m.lname)}</div>
      <div>${sanitizeHTML(m.email)}</div>
      <div>${sanitizeHTML(m.region || '')}</div>
      <div>${sanitizeHTML(m.employer || '')}</div>
      <div><span class="member-status ${m.status?.toLowerCase() || 'pending'}">${sanitizeHTML(m.status || 'Pending')}</span></div>
      <div class="action-buttons">
        <button type="button" class="action-btn approve" data-id="${sanitizeHTML(m.id)}" data-action="approve" aria-label="Approve ${sanitizeHTML(m.fname)} ${sanitizeHTML(m.lname)}">✓</button>
        <button type="button" class="action-btn reject" data-id="${sanitizeHTML(m.id)}" data-action="reject" aria-label="Reject ${sanitizeHTML(m.fname)} ${sanitizeHTML(m.lname)}">✕</button>
      </div>
    </div>
  `).join('');

  // Add event delegation for action buttons
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('.action-btn');
    if (btn) {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      updateMemberStatus(id, action === 'approve' ? 'Approved' : 'Rejected');
    }
  });
}

// ── DASHBOARD: UPDATE MEMBER STATUS ──
function updateMemberStatus(memberId, newStatus) {
  const members = getFormDataFromSheet();
  const member = members.find(m => m.id === memberId);
  if (member) {
    member.status = newStatus;
    localStorage.setItem(ADMIN_CONFIG.MEMBERS_KEY, JSON.stringify(members));
    renderMembersTable(filterMembers(members));
    updateDashboardStats(members);
  }
}

// ── DASHBOARD: FILTER MEMBERS ──
function filterMembers(members = []) {
  if (!members.length) members = getFormDataFromSheet();

  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('statusFilter')?.value || '';
  const regionFilter = document.getElementById('regionFilter')?.value || '';
  const mediaFilter = document.getElementById('mediaFilter')?.value || '';

  return members.filter(m => {
    const matchesSearch = !search ||
      (m.fname || '').toLowerCase().includes(search) ||
      (m.lname || '').toLowerCase().includes(search) ||
      (m.email || '').toLowerCase().includes(search);
    const matchesStatus = !statusFilter || m.status === statusFilter;
    const matchesRegion = !regionFilter || m.region === regionFilter;
    const matchesMedia = !mediaFilter || m.mediatype === mediaFilter;

    return matchesSearch && matchesStatus && matchesRegion && matchesMedia;
  });
}

// ── DASHBOARD: STATS ──
function updateDashboardStats(members = []) {
  if (!members.length) members = getFormDataFromSheet();

  const total = members.length;
  const pending = members.filter(m => m.status === 'Pending').length;
  const approved = members.filter(m => m.status === 'Approved').length;
  const rejected = members.filter(m => m.status === 'Rejected').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statRejected').textContent = rejected;
}

// ── DASHBOARD: FILTER HANDLERS ──
document.getElementById('searchInput')?.addEventListener('input', () => {
  const filtered = filterMembers();
  renderMembersTable(filtered);
});

['statusFilter', 'regionFilter', 'mediaFilter'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => {
    const filtered = filterMembers();
    renderMembersTable(filtered);
  });
});

// ── DASHBOARD: REFRESH ──
document.getElementById('refreshBtn')?.addEventListener('click', () => {
  loadMembersData();
  alert('Data refreshed');
});

// ── DASHBOARD: EXPORT CSV ──
document.getElementById('exportBtn')?.addEventListener('click', () => {
  const members = getFormDataFromSheet();
  if (!members.length) {
    alert('No members to export');
    return;
  }

  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Region', 'Organisation', 'Media Type', 'Status', 'Date'];
  const rows = members.map(m => [
    m.id || '',
    m.fname || '',
    m.lname || '',
    m.email || '',
    m.phone || '',
    m.region || '',
    m.employer || '',
    m.mediatype || '',
    m.status || 'Pending',
    m.date || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => '"' + (cell + '').replace(/"/g, '\\"') + '"').join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'gja-members-' + new Date().toISOString().split('T')[0] + '.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ── INIT ON PAGE LOAD ──
window.addEventListener('DOMContentLoaded', () => {
  if (checkAdminAuth()) {
    const email = localStorage.getItem('gja_admin_email') || 'Admin';
    document.getElementById('adminName').textContent = email.split('@')[0];
    switchPage('dashboard');
    loadMembersData();
  } else {
    switchPage('login');
  }
});
