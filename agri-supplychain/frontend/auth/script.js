// Authentication JavaScript
const API_BASE_URL = 'http://localhost:3000/api';
// MetaMask address format validation only; no fixed required address enforced

// DOM Elements
const roleCards = document.querySelectorAll('.role-card');
const authForms = document.getElementById('authForms');
const toastContainer = document.getElementById('toastContainer');

// State Management
let currentRole = null;
let currentTab = 'login';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkForExistingAuth();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Form submissions
    document.getElementById('farmerLoginForm')?.addEventListener('submit', handleFarmerLogin);
    document.getElementById('farmerRegisterForm')?.addEventListener('submit', handleFarmerRegister);
    document.getElementById('officerLoginForm')?.addEventListener('submit', handleOfficerLogin);
    document.getElementById('officerRegisterForm')?.addEventListener('submit', handleOfficerRegister);
    document.getElementById('customerLoginForm')?.addEventListener('submit', handleCustomerLogin);
    document.getElementById('customerRegisterForm')?.addEventListener('submit', handleCustomerRegister);

    // Input validation
    setupInputValidation();
}

function assertWalletFieldOrThrow(data) {
    const addr = (data.walletAddress || '').toLowerCase().trim();
    if (!/^0x[a-f0-9]{40}$/.test(addr)) {
        throw new Error('Enter a valid MetaMask address (0x...)');
    }
}

// Check for existing authentication
function checkForExistingAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token and redirect to appropriate dashboard
        verifyTokenAndRedirect(token);
    }
}

// Verify token and redirect to appropriate dashboard
async function verifyTokenAndRedirect(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            redirectToDashboard(data.user.role);
        } else {
            localStorage.removeItem('authToken');
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('authToken');
    }
}

// Role selection
function selectRole(role) {
    currentRole = role;
    showAuthForm(role);
}

// Show role selection cards
function showRoleSelection() {
    document.querySelector('.role-cards').style.display = 'grid';
    authForms.style.display = 'none';
    currentRole = null;
}

// Show authentication form for selected role
function showAuthForm(role) {
    document.querySelector('.role-cards').style.display = 'none';
    authForms.style.display = 'block';
    
    // Hide all auth forms
    document.querySelectorAll('.auth-form-container').forEach(form => {
        form.classList.remove('active');
        form.style.display = 'none';
    });
    
    // Show selected role form
    const selectedForm = document.getElementById(`${role}Auth`);
    if (selectedForm) {
        selectedForm.style.display = 'block';
        selectedForm.classList.add('active');
        showTab(role, 'login');
    }
}

// Show specific tab (login/register)
function showTab(role, tab) {
    currentTab = tab;
    
    // Update tab buttons
    const formContainer = document.getElementById(`${role}Auth`);
    const tabButtons = formContainer.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeTabBtn = formContainer.querySelector(`[onclick="showTab('${role}', '${tab}')"]`);
    if (activeTabBtn) {
        activeTabBtn.classList.add('active');
    }
    
    // Show/hide form content
    const loginForm = document.getElementById(`${role}Login`);
    const registerForm = document.getElementById(`${role}Register`);
    
    if (loginForm && registerForm) {
        loginForm.style.display = tab === 'login' ? 'block' : 'none';
        registerForm.style.display = tab === 'register' ? 'block' : 'none';
    }
}

// Setup input validation
function setupInputValidation() {
    // Aadhar number validation
    document.querySelectorAll('input[name="aadharNumber"]').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 12);
        });
    });

    // Phone number validation
    document.querySelectorAll('input[name="phone"]').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 10);
        });
    });

    // Age validation
    document.querySelectorAll('input[name="age"]').forEach(input => {
        input.addEventListener('input', function() {
            const role = this.closest('.auth-form-container').id.replace('Auth', '');
            const maxAge = role === 'officer' ? 65 : 100;
            const minAge = role === 'officer' ? 21 : 18;
            
            if (this.value > maxAge) this.value = maxAge;
            if (this.value < minAge) this.value = minAge;
        });
    });
}

