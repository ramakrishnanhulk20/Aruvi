// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialUSDCWrapper
/// @notice Wraps standard ERC20 tokens (like USDC) into confidential ERC7984 tokens
/// @dev Extends OpenZeppelin's ERC7984ERC20Wrapper with Zama Ethereum configuration
///      Provides 1:1 wrapping - 1 USDC becomes 1 cUSDC (both 6 decimals)
contract ConfidentialUSDCWrapper is ZamaEthereumConfig, ERC7984ERC20Wrapper {
    /// @notice Creates a new confidential wrapper for an ERC20 token
    /// @param underlyingToken The ERC20 token to wrap (e.g., USDC at 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 on Sepolia)
    /// @param name The name of the confidential token (e.g., "Confidential USDC")
    /// @param symbol The symbol of the confidential token (e.g., "cUSDC")
    /// @param uri Optional contract metadata URI (kept for parity with reference wrapper)
    constructor(
        address underlyingToken,
        string memory name,
        string memory symbol,
        string memory uri
    ) ERC7984(name, symbol, uri) ERC7984ERC20Wrapper(IERC20(underlyingToken)) {
        // Constructor automatically inherits EthereumConfig which sets up Zama protocol
        // Rate is automatically calculated by ERC7984ERC20Wrapper constructor
    }
}
