const Razorpay = require('razorpay');
const axios = require('axios');
const crypto = require('crypto');
const { Transaction, Farmer, Customer } = require('../models');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    this.upiApiUrl = process.env.UPI_API_URL || 'https://api.phonepe.com/v1/payments';
    this.bankApiUrl = process.env.BANK_API_URL;
    this.govtTreasuryAccount = {
      accountNumber: process.env.GOVT_TREASURY_ACCOUNT,
      ifscCode: process.env.GOVT_TREASURY_IFSC,
      bankName: process.env.GOVT_TREASURY_BANK
    };
    this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 2.5;
  }

  /**
   * Process payment for farmer to government transaction
   * @param {Object} transactionData - Transaction details
   * @returns {Object} Payment result
   */
  async processFarmerPayment(transactionData) {
    try {
      const { transactionId, farmerId, amount, paymentMethod, paymentDetails } = transactionData;

      // Calculate platform fee
      const platformFee = (amount * this.platformFeePercentage) / 100;
      const netAmount = amount - platformFee;

      let paymentResult;

      switch (paymentMethod) {
        case 'UPI':
          paymentResult = await this.processUPIPayment({
            amount: netAmount,
            farmerId,
            transactionId,
            paymentDetails
          });
          break;
        case 'BANK_TRANSFER':
          paymentResult = await this.processBankTransfer({
            amount: netAmount,
            farmerId,
            transactionId,
            paymentDetails
          });
          break;
        case 'DIGITAL_WALLET':
          paymentResult = await this.processDigitalWalletPayment({
            amount: netAmount,
            farmerId,
            transactionId,
            paymentDetails
          });
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      if (paymentResult.success) {
        // Update transaction with payment details
        await this.updateTransactionPayment(transactionId, {
          status: 'COMPLETED',
          paymentDetails: paymentResult.paymentDetails,
          completedAt: new Date(),
          receipt: paymentResult.receipt
        });

        // Update farmer's total earnings
        await this.updateFarmerEarnings(farmerId, netAmount);

        // Transfer platform fee to government treasury
        await this.transferToTreasury(platformFee, transactionId);

        return {
          success: true,
          transactionId,
          paymentId: paymentResult.paymentId,
          amount: netAmount,
          platformFee,
          receipt: paymentResult.receipt,
          blockchainTxHash: paymentResult.blockchainTxHash
        };
      } else {
        throw new Error(paymentResult.error);
      }
    } catch (error) {
      console.error('Error processing farmer payment:', error);
      await this.updateTransactionPayment(transactionData.transactionId, {
        status: 'FAILED',
        failureReason: error.message
      });
      throw error;
    }
  }

  /**
   * Process payment for customer to government transaction
   * @param {Object} transactionData - Transaction details
   * @returns {Object} Payment result
   */
  async processCustomerPayment(transactionData) {
    try {
      const { transactionId, customerId, amount, paymentMethod, paymentDetails } = transactionData;

      let paymentResult;

      switch (paymentMethod) {
        case 'UPI':
          paymentResult = await this.processUPIPayment({
            amount,
            customerId,
            transactionId,
            paymentDetails,
            isCustomerPayment: true
          });
          break;
        case 'BANK_TRANSFER':
          paymentResult = await this.processBankTransfer({
            amount,
            customerId,
            transactionId,
            paymentDetails,
            isCustomerPayment: true
          });
          break;
        case 'DIGITAL_WALLET':
          paymentResult = await this.processDigitalWalletPayment({
            amount,
            customerId,
            transactionId,
            paymentDetails,
            isCustomerPayment: true
          });
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      if (paymentResult.success) {
        // Update transaction
        await this.updateTransactionPayment(transactionId, {
          status: 'COMPLETED',
          paymentDetails: paymentResult.paymentDetails,
          completedAt: new Date(),
          receipt: paymentResult.receipt
        });

        // Update customer's total spent
        await this.updateCustomerSpending(customerId, amount);

        return {
          success: true,
          transactionId,
          paymentId: paymentResult.paymentId,
          amount,
          receipt: paymentResult.receipt,
          blockchainTxHash: paymentResult.blockchainTxHash
        };
      } else {
        throw new Error(paymentResult.error);
      }
    } catch (error) {
      console.error('Error processing customer payment:', error);
      await this.updateTransactionPayment(transactionData.transactionId, {
        status: 'FAILED',
        failureReason: error.message
      });
      throw error;
    }
  }

  /**
   * Process UPI payment
   */
  async processUPIPayment(paymentData) {
    try {
      const { amount, farmerId, customerId, transactionId, paymentDetails, isCustomerPayment } = paymentData;
      
      // Create UPI payment request
      const upiRequest = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: transactionId,
        notes: {
          type: isCustomerPayment ? 'customer_payment' : 'farmer_payment',
          farmerId: farmerId || null,
          customerId: customerId || null
        },
        upi: {
          vpa: paymentDetails.upiId,
          flow: 'collect'
        }
      };

      // For demo purposes, we'll simulate UPI payment
      // In production, integrate with actual UPI gateway
      const paymentId = `upi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate payment success (90% success rate for demo)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        const receipt = await this.generateReceipt({
          paymentId,
          amount,
          transactionId,
          paymentMethod: 'UPI',
          upiId: paymentDetails.upiId
        });

        return {
          success: true,
          paymentId,
          paymentDetails: {
            upiId: paymentDetails.upiId,
            transactionReference: paymentId,
            gateway: 'UPI'
          },
          receipt,
          blockchainTxHash: await this.recordOnBlockchain({
            type: 'payment',
            amount,
            transactionId,
            paymentId
          })
        };
      } else {
        return {
          success: false,
          error: 'UPI payment failed - insufficient funds or network error'
        };
      }
    } catch (error) {
      console.error('Error processing UPI payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process bank transfer payment
   */
  async processBankTransfer(paymentData) {
    try {
      const { amount, farmerId, customerId, transactionId, paymentDetails, isCustomerPayment } = paymentData;
      
      // Validate bank details
      if (!paymentDetails.accountNumber || !paymentDetails.ifscCode) {
        throw new Error('Bank account details are required');
      }

      // Create bank transfer request
      const transferRequest = {
        amount,
        currency: 'INR',
        accountNumber: paymentDetails.accountNumber,
        ifscCode: paymentDetails.ifscCode,
        beneficiaryName: paymentDetails.beneficiaryName,
        transactionId,
        purpose: isCustomerPayment ? 'customer_payment' : 'farmer_payment'
      };

      // For demo purposes, simulate bank transfer
      const paymentId = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate bank transfer processing delay
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Simulate bank transfer success (95% success rate for demo)
      const isSuccess = Math.random() > 0.05;

      if (isSuccess) {
        const receipt = await this.generateReceipt({
          paymentId,
          amount,
          transactionId,
          paymentMethod: 'BANK_TRANSFER',
          accountNumber: paymentDetails.accountNumber,
          ifscCode: paymentDetails.ifscCode
        });

        return {
          success: true,
          paymentId,
          paymentDetails: {
            accountNumber: paymentDetails.accountNumber,
            ifscCode: paymentDetails.ifscCode,
            transactionReference: paymentId,
            gateway: 'BANK_TRANSFER'
          },
          receipt,
          blockchainTxHash: await this.recordOnBlockchain({
            type: 'payment',
            amount,
            transactionId,
            paymentId
          })
        };
      } else {
        return {
          success: false,
          error: 'Bank transfer failed - invalid account details or insufficient funds'
        };
      }
    } catch (error) {
      console.error('Error processing bank transfer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process digital wallet payment
   */
  async processDigitalWalletPayment(paymentData) {
    try {
      const { amount, farmerId, customerId, transactionId, paymentDetails, isCustomerPayment } = paymentData;
      
      // Create digital wallet payment request
      const walletRequest = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: transactionId,
        wallet: paymentDetails.walletType, // 'PAYTM', 'PHONEPE', 'GOOGLE_PAY', etc.
        walletId: paymentDetails.walletId
      };

      // For demo purposes, simulate wallet payment
      const paymentId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate wallet payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate wallet payment success (85% success rate for demo)
      const isSuccess = Math.random() > 0.15;

      if (isSuccess) {
        const receipt = await this.generateReceipt({
          paymentId,
          amount,
          transactionId,
          paymentMethod: 'DIGITAL_WALLET',
          walletType: paymentDetails.walletType,
          walletId: paymentDetails.walletId
        });

        return {
          success: true,
          paymentId,
          paymentDetails: {
            walletType: paymentDetails.walletType,
            walletId: paymentDetails.walletId,
            transactionReference: paymentId,
            gateway: 'DIGITAL_WALLET'
          },
          receipt,
          blockchainTxHash: await this.recordOnBlockchain({
            type: 'payment',
            amount,
            transactionId,
            paymentId
          })
        };
      } else {
        return {
          success: false,
          error: 'Digital wallet payment failed - insufficient balance or network error'
        };
      }
    } catch (error) {
      console.error('Error processing digital wallet payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate payment receipt
   */
  async generateReceipt(receiptData) {
    const { paymentId, amount, transactionId, paymentMethod, ...details } = receiptData;
    
    const receipt = {
      receiptNumber: `RCP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      paymentId,
      transactionId,
      amount,
      paymentMethod,
      timestamp: new Date(),
      details,
      downloadUrl: `${process.env.API_BASE_URL}/receipts/${paymentId}.pdf`,
      qrCode: await this.generateQRCode({
        paymentId,
        transactionId,
        amount,
        timestamp: new Date()
      })
    };

    return receipt;
  }

  /**
   * Generate QR code for receipt
   */
  async generateQRCode(data) {
    try {
      const QRCode = require('qrcode');
      const qrData = JSON.stringify(data);
      const qrCode = await QRCode.toDataURL(qrData);
      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  /**
   * Update transaction with payment details
   */
  async updateTransactionPayment(transactionId, updateData) {
    try {
      const transaction = await Transaction.findOne({
        where: { transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      await transaction.update(updateData);
      return transaction;
    } catch (error) {
      console.error('Error updating transaction payment:', error);
      throw error;
    }
  }

  /**
   * Update farmer's total earnings
   */
  async updateFarmerEarnings(farmerId, amount) {
    try {
      const farmer = await Farmer.findByPk(farmerId);
      if (farmer) {
        await farmer.update({
          totalEarnings: parseFloat(farmer.totalEarnings) + parseFloat(amount),
          totalTransactions: parseInt(farmer.totalTransactions) + 1
        });
      }
    } catch (error) {
      console.error('Error updating farmer earnings:', error);
    }
  }

  /**
   * Update customer's total spending
   */
  async updateCustomerSpending(customerId, amount) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (customer) {
        await customer.update({
          totalSpent: parseFloat(customer.totalSpent) + parseFloat(amount),
          totalOrders: parseInt(customer.totalOrders) + 1
        });
      }
    } catch (error) {
      console.error('Error updating customer spending:', error);
    }
  }

  /**
   * Transfer platform fee to government treasury
   */
  async transferToTreasury(amount, transactionId) {
    try {
      // In a real implementation, this would transfer to government treasury
      console.log(`Transferring platform fee of ₹${amount} to government treasury for transaction ${transactionId}`);
      
      // Record treasury transfer
      const treasuryTransfer = {
        amount,
        transactionId,
        treasuryAccount: this.govtTreasuryAccount,
        timestamp: new Date(),
        status: 'COMPLETED'
      };

      // Store in database or blockchain
      return treasuryTransfer;
    } catch (error) {
      console.error('Error transferring to treasury:', error);
      throw error;
    }
  }

  /**
   * Record payment on blockchain
   */
  async recordOnBlockchain(paymentData) {
    try {
      // In a real implementation, this would interact with smart contracts
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      console.log(`Recording payment on blockchain: ${txHash}`);
      console.log('Payment data:', paymentData);
      
      return txHash;
    } catch (error) {
      console.error('Error recording on blockchain:', error);
      return null;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId) {
    try {
      // In a real implementation, this would verify with payment gateway
      const transaction = await Transaction.findOne({
        where: {
          paymentDetails: {
            [require('sequelize').Op.like]: `%"transactionReference":"${paymentId}"%`
          }
        }
      });

      if (transaction) {
        return {
          paymentId,
          status: transaction.status,
          amount: transaction.totalAmount,
          timestamp: transaction.createdAt
        };
      } else {
        return {
          paymentId,
          status: 'NOT_FOUND',
          amount: 0,
          timestamp: null
        };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(transactionId, refundAmount, reason) {
    try {
      const transaction = await Transaction.findOne({
        where: { transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'COMPLETED') {
        throw new Error('Cannot refund incomplete transaction');
      }

      // Create refund transaction
      const refundTransaction = await Transaction.create({
        transactionId: Transaction.generateTransactionId('REFUND'),
        type: 'REFUND',
        cropId: transaction.cropId,
        farmerId: transaction.farmerId,
        customerId: transaction.customerId,
        quantity: 0,
        unit: transaction.unit,
        pricePerUnit: 0,
        totalAmount: refundAmount,
        platformFee: 0,
        netAmount: refundAmount,
        status: 'PENDING',
        paymentMethod: transaction.paymentMethod,
        paymentDetails: {
          originalTransactionId: transactionId,
          refundReason: reason,
          refundAmount: refundAmount
        },
        initiatedBy: 'SYSTEM',
        notes: `Refund for transaction ${transactionId}: ${reason}`
      });

      // Process refund based on original payment method
      let refundResult;
      switch (transaction.paymentMethod) {
        case 'UPI':
          refundResult = await this.processUPIRefund(transaction, refundAmount);
          break;
        case 'BANK_TRANSFER':
          refundResult = await this.processBankRefund(transaction, refundAmount);
          break;
        case 'DIGITAL_WALLET':
          refundResult = await this.processWalletRefund(transaction, refundAmount);
          break;
        default:
          throw new Error('Unsupported refund method');
      }

      if (refundResult.success) {
        await refundTransaction.update({
          status: 'COMPLETED',
          completedAt: new Date(),
          blockchainTxHash: refundResult.blockchainTxHash
        });

        return {
          success: true,
          refundTransactionId: refundTransaction.transactionId,
          refundAmount,
          refundId: refundResult.refundId
        };
      } else {
        throw new Error(refundResult.error);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Process UPI refund
   */
  async processUPIRefund(transaction, refundAmount) {
    // Simulate UPI refund
    const refundId = `refund_upi_${Date.now()}`;
    return {
      success: true,
      refundId,
      blockchainTxHash: `0x${crypto.randomBytes(32).toString('hex')}`
    };
  }

  /**
   * Process bank refund
   */
  async processBankRefund(transaction, refundAmount) {
    // Simulate bank refund
    const refundId = `refund_bank_${Date.now()}`;
    return {
      success: true,
      refundId,
      blockchainTxHash: `0x${crypto.randomBytes(32).toString('hex')}`
    };
  }

  /**
   * Process wallet refund
   */
  async processWalletRefund(transaction, refundAmount) {
    // Simulate wallet refund
    const refundId = `refund_wallet_${Date.now()}`;
    return {
      success: true,
      refundId,
      blockchainTxHash: `0x${crypto.randomBytes(32).toString('hex')}`
    };
  }
}

module.exports = new PaymentService();
