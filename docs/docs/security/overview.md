---
sidebar_position: 1
title: Security Overview
---

# Security Overview

How Aruvi keeps your payments secure.

## Security Model

Aruvi's security rests on three pillars:

### 1. Cryptographic Security

- **FHE Encryption**: Balances and amounts use TFHE (Torus Fully Homomorphic Encryption)
- **Zama's Implementation**: Battle-tested FHE library
- **No Trusted Setup**: Unlike some ZK systems, no ceremony required
- **Post-Quantum Resistant**: FHE based on lattice problems

### 2. Smart Contract Security

- **Minimal Attack Surface**: Contracts do one thing well
- **Access Controls**: Role-based permissions where needed
- **Reentrancy Protection**: Standard guards on all state changes
- **Input Validation**: All inputs checked before use

### 3. Operational Security

- **No Admin Keys**: Core contracts are immutable
- **No Backdoors**: No emergency functions that could drain funds
- **Open Source**: All code publicly auditable
- **Decentralized**: No single point of failure

## What's Protected

| Asset | Protection |
|-------|------------|
| Your balance | FHE encrypted — only you can decrypt |
| Transfer amounts | FHE encrypted end-to-end |
| Private keys | Never leave your wallet |
| Transaction data | Amounts hidden, addresses visible |

## What's NOT Protected

| Element | Status |
|---------|--------|
| Wallet addresses | Publicly visible |
| Transaction timing | Publicly visible |
| That you use Aruvi | Publicly visible |
| Gas fees paid | Publicly visible |

## Trust Assumptions

To use Aruvi safely, you're trusting:

### Zama's Cryptography
- FHE implementation is correct
- No vulnerabilities in TFHE-rs
- Zama Gateway operates honestly

**Mitigation**: Zama is a well-funded research company with published papers and code audits.

### Ethereum Security
- Base layer remains secure
- Consensus mechanism works
- No 51% attacks

**Mitigation**: Ethereum has years of battle-testing and massive economic security.

### Smart Contract Code
- No bugs in Aruvi contracts
- Logic works as intended
- No hidden vulnerabilities

**Mitigation**: Open source code, audits, and bug bounty program.

### Your Own Security
- Private keys stay private
- No phishing attacks
- Secure wallet practices

**Mitigation**: Standard crypto security practices apply.

## Encryption Details

### TFHE Parameters

Aruvi uses Zama's recommended security parameters:
- 128-bit security level
- Suitable for financial applications
- Performance-optimized for EVM

### Key Management

- **User keys**: Standard Ethereum keys (ECDSA)
- **FHE keys**: Generated client-side in browser
- **Decryption keys**: Never transmitted — local only
- **Network keys**: Managed by Zama Gateway

### Data at Rest

- On-chain: All amounts stored as ciphertext
- Off-chain: No sensitive data stored

### Data in Transit

- Standard HTTPS for frontend
- Ethereum protocol for transactions
- Zama Gateway for decryption requests

## Access Control

### Contract Functions

| Function | Who Can Call |
|----------|--------------|
| `send` | Anyone (uses own balance) |
| `wrap` | Anyone (uses own USDC) |
| `unwrap` | Anyone (uses own cUSDC) |
| `cancelSubscription` | Only subscription subscriber |
| `refund` | Only payment recipient |

### Admin Functions

Current deployment has no admin functions that can:
- Pause the protocol
- Freeze funds
- Modify parameters
- Upgrade contracts

This is intentional. Immutability means even we can't rug you.

## Known Risks

### Smart Contract Risk
Like all DeFi, bugs could cause fund loss. We mitigate through:
- Code audits
- Extensive testing
- Conservative design

### Cryptographic Risk
FHE is newer than traditional cryptography. Potential issues:
- Implementation bugs
- Future cryptographic breakthroughs
- Side-channel attacks

Zama actively researches and patches issues.

### Regulatory Risk
Privacy technologies face regulatory scrutiny. Consider:
- Your jurisdiction's laws
- Compliance requirements
- Record-keeping obligations

Aruvi provides privacy tools; compliance is user responsibility.

## Incident Response

If a vulnerability is discovered:

1. **Immediate**: Assess severity and scope
2. **Disclosure**: Responsible disclosure to users
3. **Mitigation**: Deploy fixes if possible
4. **Post-mortem**: Public report on what happened

## Responsible Disclosure

Found a vulnerability? Please:

1. **Don't exploit it**
2. **Email security@aruvi.io**
3. **Give us time to fix it**
4. **Get recognized (and rewarded)**

See our [bug bounty program](#) for rewards.

## Best Practices

### For Users

1. **Secure your keys** — Hardware wallets recommended for large amounts
2. **Verify addresses** — Transactions are irreversible
3. **Start small** — Test with small amounts first
4. **Stay updated** — Follow announcements for security notices

### For Integrators

1. **Validate inputs** — Don't trust user data
2. **Handle errors** — Failed transactions should fail safely
3. **Audit integrations** — Your code touches user funds
4. **Test thoroughly** — Use testnet extensively

## Further Reading

- [Threat Model](/docs/security/threat-model) — Detailed attack analysis
- [Audits](/docs/security/audits) — Security audit reports
- [Zama Security](https://docs.zama.ai/fhevm/security) — FHE implementation details
