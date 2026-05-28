// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./EcoToken.sol";
import "./ProductRegistry.sol";

contract WasteRegistry is AccessControl {
    bytes32 public constant VENDOR_ROLE   = keccak256("VENDOR_ROLE");
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");

    EcoToken public ecoToken;
    ProductRegistry public productRegistry;

    struct WasteDeposit {
        uint256 id;
        address consumer;
        address vendor;
        string productId;
        uint8 material;
        uint256 weightGrams;
        uint256 tokensEarned;
        uint8 status;        // 0=pending, 1=pickedup, 2=processed
        uint256 createdAt;
        bool hasQR;
    }

    uint256 public depositCount;
    mapping(uint256 => WasteDeposit) public deposits;
    mapping(address => uint256[]) public consumerDeposits;
    mapping(address => uint256[]) public vendorDeposits;

    uint256 public totalWasteGrams;
    uint256 public totalTokensMinted;

    event WasteDropped(uint256 depositId, address consumer, address vendor, uint8 material, uint256 weightGrams, uint256 tokensEarned);
    event PickupConfirmed(uint256 depositId, address recycler, address vendor, uint256 vendorTokens);

    constructor(address _ecoToken, address _productRegistry) {
        ecoToken = EcoToken(_ecoToken);
        productRegistry = ProductRegistry(_productRegistry);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerAsVendor() external {
        _grantRole(VENDOR_ROLE, msg.sender);
    }

    function registerAsRecycler() external {
        _grantRole(RECYCLER_ROLE, msg.sender);
    }

    function dropOffWithQR(
        string calldata productId,
        address consumer,
        uint256 weightGrams
    ) external onlyRole(VENDOR_ROLE) {
        require(productRegistry.productExists(productId), "Product not registered");
        ProductRegistry.Product memory product = productRegistry.getProduct(productId);
        uint256 tokens = calculateTokens(product.material, weightGrams);
        _createDeposit(consumer, productId, product.material, weightGrams, tokens, true);
        ecoToken.mint(consumer, tokens);
    }

    function dropOffManual(
        address consumer,
        uint8 material,
        uint256 weightGrams
    ) external onlyRole(VENDOR_ROLE) {
        uint256 tokens = calculateTokens(material, weightGrams);
        _createDeposit(consumer, "", material, weightGrams, tokens, false);
        ecoToken.mint(consumer, tokens);
    }

    function confirmPickup(
        uint256 depositId,
        address vendor
    ) external onlyRole(RECYCLER_ROLE) {
        WasteDeposit storage deposit = deposits[depositId];
        require(deposit.status == 0, "Already picked up");
        deposit.status = 1;

        uint256 vendorTokens = calculateTokens(deposit.material, deposit.weightGrams);
        ecoToken.mint(vendor, vendorTokens);

        emit PickupConfirmed(depositId, msg.sender, vendor, vendorTokens);
    }

    function calculateTokens(uint8 material, uint256 weightGrams) public pure returns (uint256) {
        uint256 rate;
        if (material == 0) rate = 5;       // PLASTIC
        else if (material == 1) rate = 5;  // GLASS
        else if (material == 2) rate = 10; // METAL
        else if (material == 3) rate = 2;  // PAPER
        else if (material == 4) rate = 15; // EWASTE
        else rate = 1;                     // ORGANIC

        uint256 tokens = (weightGrams * rate) / 100;
        return tokens < 1 ? 1 : tokens;
    }

    function _createDeposit(
        address consumer,
        string memory productId,
        uint8 material,
        uint256 weightGrams,
        uint256 tokens,
        bool hasQR
    ) internal {
        depositCount++;
        deposits[depositCount] = WasteDeposit({
            id: depositCount,
            consumer: consumer,
            vendor: msg.sender,
            productId: productId,
            material: material,
            weightGrams: weightGrams,
            tokensEarned: tokens,
            status: 0,
            createdAt: block.timestamp,
            hasQR: hasQR
        });

        consumerDeposits[consumer].push(depositCount);
        vendorDeposits[msg.sender].push(depositCount);
        totalWasteGrams += weightGrams;
        totalTokensMinted += tokens;

        emit WasteDropped(depositCount, consumer, msg.sender, material, weightGrams, tokens);
    }

    function getDeposit(uint256 id) external view returns (WasteDeposit memory) {
        return deposits[id];
    }

    function getConsumerDeposits(address consumer) external view returns (uint256[] memory) {
        return consumerDeposits[consumer];
    }

    function getVendorDeposits(address vendor) external view returns (uint256[] memory) {
        return vendorDeposits[vendor];
    }
}