---
sidebar_position: 2
title: Privacy Model
---

# Privacy Model

Let's be specific about what privacy means in Aruvi. Vague promises help nobody.

## What We Protect

### Transaction Amounts

Every payment amount is encrypted. When Alice sends Bob money:

- Alice knows how much she sent
- Bob knows how much he received
- Nobody else knows anything

The blockchain records prove a transfer happened, but the value is encrypted ciphertext. Even blockchain indexers, MEV bots, and curious neighbors see nothing useful.

### Account Balances

Your confidential token balance is encrypted. Only your private key can decrypt it.

When you check your balance in the app:
1. Your wallet signs a special message
2. The Zama Gateway decrypts the value
3. Only your browser sees the result

Not even our frontend servers see your actual balance.

### Payment Patterns

Because amounts are hidden, observers can't determine:
- Which transactions are large vs small
- Whether you're accumulating or spending down
- What your regular expenses look like
- Salary payments vs. random transfers

## What We Don't Protect

Honesty time. These things are still visible:

### Wallet Addresses

Sender and receiver addresses are public. If someone knows your address, they can see:
- That you use Aruvi
- Who you transact with
- How often you transact

**Mitigation:** Use fresh wallets for sensitive transactions.

### Transaction Timing

When transactions happen is visible. Someone watching closely might notice:
- You transact every two weeks (salary?)
- Regular payments to a specific address (subscription?)
- Activity patterns

**Mitigation:** Batch transactions or add random delays if this matters to you.

### Gas Fees

The ETH you spend on gas is visible. This is a minor leak, but theoretically someone could estimate activity levels.

### That You Use Confidential Tokens

The token contract address is public. Anyone can see you hold confidential USDC, just not how much.

## Threat Models

Different threats need different protections:

### ✅ Casual Observers
Random people browsing Etherscan? Completely blocked. They see nothing useful.

### ✅ Business Intelligence Firms
Companies that analyze blockchain data for insights? They can see activity, but amounts are worthless encrypted blobs.

### ✅ Curious Acquaintances
Someone who knows your address and wants to snoop? They learn nothing about your finances.

### ⚠️ Sophisticated Adversaries
Nation-states or well-funded attackers with lots of resources? Address analysis might reveal patterns. Use fresh wallets and be thoughtful about timing.

### ⚠️ Targeted Surveillance
If someone is specifically watching YOU with unlimited resources, blockchain privacy alone isn't enough. Consider your full operational security.

## Comparison to Alternatives

| System | Amount Privacy | Address Privacy | Approach |
|--------|---------------|-----------------|----------|
| Regular Ethereum | ❌ None | ❌ None | Everything public |
| Aruvi | ✅ Full | ❌ None | FHE encryption |
| Tornado Cash | ✅ Full | ✅ Full | Mixing + ZK proofs |
| Secret Network | ✅ Full | ⚠️ Partial | Separate chain |
| Zcash | ✅ Full | ✅ Full | Shielded pools |

Aruvi trades address privacy for EVM compatibility. You can use it with existing DeFi, existing wallets, existing infrastructure. No new chains to learn.

## Privacy Best Practices

1. **Use fresh wallets** for transactions you want unlinked
2. **Don't reuse addresses** across contexts
3. **Vary timing** if patterns could reveal information
4. **Be careful what you share** — don't publicly link wallets to your identity
5. **Understand your threat model** — privacy needs vary widely
