-- Agricultural Supply Chain Management System Database Schema
-- Created for SIH Project
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- FARMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    aadhar_number VARCHAR(12) UNIQUE NOT NULL,
    address JSONB NOT NULL,
    farm_details JSONB NOT NULL,
    bank_details JSONB NOT NULL,
    upi_id VARCHAR(255),
    kyc_status VARCHAR(20) DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    kyc_documents JSONB,
    verification_status VARCHAR(20) DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'SUSPENDED')),
    verified_by UUID,
    verification_date TIMESTAMP,
    profile_picture VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    total_transactions INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    preferred_language VARCHAR(20) DEFAULT 'hindi',
    notification_preferences JSONB DEFAULT '{"sms": true, "email": false, "push": true, "whatsapp": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- GOVERNMENT EMPLOYEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS govt_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('QUALITY_INSPECTOR', 'PRICE_APPROVER', 'COLLECTION_CENTER_MANAGER', 'DISTRICT_COORDINATOR', 'STATE_COORDINATOR', 'ADMIN')),
    department VARCHAR(50) NOT NULL CHECK (department IN ('AGRICULTURE', 'HORTICULTURE', 'FOOD_PROCESSING', 'COOPERATIVE', 'MARKETING')),
    designation VARCHAR(100) NOT NULL,
    jurisdiction JSONB NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{"canVerifyCrops": false, "canApprovePrices": false, "canManagePayments": false, "canAccessReports": false, "canManageUsers": false, "canViewTransactions": false}',
    office_address JSONB NOT NULL,
    qualifications JSONB,
    license_number VARCHAR(100) UNIQUE,
    profile_picture VARCHAR(500),
    digital_signature TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    verifications_count INTEGER DEFAULT 0,
    approvals_count INTEGER DEFAULT 0,
    performance_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (performance_rating >= 0 AND performance_rating <= 5),
    working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}, "saturday": {"start": "09:00", "end": "13:00"}, "sunday": null}',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true, "urgentOnly": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    customer_type VARCHAR(20) DEFAULT 'INDIVIDUAL' CHECK (customer_type IN ('INDIVIDUAL', 'RETAILER', 'WHOLESALER', 'RESTAURANT', 'INSTITUTION')),
    business_details JSONB,
    addresses JSONB NOT NULL,
    payment_methods JSONB,
    preferences JSONB DEFAULT '{"organicOnly": false, "localProduce": false, "maxDeliveryDistance": 50, "preferredCrops": [], "priceRange": {"min": 0, "max": 1000}}',
    profile_picture VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    loyalty_points INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true, "orderUpdates": true, "priceAlerts": false, "newProducts": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CROPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_code VARCHAR(30) UNIQUE NOT NULL,
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    crop_type VARCHAR(20) NOT NULL CHECK (crop_type IN ('RICE', 'WHEAT', 'CORN', 'TOMATO', 'POTATO', 'ONION', 'SUGARCANE', 'COTTON', 'SOYBEAN', 'GROUNDNUT', 'SUNFLOWER', 'MILLET', 'BARLEY', 'OTHERS')),
    variety VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('KG', 'QUINTAL', 'TON', 'BAGS')),
    quality_grade VARCHAR(5) CHECK (quality_grade IN ('A+', 'A', 'B+', 'B', 'C')),
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    harvest_date DATE NOT NULL,
    expiry_date DATE,
    farming_method VARCHAR(20) DEFAULT 'CONVENTIONAL' CHECK (farming_method IN ('ORGANIC', 'CONVENTIONAL', 'NATURAL')),
    certifications JSONB,
    crop_images JSONB,
    status VARCHAR(30) DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'LISTED', 'PARTIALLY_SOLD', 'SOLD', 'EXPIRED')),
    verified_by UUID REFERENCES govt_employees(id),
    verification_date TIMESTAMP,
    verification_report JSONB,
    ipfs_hash VARCHAR(255),
    qr_code TEXT,
    base_price DECIMAL(10,2),
    suggested_price DECIMAL(10,2),
    approved_price DECIMAL(10,2),
    price_approved_by UUID REFERENCES govt_employees(id),
    price_approval_date TIMESTAMP,
    market_price DECIMAL(10,2),
    sold_quantity DECIMAL(10,2) DEFAULT 0.00,
    remaining_quantity DECIMAL(10,2),
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    location JSONB NOT NULL,
    weather_conditions JSONB,
    tags JSONB,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    blockchain_tx_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('FARMER_TO_GOVT', 'GOVT_TO_CUSTOMER', 'REFUND', 'FEE', 'BONUS')),
    crop_id UUID NOT NULL REFERENCES crops(id),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    customer_id UUID REFERENCES customers(id),
    govt_employee_id UUID REFERENCES govt_employees(id),
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('KG', 'QUINTAL', 'TON', 'BAGS')),
    price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit > 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED')),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('UPI', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CASH')),
    payment_details JSONB NOT NULL,
    govt_treasury_details JSONB,
    blockchain_tx_hash VARCHAR(255),
    ipfs_hash VARCHAR(255),
    initiated_by VARCHAR(20) NOT NULL CHECK (initiated_by IN ('FARMER', 'CUSTOMER', 'GOVERNMENT', 'SYSTEM')),
    approved_by UUID REFERENCES govt_employees(id),
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    failure_reason TEXT,
    receipt JSONB,
    metadata JSONB,
    notes TEXT,
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE farmers ADD CONSTRAINT fk_farmers_verified_by FOREIGN KEY (verified_by) REFERENCES govt_employees(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_farmers_farmer_code ON farmers(farmer_code);
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);
CREATE INDEX IF NOT EXISTS idx_crops_crop_code ON crops(crop_code);
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_crop_id ON transactions(crop_id);