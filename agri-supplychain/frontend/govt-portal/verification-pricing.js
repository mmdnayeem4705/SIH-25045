// Officer Verification & Pricing Workflow
const API_BASE_URL = 'http://localhost:3000/api';
let currentRequest = null;

document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  refreshRequests();
  bindForms();
});

function loadUserInfo() {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  fetch(`${API_BASE_URL}/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(r => r.json()).then(d => {
      if (d?.success) {
        const n = document.getElementById('userName'); if (n) n.textContent = d.user.name || 'Officer';
        const c = document.getElementById('userCode'); if (c) c.textContent = d.user.memoId || 'N/A';
      }
    }).catch(() => {});
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  window.location.assign(`${window.location.origin}/auth/index.html`);
}

function refreshRequests() {
  const grid = document.getElementById('pendingRequestsGrid');
  if (!grid) return;
  grid.innerHTML = '<p>Loading...</p>';
  const token = localStorage.getItem('authToken');
  // Placeholder: fetch pending verification requests (wire real endpoint later)
  // Example mock list
  const mock = [
    { id: 'req1', cropName: 'Tomatoes', farmer: 'Ravi Kumar', qty: 500, unit: 'kg', requestedAt: '2025-09-20' },
    { id: 'req2', cropName: 'Wheat', farmer: 'Anita Patel', qty: 1200, unit: 'kg', requestedAt: '2025-09-22' }
  ];
  setTimeout(() => {
    grid.innerHTML = mock.map(m => `
      <div class="request-card">
        <div class="request-main">
          <h4>${m.cropName}</h4>
          <div>Farmer: ${m.farmer}</div>
          <div>Quantity: ${m.qty} ${m.unit}</div>
          <div>Requested: ${m.requestedAt}</div>
        </div>
        <div class="request-actions">
          <button class="btn btn-secondary" onclick="rejectRequest('${m.id}')"><i class="fas fa-times"></i> Reject</button>
          <button class="btn btn-primary" onclick="approveRequest('${m.id}')"><i class="fas fa-check"></i> Approve & Verify</button>
        </div>
      </div>
    `).join('');
  }, 300);
}

function rejectRequest(id) {
  showToast('error', 'Request rejected');
}

function approveRequest(id) {
  currentRequest = { id };
  showSection('verificationPanel', true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideVerificationPanel() { showSection('verificationPanel', false); }
function hidePricingPanel() { showSection('pricingPanel', false); }

function bindForms() {
  const vForm = document.getElementById('verificationForm');
  if (vForm) vForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Collect verification data
    const data = {
      actualQuantity: parseFloat(document.getElementById('vfQty').value || '0'),
      qualityGrade: document.getElementById('vfGrade').value,
      life: parseInt(document.getElementById('vfLife').value || '0', 10),
      lifeUnit: document.getElementById('vfLifeUnit').value,
      notes: document.getElementById('vfNotes').value,
      images: [] // TODO: capture Base64 or upload to server
    };
    showToast('success', 'Verification saved. Proceed to pricing.');
    showSection('pricingPanel', true);
  });

  const pForm = document.getElementById('pricingForm');
  if (pForm) pForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      purchasePrice: parseFloat(document.getElementById('prPurchase').value || '0'),
      sellingPrice: parseFloat(document.getElementById('prSelling').value || '0'),
      notes: document.getElementById('prNotes').value
    };
    showToast('success', 'Pricing saved. Ready for sales.');
  });
}

function showSection(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? 'block' : 'none';
}

function showToast(type, message) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => { t.remove(); }, 3000);
}

