# Aruvi Contracts (FHEVM)

Smart contracts for **Aruvi**, a multi-tenant payment gateway for **confidential tokens** on Zama FHEVM.

## What this is

- `PaymentGateway`: registers merchants and routes **encrypted** payments to merchant wallets.
- `RefundManager`: optional refund queue/executor; the gateway enforces authorization.
- **Token standard**: **ERC7984-only** (OpenZeppelin Confidential Contracts).

This repo intentionally does **not** use ERC20-style `approve/allowance` for payments. ERC7984 uses an **operator** model.

## Payment flow (ERC7984)

1. Merchant is registered in the gateway by the gateway owner.
2. Customer encrypts an amount off-chain and calls `PaymentGateway.processPayment(...)`.
3. Customer must first authorize the gateway as an operator on the token:
   - `token.setOperator(gateway, until)`
4. The gateway calls `token.confidentialTransferFrom(customer, merchant, amount)`.

## Refund flow (ERC7984)

1. Merchant (or an owner-approved `RefundManager`) initiates refund via `PaymentGateway.processRefund(...)`.
2. Merchant must authorize the gateway as an operator on the token:
   - `token.setOperator(gateway, until)`
3. The gateway calls `token.confidentialTransferFrom(merchant, customer, storedAmount)`.

## Quick Start

For detailed instructions see:
[FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

## Sepolia smoke test (real network)

This is a **transaction-level** end-to-end check on Sepolia using an existing ERC7984 token address.

It deploys a fresh `PaymentGateway`, registers a merchant, then performs:
- `customer -> merchant` payment via `token.setOperator(gateway, until)` + `gateway.processPayment(...)`
- `merchant -> customer` refund via `token.setOperator(gateway, until)` + `gateway.processRefund(...)`

Run:

```bash
# PowerShell example
$env:ERC7984_TOKEN_ADDRESS="0x..."  # must be an ERC7984 token on Sepolia
$env:PAYMENT_CENTS="5000"          # optional; default 5000
npm run smoke:sepolia
```

Notes:
- The customer account must already have enough token balance on that ERC7984 token.
- This script does not decrypt balances on Sepolia (it logs encrypted handles). For decryption, use the Relayer SDK client-side.

## Sepolia deployments (XUSD stack)

Canonical stack live on Sepolia (Dec 2025):
- XUSD (mock, mint ≤ 10 tokens/call): `0x3d99929dcb309c9630a29AC6423b7E0f29e586bc`
- ConfidentialUSDCWrapper (wraps XUSD → cUSDC): `0x0e564030B638EA79307a54b7B7f8105f27d04E80`
- PaymentGateway: `0xff711932eF6058003bEe66e3f3Ced5fBA45640F4`
- RefundManager: `0xCF03d4099F749193d9eD921D1C48e5adBc09EF81`

Env defaults for scripts:
```
UNDERLYING_ERC20_ADDRESS=0x3d99929dcb309c9630a29AC6423b7E0f29e586bc
ERC7984_WRAPPER_ADDRESS=0x0e564030B638EA79307a54b7B7f8105f27d04E80
GATEWAY_ADDRESS=0xff711932eF6058003bEe66e3f3Ced5fBA45640F4
REFUND_MANAGER_ADDRESS=0xCF03d4099F749193d9eD921D1C48e5adBc09EF81
RELAYER_URL=https://relayer.testnet.zama.org
```

## Merchant quickstart (XUSD → cUSDC → pay)

Goal: mint test XUSD, shield into cUSDC, pay a merchant via the live gateway, and verify refund.

1) Fund your Sepolia wallet with a bit of ETH for gas.
2) Mint XUSD (cap 10 per call):
   ```bash
   # Mint 10 XUSD to yourself
   cast send 0x3d99929dcb309c9630a29AC6423b7E0f29e586bc "mintTo(uint256)" 10000000 --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
   ```
3) Shield (wrap) into cUSDC:
   ```bash
   # Approve and wrap 5 XUSD
   cast send 0x3d99929dcb309c9630a29AC6423b7E0f29e586bc "approve(address,uint256)" 0x0e564030B638EA79307a54b7B7f8105f27d04E80 5000000 --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
   cast send 0x0e564030B638EA79307a54b7B7f8105f27d04E80 "wrap(address,uint256)" $YOUR_ADDRESS 5000000 --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
   ```
4) Authorize gateway as operator on cUSDC:
   ```bash
   cast send 0x0e564030B638EA79307a54b7B7f8105f27d04E80 "setOperator(address,uint48)" 0xff711932eF6058003bEe66e3f3Ced5fBA45640F4 $((`date +%s` + 3600)) --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
   ```
5) Run the end-to-end smoke (wrap→pay→refund) with relayer encryption:
   ```bash
   npm run smoke:sepolia -- --network sepolia
   ```
   The script will encrypt amounts via `@zama-fhe/relayer-sdk` and drive payment + refund against the deployed gateway.

Notes:
- Wrapping is public (amount visible on-chain). Payments and refunds remain encrypted.
- The mock XUSD faucet enforces 10-token-per-call to keep balances small on testnet.

## Shield + Pay flow (wrap ERC20 → ERC7984 → pay merchant)

This is the full user journey: user has a public ERC20 token, wraps it into a confidential ERC7984 token, then pays a merchant — all in one demo.

**Prerequisite:** an ERC7984 wrapper token deployed on Sepolia (e.g., OZ `ERC7984ERC20Wrapper` instance).

Run:

```bash
# PowerShell example
$env:ERC7984_WRAPPER_ADDRESS="0x..."      # ERC7984 wrapper token address
$env:UNDERLYING_ERC20_ADDRESS="0x..."     # underlying public ERC20 (e.g., test USDC)
$env:PAYMENT_CENTS="5000"                 # optional; default 5000
npm run smoke:sepolia:shield
```

What it does:
1. Customer approves wrapper to pull underlying ERC20.
2. Customer calls `wrapper.wrap(customer, amount)` → mints confidential tokens (shielding boundary; public amount visible here).
3. Customer calls `token.setOperator(gateway, until)` → authorizes gateway.
4. Customer calls `gateway.processPayment(...)` → encrypted transfer to merchant.
5. Merchant calls `token.setOperator(gateway, until)` → authorizes gateway for refund.
6. Merchant calls `gateway.processRefund(...)` → encrypted transfer back to customer.

**Privacy note:** The `wrap` call is public (amount visible on-chain). Once wrapped, all payments/refunds are confidential (amounts encrypted).

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Test on Sepolia Testnet**

   ```bash
   # Once deployed, you can run a simple test on Sepolia.
   npx hardhat test --network sepolia
   ```

## 📁 Project Structure

```
contracts/
   contracts/
      PaymentGateway.sol
      RefundManager.sol
      MockERC7984.sol        # Test-only ERC7984 token used in local tests
   test/
      PaymentGateway.test.ts
      PaymentGateway.refund.test.ts
```

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

---

Note: Some legacy/demo contracts may remain for reference, but the supported integration path is **ERC7984 only**.
