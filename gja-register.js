// ── CONSTANTS ──
const CONFIG = {
  TABS: ['personal','contact','professional','confirm'],
  REQUIRED_FIELDS: ['fname','lname','dob','gender','email','phone','address','jobtitle','employer'],
  SUBMISSION_DELAY_MS: 1800,
  STORAGE_KEYS: { drive: 'gja_drive' },
  VALIDATION: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    googleDrive: /drive\.google\.com/
  }
};

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

// ── DOM CACHE ──
const dom = {
  tabs: null,
  tabPanels: null,
  form: null,
  submitBtn: null,
  progressFill: document.getElementById('progFill'),
  progressNum: document.getElementById('progNum'),
  progressLbl: document.getElementById('progLbl'),
  successModal: document.getElementById('successModal'),
  photoCircle: document.getElementById('photoCircle'),
  driveInput: document.getElementById('driveInput'),
  driveSt: document.getElementById('driveSt'),
  statT: document.getElementById('statT'),
  requiredElements: {}
};

// Cache required field elements
CONFIG.REQUIRED_FIELDS.forEach(id => {
  dom.requiredElements[id] = document.getElementById(id);
});

// Cache tab and panel elements
window.addEventListener('DOMContentLoaded', () => {
  dom.tabs = document.querySelectorAll('.tab');
  dom.tabPanels = CONFIG.TABS.map(t => document.getElementById('tab-'+t));
  dom.form = document.getElementById('gjaForm');
  dom.submitBtn = document.getElementById('submitBtn');

  // Tab click handler
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => gotoTab(tab.dataset.tab));
  });

  // Next/prev button handlers
  document.querySelectorAll('[data-next-tab]').forEach(btn => {
    btn.addEventListener('click', () => gotoTab(btn.dataset.nextTab));
  });

  document.querySelectorAll('[data-prev-tab]').forEach(btn => {
    btn.addEventListener('click', () => gotoTab(btn.dataset.prevTab));
  });

  // Photo input handlers
  const photoFile = document.getElementById('photoFile');
  dom.photoCircle.addEventListener('click', () => photoFile.click());
  document.getElementById('photoBtn').addEventListener('click', () => photoFile.click());
  photoFile.addEventListener('change', loadPhoto);

  // Sidebar handlers
  document.getElementById('embedFormBtn').addEventListener('click', embedForm);
  document.getElementById('saveDriveBtn').addEventListener('click', saveDrive);
  document.getElementById('drivePillBtn').addEventListener('click', openDriveLink);

  // Modal handlers
  if (document.getElementById('registerAnotherBtn')) {
    document.getElementById('registerAnotherBtn').addEventListener('click', closeModal);
  }
  if (document.getElementById('doneBtn')) {
    document.getElementById('doneBtn').addEventListener('click', closeModal);
  }

  // Admin page button
  document.getElementById('adminPageBtn')?.addEventListener('click', () => {
    window.location.href = 'gja-admin.html';
  });

  // Load saved drive URL
  const driveUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.drive);
  if (driveUrl) {
    dom.driveInput.value = driveUrl;
    document.getElementById('drivePillBtn').setAttribute('data-url', driveUrl);
  }

  // Form submission handler
  if (dom.form) {
    dom.form.addEventListener('submit', handleFormSubmit);
  }

  updateProgress();
});

// ── TABS ──
function gotoTab(id) {
  const tabIndex = CONFIG.TABS.indexOf(id);
  if (tabIndex === -1) return;

  // Remove active from all
  dom.tabPanels.forEach(panel => panel.classList.remove('active'));
  dom.tabs.forEach(tab => {
    tab.classList.remove('active');
    tab.setAttribute('aria-selected', 'false');
  });

  // Add active to current
  dom.tabPanels[tabIndex].classList.add('active');
  dom.tabs[tabIndex].classList.add('active');
  dom.tabs[tabIndex].setAttribute('aria-selected', 'true');

  if (id === 'confirm') buildReview();
  updateProgress();
  window.scrollTo({top: 0, behavior:'smooth'});
  
  // Focus the first form field in the new tab
  const firstInput = dom.tabPanels[tabIndex].querySelector('input, select, textarea, button');
  if (firstInput) firstInput.focus();
}

// ── PHOTO ──
function loadPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = document.createElement('img');
    img.src = ev.target.result;
    img.alt = 'Passport photo';
    dom.photoCircle.innerHTML = '';
    dom.photoCircle.appendChild(img);
  };
  reader.readAsDataURL(file);
}

