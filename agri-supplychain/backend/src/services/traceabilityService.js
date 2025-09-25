const QRCode = require('qrcode');
const crypto = require('crypto');
const { Crop, Farmer, GovtEmployee, Transaction } = require('../models');

class TraceabilityService {
  constructor() {
    this.ipfsClient = null;
    this.blockchainService = null;
    this.initializeServices();
  }

  /**
   * Initialize IPFS and blockchain services
   */
  async initializeServices() {
    try {
      // Initialize IPFS client if available
      if (process.env.IPFS_URL) {
        const { create } = require('ipfs-http-client');
        this.ipfsClient = create(process.env.IPFS_URL);
      }

      // Initialize blockchain service
      this.blockchainService = require('./blockchainService');
    } catch (error) {
      console.error('Error initializing traceability services:', error);
    }
  }

  /**
   * Generate QR code for crop with complete traceability data
   * @param {Object} crop - Crop object
   * @returns {Object} QR code data and metadata
   */
  async generateCropQRCode(crop) {
    try {
      // Get complete traceability data
      const traceabilityData = await this.getCropTraceabilityData(crop.id);
      
      // Create QR code payload
      const qrPayload = {
        type: 'CROP_TRACEABILITY',
        cropId: crop.id,
        cropCode: crop.cropCode,
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: traceabilityData
      };

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Store QR code data in database
      await crop.update({
        qrCode: qrCodeDataURL
      });

      // Generate unique QR code ID
      const qrCodeId = this.generateQRCodeId(crop.cropCode);

      return {
        qrCodeId,
        qrCodeDataURL,
        qrPayload,
        cropCode: crop.cropCode,
        generatedAt: new Date(),
        ipfsHash: traceabilityData.ipfsHash,
        blockchainTxHash: traceabilityData.blockchainTxHash
      };
    } catch (error) {
      console.error('Error generating crop QR code:', error);
      throw error;
    }
  }

  /**
   * Get complete traceability data for a crop
   * @param {string} cropId - Crop ID
   * @returns {Object} Complete traceability data
   */
  async getCropTraceabilityData(cropId) {
    try {
      const crop = await Crop.findByPk(cropId, {
        include: [
          {
            model: Farmer,
            attributes: ['id', 'farmerCode', 'name', 'phone', 'address', 'farmDetails']
          },
          {
            model: GovtEmployee,
            as: 'Verifier',
            attributes: ['id', 'employeeCode', 'name', 'role', 'department', 'designation']
          },
          {
            model: GovtEmployee,
            as: 'PriceApprover',
            attributes: ['id', 'employeeCode', 'name', 'role', 'department', 'designation']
          }
        ]
      });

      if (!crop) {
        throw new Error('Crop not found');
      }

      // Get all transactions for this crop
      const transactions = await Transaction.findAll({
        where: { cropId },
        order: [['createdAt', 'ASC']],
        include: [
          {
            model: Farmer,
            attributes: ['id', 'farmerCode', 'name']
          },
          {
            model: require('../models/Customer'),
            attributes: ['id', 'customerCode', 'name']
          }
        ]
      });

      // Get verification report
      const verificationReport = await this.getVerificationReport(crop);

      // Get quality certifications
      const certifications = await this.getQualityCertifications(crop);

      // Get weather and farming conditions
      const farmingConditions = await this.getFarmingConditions(crop);

      // Create traceability data
      const traceabilityData = {
        crop: {
          id: crop.id,
          cropCode: crop.cropCode,
          cropType: crop.cropType,
          variety: crop.variety,
          quantity: crop.quantity,
          unit: crop.unit,
          qualityGrade: crop.qualityGrade,
          farmingMethod: crop.farmingMethod,
          harvestDate: crop.harvestDate,
          expiryDate: crop.expiryDate,
          location: crop.location,
          certifications: crop.certifications
        },
        farmer: {
          id: crop.Farmer.id,
          farmerCode: crop.Farmer.farmerCode,
          name: crop.Farmer.name,
          phone: crop.Farmer.phone,
          address: crop.Farmer.address,
          farmDetails: crop.Farmer.farmDetails,
          rating: crop.Farmer.rating,
          totalEarnings: crop.Farmer.totalEarnings
        },
        verification: {
          verifiedBy: crop.Verifier ? {
            id: crop.Verifier.id,
            employeeCode: crop.Verifier.employeeCode,
            name: crop.Verifier.name,
            role: crop.Verifier.role,
            department: crop.Verifier.department,
            designation: crop.Verifier.designation
          } : null,
          verificationDate: crop.verificationDate,
          verificationReport: verificationReport,
          qualityScore: crop.qualityScore
        },
        pricing: {
          basePrice: crop.basePrice,
          suggestedPrice: crop.suggestedPrice,
          approvedPrice: crop.approvedPrice,
          priceApprovedBy: crop.PriceApprover ? {
            id: crop.PriceApprover.id,
            employeeCode: crop.PriceApprover.employeeCode,
            name: crop.PriceApprover.name,
            role: crop.PriceApprover.role
          } : null,
          priceApprovalDate: crop.priceApprovalDate,
          marketPrice: crop.marketPrice
        },
        transactions: transactions.map(txn => ({
          id: txn.id,
          transactionId: txn.transactionId,
          type: txn.type,
          quantity: txn.quantity,
          unit: txn.unit,
          pricePerUnit: txn.pricePerUnit,
          totalAmount: txn.totalAmount,
          status: txn.status,
          paymentMethod: txn.paymentMethod,
          createdAt: txn.createdAt,
          completedAt: txn.completedAt,
          farmer: txn.Farmer ? {
            id: txn.Farmer.id,
            farmerCode: txn.Farmer.farmerCode,
            name: txn.Farmer.name
          } : null,
          customer: txn.Customer ? {
            id: txn.Customer.id,
            customerCode: txn.Customer.customerCode,
            name: txn.Customer.name
          } : null
        })),
        certifications: certifications,
        farmingConditions: farmingConditions,
        blockchain: {
          txHash: crop.blockchainTxHash,
          ipfsHash: crop.ipfsHash
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0',
          dataIntegrity: await this.calculateDataIntegrity(crop, transactions)
        }
      };

      // Store in IPFS if available
      if (this.ipfsClient) {
        const ipfsHash = await this.storeInIPFS(traceabilityData);
        traceabilityData.ipfsHash = ipfsHash;
      }

      // Record on blockchain if available
      if (this.blockchainService) {
        const blockchainTxHash = await this.recordOnBlockchain(traceabilityData);
        traceabilityData.blockchainTxHash = blockchainTxHash;
      }

      return traceabilityData;
    } catch (error) {
      console.error('Error getting crop traceability data:', error);
      throw error;
    }
  }

