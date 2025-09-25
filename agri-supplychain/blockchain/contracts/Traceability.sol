// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Traceability
 * @dev Smart contract for managing crop traceability and QR code data
 * @author SIH Team
 */
contract Traceability {
    // Events
    event TraceabilityDataRecorded(
        address indexed cropId,
        address indexed farmerId,
        string cropCode,
        string ipfsHash,
        string dataHash,
        uint256 timestamp
    );

    event QRCodeGenerated(
        address indexed cropId,
        string qrCodeId,
        string qrCodeData,
        uint256 timestamp
    );

    event TraceabilityDataUpdated(
        address indexed cropId,
        string newIpfsHash,
        string newDataHash,
        uint256 timestamp
    );

    event VerificationRecorded(
        address indexed cropId,
        address indexed verifierId,
        string verificationHash,
        uint256 timestamp
    );

    // Structs
    struct TraceabilityRecord {
        address cropId;
        address farmerId;
        string cropCode;
        string ipfsHash;
        string dataHash;
        uint256 timestamp;
        bool isActive;
        string qrCodeId;
        string qrCodeData;
    }

    struct VerificationRecord {
        address cropId;
        address verifierId;
        string verificationHash;
        string qualityGrade;
        uint256 qualityScore;
        uint256 timestamp;
        bool isVerified;
    }

    struct JourneyStep {
        string stepType; // "FARM", "VERIFICATION", "PRICING", "PAYMENT", "SALE"
        string description;
        address actorId;
        string actorType; // "FARMER", "GOVT_EMPLOYEE", "CUSTOMER"
        uint256 timestamp;
        string metadata;
    }

    // State variables
    mapping(address => TraceabilityRecord) public traceabilityRecords;
    mapping(address => VerificationRecord) public verificationRecords;
    mapping(address => JourneyStep[]) public cropJourney;
    mapping(string => address) public qrCodeToCrop;
    mapping(address => uint256) public farmerCropCount;

    address public owner;
    address public farmerGovtContract;
    address public govtCustomerContract;
    uint256 public totalRecords;
    uint256 public totalVerifications;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorizedContract() {
        require(
            msg.sender == farmerGovtContract || 
            msg.sender == govtCustomerContract || 
            msg.sender == owner,
            "Only authorized contracts can call this function"
        );
        _;
    }

    // Constructor
    constructor(address _farmerGovtContract, address _govtCustomerContract) {
        owner = msg.sender;
        farmerGovtContract = _farmerGovtContract;
        govtCustomerContract = _govtCustomerContract;
    }

    /**
     * @dev Record traceability data for a crop
     * @param _cropId Address of the crop
     * @param _farmerId Address of the farmer
     * @param _cropCode Crop code
     * @param _ipfsHash IPFS hash of the traceability data
     * @param _dataHash Hash of the traceability data
     */
    function recordTraceabilityData(
        address _cropId,
        address _farmerId,
        string memory _cropCode,
        string memory _ipfsHash,
        string memory _dataHash
    ) external onlyAuthorizedContract {
        require(_cropId != address(0), "Invalid crop address");
        require(_farmerId != address(0), "Invalid farmer address");
        require(bytes(_cropCode).length > 0, "Crop code cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");

        TraceabilityRecord memory newRecord = TraceabilityRecord({
            cropId: _cropId,
            farmerId: _farmerId,
            cropCode: _cropCode,
            ipfsHash: _ipfsHash,
            dataHash: _dataHash,
            timestamp: block.timestamp,
            isActive: true,
            qrCodeId: "",
            qrCodeData: ""
        });

        traceabilityRecords[_cropId] = newRecord;
        farmerCropCount[_farmerId]++;
        totalRecords++;

        emit TraceabilityDataRecorded(
            _cropId,
            _farmerId,
            _cropCode,
            _ipfsHash,
            _dataHash,
            block.timestamp
        );
    }

    /**
     * @dev Generate QR code for a crop
     * @param _cropId Address of the crop
     * @param _qrCodeId QR code ID
     * @param _qrCodeData QR code data
     */
    function generateQRCode(
        address _cropId,
        string memory _qrCodeId,
        string memory _qrCodeData
    ) external onlyAuthorizedContract {
        require(traceabilityRecords[_cropId].cropId != address(0), "Crop not found");
        require(bytes(_qrCodeId).length > 0, "QR code ID cannot be empty");
        require(bytes(_qrCodeData).length > 0, "QR code data cannot be empty");
        require(qrCodeToCrop[_qrCodeId] == address(0), "QR code ID already exists");

        traceabilityRecords[_cropId].qrCodeId = _qrCodeId;
        traceabilityRecords[_cropId].qrCodeData = _qrCodeData;
        qrCodeToCrop[_qrCodeId] = _cropId;

        emit QRCodeGenerated(
            _cropId,
            _qrCodeId,
            _qrCodeData,
            block.timestamp
        );
    }

    /**
     * @dev Update traceability data
     * @param _cropId Address of the crop
     * @param _newIpfsHash New IPFS hash
     * @param _newDataHash New data hash
     */
    function updateTraceabilityData(
        address _cropId,
        string memory _newIpfsHash,
        string memory _newDataHash
    ) external onlyAuthorizedContract {
        require(traceabilityRecords[_cropId].cropId != address(0), "Crop not found");
        require(bytes(_newIpfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_newDataHash).length > 0, "Data hash cannot be empty");

        traceabilityRecords[_cropId].ipfsHash = _newIpfsHash;
        traceabilityRecords[_cropId].dataHash = _newDataHash;

        emit TraceabilityDataUpdated(
            _cropId,
            _newIpfsHash,
            _newDataHash,
            block.timestamp
        );
    }

    /**
     * @dev Record verification data
     * @param _cropId Address of the crop
     * @param _verifierId Address of the verifier
     * @param _verificationHash Hash of the verification data
     * @param _qualityGrade Quality grade
     * @param _qualityScore Quality score
     */
    function recordVerification(
        address _cropId,
        address _verifierId,
        string memory _verificationHash,
        string memory _qualityGrade,
        uint256 _qualityScore
    ) external onlyAuthorizedContract {
        require(traceabilityRecords[_cropId].cropId != address(0), "Crop not found");
        require(_verifierId != address(0), "Invalid verifier address");
        require(bytes(_verificationHash).length > 0, "Verification hash cannot be empty");
        require(_qualityScore >= 0 && _qualityScore <= 100, "Quality score must be between 0 and 100");

        VerificationRecord memory newVerification = VerificationRecord({
            cropId: _cropId,
            verifierId: _verifierId,
            verificationHash: _verificationHash,
            qualityGrade: _qualityGrade,
            qualityScore: _qualityScore,
            timestamp: block.timestamp,
            isVerified: true
        });

        verificationRecords[_cropId] = newVerification;
        totalVerifications++;

        emit VerificationRecorded(
            _cropId,
            _verifierId,
            _verificationHash,
            block.timestamp
        );
    }

    /**
     * @dev Add journey step to crop traceability
     * @param _cropId Address of the crop
     * @param _stepType Type of the step
     * @param _description Description of the step
     * @param _actorId Address of the actor
     * @param _actorType Type of the actor
     * @param _metadata Additional metadata
     */
    function addJourneyStep(
        address _cropId,
        string memory _stepType,
        string memory _description,
        address _actorId,
        string memory _actorType,
        string memory _metadata
    ) external onlyAuthorizedContract {
        require(traceabilityRecords[_cropId].cropId != address(0), "Crop not found");
        require(bytes(_stepType).length > 0, "Step type cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_actorId != address(0), "Invalid actor address");

        JourneyStep memory newStep = JourneyStep({
            stepType: _stepType,
            description: _description,
            actorId: _actorId,
            actorType: _actorType,
            timestamp: block.timestamp,
            metadata: _metadata
        });

        cropJourney[_cropId].push(newStep);
    }

    /**
     * @dev Get traceability record for a crop
     * @param _cropId Address of the crop
     * @return Traceability record
     */
    function getTraceabilityRecord(address _cropId) external view returns (TraceabilityRecord memory) {
        require(traceabilityRecords[_cropId].cropId != address(0), "Crop not found");
        return traceabilityRecords[_cropId];
    }

    /**
     * @dev Get verification record for a crop
     * @param _cropId Address of the crop
     * @return Verification record
     */
    function getVerificationRecord(address _cropId) external view returns (VerificationRecord memory) {
        require(verificationRecords[_cropId].cropId != address(0), "Verification record not found");
        return verificationRecords[_cropId];
    }

    /**
     * @dev Get crop journey steps
     * @param _cropId Address of the crop
     * @return Array of journey steps
     */
    function getCropJourney(address _cropId) external view returns (JourneyStep[] memory) {
        require(traceabilityRecords[_cropId].cropId != address(0), "Crop not found");
        return cropJourney[_cropId];
    }

    /**
     * @dev Get crop by QR code ID
     * @param _qrCodeId QR code ID
     * @return Crop address
     */
    function getCropByQRCode(string memory _qrCodeId) external view returns (address) {
        require(qrCodeToCrop[_qrCodeId] != address(0), "QR code not found");
        return qrCodeToCrop[_qrCodeId];
    }

    /**
     * @dev Get farmer crop count
     * @param _farmerId Address of the farmer
     * @return Number of crops
     */
    function getFarmerCropCount(address _farmerId) external view returns (uint256) {
        return farmerCropCount[_farmerId];
    }

    /**
     * @dev Get contract statistics
     * @return Total records and verifications
     */
    function getContractStats() external view returns (uint256, uint256) {
        return (totalRecords, totalVerifications);
    }

    /**
     * @dev Update authorized contracts (only owner)
     * @param _farmerGovtContract New farmer-govt contract address
     * @param _govtCustomerContract New govt-customer contract address
     */
    function updateAuthorizedContracts(
        address _farmerGovtContract,
        address _govtCustomerContract
    ) external onlyOwner {
        require(_farmerGovtContract != address(0), "Invalid farmer-govt contract address");
        require(_govtCustomerContract != address(0), "Invalid govt-customer contract address");
        
        farmerGovtContract = _farmerGovtContract;
        govtCustomerContract = _govtCustomerContract;
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
     * @dev Deactivate traceability record (only owner)
     * @param _cropId Address of the crop
     */
    function deactivateRecord(address _cropId) external onlyOwner {
        require(traceabilityRecords[_cropId].cropId != address(0), "Crop not found");
        traceabilityRecords[_cropId].isActive = false;
    }

    /**
     * @dev Get complete traceability data for a crop
     * @param _cropId Address of the crop
     * @return Complete traceability data
     */
    function getCompleteTraceabilityData(address _cropId) external view returns (
        TraceabilityRecord memory,
        VerificationRecord memory,
        JourneyStep[] memory
    ) {
        require(traceabilityRecords[_cropId].cropId != address(0), "Crop not found");
        
        return (
            traceabilityRecords[_cropId],
            verificationRecords[_cropId],
            cropJourney[_cropId]
        );
    }
}