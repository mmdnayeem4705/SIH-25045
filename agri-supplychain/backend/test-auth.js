// Simple test script for authentication system
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test data
const testFarmer = {
  name: "Test Farmer",
  age: 30,
  dateOfBirth: "1994-01-01",
  gender: "MALE",
  email: "test.farmer@example.com",
  phone: "9876543210",
  aadharNumber: "123456789012",
  address: JSON.stringify({
    street: "Test Street",
    village: "Test Village",
    district: "Delhi",
    state: "Delhi",
    pincode: "110001"
  }),
  farmDetails: JSON.stringify({
    totalLand: "2 acres",
    crops: ["Wheat", "Rice"],
    soilType: "Alluvial",
    irrigationType: "Tube Well"
  }),
  bankDetails: JSON.stringify({
    accountNumber: "1234567890",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    branchName: "Main Branch"
  })
};

const testOfficer = {
  name: "Test Officer",
  age: 35,
  dateOfBirth: "1989-01-01",
  gender: "MALE",
  email: "test.officer@example.com",
  phone: "9876543211",
  aadharNumber: "123456789013",
  role: "QUALITY_INSPECTOR",
  department: "AGRICULTURE",
  designation: "Senior Inspector",
  jurisdiction: JSON.stringify({
    level: "District",
    area: "Delhi",
    district: "Delhi",
    state: "Delhi",
    collectionCenters: ["Center 1", "Center 2"]
  }),
  officeAddress: JSON.stringify({
    office: "Agriculture Office",
    district: "Delhi",
    state: "Delhi",
    pincode: "110001"
  }),
  qualifications: JSON.stringify({
    degree: "B.Sc Agriculture",
    specialization: "Crop Science",
    experience: "5 years"
  })
};

const testCustomer = {
  name: "Test Customer",
  age: 28,
  dateOfBirth: "1996-01-01",
  gender: "FEMALE",
  email: "test.customer@example.com",
  phone: "9876543212",
  aadharNumber: "123456789014",
  customerType: "INDIVIDUAL",
  addresses: JSON.stringify([{
    type: "Home",
    street: "Customer Street",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    isDefault: true
  }]),
  businessDetails: JSON.stringify({
    businessName: "Test Business",
    licenseNumber: "LIC123456",
    gstNumber: "GST123456789",
    businessType: "Retail"
  })
};

async function testAuthentication() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);

    // Test 2: Farmer Registration
    console.log('\n2. Testing Farmer Registration...');
    try {
      const farmerRegResponse = await axios.post(`${API_BASE_URL}/auth/farmer/register`, testFarmer);
      console.log('✅ Farmer Registration:', farmerRegResponse.data.message);
      console.log('   Farmer Code:', farmerRegResponse.data.user.farmerCode);
    } catch (error) {
      console.log('⚠️  Farmer Registration:', error.response?.data?.message || error.message);
    }

    // Test 3: Farmer Login
    console.log('\n3. Testing Farmer Login...');
    try {
      const farmerLoginResponse = await axios.post(`${API_BASE_URL}/auth/farmer/login`, {
        aadharNumber: testFarmer.aadharNumber,
        dateOfBirth: testFarmer.dateOfBirth
      });
      console.log('✅ Farmer Login:', farmerLoginResponse.data.message);
      console.log('   Token received:', !!farmerLoginResponse.data.token);
    } catch (error) {
      console.log('❌ Farmer Login:', error.response?.data?.message || error.message);
    }

    // Test 4: Officer Registration
    console.log('\n4. Testing Officer Registration...');
    try {
      const officerRegResponse = await axios.post(`${API_BASE_URL}/auth/officer/register`, testOfficer);
      console.log('✅ Officer Registration:', officerRegResponse.data.message);
      console.log('   Memo ID:', officerRegResponse.data.user.memoId);
    } catch (error) {
      console.log('⚠️  Officer Registration:', error.response?.data?.message || error.message);
    }

    // Test 5: Officer Login
    console.log('\n5. Testing Officer Login...');
    try {
      const officerLoginResponse = await axios.post(`${API_BASE_URL}/auth/officer/login`, {
        memoId: "AVO24AGDEL001", // This would be generated during registration
        dateOfBirth: testOfficer.dateOfBirth
      });
      console.log('✅ Officer Login:', officerLoginResponse.data.message);
      console.log('   Token received:', !!officerLoginResponse.data.token);
    } catch (error) {
      console.log('❌ Officer Login:', error.response?.data?.message || error.message);
    }

    // Test 6: Customer Registration
    console.log('\n6. Testing Customer Registration...');
    try {
      const customerRegResponse = await axios.post(`${API_BASE_URL}/auth/customer/register`, testCustomer);
      console.log('✅ Customer Registration:', customerRegResponse.data.message);
      console.log('   Customer Code:', customerRegResponse.data.user.customerCode);
    } catch (error) {
      console.log('⚠️  Customer Registration:', error.response?.data?.message || error.message);
    }

    // Test 7: Customer Login
    console.log('\n7. Testing Customer Login...');
    try {
      const customerLoginResponse = await axios.post(`${API_BASE_URL}/auth/customer/login`, {
        aadharNumber: testCustomer.aadharNumber,
        dateOfBirth: testCustomer.dateOfBirth
      });
      console.log('✅ Customer Login:', customerLoginResponse.data.message);
      console.log('   Token received:', !!customerLoginResponse.data.token);
    } catch (error) {
      console.log('❌ Customer Login:', error.response?.data?.message || error.message);
    }

    // Test 8: Invalid Login
    console.log('\n8. Testing Invalid Login...');
    try {
      await axios.post(`${API_BASE_URL}/auth/farmer/login`, {
        aadharNumber: "999999999999",
        dateOfBirth: "1990-01-01"
      });
      console.log('❌ Invalid Login: Should have failed');
    } catch (error) {
      console.log('✅ Invalid Login:', error.response?.data?.message);
    }

    console.log('\n🎉 Authentication System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAuthentication();
}

module.exports = { testAuthentication };
