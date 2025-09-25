# Agricultural Supply Chain - Authentication System

## Overview

This document describes the comprehensive authentication system implemented for the Agricultural Supply Chain Management System. The system supports three main user types with role-based access control and secure authentication using Aadhar numbers and date of birth.

## User Roles

### 1. Farmer (Seller)
- **Role**: `FARMER`
- **Authentication**: Aadhar Number + Date of Birth
- **Registration Fields**: Name, Age, DOB, Gender, Email (optional), Phone, Aadhar Number, Address, Farm Details, Bank Details
- **Login Fields**: Aadhar Number, Date of Birth
- **Capabilities**: 
  - Sell crops directly to customers (fixed price)
  - Sell crops to Agricultural Verification Officers (negotiated price)
  - Manage crop listings
  - View transaction history

### 2. Agricultural Verification Officer
- **Role**: `AGRICULTURAL_VERIFICATION_OFFICER`
- **Authentication**: Memo ID + Date of Birth
- **Registration Fields**: Name, Age, DOB, Gender, Email, Phone, Aadhar Number, Role, Department, Designation, Jurisdiction, Office Address, Qualifications
- **Login Fields**: Memo ID, Date of Birth
- **Capabilities**:
  - Verify and analyze crops from farmers
  - Check production weight and quality
  - Generate quality reports
  - Set suitable prices for farmers
  - Sell verified crops to customers
  - Manage collection centers

### 3. Customer (Buyer)
- **Role**: `CUSTOMER`
- **Authentication**: Aadhar Number + Date of Birth
- **Registration Fields**: Name, Age, DOB, Gender, Email, Phone, Aadhar Number, Customer Type, Business Details, Addresses, Payment Methods
- **Login Fields**: Aadhar Number, Date of Birth
- **Capabilities**:
  - Buy crops from farmers (direct purchase)
  - Buy crops from Agricultural Verification Officers
  - Manage purchase history
  - Set preferences for organic/local produce

## Authentication Flow

### Registration Process
1. User selects their role (Farmer/Officer/Customer)
2. Fills out the registration form with required information
3. System validates all input fields
4. Creates user account with generated unique codes:
   - **Farmer**: `FM{YY}{DISTRICT}{SEQUENCE}` (e.g., FM24DEL0001)
   - **Officer**: `AVO{YY}{DEPT}{DISTRICT}{SEQUENCE}` (e.g., AVO24AGDEL001)
   - **Customer**: `CU{YY}{TYPE}{CITY}{SEQUENCE}` (e.g., CU24INMUM0001)
5. Returns JWT token for immediate login

### Login Process
1. User enters role-specific credentials:
   - **Farmer/Customer**: Aadhar Number + Date of Birth
   - **Officer**: Memo ID + Date of Birth
2. System validates credentials
3. Returns JWT token with user information
4. Redirects to appropriate dashboard

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Farmer Authentication
- `POST /api/auth/farmer/register` - Register new farmer
- `POST /api/auth/farmer/login` - Farmer login

#### Agricultural Verification Officer Authentication
- `POST /api/auth/officer/register` - Register new officer
- `POST /api/auth/officer/login` - Officer login

#### Customer Authentication
- `POST /api/auth/customer/register` - Register new customer
- `POST /api/auth/customer/login` - Customer login

#### Profile Management
- `GET /api/auth/profile` - Get current user profile (requires authentication)

## Security Features

### JWT Token Authentication
- Tokens expire after 24 hours
- Contains user ID, role, name, and email
- Required for all protected routes

### Input Validation
- Aadhar number: 12-digit validation
- Phone number: 10-digit Indian mobile format
- Email: Standard email format validation
- Age restrictions:
  - Farmers/Customers: 18-100 years
  - Officers: 21-65 years

### Role-Based Access Control
- Middleware functions for each role:
  - `requireFarmer()` - Farmer-only access
  - `requireOfficer()` - Officer-only access
  - `requireCustomer()` - Customer-only access
  - `requireFarmerOrOfficer()` - Combined access

## Database Models

### Farmer Model
```javascript
{
  id: UUID,
  farmerCode: String (unique),
  name: String,
  age: Integer (18-100),
  dateOfBirth: Date,
  gender: ENUM('MALE', 'FEMALE', 'OTHER'),
  email: String (optional),
  phone: String (unique),
  aadharNumber: String (unique, 12 digits),
  address: JSON,
  farmDetails: JSON,
  bankDetails: JSON,
  // ... other fields
}
```

