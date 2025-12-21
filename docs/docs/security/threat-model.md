---
sidebar_position: 2
title: Threat Model
---

# Threat Model

A detailed look at potential attacks and how Aruvi defends against them.

## Attacker Profiles

### Script Kiddie
**Resources**: Low
**Sophistication**: Low
**Goal**: Easy exploits, griefing

**Threats**:
- Attempting known exploits
- Spamming transactions
- Social engineering

**Defenses**:
- Standard smart contract security
- Rate limiting on frontend
- No sensitive data exposure

### Financial Criminal
**Resources**: Medium
**Sophistication**: Medium
**Goal**: Steal funds

**Threats**:
- Smart contract exploits
- Phishing attacks
- Front-running

**Defenses**:
- Audited contracts
- No admin keys to steal
- Encrypted amounts prevent meaningful front-running

### Blockchain Analyst
**Resources**: Medium
**Sophistication**: High
**Goal**: De-anonymize users, gather intelligence

**Threats**:
- Address clustering
- Transaction graph analysis
- Timing analysis

**Defenses**:
- Amounts encrypted (limits value of analysis)
- Users can use fresh wallets
- Timing is visible (user responsibility to vary)

### Nation State
**Resources**: Very High
**Sophistication**: Very High
**Goal**: Surveillance, control

**Threats**:
- Break cryptography
- Compromise infrastructure
- Legal pressure

**Defenses**:
- FHE with 128-bit security
- Decentralized architecture
- No central company to pressure
- Open source code

## Attack Vectors

### Smart Contract Attacks

#### Reentrancy
**Attack**: Recursive calls to drain funds
**Status**: ❌ Mitigated
**How**: Checks-effects-interactions pattern, reentrancy guards

#### Integer Overflow
**Attack**: Manipulate arithmetic to create/destroy value
**Status**: ❌ Mitigated  
**How**: Solidity 0.8+ with built-in overflow checks

#### Access Control Bypass
**Attack**: Call privileged functions without permission
**Status**: ❌ Mitigated
**How**: Explicit access checks, minimal privilege design

#### Front-running
**Attack**: Insert transaction before victim's transaction
**Status**: ⚠️ Partially Mitigated
**How**: Amounts are encrypted, so profitable front-running is hard. Timing-based attacks still possible.

### Cryptographic Attacks

#### Key Extraction
**Attack**: Extract private key from ciphertext
**Status**: ❌ Mitigated
**How**: TFHE security based on hard lattice problems

#### Ciphertext Manipulation
**Attack**: Modify ciphertext to change plaintext value
**Status**: ❌ Mitigated
**How**: FHE is malleable by design (that's the feature), but modifications are constrained to valid operations

#### Side-channel Attack
**Attack**: Extract secrets from timing, power usage, etc.
**Status**: ⚠️ Partially Applicable
**How**: Mostly relevant to key generation, which happens in secure environments (Zama Gateway, user's browser)

#### Quantum Attack
**Attack**: Use quantum computer to break encryption
**Status**: ❌ Mitigated (for now)
**How**: TFHE is based on lattice problems, believed quantum-resistant. No practical quantum computers exist yet.

### Infrastructure Attacks

#### RPC Manipulation
**Attack**: Malicious RPC returns fake data
**Status**: ⚠️ User Responsibility
**How**: Users should use trusted RPCs. Critical operations verified by wallet.

#### Zama Gateway Compromise
**Attack**: Attacker controls decryption gateway
**Status**: ⚠️ Trust Assumption
**How**: Gateway can only decrypt what it's asked to. Can't steal funds, but could deny service or leak balances to attacker.

#### DNS Hijacking
**Attack**: Redirect users to fake frontend
**Status**: ⚠️ Standard Web Risk
**How**: DNSSEC, HTTPS, users should verify URLs

### Social Engineering

#### Phishing
**Attack**: Trick users into revealing keys or signing malicious transactions
**Status**: ⚠️ User Responsibility
**How**: Never share keys, verify transaction details in wallet, bookmark official site

#### Fake Support
**Attack**: Impersonate support to steal credentials
**Status**: ⚠️ User Responsibility
**How**: Aruvi will never ask for private keys. No "support" can help recover funds.

## Privacy Attack Analysis

### Amount Discovery

**Goal**: Learn how much someone sent/received

**Attack vectors**:
1. Wrap/Unwrap correlation
   - *Risk*: Wrap 100, transfer, unwrap 100 → amount revealed
   - *Mitigation*: Batch wraps, partial unwraps, time delays
   
2. Balance before/after
   - *Risk*: Track public USDC balance changes around transactions
   - *Mitigation*: Keep some public USDC uninvolved

3. Gas correlation
   - *Risk*: Similar gas costs might indicate similar amounts
   - *Mitigation*: Gas is fairly consistent for same operations

### Address Linkage

**Goal**: Link multiple addresses to same person

**Attack vectors**:
1. Funding patterns
   - *Risk*: All addresses funded from same source
   - *Mitigation*: Use different funding sources
   
2. Transaction timing
   - *Risk*: Multiple addresses active at same times
   - *Mitigation*: Randomize activity timing

3. Behavioral analysis
   - *Risk*: Similar usage patterns across addresses
   - *Mitigation*: Vary behavior

## Risk Matrix

| Attack | Likelihood | Impact | Overall Risk |
|--------|-----------|--------|--------------|
| Smart contract bug | Low | High | Medium |
| Phishing | High | High | High |
| Amount inference | Medium | Medium | Medium |
| Address linking | High | Low | Medium |
| Gateway compromise | Very Low | Medium | Low |
| Cryptographic break | Very Low | Very High | Low |
| Front-running | Medium | Low | Low |

## Recommendations

### High Risk Tolerance
(Small amounts, testing)
- Use any wallet
- Default settings fine
- Don't worry about address reuse

### Medium Risk Tolerance
(Moderate amounts, regular use)
- Use reputable hot wallet
- Be aware of wrap/unwrap timing
- Don't publicly link addresses

### Low Risk Tolerance
(Large amounts, sensitive transactions)
- Hardware wallet
- Fresh address per major transaction
- Randomize timing
- Split large amounts
- Consider additional privacy layers

## Future Mitigations

On our roadmap:
- **Stealth addresses**: Hide recipient addresses
- **Batch transactions**: Mix multiple operations
- **Relayers**: Hide sender addresses via relaying
- **TEE integration**: Additional computation privacy