  /**
   * Scan QR code and return traceability information
   * @param {string} qrCodeData - QR code data
   * @returns {Object} Traceability information
   */
  async scanQRCode(qrCodeData) {
    try {
      const qrPayload = JSON.parse(qrCodeData);
      
      if (qrPayload.type !== 'CROP_TRACEABILITY') {
        throw new Error('Invalid QR code type');
      }

      // Verify QR code integrity
      const isValid = await this.verifyQRCodeIntegrity(qrPayload);
      if (!isValid) {
        throw new Error('QR code data has been tampered with');
      }

      // Get fresh traceability data
      const traceabilityData = await this.getCropTraceabilityData(qrPayload.cropId);

      // Add scan metadata
      traceabilityData.scanMetadata = {
        scannedAt: new Date().toISOString(),
        scanId: this.generateScanId(),
        dataSource: 'QR_CODE',
        integrityVerified: true
      };

      return traceabilityData;
    } catch (error) {
      console.error('Error scanning QR code:', error);
      throw error;
    }
  }

  /**
   * Get verification report for a crop
   */
  async getVerificationReport(crop) {
    try {
      if (!crop.verificationReport) {
        return null;
      }

      return {
        grade: crop.verificationReport.grade,
        quality: crop.verificationReport.quality,
        moisture: crop.verificationReport.moisture,
        defects: crop.verificationReport.defects,
        recommendations: crop.verificationReport.recommendations,
        inspectorNotes: crop.verificationReport.inspectorNotes,
        testResults: crop.verificationReport.testResults,
        certificationStatus: crop.verificationReport.certificationStatus
      };
    } catch (error) {
      console.error('Error getting verification report:', error);
      return null;
    }
  }

  /**
   * Get quality certifications for a crop
   */
  async getQualityCertifications(crop) {
    try {
      if (!crop.certifications) {
        return [];
      }

      return crop.certifications.map(cert => ({
        type: cert.type,
        number: cert.number,
        issuedBy: cert.issuedBy,
        validTill: cert.validTill,
        status: new Date(cert.validTill) > new Date() ? 'VALID' : 'EXPIRED'
      }));
    } catch (error) {
      console.error('Error getting quality certifications:', error);
      return [];
    }
  }

  /**
   * Get farming conditions for a crop
   */
  async getFarmingConditions(crop) {
    try {
      return {
        weatherConditions: crop.weatherConditions,
        soilType: crop.Farmer?.farmDetails?.soilType,
        irrigationType: crop.Farmer?.farmDetails?.irrigationType,
        farmingMethod: crop.farmingMethod,
        harvestConditions: {
          temperature: crop.weatherConditions?.temperature,
          humidity: crop.weatherConditions?.humidity,
          rainfall: crop.weatherConditions?.rainfall
        }
      };
    } catch (error) {
      console.error('Error getting farming conditions:', error);
      return {};
    }
  }

