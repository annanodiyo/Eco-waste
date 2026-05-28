// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ProductRegistry is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");

    struct Product {
        string productId;
        string name;
        uint8 material;
        uint256 weightGrams;
        address manufacturer;
        string companyName;
        uint256 registeredAt;
        bool exists;
    }

    mapping(string => Product) public products;

    event ProductRegistered(string productId, address manufacturer, string name);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerAsManufacturer() external {
        _grantRole(MANUFACTURER_ROLE, msg.sender);
    }

    function registerProduct(
        string calldata productId,
        string calldata name,
        uint8 material,
        uint256 weightGrams,
        string calldata companyName
    ) external onlyRole(MANUFACTURER_ROLE) {
        require(!products[productId].exists, "Product already exists");

        products[productId] = Product({
            productId: productId,
            name: name,
            material: material,
            weightGrams: weightGrams,
            manufacturer: msg.sender,
            companyName: companyName,
            registeredAt: block.timestamp,
            exists: true
        });

        emit ProductRegistered(productId, msg.sender, name);
    }

    function getProduct(string calldata productId) external view returns (Product memory) {
        require(products[productId].exists, "Product not found");
        return products[productId];
    }

    function productExists(string calldata productId) external view returns (bool) {
        return products[productId].exists;
    }
}