// ── PROGRESS ──
function updateProgress() {
  let filled = 0;
  CONFIG.REQUIRED_FIELDS.forEach(id => {
    if (dom.requiredElements[id]?.value.trim()) filled++;
  });

  const percent = Math.round((filled / CONFIG.REQUIRED_FIELDS.length) * 100);
  dom.progressFill.style.width = percent + '%';
  dom.progressNum.textContent = percent + '%';
  dom.progressLbl.textContent = percent === 100 ? 'All required fields filled ✓' : 'Form completion';
}

// Event delegation for form inputs
document.addEventListener('input', (e) => {
  if (['input','select','textarea'].includes(e.target.tagName.toLowerCase())) {
    updateProgress();
  }
});

// Prevent Enter key from submitting in text fields
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') {
    e.preventDefault();
    const form = e.target.closest('form');
    const inputs = Array.from(form.querySelectorAll('input[type=text], input[type=email], input[type=tel], input[type=date], select, textarea'));
    const currentIndex = inputs.indexOf(e.target);
    if (currentIndex < inputs.length - 1) {
      inputs[currentIndex + 1].focus();
    }
  }
});

// ── VALIDATION ──
const validationRules = [
  { id:'fname', fg:'fg-fname', fn: v => v.trim().length > 0, msg: 'First name is required' },
  { id:'lname', fg:'fg-lname', fn: v => v.trim().length > 0, msg: 'Surname is required' },
  { id:'dob',   fg:'fg-dob',   fn: v => v.trim().length > 0, msg: 'Date of birth is required' },
  { id:'gender',fg:'fg-gender',fn: v => v.trim().length > 0, msg: 'Please select a gender' },
  { id:'email', fg:'fg-email', fn: v => CONFIG.VALIDATION.email.test(v), msg: 'Valid email required (e.g., name@domain.com)' },
  { id:'phone', fg:'fg-phone', fn: v => v.trim().length > 5, msg: 'Valid phone number required' },
  { id:'address',fg:'fg-address',fn: v => v.trim().length > 0, msg: 'Residential address is required' },
  { id:'jobtitle',fg:'fg-jobtitle',fn: v => v.trim().length > 0, msg: 'Job title is required' },
  { id:'employer',fg:'fg-employer',fn: v => v.trim().length > 0, msg: 'Media organisation/employer is required' },
];

function applyValidationResult(fieldGroup, isValid) {
  fieldGroup.classList.toggle('err', !isValid);
  const input = fieldGroup.querySelector('input, select, textarea');
  if (input) {
    input.setAttribute('aria-invalid', !isValid);
  }
}

function validate() {
  let isValid = true;

  validationRules.forEach(rule => {
    const field = document.getElementById(rule.id);
    const fieldGroup = document.getElementById(rule.fg);
    if (!field || !fieldGroup) return;

    const passesValidation = rule.fn(field.value);
    applyValidationResult(fieldGroup, passesValidation);
    
    // Update error message if available
    const errEl = fieldGroup.querySelector('.ferr');
    if (errEl && rule.msg) {
      errEl.textContent = rule.msg;
    }
    
    if (!passesValidation) isValid = false;
  });

  if (!document.getElementById('c1').checked || !document.getElementById('c2').checked) {
    alert('Please accept the required consent checkboxes (marked with *) to proceed.');
    isValid = false;
  }

  return isValid;
}

// ── REVIEW ──
function buildReview() {
  const getFieldValue = (id) => {
    const el = document.getElementById(id);
    const value = el?.value.trim() || '';
    return value ? sanitizeHTML(value) : '—';
  };

  const rows = [
    ['Full Name', getFieldValue('fname') + ' ' + getFieldValue('lname')],
    ['Date of Birth', getFieldValue('dob')],
    ['Gender', getFieldValue('gender')],
    ['Email', getFieldValue('email')],
    ['Phone', getFieldValue('phone')],
    ['Address', getFieldValue('address')],
    ['Job Title', getFieldValue('jobtitle')],
    ['Employer', getFieldValue('employer')],
    ['Media Type', getFieldValue('mediatype')],
  ];

  const reviewGrid = document.getElementById('reviewGrid');
  reviewGrid.innerHTML = '<p style="font-size:11.5px;color:var(--ink-faint);margin-bottom:10px">Please verify before submitting:</p>';

  rows.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'rv';

    const labelEl = document.createElement('span');
    labelEl.textContent = label;

    const valueEl = document.createElement('strong');
    valueEl.textContent = value;

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    reviewGrid.appendChild(row);
  });
}

