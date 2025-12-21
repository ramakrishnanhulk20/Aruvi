---
sidebar_position: 3
title: Audits
---

# Security Audits

Information about Aruvi's security audits and bug bounty program.

## Audit Status

### Current Status: Pre-Audit (Testnet)

Aruvi is currently deployed on Sepolia testnet. Formal audits are scheduled before mainnet launch.

| Phase | Status |
|-------|--------|
| Internal Review | ✅ Complete |
| Testnet Deployment | ✅ Live |
| External Audit | 🔄 Scheduled |
| Bug Bounty | ✅ Active |
| Mainnet Launch | ⏳ After Audit |

## Planned Audits

### Smart Contract Audit

**Scope**:
- PaymentGateway.sol
- ConfidentialUSDCWrapper.sol
- ProductRegistry.sol
- RefundManager.sol

**Focus Areas**:
- Access control
- State management
- FHE integration correctness
- Economic attacks
- Gas optimization

### FHE Integration Review

**Scope**:
- Proper use of fhEVM primitives
- Encryption/decryption flows
- Input validation for encrypted types

**Auditor**: Working with Zama's security team

## Internal Review

What we've done internally:

### Static Analysis
- Slither analysis (all high/medium resolved)
- Mythril symbolic execution
- Custom FHE-specific checks

### Test Coverage
- Unit tests for all functions
- Integration tests for flows
- Fuzzing with Foundry

### Manual Review
- Line-by-line code review
- Architecture review
- Threat modeling sessions

## Bug Bounty Program

### Currently Active

Even before formal audits, we want the community's help finding issues.

### Rewards

| Severity | Reward |
|----------|--------|
| Critical | Up to $50,000 |
| High | Up to $10,000 |
| Medium | Up to $2,000 |
| Low | Up to $500 |

### Severity Definitions

**Critical**
- Direct theft of funds
- Permanent freezing of funds
- Breaking of core cryptographic guarantees

**High**
- Temporary freezing of funds
- Partial fund loss
- Significant information disclosure

**Medium**
- Griefing attacks (DOS)
- Minor information leakage
- Economic inefficiencies

**Low**
- UI bugs
- Gas inefficiencies
- Minor deviations from spec

### In Scope

- Smart contracts in `/contracts/contracts/`
- Frontend code in `/frontend/src/`
- Contract interactions and flows

### Out of Scope

- Test files
- Deployment scripts
- Third-party dependencies (report to them)
- Already known issues

### Rules

1. **Don't exploit on mainnet** — Testnet only
2. **Don't publicize before fix** — Responsible disclosure
3. **Provide clear reproduction steps**
4. **One report per issue**
5. **First valid reporter wins**

### How to Report

1. Email: security@aruvi.io
2. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. We'll respond within 48 hours
4. Work together on fix timeline
5. Get credited and rewarded

## Known Issues

### Acknowledged Limitations

| Issue | Status | Notes |
|-------|--------|-------|
| Address privacy not provided | By Design | Use fresh wallets |
| Transaction timing visible | By Design | User responsibility |
| Gateway is trusted | Accepted Risk | Future decentralization planned |
| Higher gas costs | By Design | FHE is expensive |

### Under Investigation

None currently.

## Past Incidents

### Testnet

No security incidents to date on testnet.

### Mainnet

Not yet launched.

## Verification

### Contract Verification

All contracts are verified on Etherscan:
- [PaymentGateway](https://sepolia.etherscan.io/address/0x05798f2304A5B9263243C8002c87D4f59546958D#code)
- ConfidentialUSDCWrapper (link)
- ProductRegistry (link)

### Source Code

All source code is available at:
- GitHub: [github.com/aruvi-project/aruvi](https://github.com/aruvi-project/aruvi)

Compare deployed bytecode with compiled source to verify.

## Security Contacts

- **Security Issues**: security@aruvi.io
- **General Questions**: Discord #security channel
- **PGP Key**: Available on request for encrypted communication

## Audit Reports

*(This section will be updated with links to audit reports as they become available)*

### Scheduled

| Auditor | Scope | Timeline |
|---------|-------|----------|
| TBD | Smart Contracts | Q1 2025 |
| Zama | FHE Integration | Q1 2025 |

### Completed

*None yet — check back after mainnet launch.*

---

## Community Review

While waiting for formal audits, we encourage community review:

1. **Read the code**: `/contracts/contracts/`
2. **Understand the architecture**: [Architecture docs](/docs/developers/architecture)
3. **Ask questions**: Discord #dev-chat
4. **Report issues**: Bug bounty or GitHub issues
5. **Discuss concerns**: Open forum discussion

The more eyes on the code, the more secure it becomes.