### AgriculturalVerificationOfficer Model
```javascript
{
  id: UUID,
  memoId: String (unique),
  name: String,
  age: Integer (21-65),
  dateOfBirth: Date,
  gender: ENUM('MALE', 'FEMALE', 'OTHER'),
  email: String (unique),
  phone: String (unique),
  aadharNumber: String (unique, 12 digits),
  role: ENUM('QUALITY_INSPECTOR', 'PRICE_APPROVER', ...),
  department: ENUM('AGRICULTURE', 'HORTICULTURE', ...),
  designation: String,
  jurisdiction: JSON,
  permissions: JSON,
  officeAddress: JSON,
  qualifications: JSON,
  // ... other fields
}
```

### Customer Model
```javascript
{
  id: UUID,
  customerCode: String (unique),
  name: String,
  age: Integer (18-100),
  dateOfBirth: Date,
  gender: ENUM('MALE', 'FEMALE', 'OTHER'),
  email: String (unique),
  phone: String (unique),
  aadharNumber: String (unique, 12 digits),
  customerType: ENUM('INDIVIDUAL', 'RETAILER', 'WHOLESALER', ...),
  businessDetails: JSON,
  addresses: JSON,
  paymentMethods: JSON,
  // ... other fields
}
```

## Frontend Implementation

### Authentication Page Structure
```
/frontend/auth/
├── index.html          # Main authentication page
├── styles.css          # Authentication styles
└── script.js           # Authentication logic
```

### Features
- **Role Selection**: Visual cards for each user type
- **Form Validation**: Real-time input validation
- **Responsive Design**: Mobile-friendly interface
- **Toast Notifications**: User feedback for actions
- **Loading States**: Visual feedback during API calls
- **Auto-redirect**: Seamless navigation to dashboards

### Form Fields by Role

#### Farmer Registration
- Personal: Name, Age, DOB, Gender, Email (optional), Phone, Aadhar
- Business: Address, Farm Details, Bank Details

#### Officer Registration
- Personal: Name, Age, DOB, Gender, Email, Phone, Aadhar
- Professional: Role, Department, Designation, Jurisdiction, Office Address, Qualifications

#### Customer Registration
- Personal: Name, Age, DOB, Gender, Email, Phone, Aadhar
- Business: Customer Type, Business Details, Addresses, Payment Methods

## Usage Examples

### Farmer Registration
```javascript
const farmerData = {
  name: "Ram Singh",
  age: 35,
  dateOfBirth: "1989-05-15",
  gender: "MALE",
  email: "ram.singh@email.com",
  phone: "9876543210",
  aadharNumber: "123456789012",
  address: {
    street: "Village Road",
    village: "Test Village",
    district: "Delhi",
    state: "Delhi",
    pincode: "110001"
  },
  farmDetails: {
    totalLand: "5 acres",
    crops: ["Wheat", "Rice"],
    soilType: "Alluvial",
    irrigationType: "Tube Well"
  },
  bankDetails: {
    accountNumber: "1234567890",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    branchName: "Main Branch"
  }
};
```

### Officer Login
```javascript
const loginData = {
  memoId: "AVO24AGDEL001",
  dateOfBirth: "1985-03-20"
};
```

## Error Handling

### Common Error Responses
```javascript
// Validation Error
{
  success: false,
  message: "Invalid Aadhar number format"
}

// Authentication Error
{
  success: false,
  message: "Invalid credentials"
}

// Duplicate User Error
{
  success: false,
  message: "Farmer with this Aadhar number already exists"
}
```

## Security Considerations

1. **No Password Storage**: Uses Aadhar + DOB for authentication
2. **JWT Expiration**: Tokens expire after 24 hours
3. **Input Sanitization**: All inputs are validated and sanitized
4. **Rate Limiting**: API endpoints are rate-limited
5. **CORS Configuration**: Proper CORS setup for security
6. **Helmet Security**: Security headers using Helmet.js

## Future Enhancements

1. **OTP Verification**: SMS/Email OTP for additional security
2. **Biometric Authentication**: Integration with Aadhar biometrics
3. **Multi-factor Authentication**: Additional security layers
4. **Session Management**: Advanced session handling
5. **Audit Logging**: Comprehensive audit trails
6. **Password Recovery**: Alternative authentication methods

## Getting Started

1. **Start the Backend Server**:
   ```bash
   cd agri-supplychain/backend
   npm install
   npm start
   ```

2. **Access Authentication Page**:
   ```
   http://localhost:3000/frontend/auth/index.html
   ```

3. **Test Registration/Login**:
   - Select a role (Farmer/Officer/Customer)
   - Fill out the registration form
   - Or use existing credentials to login

## Support

For issues or questions regarding the authentication system, please refer to the main project documentation or contact the development team.

