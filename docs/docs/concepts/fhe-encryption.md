---
sidebar_position: 3
title: FHE Encryption
---

# Fully Homomorphic Encryption

FHE is the cryptography that makes Aruvi possible. Let's break it down without getting too academic.

## The Basic Idea

Normal encryption is like a locked box. Put something in, lock it, and nobody can see inside. But if you need to do anything with the contents, you have to unlock it first. Which means someone sees the contents.

FHE is like a magic box where you can manipulate what's inside without opening it. Reach in through special gloves, rearrange things, and the result stays locked.

```
Traditional: Encrypt → (can't do anything) → Decrypt → Compute → Encrypt
FHE:         Encrypt → Compute on ciphertext → Decrypt result
```

## Why This Matters for Payments

A payment involves math:

```
new_sender_balance = old_sender_balance - amount
new_receiver_balance = old_receiver_balance + amount
```

With FHE, we do this math on encrypted values:

```
encrypted(new_sender) = encrypted(old_sender) - encrypted(amount)
encrypted(new_receiver) = encrypted(old_receiver) + encrypted(amount)
```

The blockchain never sees actual numbers. It just shuffles encrypted blobs around.

## How Aruvi Uses FHE

### Encrypted Balances

Your confidential token balance is stored as an `euint64` — an encrypted unsigned 64-bit integer. On-chain, it looks like random bytes. Only you can decrypt it.

### Encrypted Transfers

When you send money:

1. Your browser encrypts the amount
2. The contract adds/subtracts encrypted values
3. New encrypted balances are stored
4. Nobody saw actual numbers at any step

### Balance Checks

"But wait — how does the contract know I have enough funds if it can't see my balance?"

Great question! FHE supports comparison operations on encrypted values. The contract can check:

```
encrypted(balance) >= encrypted(amount)
```

This returns an encrypted boolean. The contract can use this to conditionally proceed or revert — all without learning actual values.

## The Zama Stack

Aruvi runs on [Zama's fhEVM](https://www.zama.ai/fhevm), which adds FHE to the Ethereum Virtual Machine.

Key components:

### TFHE-rs
Zama's core FHE library, written in Rust. Blazing fast for FHE standards.

### fhEVM
A modified EVM that understands encrypted types. Solidity contracts can declare `euint64` variables and perform operations on them.

### Zama Gateway
A service that handles decryption requests. When you need to see your actual balance, you prove ownership and the gateway decrypts.

## Encrypted Types

Contracts can use various encrypted types:

| Type | Description |
|------|-------------|
| `ebool` | Encrypted boolean |
| `euint4` | Encrypted 4-bit unsigned int |
| `euint8` | Encrypted 8-bit unsigned int |
| `euint16` | Encrypted 16-bit unsigned int |
| `euint32` | Encrypted 32-bit unsigned int |
| `euint64` | Encrypted 64-bit unsigned int |
| `eaddress` | Encrypted address |

Aruvi uses `euint64` for balances and amounts — enough range for any reasonable payment.

## Performance

FHE is computationally expensive. Let's be real:

- Operations take longer than plaintext
- Gas costs are higher
- There's network latency for decryption

But it's getting faster. Zama's optimizations have made it practical for real use. A payment takes a few seconds, not minutes.

## The Trade-offs

| Aspect | Trade-off |
|--------|-----------|
| **Privacy** | Excellent — amounts are truly hidden |
| **Speed** | Slower than regular transactions |
| **Cost** | Higher gas fees |
| **Complexity** | More complex contracts |
| **Compatibility** | Works with standard wallets |

We think the privacy benefits outweigh the costs for financial transactions. Your mileage may vary.

## Learning More

Want to dive deeper?

- [Zama Documentation](https://docs.zama.ai/) — the source
- [TFHE Deep Dive](https://www.zama.ai/post/tfhe-deep-dive-part-1) — technical details
- [FHE.org](https://fhe.org/) — community resources
