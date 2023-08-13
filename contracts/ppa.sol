// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract PPA {
    using SafeMath for uint256;

    address private owner;
    NonTransferableToken public token;
    struct StateChange {
        string description;
        uint256 timestamp;
    }

    mapping(uint256 => StateChange) public stateChanges;
    uint256 public stateChangeCount = 0;
    struct Generator {
        address payable generatorAddress;
        bool isVerified;
        uint256 minGeneration;
        uint penaltyPer1000;
        uint balance;
    }

    struct Consumer {
        address payable consumerAddress;
        bool isVerified;
        uint256 minConsumption;
        uint penaltyPer1000;
        uint balance;
    }

    struct MonthlyData {
        uint256 generation;
        uint256 consumption;
        bool isVerified;
        uint256 timestamp;
    }

    enum BillingFreq {
        WEEK,
        MONTH,
        QUARTER,
        YEAR
    }

    // Constants
    uint256 public constant MIN_GENERATION = 100; // Example value
    uint256 public constant MIN_CONSUMPTION = 50; // Example value

    // State variables
    Generator private generator;
    Consumer private consumer;
    mapping(uint256 => MonthlyData) public monthlyData;
    BillingFreq public freq;
    uint256 public contractStartDate;
    uint256 public contractEndDate;
    bool public contractInitiated = false;
    mapping(address => bool) public authorities;

    // Events
    event AuthorityAdded(address indexed authority);
    event GeneratorVerified(address indexed generator);
    event ConsumerVerified(address indexed consumer);
    event MonthlyDataUploaded(uint256 monthTimestamp);
    event PenaltiesCalculated(
        uint256 monthTimestamp,
        uint generatorPenalty,
        uint consumerPenalty
    );
    event ContractInitiated(uint256 startDate);
    event PenaltyAgreed(uint256 penaltyAmount);

    function recordStateChange(string memory description) internal {
        stateChanges[stateChangeCount] = StateChange({
            description: description,
            timestamp: block.timestamp
        });
        stateChangeCount++;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    // modifier onlyAuthority() {
    //     require(authorities[msg.sender], "Caller is not an authority");
    //     _;
    // }

    modifier onlyGenerator() {
        require(
            msg.sender == generator.generatorAddress,
            "Only generator allowed"
        );
        _;
    }

    modifier onlyConsumer() {
        require(
            msg.sender == consumer.consumerAddress,
            "Only consumer allowed"
        );
        _;
    }

    modifier contractActive() {
        require(
            block.timestamp >= contractStartDate &&
                block.timestamp <= contractEndDate,
            "Contract not active"
        );
        _;
    }

    constructor(
        address _tokenAddress,
        address payable _generatorAddress,
        address payable _consumerAddress,
        uint256 _minGeneration,
        uint256 _minConsumption
    ) {
        require(
            _tokenAddress != address(0),
            "Token address cannot be zero address"
        );
        require(
            _generatorAddress != address(0),
            "Generator address cannot be zero address"
        );
        require(
            _consumerAddress != address(0),
            "Consumer address cannot be zero address"
        );

        owner = msg.sender;
        token = NonTransferableToken(_tokenAddress);

        // Set default values
        generator.generatorAddress = _generatorAddress;
        generator.isVerified = true;
        generator.minGeneration = _minGeneration;
        generator.penaltyPer1000 = 5; // Default penalty value

        consumer.consumerAddress = _consumerAddress;
        consumer.isVerified = true;
        consumer.minConsumption = _minConsumption;
        consumer.penaltyPer1000 = 5; // Default penalty value

        recordStateChange("Contract created with default values");
    }

    function getBillingKeys()
        public
        pure
        returns (string memory, string memory, string memory, string memory)
    {
        return ("WEEK", "MONTH", "QUARTER", "YEAR");
    }

    function getBillingKeyByValue(
        BillingFreq billFreq
    ) public pure returns (string memory) {
        if (billFreq == BillingFreq.WEEK) return "WEEK";
        if (billFreq == BillingFreq.MONTH) return "MONTH";
        if (billFreq == BillingFreq.QUARTER) return "QUARTER";
        if (billFreq == BillingFreq.YEAR) return "YEAR";
        revert("Invalid billing frequency");
    }

    function getBillingValueByKey(
        string memory billFreq
    ) public pure returns (BillingFreq) {
        if (keccak256(bytes(billFreq)) == keccak256(bytes("WEEK")))
            return BillingFreq.WEEK;
        if (keccak256(bytes(billFreq)) == keccak256(bytes("MONTH")))
            return BillingFreq.MONTH;
        if (keccak256(bytes(billFreq)) == keccak256(bytes("QUARTER")))
            return BillingFreq.QUARTER;
        if (keccak256(bytes(billFreq)) == keccak256(bytes("YEAR")))
            return BillingFreq.YEAR;
        revert("Invalid billing frequency key");
    }

    modifier onlyAuthority() {
        require(token.balanceOf(msg.sender) > 0, "Caller is not an authority");
        _;
    }

    function addAuthority(address _authority) public onlyOwner {
        token.mintAndAssign(_authority, 1); // Mint 1 token to the authority
        emit AuthorityAdded(_authority);
    }

    function requestVerification(
        address payable _generator,
        address payable _consumer
    ) public {
        require(
            msg.sender == _generator || msg.sender == _consumer,
            "Only participants can request verification"
        );
        generator.generatorAddress = _generator;
        consumer.consumerAddress = _consumer;
        recordStateChange("Verification Requested");
    }

    function verifyGenerator() public onlyAuthority {
        generator.isVerified = true;
        emit GeneratorVerified(generator.generatorAddress);
        recordStateChange("Generator Verified");
    }

    function verifyConsumer() public onlyAuthority {
        consumer.isVerified = true;
        emit ConsumerVerified(consumer.consumerAddress);
        recordStateChange("Consumer Verified");
    }

    function setParameters(
        uint256 _genMinGeneration,
        uint256 _consMinConsumption,
        uint _genPenalty,
        uint _consPenalty,
        BillingFreq _freq,
        uint256 _contractDuration
    ) public {
        require(
            generator.isVerified && consumer.isVerified,
            "Parties need to be verified first"
        );
        require(
            msg.sender == generator.generatorAddress ||
                msg.sender == consumer.consumerAddress,
            "Only participants can set parameters"
        );

        generator.minGeneration = _genMinGeneration;
        consumer.minConsumption = _consMinConsumption;
        generator.penaltyPer1000 = _genPenalty;
        consumer.penaltyPer1000 = _consPenalty;
        freq = _freq;
        contractEndDate = block.timestamp + _contractDuration;
        recordStateChange("Parameters Set");
    }

    function initiateContract(uint256 startDate) public {
        require(
            generator.isVerified && consumer.isVerified,
            "Parties need to be verified first"
        );
        require(
            msg.sender == generator.generatorAddress ||
                msg.sender == consumer.consumerAddress,
            "Only participants can initiate contract"
        );

        contractStartDate = startDate;
        contractInitiated = true;
        emit ContractInitiated(startDate);
        recordStateChange("Contract Initiated");
    }

    function uploadMonthlyData(
        uint256 _monthTimestamp,
        uint256 _generation,
        uint256 _consumption
    ) public contractActive {
        require(
            msg.sender == generator.generatorAddress ||
                msg.sender == consumer.consumerAddress,
            "Only participants can upload data"
        );
        require(
            !monthlyData[_monthTimestamp].isVerified,
            "Data for this month already verified"
        );

        monthlyData[_monthTimestamp] = MonthlyData({
            generation: _generation,
            consumption: _consumption,
            isVerified: false,
            timestamp: _monthTimestamp
        });
        emit MonthlyDataUploaded(_monthTimestamp);
        recordStateChange("Monthly Data Uploaded");
    }

    function dataVerified(uint256 _monthTimestamp) public {
        require(
            msg.sender == generator.generatorAddress ||
                msg.sender == consumer.consumerAddress,
            "Only participants can verify data"
        );
        require(
            monthlyData[_monthTimestamp].timestamp == _monthTimestamp &&
                !monthlyData[_monthTimestamp].isVerified,
            "Data for this month not uploaded or already verified"
        );
        monthlyData[_monthTimestamp].isVerified = true;
        calculatePenalties(_monthTimestamp);
        recordStateChange("Data Verified");
    }

    function calculatePenalties(uint256 _monthTimestamp) internal {
        MonthlyData memory monthData = monthlyData[_monthTimestamp];
        uint generatorPenalty = 0;
        uint consumerPenalty = 0;

        if (monthData.generation < generator.minGeneration) {
            generatorPenalty =
                ((generator.minGeneration - monthData.generation) *
                    generator.penaltyPer1000) /
                1000;
            generator.balance = generator.balance.sub(generatorPenalty);
            consumer.balance = consumer.balance.add(generatorPenalty);
        }

        if (monthData.consumption < consumer.minConsumption) {
            consumerPenalty =
                ((consumer.minConsumption - monthData.consumption) *
                    consumer.penaltyPer1000) /
                1000;
            generator.balance = generator.balance.sub(consumerPenalty);
            consumer.balance = consumer.balance.add(consumerPenalty);
        }

        emit PenaltiesCalculated(
            _monthTimestamp,
            generatorPenalty,
            consumerPenalty
        );
        recordStateChange("Penalties Calculated");
    }

    function agreeOnPenalty(uint penaltyAmount) public contractActive {
        require(
            msg.sender == generator.generatorAddress ||
                msg.sender == consumer.consumerAddress,
            "Only participants can agree on penalties"
        );

        if (msg.sender == generator.generatorAddress) {
            consumer.balance -= penaltyAmount;
            generator.balance += penaltyAmount;
        } else {
            generator.balance -= penaltyAmount;
            consumer.balance += penaltyAmount;
        }

        emit PenaltyAgreed(penaltyAmount);
        recordStateChange("Penalty Agreed Upon");
    }

    function checkContractExpiry() external view {
        require(block.timestamp > contractEndDate, "Contract is still active");
        // Implement notification logic if needed.
    }
}

contract NonTransferableToken is IERC20 {
    using SafeMath for uint256;

    mapping(address => uint256) private _balances;
    uint256 private _totalSupply = 10000;
    address owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(
        address account
    ) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address, uint256) external pure override returns (bool) {
        revert("This token is non-transferable");
    }

    function allowance(
        address owner,
        address spender
    ) external pure override returns (uint256) {
        return 0; // As the token is non-transferable, no allowances are provided.
    }

    function approve(
        address spender,
        uint256 amount
    ) external pure override returns (bool) {
        revert("This token is non-transferable, approvals are not allowed");
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external pure override returns (bool) {
        revert("This token is non-transferable");
    }

    function mintAndAssign(
        address recipient,
        uint256 amount
    ) external onlyOwner {
        _mint(recipient, amount);
    }

    function _mint(address recipient, uint256 amount) internal {
        require(recipient != address(0), "Cannot mint to the zero address");
        _totalSupply += amount;
        _balances[recipient] += amount;
        emit Transfer(address(0), recipient, amount); // Emitting a Transfer event as per ERC-20 standards for minting
    }
}
