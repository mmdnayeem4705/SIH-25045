// Farmer Dashboard JavaScript
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Farmer dashboard loaded!');
    loadUserInfo();
    loadDashboardData();
    loadMyCrops();
    
    // Test if the function is available
    console.log('showDirectSelling function available:', typeof showDirectSelling);
    
    // Add event listener for direct selling card
    // Link now navigates via anchor; keep fallback only if needed
    const directSellingCard = document.getElementById('directSellingCard');
    if (!directSellingCard) {
        console.error('Direct selling card not found!');
    }
    
    // Add event listener for officer contact card
    const officerContactCard = document.getElementById('officerContactCard');
    if (officerContactCard) {
        officerContactCard.addEventListener('click', function() {
            console.log('Officer Contact card clicked via event listener!');
            showOfficerContact();
        });
        console.log('Event listener added to officer contact card');
    } else {
        console.error('Officer contact card not found!');
    }
});

// Load user information
function loadUserInfo() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/auth/index.html';
        return;
    }

    fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('userCode').textContent = data.user.farmerCode || 'N/A';
        }
    })
    .catch(error => {
        console.error('Error loading user info:', error);
    });
}

// Load dashboard data
function loadDashboardData() {
    // Load stats and other dashboard data
    // This would typically fetch from the backend
    updateStats();
}

// Update dashboard statistics
function updateStats() {
    // Mock data for now - replace with actual API calls
    document.getElementById('totalCrops').textContent = '0';
    document.getElementById('totalEarnings').textContent = '₹0';
    document.getElementById('totalTransactions').textContent = '0';
    document.getElementById('farmerRating').textContent = '0.0';
    document.getElementById('directSalesCount').textContent = '0';
    document.getElementById('directSalesRevenue').textContent = '₹0';
    document.getElementById('officerRequestsCount').textContent = '0';
    document.getElementById('officerSalesRevenue').textContent = '₹0';
}

// Load current farmer's crops into the listings grid (uses /api/crops/farmer/:farmerId)
function loadMyCrops() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    // We need the farmer id; fetch profile first
    fetch(`${API_BASE_URL}/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (!res?.success) return;
        const farmerId = res.user.id;
        return fetch(`${API_BASE_URL}/crops/farmer/${farmerId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      })
      .then(r => r ? r.json() : null)
      .then(res => {
        if (!res?.success) return;
        renderFarmerCrops(res.data || []);
      })
      .catch(() => {});
}