// ==================== FARMER AUTHENTICATION ====================

async function handleFarmerLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try { assertWalletFieldOrThrow(data); } catch (err) { showToast('error', err.message); return; }
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        const response = await fetch(`${API_BASE_URL}/auth/farmer/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userRole', 'FARMER');
            showToast('success', 'Login successful! Redirecting...');
            setTimeout(() => redirectToDashboard('FARMER'), 1500);
        } else {
            showToast('error', result.message);
        }
    } catch (error) {
        showToast('error', 'Login failed. Please try again.');
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

async function handleFarmerRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try { assertWalletFieldOrThrow(data); } catch (err) { showToast('error', err.message); return; }
    // Client-side validation to prevent 400/500
    if (!validateAadhar(data.aadharNumber)) { showToast('error', 'Enter a valid 12-digit Aadhar number'); return; }
    if (!validatePhone(data.phone)) { showToast('error', 'Enter a valid 10-digit phone (starts 6-9)'); return; }
    if (data.email && !validateEmail(data.email)) { showToast('error', 'Enter a valid email'); return; }
    
    // Format address as JSON
    data.address = {
        street: data.street,
        village: data.village,
        district: data.district,
        state: data.state,
        pincode: data.pincode
    };
    
    // Format farm details as JSON
    data.farmDetails = {
        size: parseFloat(data.farmSize),
        cropTypes: data.cropTypes.split(',').map(crop => crop.trim())
    };
    
    // Format bank details as JSON
    data.bankDetails = {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode
    };
    
    // Remove the individual fields that are now part of JSON objects
    delete data.street;
    delete data.village;
    delete data.district;
    delete data.state;
    delete data.pincode;
    delete data.farmSize;
    delete data.cropTypes;
    delete data.bankName;
    delete data.accountNumber;
    delete data.ifscCode;
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        const response = await fetch(`${API_BASE_URL}/auth/farmer/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userRole', 'FARMER');
            showToast('success', 'Registration successful! Redirecting...');
            setTimeout(() => redirectToDashboard('FARMER'), 1500);
        } else {
            showToast('error', result.message || 'Registration failed');
        }
    } catch (error) {
        showToast('error', 'Registration failed. Please try again.');
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

// ==================== AGRICULTURAL VERIFICATION OFFICER AUTHENTICATION ====================

async function handleOfficerLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try { assertWalletFieldOrThrow(data); } catch (err) { showToast('error', err.message); return; }
    if (!validateAadhar(data.aadharNumber)) { showToast('error', 'Enter a valid 12-digit Aadhar number'); return; }
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        const response = await fetch(`${API_BASE_URL}/auth/officer/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userRole', 'AGRICULTURAL_VERIFICATION_OFFICER');
            showToast('success', 'Login successful! Redirecting...');
            setTimeout(() => redirectToDashboard('AGRICULTURAL_VERIFICATION_OFFICER'), 1500);
        } else {
            showToast('error', result.message);
        }
    } catch (error) {
        showToast('error', 'Login failed. Please try again.');
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

async function handleOfficerRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try { assertWalletFieldOrThrow(data); } catch (err) { showToast('error', err.message); return; }
    
    // Format jurisdiction as JSON
    data.jurisdiction = {
        district: data.district,
        state: data.state
    };
    
    // Format office address as JSON
    data.officeAddress = {
        street: data.officeStreet,
        city: data.officeCity,
        pincode: data.officePincode
    };
    
    // Remove the individual fields that are now part of JSON objects
    delete data.district;
    delete data.state;
    delete data.officeStreet;
    delete data.officeCity;
    delete data.officePincode;
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        const response = await fetch(`${API_BASE_URL}/auth/officer/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userRole', 'AGRICULTURAL_VERIFICATION_OFFICER');
            showToast('success', 'Registration successful! Redirecting...');
            setTimeout(() => redirectToDashboard('AGRICULTURAL_VERIFICATION_OFFICER'), 1500);
        } else {
            showToast('error', result.message);
        }
    } catch (error) {
        showToast('error', 'Registration failed. Please try again.');
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

// ==================== CUSTOMER AUTHENTICATION ====================

async function handleCustomerLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try { assertWalletFieldOrThrow(data); } catch (err) { showToast('error', err.message); return; }
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        const response = await fetch(`${API_BASE_URL}/auth/customer/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userRole', 'CUSTOMER');
            showToast('success', 'Login successful! Redirecting...');
            setTimeout(() => redirectToDashboard('CUSTOMER'), 1500);
        } else {
            showToast('error', result.message);
        }
    } catch (error) {
        showToast('error', 'Login failed. Please try again.');
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

async function handleCustomerRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try { assertWalletFieldOrThrow(data); } catch (err) { showToast('error', err.message); return; }
    
    // Format addresses as JSON
    data.addresses = [{
        street: data.street,
        city: data.city,
        district: data.district,
        state: data.state,
        pincode: data.pincode
    }];
    
    // Format business details as JSON (if provided)
    if (data.businessName || data.businessType) {
        data.businessDetails = {
            name: data.businessName || '',
            type: data.businessType || ''
        };
    }
    
    // Remove the individual fields that are now part of JSON objects
    delete data.street;
    delete data.city;
    delete data.district;
    delete data.state;
    delete data.pincode;
    delete data.businessName;
    delete data.businessType;
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        const response = await fetch(`${API_BASE_URL}/auth/customer/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userRole', 'CUSTOMER');
            showToast('success', 'Registration successful! Redirecting...');
            setTimeout(() => redirectToDashboard('CUSTOMER'), 1500);
        } else {
            showToast('error', result.message);
        }
    } catch (error) {
        showToast('error', 'Registration failed. Please try again.');
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Show loading state
function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span> Processing...';
}

