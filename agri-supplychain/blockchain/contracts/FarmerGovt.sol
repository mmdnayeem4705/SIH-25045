// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FarmerGovt
 * @dev Smart contract for managing transactions between farmers and government
 * @author SIH Team
 */
contract FarmerGovt {
    // Events
    event TransactionRecorded(
        bytes32 indexed transactionId,
        address indexed farmerId,
        address indexed cropId,
        uint256 quantity,
        uint256 pricePerUnit,
        uint256 totalAmount,
        address govtEmployeeId,
        string verificationHash,
        uint256 timestamp
    );

    event PaymentProcessed(
        bytes32 indexed transactionId,
        address indexed farmerId,
        uint256 amount,
        string paymentMethod,
        string paymentReference,
        uint256 timestamp
    );

    event VerificationUpdated(
        address indexed cropId,
        string qualityGrade,
        uint256 qualityScore,
        string verificationHash,
        uint256 timestamp
    );

    // Structs
    struct Transaction {
        bytes32 transactionId;
        address farmerId;
        address cropId;
        uint256 quantity;
        uint256 pricePerUnit;
        uint256 totalAmount;
        address govtEmployeeId;
        string verificationHash;
        uint256 timestamp;
        bool isPaid;
        string paymentReference;
    }

    struct CropVerification {
        address cropId;
        string qualityGrade;
        uint256 qualityScore;
        string verificationHash;
        address verifiedBy;
        uint256 timestamp;
        bool isVerified;
    }

    // State variables
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => CropVerification) public cropVerifications;
    mapping(address => uint256) public farmerEarnings;
    mapping(address => uint256) public farmerTransactionCount;

    address public owner;
    address public treasury;
    uint256 public platformFeePercentage; // in basis points (100 = 1%)
    uint256 public totalTransactions;
    uint256 public totalVolume;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyGovtEmployee() {
        // In a real implementation, this would check against a whitelist of government employees
        require(msg.sender != address(0), "Invalid government employee");
        _;
    }

    // Constructor
    constructor(address _treasury, uint256 _platformFeePercentage) {
        owner = msg.sender;
        treasury = _treasury;
        platformFeePercentage = _platformFeePercentage;
    }

    /**
     * @dev Record a transaction between farmer and government
     * @param _farmerId Address of the farmer
     * @param _cropId Address of the crop
     * @param _quantity Quantity of the crop
     * @param _pricePerUnit Price per unit
     * @param _totalAmount Total amount
     * @param _govtEmployeeId Address of the government employee
     * @param _verificationHash Hash of the verification data
     */
    function recordTransaction(
        address _farmerId,
        address _cropId,
        uint256 _quantity,
        uint256 _pricePerUnit,
        uint256 _totalAmount,
        address _govtEmployeeId,
        string memory _verificationHash
    ) external onlyGovtEmployee {
        require(_farmerId != address(0), "Invalid farmer address");
        require(_cropId != address(0), "Invalid crop address");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_pricePerUnit > 0, "Price per unit must be greater than 0");
        require(_totalAmount > 0, "Total amount must be greater than 0");

        bytes32 transactionId = keccak256(
            abi.encodePacked(
                _farmerId,
                _cropId,
                _quantity,
                _pricePerUnit,
                block.timestamp,
                msg.sender
            )
        );

        require(transactions[transactionId].transactionId == bytes32(0), "Transaction already exists");

        Transaction memory newTransaction = Transaction({
            transactionId: transactionId,
            farmerId: _farmerId,
            cropId: _cropId,
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            totalAmount: _totalAmount,
            govtEmployeeId: _govtEmployeeId,
            verificationHash: _verificationHash,
            timestamp: block.timestamp,
            isPaid: false,
            paymentReference: ""
        });

        transactions[transactionId] = newTransaction;
        totalTransactions++;
        totalVolume += _totalAmount;

        emit TransactionRecorded(
            transactionId,
            _farmerId,
            _cropId,
            _quantity,
            _pricePerUnit,
            _totalAmount,
            _govtEmployeeId,
            _verificationHash,
            block.timestamp
        );
    }

    /**
     * @dev Process payment to farmer
     * @param _transactionId Transaction ID
     * @param _paymentMethod Payment method used
     * @param _paymentReference Payment reference
     */
    function processPayment(
        bytes32 _transactionId,
        string memory _paymentMethod,
        string memory _paymentReference
    ) external onlyGovtEmployee {
        require(transactions[_transactionId].transactionId != bytes32(0), "Transaction not found");
        require(!transactions[_transactionId].isPaid, "Payment already processed");

        Transaction storage transaction = transactions[_transactionId];
        
        // Calculate platform fee
        uint256 platformFee = (transaction.totalAmount * platformFeePercentage) / 10000;
        uint256 netAmount = transaction.totalAmount - platformFee;

        // Update farmer earnings
        farmerEarnings[transaction.farmerId] += netAmount;
        farmerTransactionCount[transaction.farmerId]++;

        // Mark transaction as paid
        transaction.isPaid = true;
        transaction.paymentReference = _paymentReference;

        emit PaymentProcessed(
            _transactionId,
            transaction.farmerId,
            netAmount,
            _paymentMethod,
            _paymentReference,
            block.timestamp
        );
    }

    /**
     * @dev Update crop verification
     * @param _cropId Address of the crop
     * @param _qualityGrade Quality grade
     * @param _qualityScore Quality score
     * @param _verificationHash Hash of the verification data
     */
    function updateCropVerification(
        address _cropId,
        string memory _qualityGrade,
        uint256 _qualityScore,
        string memory _verificationHash
    ) external onlyGovtEmployee {
        require(_cropId != address(0), "Invalid crop address");
        require(_qualityScore >= 0 && _qualityScore <= 100, "Quality score must be between 0 and 100");

        CropVerification storage verification = cropVerifications[_cropId];
        verification.cropId = _cropId;
        verification.qualityGrade = _qualityGrade;
        verification.qualityScore = _qualityScore;
        verification.verificationHash = _verificationHash;
        verification.verifiedBy = msg.sender;
        verification.timestamp = block.timestamp;
        verification.isVerified = true;

        emit VerificationUpdated(
            _cropId,
            _qualityGrade,
            _qualityScore,
            _verificationHash,
            block.timestamp
        );
    }

    /**
     * @dev Get transaction details
     * @param _transactionId Transaction ID
     * @return Transaction details
     */
    function getTransaction(bytes32 _transactionId) external view returns (Transaction memory) {
        require(transactions[_transactionId].transactionId != bytes32(0), "Transaction not found");
        return transactions[_transactionId];
    }

    /**
     * @dev Get crop verification details
     * @param _cropId Crop address
     * @return Crop verification details
     */
    function getCropVerification(address _cropId) external view returns (CropVerification memory) {
        require(cropVerifications[_cropId].cropId != address(0), "Crop verification not found");
        return cropVerifications[_cropId];
    }

    /**
     * @dev Get farmer statistics
     * @param _farmerId Farmer address
     * @return Total earnings and transaction count
     */
    function getFarmerStats(address _farmerId) external view returns (uint256, uint256) {
        return (farmerEarnings[_farmerId], farmerTransactionCount[_farmerId]);
    }

    /**
     * @dev Get contract statistics
     * @return Total transactions and volume
     */
    function getContractStats() external view returns (uint256, uint256) {
        return (totalTransactions, totalVolume);
    }

    /**
     * @dev Update platform fee percentage (only owner)
     * @param _newFeePercentage New fee percentage in basis points
     */
    function updatePlatformFee(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 1000, "Fee percentage cannot exceed 10%");
        platformFeePercentage = _newFeePercentage;
    }

    /**
     * @dev Update treasury address (only owner)
     * @param _newTreasury New treasury address
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        treasury = _newTreasury;
    }

    /**
     * @dev Transfer ownership (only owner)
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        owner = _newOwner;
    }

    /**
     * @dev Emergency pause function (only owner)
     */
    function pause() external onlyOwner {
        // In a real implementation, this would pause the contract
        // For now, we'll just emit an event
        emit TransactionRecorded(
            bytes32(0),
            address(0),
            address(0),
            0,
            0,
            0,
            address(0),
            "CONTRACT_PAUSED",
            block.timestamp
        );
    }

    /**
     * @dev Withdraw funds to treasury (only owner)
     * @param _amount Amount to withdraw
     */
    function withdrawToTreasury(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient contract balance");
        require(treasury != address(0), "Treasury address not set");
        
        payable(treasury).transfer(_amount);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Contract can receive ETH
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        // Fallback function
    }
}