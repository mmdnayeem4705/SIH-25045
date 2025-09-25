// Customer Dashboard JavaScript
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadCustomerAvailableCrops();
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
            document.getElementById('userName').textContent = data.user.name || 'Customer';
            document.getElementById('userCode').textContent = data.user.customerCode || 'N/A';
        }
    })
    .catch(() => {});
}

function showBuyFromFarmers() {
    toggleSection('buyFromFarmersSection', true);
    toggleSection('buyFromOfficersSection', false);
}

function showBuyFromOfficers() {
    toggleSection('buyFromFarmersSection', false);
    toggleSection('buyFromOfficersSection', true);
}

function toggleSection(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
}

function filterFarmerCrops() {}
function filterOfficerCrops() {}
function filterPurchaseHistory() {}
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.assign(`${window.location.origin}/auth/index.html`);
}

// Load available crops for customers (from /api/crops/available)
function loadCustomerAvailableCrops() {
    fetch(`${API_BASE_URL}/crops/available`)
      .then(r => r.json())
      .then(res => {
        if (!res?.success) return;
        const list = res.data || [];
        renderCropsGrid('farmerCropsGrid', list);
        // Default to show Farmers tab
        showBuyFromFarmers();
      })
      .catch(() => {});
}

function renderCropsGrid(containerId, crops) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    if (!Array.isArray(crops) || crops.length === 0) {
        grid.innerHTML = '<p>No crops available right now.</p>';
        return;
    }
    grid.innerHTML = crops.map(crop => {
        const name = crop.name || crop.variety || crop.cropType || 'Crop';
        const qty = crop.quantity ?? 0;
        const unit = crop.unit || crop.quantityUnit || 'KG';
        const price = crop.approvedPrice ?? crop.pricePerUnit ?? 0;
        const grade = crop.qualityGrade || '-';
        return `
            <div class="crop-card">
                <div class="crop-header">
                    <h4>${name}</h4>
                    <span class="badge">${crop.status || ''}</span>
                </div>
                <div class="crop-body">
                    <div>Quantity: ${qty} ${unit}</div>
                    <div>Price: ₹${price}</div>
                    <div>Grade: ${grade}</div>
                </div>
                <div class="crop-actions">
                    <button class="btn btn-primary" onclick="openPurchase('${crop.id || ''}', '${name}', ${qty}, ${price})">Buy</button>
                </div>
            </div>
        `;
    }).join('');
}

function openPurchase(cropId, name, maxQty, pricePerKg) {
    document.getElementById('purchaseCropName').textContent = name;
    document.getElementById('maxQuantity').textContent = maxQty || 0;
    document.getElementById('purchasePricePerKg').textContent = pricePerKg || 0;
    const modal = document.getElementById('purchaseModal');
    if (modal) modal.style.display = 'block';
}