// ── SUBMIT (CONSOLIDATED - SINGLE HANDLER) ──
function handleFormSubmit(e) {
  e.preventDefault();
  if (!validate()) return;

  dom.submitBtn.disabled = true;
  dom.submitBtn.innerHTML = '<span aria-hidden="true">⏳</span> Submitting…';
  dom.submitBtn.setAttribute('aria-busy', 'true');

  setTimeout(() => {
    const fname = sanitizeInput(document.getElementById('fname').value);
    const lname = sanitizeInput(document.getElementById('lname').value);
    const email = sanitizeInput(document.getElementById('email').value);
    const employer = sanitizeInput(document.getElementById('employer').value);
    const memId = 'GJA-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5);
    const date = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});

    const modalRef = document.getElementById('modalRefBlock');
    modalRef.innerHTML = '';

    const refData = [
      ['Member ID', memId],
      ['Full Name', fname + ' ' + lname],
      ['Email', email],
      ['Organisation', employer || '—'],
      ['Application Date', date],
      ['Status', 'Under Review'],
    ];

    refData.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'mref-row';

      const labelEl = document.createElement('span');
      labelEl.textContent = label;

      const valueEl = document.createElement('strong');
      valueEl.textContent = value;

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      modalRef.appendChild(row);
    });

    // Store member data
    const formData = getFormDataFromLocalStorage();
    const newMember = {
      id: memId,
      fname: fname,
      lname: lname,
      email: email,
      phone: sanitizeInput(document.getElementById('phone').value),
      address: sanitizeInput(document.getElementById('address').value),
      region: document.querySelector('select[name="region"]')?.value || '',
      employer: employer,
      mediatype: document.querySelector('select[name="mediatype"]')?.value || '',
      status: 'Pending',
      date: date,
      photoUrl: document.getElementById('photoCircle').querySelector('img')?.src || ''
    };
    formData.push(newMember);
    localStorage.setItem('gja_members_data', JSON.stringify(formData));

    dom.successModal.classList.add('open');
    dom.successModal.focus();
    if (dom.statT) dom.statT.textContent = parseInt(dom.statT.textContent) + 1;

    dom.submitBtn.disabled = false;
    dom.submitBtn.innerHTML = 'Submit GJA Application';
    dom.submitBtn.removeAttribute('aria-busy');
  }, CONFIG.SUBMISSION_DELAY_MS);
}

function closeModal() {
  dom.successModal.classList.remove('open');
  dom.form?.reset();
  dom.photoCircle.innerHTML = '📷';
  gotoTab('personal');
  updateProgress();
  // Return focus to submit button
  dom.submitBtn?.focus();
}

// ── GOOGLE FORMS ──
function embedForm() {
  const url = document.getElementById('gformsInput').value.trim();
  if (!url) { 
    alert('Please paste a Google Form URL.'); 
    return; 
  }
  const embedUrl = url.includes('embedded=true') ? url : url + (url.includes('?') ? '&' : '?') + 'embedded=true';
  const viewport = document.getElementById('gfViewport');
  viewport.innerHTML = `<iframe src="${sanitizeHTML(embedUrl)}" width="100%" height="540" frameborder="0" title="Google Form">Loading...</iframe>`;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', 'Embedded Google Form');
}

// ── GOOGLE DRIVE ──
function setStatus(element, type, message) {
  element.className = 'drive-st dst-' + type;
  element.textContent = message;
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');
}

function saveDrive() {
  const url = dom.driveInput.value.trim();

  if (!url) {
    setStatus(dom.driveSt, 'err', '⚠ Please enter a URL.');
    return;
  }

  if (!CONFIG.VALIDATION.googleDrive.test(url)) {
    setStatus(dom.driveSt, 'err', '⚠ Please enter a valid Google Drive URL.');
    return;
  }

  localStorage.setItem(CONFIG.STORAGE_KEYS.drive, url);
  setStatus(dom.driveSt, 'ok', '✓ Drive folder linked. The header button now opens your folder.');
  document.getElementById('drivePillBtn').setAttribute('data-url', url);
}

function openDriveLink(e) {
  const url = localStorage.getItem(CONFIG.STORAGE_KEYS.drive) || e.currentTarget.getAttribute('data-url');
  if (url) { e.preventDefault(); window.open(url, '_blank'); }
}

// ── LOCAL STORAGE HELPERS ──
function getFormDataFromLocalStorage() {
  const saved = localStorage.getItem('gja_members_data');
  return saved ? JSON.parse(saved) : [];
}