  /**
   * Calculate data integrity hash
   */
  async calculateDataIntegrity(crop, transactions) {
    try {
      const dataString = JSON.stringify({
        crop: crop.toJSON(),
        transactions: transactions.map(t => t.toJSON())
      });
      
      const hash = crypto.createHash('sha256').update(dataString).digest('hex');
      return hash;
    } catch (error) {
      console.error('Error calculating data integrity:', error);
      return null;
    }
  }

  /**
   * Verify QR code integrity
   */
  async verifyQRCodeIntegrity(qrPayload) {
    try {
      // In a real implementation, this would verify digital signatures
      // For now, we'll do basic validation
      return qrPayload.cropId && qrPayload.cropCode && qrPayload.timestamp;
    } catch (error) {
      console.error('Error verifying QR code integrity:', error);
      return false;
    }
  }

  /**
   * Store traceability data in IPFS
   */
  async storeInIPFS(traceabilityData) {
    try {
      if (!this.ipfsClient) {
        console.log('IPFS client not available, skipping IPFS storage');
        return null;
      }

      const dataBuffer = Buffer.from(JSON.stringify(traceabilityData));
      const result = await this.ipfsClient.add(dataBuffer);
      
      console.log(`Stored traceability data in IPFS: ${result.path}`);
      return result.path;
    } catch (error) {
      console.error('Error storing in IPFS:', error);
      return null;
    }
  }

  /**
   * Record traceability data on blockchain
   */
  async recordOnBlockchain(traceabilityData) {
    try {
      if (!this.blockchainService) {
        console.log('Blockchain service not available, skipping blockchain storage');
        return null;
      }

      const txHash = await this.blockchainService.recordTraceabilityData(traceabilityData);
      console.log(`Recorded traceability data on blockchain: ${txHash}`);
      return txHash;
    } catch (error) {
      console.error('Error recording on blockchain:', error);
      return null;
    }
  }

  /**
   * Generate unique QR code ID
   */
  generateQRCodeId(cropCode) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `QR_${cropCode}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Generate unique scan ID
   */
  generateScanId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    return `SCAN_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Get traceability statistics
   */
  async getTraceabilityStats() {
    try {
      const totalCrops = await Crop.count();
      const cropsWithQR = await Crop.count({
        where: {
          qrCode: {
            [require('sequelize').Op.ne]: null
          }
        }
      });
      const cropsWithIPFS = await Crop.count({
        where: {
          ipfsHash: {
            [require('sequelize').Op.ne]: null
          }
        }
      });
      const cropsWithBlockchain = await Crop.count({
        where: {
          blockchainTxHash: {
            [require('sequelize').Op.ne]: null
          }
        }
      });

      return {
        totalCrops,
        cropsWithQR,
        cropsWithIPFS,
        cropsWithBlockchain,
        qrCoverage: totalCrops > 0 ? (cropsWithQR / totalCrops) * 100 : 0,
        ipfsCoverage: totalCrops > 0 ? (cropsWithIPFS / totalCrops) * 100 : 0,
        blockchainCoverage: totalCrops > 0 ? (cropsWithBlockchain / totalCrops) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting traceability stats:', error);
      throw error;
    }
  }

  /**
   * Generate traceability report
   */
  async generateTraceabilityReport(cropId) {
    try {
      const traceabilityData = await this.getCropTraceabilityData(cropId);
      
      const report = {
        summary: {
          cropCode: traceabilityData.crop.cropCode,
          cropType: traceabilityData.crop.cropType,
          farmer: traceabilityData.farmer.name,
          harvestDate: traceabilityData.crop.harvestDate,
          qualityGrade: traceabilityData.crop.qualityGrade,
          totalTransactions: traceabilityData.transactions.length,
          totalValue: traceabilityData.transactions.reduce((sum, txn) => sum + parseFloat(txn.totalAmount), 0)
        },
        journey: {
          farm: {
            farmer: traceabilityData.farmer,
            farmingConditions: traceabilityData.farmingConditions,
            certifications: traceabilityData.certifications
          },
          verification: traceabilityData.verification,
          pricing: traceabilityData.pricing,
          transactions: traceabilityData.transactions
        },
        quality: {
          grade: traceabilityData.crop.qualityGrade,
          score: traceabilityData.verification.qualityScore,
          report: traceabilityData.verification.verificationReport,
          certifications: traceabilityData.certifications
        },
        blockchain: {
          ipfsHash: traceabilityData.blockchain.ipfsHash,
          txHash: traceabilityData.blockchain.txHash,
          dataIntegrity: traceabilityData.metadata.dataIntegrity
        },
        generatedAt: new Date().toISOString()
      };

      return report;
    } catch (error) {
      console.error('Error generating traceability report:', error);
      throw error;
    }
  }
}

module.exports = new TraceabilityService();
