const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contracts = {};
    this.initializeBlockchain();
  }

  /**
   * Initialize blockchain connection and contracts
   */
  async initializeBlockchain() {
    try {
      // Initialize provider (use local network for development)
      const networkUrl = process.env.BLOCKCHAIN_NETWORK_URL || 'http://localhost:8545';
      this.provider = new ethers.JsonRpcProvider(networkUrl);

      // Initialize wallet
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
      }

      // Load and deploy contracts
      await this.loadContracts();
      
      console.log('Blockchain service initialized successfully');
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      // Continue without blockchain in development
    }
  }

  /**
   * Load smart contracts
   */
  async loadContracts() {
    try {
      const contractsDir = path.join(__dirname, '../../blockchain/contracts');
      
      // Load FarmerGovt contract
      const farmerGovtABI = this.loadContractABI('FarmerGovt');
      const farmerGovtAddress = process.env.FARMER_GOVT_CONTRACT_ADDRESS;
      if (farmerGovtABI && farmerGovtAddress) {
        this.contracts.FarmerGovt = new ethers.Contract(
          farmerGovtAddress,
          farmerGovtABI,
          this.wallet || this.provider
        );
      }

      // Load GovtCustomer contract
      const govtCustomerABI = this.loadContractABI('GovtCustomer');
      const govtCustomerAddress = process.env.GOVT_CUSTOMER_CONTRACT_ADDRESS;
      if (govtCustomerABI && govtCustomerAddress) {
        this.contracts.GovtCustomer = new ethers.Contract(
          govtCustomerAddress,
          govtCustomerABI,
          this.wallet || this.provider
        );
      }

      // Load Traceability contract
      const traceabilityABI = this.loadContractABI('Traceability');
      const traceabilityAddress = process.env.TRACEABILITY_CONTRACT_ADDRESS;
      if (traceabilityABI && traceabilityAddress) {
        this.contracts.Traceability = new ethers.Contract(
          traceabilityAddress,
          traceabilityABI,
          this.wallet || this.provider
        );
      }

      console.log('Smart contracts loaded successfully');
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  }

  /**
   * Load contract ABI from file
   */
  loadContractABI(contractName) {
    try {
      const abiPath = path.join(__dirname, `../../blockchain/contracts/${contractName}.json`);
      if (fs.existsSync(abiPath)) {
        const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        return contractData.abi;
      }
      return null;
    } catch (error) {
      console.error(`Error loading ${contractName} ABI:`, error);
      return null;
    }
  }

  /**
   * Record farmer to government transaction on blockchain
   * @param {Object} transactionData - Transaction data
   * @returns {string} Transaction hash
   */
  async recordFarmerGovtTransaction(transactionData) {
    try {
      if (!this.contracts.FarmerGovt) {
        console.log('FarmerGovt contract not available, simulating transaction');
        return this.simulateTransaction('FARMER_GOVT', transactionData);
      }

      const {
        farmerId,
        cropId,
        quantity,
        pricePerUnit,
        totalAmount,
        govtEmployeeId,
        verificationHash
      } = transactionData;

      const tx = await this.contracts.FarmerGovt.recordTransaction(
        farmerId,
        cropId,
        quantity,
        pricePerUnit,
        totalAmount,
        govtEmployeeId,
        verificationHash
      );

      console.log(`Farmer-Govt transaction recorded: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('Error recording farmer-govt transaction:', error);
      return this.simulateTransaction('FARMER_GOVT', transactionData);
    }
  }

  /**
   * Record government to customer transaction on blockchain
   * @param {Object} transactionData - Transaction data
   * @returns {string} Transaction hash
   */
  async recordGovtCustomerTransaction(transactionData) {
    try {
      if (!this.contracts.GovtCustomer) {
        console.log('GovtCustomer contract not available, simulating transaction');
        return this.simulateTransaction('GOVT_CUSTOMER', transactionData);
      }

      const {
        customerId,
        cropId,
        quantity,
        pricePerUnit,
        totalAmount,
        govtEmployeeId,
        paymentHash
      } = transactionData;

      const tx = await this.contracts.GovtCustomer.recordTransaction(
        customerId,
        cropId,
        quantity,
        pricePerUnit,
        totalAmount,
        govtEmployeeId,
        paymentHash
      );

      console.log(`Govt-Customer transaction recorded: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('Error recording govt-customer transaction:', error);
      return this.simulateTransaction('GOVT_CUSTOMER', transactionData);
    }
  }

  /**
   * Record traceability data on blockchain
   * @param {Object} traceabilityData - Traceability data
   * @returns {string} Transaction hash
   */
  async recordTraceabilityData(traceabilityData) {
    try {
      if (!this.contracts.Traceability) {
        console.log('Traceability contract not available, simulating transaction');
        return this.simulateTransaction('TRACEABILITY', traceabilityData);
      }

      const {
        cropId,
        farmerId,
        cropCode,
        ipfsHash,
        dataHash
      } = traceabilityData;

      const tx = await this.contracts.Traceability.recordTraceabilityData(
        cropId,
        farmerId,
        cropCode,
        ipfsHash,
        dataHash
      );

      console.log(`Traceability data recorded: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('Error recording traceability data:', error);
      return this.simulateTransaction('TRACEABILITY', traceabilityData);
    }
  }

  /**
   * Get transaction details from blockchain
   * @param {string} txHash - Transaction hash
   * @returns {Object} Transaction details
   */
  async getTransactionDetails(txHash) {
    try {
      if (!this.provider) {
        console.log('Blockchain provider not available');
        return null;
      }

      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      return {
        hash: txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting transaction details:', error);
      return null;
    }
  }

  /**
   * Get crop traceability from blockchain
   * @param {string} cropId - Crop ID
   * @returns {Object} Traceability data
   */
  async getCropTraceability(cropId) {
    try {
      if (!this.contracts.Traceability) {
        console.log('Traceability contract not available');
        return null;
      }

      const traceabilityData = await this.contracts.Traceability.getCropTraceability(cropId);
      
      return {
        cropId: traceabilityData.cropId,
        farmerId: traceabilityData.farmerId,
        cropCode: traceabilityData.cropCode,
        ipfsHash: traceabilityData.ipfsHash,
        dataHash: traceabilityData.dataHash,
        recordedAt: new Date(parseInt(traceabilityData.timestamp) * 1000)
      };
    } catch (error) {
      console.error('Error getting crop traceability:', error);
      return null;
    }
  }

  /**
   * Verify transaction on blockchain
   * @param {string} txHash - Transaction hash
   * @returns {boolean} Verification result
   */
  async verifyTransaction(txHash) {
    try {
      if (!this.provider) {
        console.log('Blockchain provider not available');
        return false;
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt && receipt.status === 1;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  /**
   * Get blockchain statistics
   * @returns {Object} Blockchain statistics
   */
  async getBlockchainStats() {
    try {
      if (!this.provider) {
        return {
          connected: false,
          message: 'Blockchain not connected'
        };
      }

      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();

      return {
        connected: true,
        network: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        contracts: {
          FarmerGovt: !!this.contracts.FarmerGovt,
          GovtCustomer: !!this.contracts.GovtCustomer,
          Traceability: !!this.contracts.Traceability
        }
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Simulate transaction when blockchain is not available
   * @param {string} type - Transaction type
   * @param {Object} data - Transaction data
   * @returns {string} Simulated transaction hash
   */
  simulateTransaction(type, data) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    const simulatedHash = `0x${timestamp.toString(16)}${random}`;
    
    console.log(`Simulated ${type} transaction: ${simulatedHash}`);
    return simulatedHash;
  }

  /**
   * Deploy contracts (for development)
   * @returns {Object} Deployment results
   */
  async deployContracts() {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not available for deployment');
      }

      const deploymentResults = {};

      // Deploy FarmerGovt contract
      try {
        const farmerGovtFactory = new ethers.ContractFactory(
          this.getFarmerGovtBytecode(),
          this.getFarmerGovtABI(),
          this.wallet
        );
        
        const farmerGovtContract = await farmerGovtFactory.deploy();
        await farmerGovtContract.waitForDeployment();
        deploymentResults.FarmerGovt = await farmerGovtContract.getAddress();
      } catch (error) {
        console.error('Error deploying FarmerGovt contract:', error);
      }

      // Deploy GovtCustomer contract
      try {
        const govtCustomerFactory = new ethers.ContractFactory(
          this.getGovtCustomerBytecode(),
          this.getGovtCustomerABI(),
          this.wallet
        );
        
        const govtCustomerContract = await govtCustomerFactory.deploy();
        await govtCustomerContract.waitForDeployment();
        deploymentResults.GovtCustomer = await govtCustomerContract.getAddress();
      } catch (error) {
        console.error('Error deploying GovtCustomer contract:', error);
      }

      // Deploy Traceability contract
      try {
        const traceabilityFactory = new ethers.ContractFactory(
          this.getTraceabilityBytecode(),
          this.getTraceabilityABI(),
          this.wallet
        );
        
        const traceabilityContract = await traceabilityFactory.deploy();
        await traceabilityContract.waitForDeployment();
        deploymentResults.Traceability = await traceabilityContract.getAddress();
      } catch (error) {
        console.error('Error deploying Traceability contract:', error);
      }

      return deploymentResults;
    } catch (error) {
      console.error('Error deploying contracts:', error);
      throw error;
    }
  }

  /**
   * Get FarmerGovt contract ABI (placeholder)
   */
  getFarmerGovtABI() {
    return [
      "function recordTransaction(address farmerId, address cropId, uint256 quantity, uint256 pricePerUnit, uint256 totalAmount, address govtEmployeeId, string memory verificationHash) public",
      "function getTransaction(bytes32 txHash) public view returns (tuple(address farmerId, address cropId, uint256 quantity, uint256 pricePerUnit, uint256 totalAmount, address govtEmployeeId, string memory verificationHash, uint256 timestamp))"
    ];
  }

  /**
   * Get GovtCustomer contract ABI (placeholder)
   */
  getGovtCustomerABI() {
    return [
      "function recordTransaction(address customerId, address cropId, uint256 quantity, uint256 pricePerUnit, uint256 totalAmount, address govtEmployeeId, string memory paymentHash) public",
      "function getTransaction(bytes32 txHash) public view returns (tuple(address customerId, address cropId, uint256 quantity, uint256 pricePerUnit, uint256 totalAmount, address govtEmployeeId, string memory paymentHash, uint256 timestamp))"
    ];
  }

  /**
   * Get Traceability contract ABI (placeholder)
   */
  getTraceabilityABI() {
    return [
      "function recordTraceabilityData(address cropId, address farmerId, string memory cropCode, string memory ipfsHash, string memory dataHash) public",
      "function getCropTraceability(address cropId) public view returns (tuple(address cropId, address farmerId, string memory cropCode, string memory ipfsHash, string memory dataHash, uint256 timestamp))"
    ];
  }

  /**
   * Get contract bytecode (placeholder - would be actual compiled bytecode)
   */
  getFarmerGovtBytecode() {
    return "0x608060405234801561001057600080fd5b50"; // Placeholder bytecode
  }

  getGovtCustomerBytecode() {
    return "0x608060405234801561001057600080fd5b50"; // Placeholder bytecode
  }

  getTraceabilityBytecode() {
    return "0x608060405234801561001057600080fd5b50"; // Placeholder bytecode
  }
}

module.exports = new BlockchainService();
