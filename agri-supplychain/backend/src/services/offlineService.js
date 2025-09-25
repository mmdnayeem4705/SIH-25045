const { Farmer, Crop, GovtEmployee, Transaction } = require('../models');
const { pricingService } = require('./pricingService');
const { paymentService } = require('./paymentService');
const { traceabilityService } = require('./traceabilityService');

class OfflineService {
  constructor() {
    this.collectionCenters = new Map();
    this.offlineTransactions = new Map();
    this.initializeCollectionCenters();
  }

  /**
   * Initialize collection centers for offline support
   */
  initializeCollectionCenters() {
    // Mock collection centers data
    this.collectionCenters.set('CC001', {
      id: 'CC001',
      name: 'District Agriculture Office - Main Center',
      address: {
        street: 'Agriculture Complex',
        village: 'District Headquarters',
        district: 'Sample District',
        state: 'Sample State',
        pincode: '123456'
      },
      coordinates: {
        latitude: 28.6139,
        longitude: 77.2090
      },
      manager: {
        name: 'Dr. Rajesh Kumar',
        phone: '9876543210',
        email: 'rajesh.kumar@agriculture.gov.in'
      },
      workingHours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '13:00' },
        sunday: null
      },
      facilities: ['Crop Verification', 'Quality Testing', 'Price Approval', 'Payment Processing'],
      isActive: true
    });

    this.collectionCenters.set('CC002', {
      id: 'CC002',
      name: 'Rural Agriculture Center - Village A',
      address: {
        street: 'Village Panchayat Office',
        village: 'Village A',
        district: 'Sample District',
        state: 'Sample State',
        pincode: '123457'
      },
      coordinates: {
        latitude: 28.6140,
        longitude: 77.2091
      },
      manager: {
        name: 'Shri Ram Singh',
        phone: '9876543211',
        email: 'ram.singh@agriculture.gov.in'
      },
      workingHours: {
        monday: { start: '10:00', end: '16:00' },
        tuesday: { start: '10:00', end: '16:00' },
        wednesday: { start: '10:00', end: '16:00' },
        thursday: { start: '10:00', end: '16:00' },
        friday: { start: '10:00', end: '16:00' },
        saturday: { start: '10:00', end: '14:00' },
        sunday: null
      },
      facilities: ['Crop Registration', 'Basic Quality Check', 'Payment Collection'],
      isActive: true
    });
  }

  /**
   * Register farmer offline at collection center
   * @param {Object} farmerData - Farmer registration data
   * @param {string} collectionCenterId - Collection center ID
   * @param {string} govtEmployeeId - Government employee ID
   * @returns {Object} Registration result
   */
  async registerFarmerOffline(farmerData, collectionCenterId, govtEmployeeId) {
    try {
      // Validate collection center
      const collectionCenter = this.collectionCenters.get(collectionCenterId);
      if (!collectionCenter || !collectionCenter.isActive) {
        throw new Error('Invalid or inactive collection center');
      }

      // Validate government employee
      const govtEmployee = await GovtEmployee.findByPk(govtEmployeeId);
      if (!govtEmployee || !govtEmployee.isActive) {
        throw new Error('Invalid or inactive government employee');
      }

      // Generate farmer code
      const farmerCode = Farmer.generateFarmerCode(
        farmerData.address.district,
        await this.getNextFarmerSequence(farmerData.address.district)
      );

      // Create farmer record
      const farmer = await Farmer.create({
        ...farmerData,
        farmerCode,
        verificationStatus: 'VERIFIED',
        verifiedBy: govtEmployeeId,
        verificationDate: new Date(),
        isActive: true
      });

      // Create offline registration record
      const offlineRecord = {
        id: `OFF_REG_${Date.now()}`,
        type: 'FARMER_REGISTRATION',
        farmerId: farmer.id,
        collectionCenterId,
        govtEmployeeId,
        data: farmerData,
        timestamp: new Date(),
        status: 'COMPLETED'
      };

      this.offlineTransactions.set(offlineRecord.id, offlineRecord);

      return {
        success: true,
        farmerId: farmer.id,
        farmerCode: farmer.farmerCode,
        offlineRecordId: offlineRecord.id,
        collectionCenter: collectionCenter.name,
        registeredBy: govtEmployee.name,
        message: 'Farmer registered successfully offline'
      };
    } catch (error) {
      console.error('Error registering farmer offline:', error);
      throw error;
    }
  }

  /**
   * Register crop offline at collection center
   * @param {Object} cropData - Crop registration data
   * @param {string} farmerId - Farmer ID
   * @param {string} collectionCenterId - Collection center ID
   * @param {string} govtEmployeeId - Government employee ID
   * @returns {Object} Registration result
   */
  async registerCropOffline(cropData, farmerId, collectionCenterId, govtEmployeeId) {
    try {
      // Validate farmer
      const farmer = await Farmer.findByPk(farmerId);
      if (!farmer || !farmer.isActive) {
        throw new Error('Invalid or inactive farmer');
      }

      // Validate collection center
      const collectionCenter = this.collectionCenters.get(collectionCenterId);
      if (!collectionCenter || !collectionCenter.isActive) {
        throw new Error('Invalid or inactive collection center');
      }

      // Generate crop code
      const cropCode = Crop.generateCropCode(
        cropData.cropType,
        farmer.address.district,
        await this.getNextCropSequence(cropData.cropType, farmer.address.district)
      );

      // Create crop record
      const crop = await Crop.create({
        ...cropData,
        cropCode,
        farmerId,
        status: 'PENDING_VERIFICATION',
        location: {
          ...cropData.location,
          collectionCenter: collectionCenter.name,
          collectionCenterId
        }
      });

      // Create offline crop registration record
      const offlineRecord = {
        id: `OFF_CROP_${Date.now()}`,
        type: 'CROP_REGISTRATION',
        cropId: crop.id,
        farmerId,
        collectionCenterId,
        govtEmployeeId,
        data: cropData,
        timestamp: new Date(),
        status: 'PENDING_VERIFICATION'
      };

      this.offlineTransactions.set(offlineRecord.id, offlineRecord);

      return {
        success: true,
        cropId: crop.id,
        cropCode: crop.cropCode,
        offlineRecordId: offlineRecord.id,
        collectionCenter: collectionCenter.name,
        message: 'Crop registered successfully offline. Verification pending.'
      };
    } catch (error) {
      console.error('Error registering crop offline:', error);
      throw error;
    }
  }

  /**
   * Verify crop offline at collection center
   * @param {string} cropId - Crop ID
   * @param {Object} verificationData - Verification data
   * @param {string} govtEmployeeId - Government employee ID
   * @returns {Object} Verification result
   */
  async verifyCropOffline(cropId, verificationData, govtEmployeeId) {
    try {
      // Get crop
      const crop = await Crop.findByPk(cropId);
      if (!crop) {
        throw new Error('Crop not found');
      }

      // Validate government employee
      const govtEmployee = await GovtEmployee.findByPk(govtEmployeeId);
      if (!govtEmployee || !govtEmployee.isActive) {
        throw new Error('Invalid or inactive government employee');
      }

      // Check if employee has permission to verify crops
      if (!govtEmployee.hasPermission('canVerifyCrops')) {
        throw new Error('Employee does not have permission to verify crops');
      }

      // Get AI price prediction
      const pricePrediction = await pricingService.predictPrice(
        {
          cropType: crop.cropType,
          district: crop.location.district || crop.location.collectionCenter
        },
        await pricingService.getMarketData(crop.cropType, crop.location.district),
        await pricingService.getWeatherData(
          crop.location.coordinates?.latitude,
          crop.location.coordinates?.longitude
        )
      );

      // Update crop with verification data
      await crop.update({
        status: 'VERIFIED',
        verifiedBy: govtEmployeeId,
        verificationDate: new Date(),
        qualityGrade: verificationData.qualityGrade,
        qualityScore: verificationData.qualityScore,
        verificationReport: verificationData.verificationReport,
        basePrice: pricePrediction.basePrice,
        suggestedPrice: pricePrediction.suggestedPrice,
        approvedPrice: verificationData.approvedPrice || pricePrediction.suggestedPrice,
        priceApprovedBy: govtEmployeeId,
        priceApprovalDate: new Date()
      });

      // Update offline record
      const offlineRecord = this.offlineTransactions.get(`OFF_CROP_${cropId}`);
      if (offlineRecord) {
        offlineRecord.status = 'VERIFIED';
        offlineRecord.verificationData = verificationData;
        offlineRecord.verifiedAt = new Date();
      }

      return {
        success: true,
        cropId: crop.id,
        cropCode: crop.cropCode,
        qualityGrade: crop.qualityGrade,
        approvedPrice: crop.approvedPrice,
        verifiedBy: govtEmployee.name,
        verificationDate: crop.verificationDate,
        message: 'Crop verified successfully offline'
      };
    } catch (error) {
      console.error('Error verifying crop offline:', error);
      throw error;
    }
  }

  /**
   * Process payment offline at collection center
   * @param {string} cropId - Crop ID
   * @param {Object} paymentData - Payment data
   * @param {string} govtEmployeeId - Government employee ID
   * @returns {Object} Payment result
   */
  async processPaymentOffline(cropId, paymentData, govtEmployeeId) {
    try {
      // Get crop
      const crop = await Crop.findByPk(cropId);
      if (!crop || crop.status !== 'VERIFIED') {
        throw new Error('Crop not found or not verified');
      }

      // Validate government employee
      const govtEmployee = await GovtEmployee.findByPk(govtEmployeeId);
      if (!govtEmployee || !govtEmployee.isActive) {
        throw new Error('Invalid or inactive government employee');
      }

      // Create transaction
      const transaction = await Transaction.create({
        transactionId: Transaction.generateTransactionId('FARMER_TO_GOVT'),
        type: 'FARMER_TO_GOVT',
        cropId: crop.id,
        farmerId: crop.farmerId,
        quantity: paymentData.quantity,
        unit: crop.unit,
        pricePerUnit: crop.approvedPrice,
        totalAmount: paymentData.quantity * crop.approvedPrice,
        platformFee: (paymentData.quantity * crop.approvedPrice * 2.5) / 100,
        netAmount: (paymentData.quantity * crop.approvedPrice) - ((paymentData.quantity * crop.approvedPrice * 2.5) / 100),
        status: 'PENDING',
        paymentMethod: paymentData.paymentMethod,
        paymentDetails: paymentData.paymentDetails,
        initiatedBy: 'GOVERNMENT',
        approvedBy: govtEmployeeId,
        approvedAt: new Date()
      });

      // Process payment
      const paymentResult = await paymentService.processFarmerPayment({
        transactionId: transaction.transactionId,
        farmerId: crop.farmerId,
        amount: transaction.netAmount,
        paymentMethod: paymentData.paymentMethod,
        paymentDetails: paymentData.paymentDetails
      });

      if (paymentResult.success) {
        // Update crop status
        await crop.update({
          status: 'SOLD',
          soldQuantity: paymentData.quantity,
          totalEarnings: paymentResult.amount
        });

        // Create offline payment record
        const offlineRecord = {
          id: `OFF_PAY_${Date.now()}`,
          type: 'OFFLINE_PAYMENT',
          transactionId: transaction.transactionId,
          cropId,
          farmerId: crop.farmerId,
          collectionCenterId: crop.location.collectionCenterId,
          govtEmployeeId,
          paymentData,
          paymentResult,
          timestamp: new Date(),
          status: 'COMPLETED'
        };

        this.offlineTransactions.set(offlineRecord.id, offlineRecord);

        return {
          success: true,
          transactionId: transaction.transactionId,
          paymentId: paymentResult.paymentId,
          amount: paymentResult.amount,
          receipt: paymentResult.receipt,
          offlineRecordId: offlineRecord.id,
          message: 'Payment processed successfully offline'
        };
      } else {
        throw new Error(paymentResult.error);
      }
    } catch (error) {
      console.error('Error processing payment offline:', error);
      throw error;
    }
  }

  /**
   * Get collection centers by location
   * @param {Object} location - Location data
   * @returns {Array} Collection centers
   */
  getCollectionCentersByLocation(location) {
    const centers = Array.from(this.collectionCenters.values())
      .filter(center => center.isActive)
      .map(center => ({
        id: center.id,
        name: center.name,
        address: center.address,
        coordinates: center.coordinates,
        manager: center.manager,
        workingHours: center.workingHours,
        facilities: center.facilities,
        distance: this.calculateDistance(
          location.latitude,
          location.longitude,
          center.coordinates.latitude,
          center.coordinates.longitude
        )
      }))
      .sort((a, b) => a.distance - b.distance);

    return centers;
  }

  /**
   * Get offline transaction history
   * @param {string} farmerId - Farmer ID
   * @returns {Array} Offline transactions
   */
  getOfflineTransactionHistory(farmerId) {
    return Array.from(this.offlineTransactions.values())
      .filter(record => record.farmerId === farmerId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get collection center details
   * @param {string} centerId - Collection center ID
   * @returns {Object} Collection center details
   */
  getCollectionCenterDetails(centerId) {
    return this.collectionCenters.get(centerId);
  }

  /**
   * Get next farmer sequence number
   */
  async getNextFarmerSequence(district) {
    try {
      const count = await Farmer.count({
        where: {
          address: {
            [require('sequelize').Op.like]: `%"district":"${district}"%`
          }
        }
      });
      return count + 1;
    } catch (error) {
      console.error('Error getting farmer sequence:', error);
      return 1;
    }
  }

  /**
   * Get next crop sequence number
   */
  async getNextCropSequence(cropType, district) {
    try {
      const count = await Crop.count({
        where: {
          cropType,
          location: {
            [require('sequelize').Op.like]: `%"district":"${district}"%`
          }
        }
      });
      return count + 1;
    } catch (error) {
      console.error('Error getting crop sequence:', error);
      return 1;
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 100) / 100;
  }

  /**
   * Convert degrees to radians
   */
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Get offline service statistics
   */
  getOfflineStats() {
    const totalCenters = this.collectionCenters.size;
    const activeCenters = Array.from(this.collectionCenters.values())
      .filter(center => center.isActive).length;
    const totalOfflineTransactions = this.offlineTransactions.size;

    return {
      totalCenters,
      activeCenters,
      totalOfflineTransactions,
      centersByType: {
        main: Array.from(this.collectionCenters.values())
          .filter(center => center.facilities.includes('Crop Verification')).length,
        rural: Array.from(this.collectionCenters.values())
          .filter(center => center.facilities.includes('Crop Registration')).length
      }
    };
  }
}

module.exports = new OfflineService();