// Hide loading state
function hideLoading(button) {
    button.disabled = false;
    const role = currentRole;
    const action = currentTab === 'login' ? 'Login' : 'Register';
    const icon = currentTab === 'login' ? 'fas fa-sign-in-alt' : 'fas fa-user-plus';
    button.innerHTML = `<i class="${icon}"></i> ${action}`;
}

// Show toast notification
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icon}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Get toast icon based on type
function getToastIcon(type) {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Redirect to appropriate dashboard
function redirectToDashboard(role) {
    const dashboards = {
        'FARMER': '/farmer-app/index.html',
        'AGRICULTURAL_VERIFICATION_OFFICER': '/govt-portal/index.html',
        'CUSTOMER': '/customer-app/index.html'
    };
    const dashboardPath = dashboards[role];
    if (dashboardPath) {
        const target = `${window.location.origin}${dashboardPath}`;
        window.location.assign(target);
    } else {
        showToast('error', 'Invalid user role');
    }
}

// Validate Aadhar number
function validateAadhar(aadharNumber) {
    return /^\d{12}$/.test(aadharNumber);
}

// Validate phone number
function validatePhone(phoneNumber) {
    return /^[6-9]\d{9}$/.test(phoneNumber);
}

// Validate email
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Format JSON input helper
function formatJsonInput(textarea) {
    try {
        const parsed = JSON.parse(textarea.value);
        textarea.value = JSON.stringify(parsed, null, 2);
    } catch (error) {
        // Invalid JSON, don't format
    }
}

// Add JSON formatting to textareas
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('textarea[name="address"], textarea[name="farmDetails"], textarea[name="bankDetails"], textarea[name="jurisdiction"], textarea[name="officeAddress"], textarea[name="qualifications"], textarea[name="addresses"], textarea[name="businessDetails"]').forEach(textarea => {
        textarea.addEventListener('blur', function() {
            if (this.value.trim()) {
                formatJsonInput(this);
            }
        });
    });
});

