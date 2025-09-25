// Agricultural Verification Officer Dashboard JavaScript
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    // Ensure card clicks navigate even if event handlers are blocked
    const card = document.getElementById('verificationPricingCard');
    if (card) {
        card.addEventListener('click', () => {
            window.location.assign(`${window.location.origin}/govt-portal/verification-pricing.html`);
        });
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                window.location.assign(`${window.location.origin}/govt-portal/verification-pricing.html`);
            }
        });
    }
});

function loadUserInfo() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.assign(`${window.location.origin}/auth/index.html`);
        return;
    }

    fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        if (data?.success) {
            document.getElementById('userName').textContent = data.user.name || 'Officer';
            document.getElementById('userCode').textContent = data.user.memoId || 'N/A';
        }
    })
    .catch(() => {});
}

function showUnifiedWork() { toggle('unifiedWorkSection', true); toggle('salesManagementSection', false); }
function showCropVerification() { toggle('cropVerificationSection', true); toggle('priceManagementSection', false); toggle('salesManagementSection', false); }
function showPriceManagement() { toggle('cropVerificationSection', false); toggle('priceManagementSection', true); toggle('salesManagementSection', false); }
function showSalesManagement() { toggle('cropVerificationSection', false); toggle('priceManagementSection', false); toggle('salesManagementSection', true); }
function refreshVerifications() {}
function showPriceSettingModal() { const m = document.getElementById('priceSettingModal'); if (m) m.style.display = 'block'; }
function showNewSaleModal() { const m = document.getElementById('newSaleModal'); if (m) m.style.display = 'block'; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

function toggle(id, show) { const el = document.getElementById(id); if (el) el.style.display = show ? 'block' : 'none'; }

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.assign(`${window.location.origin}/auth/index.html`);
}
