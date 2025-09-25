// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GovtCustomer
 * @dev Smart contract for managing transactions between government and customers
 * @author SIH Team
 */
contract GovtCustomer {
    // Events
    event SaleRecorded(
        bytes32 indexed saleId,
        address indexed customerId,
        address indexed cropId,
        uint256 quantity,
        uint256 pricePerUnit,
        uint256 totalAmount,
        address govtEmployeeId,
        string paymentHash,
        uint256 timestamp
    );

    event PaymentReceived(
        bytes32 indexed saleId,
        address indexed customerId,
        uint256 amount,
        string paymentMethod,
        string paymentReference,
        uint256 timestamp
    );

    event CustomerRegistered(
        address indexed customerId,
        string customerCode,
        string name,
        uint256 timestamp
    );

    // Structs
    struct Sale {
        bytes32 saleId;
        address customerId;
        address cropId;
        uint256 quantity;
        uint256 pricePerUnit;
        uint256 totalAmount;
        address govtEmployeeId;
        string paymentHash;
        uint256 timestamp;
        bool isPaid;
        string paymentReference;
        string deliveryAddress;
        string deliveryStatus;
    }

    struct Customer {
        address customerId;
        string customerCode;
        string name;
        string email;
        string phone;
        address walletAddress;
        uint256 totalPurchases;
        uint256 totalSpent;
        uint256 loyaltyPoints;
        bool isActive;
        uint256 registrationTimestamp;
    }

    // State variables
    mapping(bytes32 => Sale) public sales;
    mapping(address => Customer) public customers;
    mapping(address => uint256) public customerPurchaseCount;
    mapping(address => uint256) public customerSpending;

    address public owner;
    address public treasury;
    uint256 public platformFeePercentage; // in basis points (100 = 1%)
    uint256 public totalSales;
    uint256 public totalRevenue;
    uint256 public loyaltyPointsRate; // points per rupee spent

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

    modifier onlyRegisteredCustomer() {
        require(customers[msg.sender].isActive, "Customer not registered or inactive");
        _;
    }

    // Constructor
    constructor(address _treasury, uint256 _platformFeePercentage, uint256 _loyaltyPointsRate) {
        owner = msg.sender;
        treasury = _treasury;
        platformFeePercentage = _platformFeePercentage;
        loyaltyPointsRate = _loyaltyPointsRate;
    }

    /**
     * @dev Register a new customer
     * @param _customerCode Customer code
     * @param _name Customer name
     * @param _email Customer email
     * @param _phone Customer phone
     * @param _walletAddress Customer wallet address
     */
    function registerCustomer(
        string memory _customerCode,
        string memory _name,
        string memory _email,
        string memory _phone,
        address _walletAddress
    ) external {
        require(customers[msg.sender].customerId == address(0), "Customer already registered");
        require(bytes(_customerCode).length > 0, "Customer code cannot be empty");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_walletAddress != address(0), "Invalid wallet address");

        Customer memory newCustomer = Customer({
            customerId: msg.sender,
            customerCode: _customerCode,
            name: _name,
            email: _email,
            phone: _phone,
            walletAddress: _walletAddress,
            totalPurchases: 0,
            totalSpent: 0,
            loyaltyPoints: 0,
            isActive: true,
            registrationTimestamp: block.timestamp
        });

        customers[msg.sender] = newCustomer;

        emit CustomerRegistered(
            msg.sender,
            _customerCode,
            _name,
            block.timestamp
        );
    }

    /**
     * @dev Record a sale to customer
     * @param _customerId Address of the customer
     * @param _cropId Address of the crop
     * @param _quantity Quantity of the crop
     * @param _pricePerUnit Price per unit
     * @param _totalAmount Total amount
     * @param _govtEmployeeId Address of the government employee
     * @param _paymentHash Hash of the payment data
     * @param _deliveryAddress Delivery address
     */
    function recordSale(
        address _customerId,
        address _cropId,
        uint256 _quantity,
        uint256 _pricePerUnit,
        uint256 _totalAmount,
        address _govtEmployeeId,
        string memory _paymentHash,
        string memory _deliveryAddress
    ) external onlyGovtEmployee {
        require(_customerId != address(0), "Invalid customer address");
        require(_cropId != address(0), "Invalid crop address");
        require(customers[_customerId].isActive, "Customer not registered or inactive");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_pricePerUnit > 0, "Price per unit must be greater than 0");
        require(_totalAmount > 0, "Total amount must be greater than 0");

        bytes32 saleId = keccak256(
            abi.encodePacked(
                _customerId,
                _cropId,
                _quantity,
                _pricePerUnit,
                block.timestamp,
                msg.sender
            )
        );

        require(sales[saleId].saleId == bytes32(0), "Sale already exists");

        Sale memory newSale = Sale({
            saleId: saleId,
            customerId: _customerId,
            cropId: _cropId,
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            totalAmount: _totalAmount,
            govtEmployeeId: _govtEmployeeId,
            paymentHash: _paymentHash,
            timestamp: block.timestamp,
            isPaid: false,
            paymentReference: "",
            deliveryAddress: _deliveryAddress,
            deliveryStatus: "PENDING"
        });

        sales[saleId] = newSale;
        totalSales++;
        totalRevenue += _totalAmount;

        emit SaleRecorded(
            saleId,
            _customerId,
            _cropId,
            _quantity,
            _pricePerUnit,
            _totalAmount,
            _govtEmployeeId,
            _paymentHash,
            block.timestamp
        );
    }

    /**
     * @dev Process customer payment
     * @param _saleId Sale ID
     * @param _paymentMethod Payment method used
     * @param _paymentReference Payment reference
     */
    function processCustomerPayment(
        bytes32 _saleId,
        string memory _paymentMethod,
        string memory _paymentReference
    ) external onlyGovtEmployee {
        require(sales[_saleId].saleId != bytes32(0), "Sale not found");
        require(!sales[_saleId].isPaid, "Payment already processed");

        Sale storage sale = sales[_saleId];
        
        // Calculate platform fee
        uint256 platformFee = (sale.totalAmount * platformFeePercentage) / 10000;
        uint256 netAmount = sale.totalAmount - platformFee;

        // Update customer statistics
        customers[sale.customerId].totalPurchases++;
        customers[sale.customerId].totalSpent += sale.totalAmount;
        customers[sale.customerId].loyaltyPoints += (sale.totalAmount * loyaltyPointsRate) / 100;
        
        customerPurchaseCount[sale.customerId]++;
        customerSpending[sale.customerId] += sale.totalAmount;

        // Mark sale as paid
        sale.isPaid = true;
        sale.paymentReference = _paymentReference;

        emit PaymentReceived(
            _saleId,
            sale.customerId,
            netAmount,
            _paymentMethod,
            _paymentReference,
            block.timestamp
        );
    }

    /**
     * @dev Update delivery status
     * @param _saleId Sale ID
     * @param _deliveryStatus New delivery status
     */
    function updateDeliveryStatus(
        bytes32 _saleId,
        string memory _deliveryStatus
    ) external onlyGovtEmployee {
        require(sales[_saleId].saleId != bytes32(0), "Sale not found");
        require(sales[_saleId].isPaid, "Sale not paid yet");

        sales[_saleId].deliveryStatus = _deliveryStatus;
    }

    /**
     * @dev Get sale details
     * @param _saleId Sale ID
     * @return Sale details
     */
    function getSale(bytes32 _saleId) external view returns (Sale memory) {
        require(sales[_saleId].saleId != bytes32(0), "Sale not found");
        return sales[_saleId];
    }

    /**
     * @dev Get customer details
     * @param _customerId Customer address
     * @return Customer details
     */
    function getCustomer(address _customerId) external view returns (Customer memory) {
        require(customers[_customerId].customerId != address(0), "Customer not found");
        return customers[_customerId];
    }

    /**
     * @dev Get customer statistics
     * @param _customerId Customer address
     * @return Total purchases, spending, and loyalty points
     */
    function getCustomerStats(address _customerId) external view returns (uint256, uint256, uint256) {
        return (
            customers[_customerId].totalPurchases,
            customers[_customerId].totalSpent,
            customers[_customerId].loyaltyPoints
        );
    }

    /**
     * @dev Get contract statistics
     * @return Total sales and revenue
     */
    function getContractStats() external view returns (uint256, uint256) {
        return (totalSales, totalRevenue);
    }

    /**
     * @dev Redeem loyalty points
     * @param _customerId Customer address
     * @param _points Points to redeem
     * @param _discountAmount Discount amount
     */
    function redeemLoyaltyPoints(
        address _customerId,
        uint256 _points,
        uint256 _discountAmount
    ) external onlyGovtEmployee {
        require(customers[_customerId].isActive, "Customer not active");
        require(customers[_customerId].loyaltyPoints >= _points, "Insufficient loyalty points");
        require(_discountAmount > 0, "Discount amount must be greater than 0");

        customers[_customerId].loyaltyPoints -= _points;
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
     * @dev Update loyalty points rate (only owner)
     * @param _newRate New loyalty points rate
     */
    function updateLoyaltyPointsRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Loyalty points rate must be greater than 0");
        loyaltyPointsRate = _newRate;
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