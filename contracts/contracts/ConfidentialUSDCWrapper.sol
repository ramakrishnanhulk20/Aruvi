// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.27;

import "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialUSDCWrapper
/// @notice Wraps ERC20 USDC into confidential ERC7984 tokens (1:1 ratio)
contract ConfidentialUSDCWrapper is ZamaEthereumConfig, ERC7984ERC20Wrapper {
    constructor(
        address underlyingToken,
        string memory name,
        string memory symbol,
        string memory uri
    ) ERC7984(name, symbol, uri) ERC7984ERC20Wrapper(IERC20(underlyingToken)) {}
}
