// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PaymentContract
 * @dev Smart contract for handling agricultural supply chain payments via MetaMask
 * @author SIH Team
 */
contract PaymentContract {
    // Events
    event PaymentInitiated(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        string transactionType,
        uint256 timestamp
    );

    event PaymentCompleted(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        string transactionHash,
        uint256 timestamp
    );

    event PaymentFailed(
        bytes32 indexed paymentId,
        address indexed payer,
        string reason,
        uint256 timestamp
    );

    event RefundProcessed(
        bytes32 indexed paymentId,
        address indexed originalPayer,
        address indexed originalPayee,
        uint256 refundAmount,
        string reason,
        uint256 timestamp
    );

    // Structs
    struct Payment {
        bytes32 paymentId;
        address payer;
        address payee;
        uint256 amount;
        string transactionType; // "FARMER_PAYMENT", "CUSTOMER_PAYMENT", "PLATFORM_FEE"
        string status; // "PENDING", "COMPLETED", "FAILED", "REFUNDED"
        string transactionHash;
        uint256 timestamp;
        string metadata; // JSON string with additional data
        bool isActive;
    }

    struct PlatformFee {
        uint256 percentage; // Basis points (e.g., 250 = 2.5%)
        address treasury;
        uint256 totalCollected;
    }

    // State variables
    mapping(bytes32 => Payment) public payments;
    mapping(address => uint256) public userBalances;
    mapping(address => uint256) public userTotalPaid;
    mapping(address => uint256) public userTotalReceived;
    
    PlatformFee public platformFee;
    address public owner;
    address public traceabilityContract;
    
    uint256 public totalPayments;
    uint256 public totalVolume;
    uint256 public totalPlatformFees;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorizedContract() {
        require(
            msg.sender == traceabilityContract || msg.sender == owner,
            "Only authorized contracts can call this function"
        );
        _;
    }

    modifier validPayment(bytes32 _paymentId) {
        require(payments[_paymentId].paymentId != bytes32(0), "Payment does not exist");
        _;
    }

    // Constructor
    constructor(address _traceabilityContract) {
        owner = msg.sender;
        traceabilityContract = _traceabilityContract;
        platformFee = PlatformFee({
            percentage: 250, // 2.5%
            treasury: msg.sender,
            totalCollected: 0
        });
    }

    /**
     * @dev Initiate a payment
     * @param _paymentId Unique payment identifier
     * @param _payee Address of the recipient
     * @param _amount Amount to be paid (in wei)
     * @param _transactionType Type of transaction
     * @param _metadata Additional payment metadata
     */
    function initiatePayment(
        bytes32 _paymentId,
        address _payee,
        uint256 _amount,
        string memory _transactionType,
        string memory _metadata
    ) external payable {
        require(_payee != address(0), "Invalid payee address");
        require(_amount > 0, "Amount must be greater than zero");
        require(msg.value >= _amount, "Insufficient payment amount");
        require(payments[_paymentId].paymentId == bytes32(0), "Payment ID already exists");

        // Create payment record
        Payment memory newPayment = Payment({
            paymentId: _paymentId,
            payer: msg.sender,
            payee: _payee,
            amount: _amount,
            transactionType: _transactionType,
            status: "PENDING",
            transactionHash: "",
            timestamp: block.timestamp,
            metadata: _metadata,
            isActive: true
        });

        payments[_paymentId] = newPayment;
        totalPayments++;

        emit PaymentInitiated(
            _paymentId,
            msg.sender,
            _payee,
            _amount,
            _transactionType,
            block.timestamp
        );
    }

    /**
     * @dev Complete a payment
     * @param _paymentId Payment identifier
     * @param _transactionHash Blockchain transaction hash
     */
    function completePayment(
        bytes32 _paymentId,
        string memory _transactionHash
    ) external validPayment(_paymentId) {
        Payment storage payment = payments[_paymentId];
        require(
            keccak256(abi.encodePacked(payment.status)) == keccak256(abi.encodePacked("PENDING")),
            "Payment not in pending status"
        );
        require(payment.payer == msg.sender, "Only payer can complete payment");

        // Calculate platform fee
        uint256 feeAmount = (payment.amount * platformFee.percentage) / 10000;
        uint256 netAmount = payment.amount - feeAmount;

        // Transfer funds
        payable(payment.payee).transfer(netAmount);
        payable(platformFee.treasury).transfer(feeAmount);

        // Update payment status
        payment.status = "COMPLETED";
        payment.transactionHash = _transactionHash;

        // Update balances and statistics
        userBalances[payment.payee] += netAmount;
        userTotalPaid[payment.payer] += payment.amount;
        userTotalReceived[payment.payee] += netAmount;
        totalVolume += payment.amount;
        totalPlatformFees += feeAmount;
        platformFee.totalCollected += feeAmount;

        emit PaymentCompleted(
            _paymentId,
            payment.payer,
            payment.payee,
            payment.amount,
            _transactionHash,
            block.timestamp
        );
    }

    /**
     * @dev Process payment failure
     * @param _paymentId Payment identifier
     * @param _reason Reason for failure
     */
    function processPaymentFailure(
        bytes32 _paymentId,
        string memory _reason
    ) external onlyAuthorizedContract validPayment(_paymentId) {
        Payment storage payment = payments[_paymentId];
        require(
            keccak256(abi.encodePacked(payment.status)) == keccak256(abi.encodePacked("PENDING")),
            "Payment not in pending status"
        );

        // Refund to payer
        payable(payment.payer).transfer(payment.amount);

        // Update payment status
        payment.status = "FAILED";

        emit PaymentFailed(_paymentId, payment.payer, _reason, block.timestamp);
    }

    /**
     * @dev Process refund
     * @param _paymentId Payment identifier
     * @param _refundAmount Amount to refund
     * @param _reason Reason for refund
     */
    function processRefund(
        bytes32 _paymentId,
        uint256 _refundAmount,
        string memory _reason
    ) external onlyAuthorizedContract validPayment(_paymentId) {
        Payment storage payment = payments[_paymentId];
        require(
            keccak256(abi.encodePacked(payment.status)) == keccak256(abi.encodePacked("COMPLETED")),
            "Payment not completed"
        );
        require(_refundAmount <= payment.amount, "Refund amount exceeds payment amount");

        // Transfer refund to original payer
        payable(payment.payer).transfer(_refundAmount);

        // Update payment status
        payment.status = "REFUNDED";

        // Update balances
        userBalances[payment.payee] -= _refundAmount;
        userTotalPaid[payment.payer] -= _refundAmount;
        userTotalReceived[payment.payee] -= _refundAmount;

        emit RefundProcessed(
            _paymentId,
            payment.payer,
            payment.payee,
            _refundAmount,
            _reason,
            block.timestamp
        );
    }

    /**
     * @dev Get payment details
     * @param _paymentId Payment identifier
     * @return Payment details
     */
    function getPayment(bytes32 _paymentId) external view returns (Payment memory) {
        require(payments[_paymentId].paymentId != bytes32(0), "Payment does not exist");
        return payments[_paymentId];
    }

    /**
     * @dev Get user payment statistics
     * @param _user User address
     * @return totalPaid, totalReceived, balance
     */
    function getUserStats(address _user) external view returns (uint256, uint256, uint256) {
        return (
            userTotalPaid[_user],
            userTotalReceived[_user],
            userBalances[_user]
        );
    }

    /**
     * @dev Get platform statistics
     * @return totalPayments, totalVolume, totalFees
     */
    function getPlatformStats() external view returns (uint256, uint256, uint256) {
        return (totalPayments, totalVolume, totalPlatformFees);
    }

    /**
     * @dev Update platform fee (only owner)
     * @param _percentage New fee percentage in basis points
     * @param _treasury New treasury address
     */
    function updatePlatformFee(uint256 _percentage, address _treasury) external onlyOwner {
        require(_percentage <= 1000, "Fee cannot exceed 10%");
        require(_treasury != address(0), "Invalid treasury address");
        
        platformFee.percentage = _percentage;
        platformFee.treasury = _treasury;
    }

    /**
     * @dev Update traceability contract address
     * @param _traceabilityContract New traceability contract address
     */
    function updateTraceabilityContract(address _traceabilityContract) external onlyOwner {
        require(_traceabilityContract != address(0), "Invalid contract address");
        traceabilityContract = _traceabilityContract;
    }

    /**
     * @dev Withdraw contract balance (only owner)
     * @param _amount Amount to withdraw
     */
    function withdrawBalance(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(_amount);
    }

    /**
     * @dev Emergency pause (only owner)
     * @param _paymentId Payment to pause
     */
    function pausePayment(bytes32 _paymentId) external onlyOwner validPayment(_paymentId) {
        payments[_paymentId].isActive = false;
    }

    /**
     * @dev Resume payment (only owner)
     * @param _paymentId Payment to resume
     */
    function resumePayment(bytes32 _paymentId) external onlyOwner validPayment(_paymentId) {
        payments[_paymentId].isActive = true;
    }

    /**
     * @dev Get contract balance
     * @return Contract balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Generate payment ID from transaction data
     * @param _transactionId Transaction ID
     * @param _payer Payer address
     * @param _timestamp Timestamp
     * @return Generated payment ID
     */
    function generatePaymentId(
        string memory _transactionId,
        address _payer,
        uint256 _timestamp
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_transactionId, _payer, _timestamp));
    }

    // Fallback function to receive ETH
    receive() external payable {
        // Allow contract to receive ETH
    }
}