function renderFarmerCrops(crops) {
    const grid = document.getElementById('cropListingsGrid');
    if (!grid) return;
    if (!Array.isArray(crops) || crops.length === 0) {
        grid.innerHTML = '<p>No listings yet. Click "Add New Crop Listing" to create one.</p>';
        return;
    }
    grid.innerHTML = crops.map(crop => {
        const name = crop.name || crop.variety || crop.cropType || 'Crop';
        const qty = crop.quantity ?? 0;
        const unit = crop.unit || crop.quantityUnit || 'KG';
        const price = crop.approvedPrice ?? crop.pricePerUnit ?? 0;
        const status = crop.status || 'LISTED';
        return `
            <div class="listing-card">
                <div class="listing-header">
                    <h4>${name}</h4>
                    <span class="badge">${status}</span>
                </div>
                <div class="listing-body">
                    <div>Quantity: ${qty} ${unit}</div>
                    <div>Price: ₹${price}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Show direct selling section
// Deprecated: direct navigation is handled by anchor in HTML
function showDirectSelling() {
    window.location.assign(`${window.location.origin}/farmer-app/direct-sell.html`);
}

// Show officer contact section
function showOfficerContact() {
    console.log('Showing officer contact section');
    
    // Sample officer data
    const officers = [
        {
            memoId: 'AVO25001',
            name: 'Dr. Priya Sharma',
            age: 28,
            dob: '1995-07-22',
            gender: 'FEMALE',
            email: 'priya.sharma@gov.in',
            phone: '9876543211',
            aadhar: '234567890123',
            role: 'QUALITY_INSPECTOR',
            department: 'AGRICULTURE',
            designation: 'Agricultural Quality Inspector',
            address: '456 Govt Complex, Indore, Madhya Pradesh, 452001',
            qualifications: 'B.Sc Agriculture, M.Sc Agronomy, 3 yrs experience'
        },
        {
            memoId: 'AVO25002',
            name: 'Anil Verma',
            age: 33,
            dob: '1990-02-11',
            gender: 'MALE',
            email: 'anil.verma@gov.in',
            phone: '9876543216',
            aadhar: '678901234567',
            role: 'FIELD_SUPERVISOR',
            department: 'AGRICULTURE',
            designation: 'Crop Quality Supervisor',
            address: '77 Agri Dept Block, Lucknow, Uttar Pradesh, 226001',
            qualifications: 'M.Sc Soil Science, 5 yrs experience'
        },
        {
            memoId: 'AVO25003',
            name: 'Kavitha Reddy',
            age: 31,
            dob: '1992-12-05',
            gender: 'FEMALE',
            email: 'kavitha.reddy@gov.in',
            phone: '9876543217',
            aadhar: '789012345678',
            role: 'SENIOR_AGRONOMIST',
            department: 'AGRICULTURE',
            designation: 'Senior Agricultural Analyst',
            address: '89 Krishi Bhawan, Vijayawada, Andhra Pradesh, 520001',
            qualifications: 'Ph.D Agronomy, 6 yrs experience'
        }
    ];
    
    // Create officer cards HTML
    let officersHTML = '';
    officers.forEach(officer => {
        officersHTML += `
            <div class="officer-card">
                <div class="officer-header">
                    <div class="officer-avatar">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="officer-info">
                        <h3>${officer.name}</h3>
                        <p class="officer-designation">${officer.designation}</p>
                        <p class="officer-memo">Memo ID: ${officer.memoId}</p>
                    </div>
                </div>
                <div class="officer-details">
                    <div class="detail-row">
                        <span class="detail-label">Department:</span>
                        <span class="detail-value">${officer.department}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Experience:</span>
                        <span class="detail-value">${officer.qualifications}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${officer.address}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Contact:</span>
                        <span class="detail-value">${officer.phone} | ${officer.email}</span>
                    </div>
                </div>
                <div class="officer-actions">
                    <button class="btn btn-primary" onclick="contactOfficer('${officer.memoId}', '${officer.name}')">
                        <i class="fas fa-phone"></i> Contact Officer
                    </button>
                    <button class="btn btn-secondary" onclick="requestVerification('${officer.memoId}', '${officer.name}')">
                        <i class="fas fa-clipboard-check"></i> Request Verification
                    </button>
                </div>
            </div>
        `;
    });
    
    // Show officers in a modal
    showOfficersModal(officersHTML);
}

// Show officers modal
function showOfficersModal(officersHTML) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('officersModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'officersModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-users"></i> Available Agricultural Verification Officers</h2>
                    <button class="close-btn" onclick="closeModal('officersModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="officers-grid" id="officersGrid">
                        ${officersHTML}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById('officersGrid').innerHTML = officersHTML;
    }
    
    modal.style.display = 'block';
}

// Contact officer function
function contactOfficer(memoId, name) {
    console.log(`Contacting officer: ${name} (${memoId})`);
    showToast('success', `Contacting ${name}... You will receive a call shortly.`);
    // Here you would implement actual contact functionality
}

// Request verification function
function requestVerification(memoId, name) {
    console.log(`Requesting verification from: ${name} (${memoId})`);
    showToast('success', `Verification request sent to ${name}. They will contact you soon.`);
    // Here you would implement actual verification request functionality
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Load nearby officers
function loadOfficers() {
    // Mock data for now - replace with actual API calls
    const officersGrid = document.getElementById('officersGrid');
    officersGrid.innerHTML = `
        <div class="officer-card">
            <div class="officer-info">
                <h4>Rajesh Kumar</h4>
                <p>Agricultural Verification Officer</p>
                <p>District: Kurnool</p>
                <p>Phone: +91 9876543210</p>
            </div>
            <button class="btn btn-primary" onclick="requestOfficerVisit('officer1')">
                Request Visit
            </button>
        </div>
    `;
}

// Show add crop modal
function showAddCropModal() {
    document.getElementById('addCropModal').style.display = 'flex';
}

// Show request officer modal
function showRequestOfficerModal() {
    document.getElementById('requestOfficerModal').style.display = 'flex';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Request officer visit
function requestOfficerVisit(officerId) {
    showRequestOfficerModal();
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.assign(`${window.location.origin}/auth/index.html`);
} 
