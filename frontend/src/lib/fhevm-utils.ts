/**
 * FHEVM Utility Functions
 * Helper functions for FHEVM encryption and type conversions
 */

import { hexlify } from 'ethers';

/**
 * Convert Uint8Array to hex string using ethers
 * @param bytes - The bytes to convert
 * @returns Hex string with 0x prefix
 */
export function toHex(bytes: Uint8Array): `0x${string}` {
  return hexlify(bytes) as `0x${string}`;
}

/**
 * Map external encrypted integer type to RelayerEncryptedInput builder method
 * @param internalType - The Solidity internal type
 * @returns The corresponding builder method name
 */
export function getEncryptionMethod(internalType: string): string {
  switch (internalType) {
    case 'externalEbool':
      return 'addBool';
    case 'externalEuint8':
      return 'add8';
    case 'externalEuint16':
      return 'add16';
    case 'externalEuint32':
      return 'add32';
    case 'externalEuint64':
      return 'add64';
    case 'externalEuint128':
      return 'add128';
    case 'externalEuint256':
      return 'add256';
    case 'externalEaddress':
      return 'addAddress';
    default:
      throw new Error(`Unknown encryption type: ${internalType}`);
  }
}

// ABI types for contract interaction
interface ABIInput {
  name: string;
  type: string;
  indexed?: boolean;
  components?: ABIInput[];
}

interface ABIItem {
  type: string;
  name?: string;
  inputs?: ABIInput[];
  outputs?: ABIInput[];
  stateMutability?: string;
}

/**
 * Convert encrypted result to contract parameters based on ABI
 * @param enc - The encrypted result from FHEVM
 * @param abi - The contract ABI
 * @param functionName - The function name to call
 * @returns Array of formatted parameters ready for contract call
 */
export function formatEncryptedParams(
  enc: { handles: Uint8Array[]; inputProof: Uint8Array },
  abi: ABIItem[],
  functionName: string
): (string | bigint | boolean)[] {
  const fn = abi.find((item) => item.type === 'function' && item.name === functionName);
  if (!fn || !fn.inputs) throw new Error(`Function ABI not found for ${functionName}`);

  return fn.inputs.map((input, index) => {
    const raw = index === 0 ? enc.handles[0] : enc.inputProof;
    switch (input.type) {
      case 'bytes32':
      case 'bytes':
        return hexlify(raw);
      case 'uint256':
        return BigInt(raw as unknown as string);
      case 'address':
      case 'string':
        return raw as unknown as string;
      case 'bool':
        return Boolean(raw);
      default:
        console.warn(`Unknown ABI param type ${input.type}; passing as hex`);
        return hexlify(raw);
    }
  });
}
