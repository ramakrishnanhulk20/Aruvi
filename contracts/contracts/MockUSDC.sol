// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Mock USDC token for testing (mimics real USDC with 6 decimals)
/// @dev Anyone can mint for testing purposes
contract MockUSDC is ERC20 {
    uint8 private constant DECIMALS = 6;
    uint256 private constant MAX_MINT_PER_CALL = 10 * 1e6; // 10 XUSD per call (6 decimals)

    constructor() ERC20("XUSD", "XUSD") {}

    /// @notice Returns 6 decimals to match real USDC
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Mint tokens to any address (for testing only)
    /// @param to The recipient address
    /// @param amount The amount to mint (in 6-decimal units)
    function mint(address to, uint256 amount) external {
        require(amount <= MAX_MINT_PER_CALL, "Mint capped at 10 XUSD per call");
        _mint(to, amount);
    }

    /// @notice Mint tokens to caller (convenience function)
    /// @param amount The amount to mint (in 6-decimal units)
    function mintTo(uint256 amount) external {
        require(amount <= MAX_MINT_PER_CALL, "Mint capped at 10 XUSD per call");
        _mint(msg.sender, amount);
    }
}
