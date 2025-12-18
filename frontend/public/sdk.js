/**
 * Aruvi SDK v2.0.0
 * JavaScript SDK for integrating confidential payments into merchant websites
 * 
 * Features:
 * - Secure server-side payment verification
 * - Decryption signature support for trustless verification
 * - HTTP 402 payment protocol support
 * - Protected resource access
 * 
 * Usage:
 * <script src="https://aruvi.app/sdk.js"></script>
 * <script>
 *   const aruvi = Aruvi.init({
 *     merchantAddress: '0xYOUR_ADDRESS',
 *     network: 'sepolia'
 *   });
 *   
 *   // Simple checkout (redirect flow)
 *   await aruvi.checkout({
 *     amount: 10.5,
 *     orderId: 'ORDER123',
 *     onSuccess: (result) => console.log('Payment successful!', result)
 *   });
 *   
 *   // Access protected API (402 flow)
 *   const data = await aruvi.fetchProtected('/api/premium-data', { amount: 1000000 });
 * </script>
 */

(function (window) {
  'use strict';

  // Use current origin for demo (works on localhost and production)
  const ARUVI_BASE_URL = window.location.origin;
  const ARUVI_CHECKOUT_URL = `${ARUVI_BASE_URL}/checkout`;
  const ARUVI_VERIFY_URL = `${ARUVI_BASE_URL}/api/payment/verify`;
  const ARUVI_SESSION_URL = `${ARUVI_BASE_URL}/api/payment/session`;
  
  // Support for both xUSD and USDC token systems
  const CONTRACTS = {
    sepolia: {
      // Default: Official USDC system
      GATEWAY: '0x5B263646881afd742c157D8Efc307ac39E65662e',
      WRAPPER: '0x5f8D47C188478fDf89a9aff7275b86553fc126fe',
      REFUND_MANAGER: '0xe2045ff92802F273506Be69b314b29ED9f0dF63e',
      PRODUCT_REGISTRY: '0x0AA169680b5AAe296Fc8634C28B2a86ddb99f300',
      CUSD: '0x5f8D47C188478fDf89a9aff7275b86553fc126fe',
      
      // Token-specific contract sets
      USDC: {
        GATEWAY: '0x5B263646881afd742c157D8Efc307ac39E65662e',
        WRAPPER: '0x5f8D47C188478fDf89a9aff7275b86553fc126fe',
        REFUND_MANAGER: '0xe2045ff92802F273506Be69b314b29ED9f0dF63e',
        PRODUCT_REGISTRY: '0x0AA169680b5AAe296Fc8634C28B2a86ddb99f300',
        UNDERLYING: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        SYMBOL: 'USDC'
      },
      
      xUSD: {
        GATEWAY: '0xEcC6317E60C3115A782D577d02322eDc3c27119a',
        WRAPPER: '0xbA89Abc56387D3bA5864E6A0a0a5e7cd9d872845',
        REFUND_MANAGER: '0xe637B2B335F6Ab8A108d8d1Bc39916589703dC4E',
        PRODUCT_REGISTRY: '0x9523Bb7B1f1e3E773fc575Bc86f9b874C70B4D1D',
        UNDERLYING: '0xC392ceE2b731A6a719BAd5205B9Cb44F346F012a',
        SYMBOL: 'xUSD'
      }
    }
  };

  const NETWORK_CONFIG = {
    sepolia: {
      chainId: 11155111,
      name: 'ethereum-sepolia',
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/kXytHHVSIDpIomFmHFiYA'
    }
  };

  // ProductRegistry ABI (minimal - only what we need)
  const PRODUCT_REGISTRY_ABI = [
    {
      "inputs": [
        {"internalType": "address", "name": "merchant", "type": "address"},
        {"internalType": "uint256", "name": "productId", "type": "uint256"}
      ],
      "name": "getProduct",
      "outputs": [
        {"internalType": "string", "name": "name", "type": "string"},
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "uint8", "name": "productType", "type": "uint8"},
        {"internalType": "uint8", "name": "pricingMode", "type": "uint8"},
        {"internalType": "uint256", "name": "publicPrice", "type": "uint256"},
        {"internalType": "bool", "name": "active", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // =============================================================================
  // Utility Functions
  // =============================================================================

  /**
   * Fetch product details from ProductRegistry contract
   * @param {string} merchantAddress - Merchant's address
   * @param {number} productId - Product ID (0, 1, 2...)
   * @param {string} network - Network name
   * @returns {Promise<Object>} Product details {name, description, price}
   */
  async function fetchProductFromRegistry(merchantAddress, productId, network = 'sepolia') {
    const config = NETWORK_CONFIG[network];
    const contracts = CONTRACTS[network];
    
    if (!config || !contracts) {
      throw new Error(`Unsupported network: ${network}`);
    }

    try {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const registry = new ethers.Contract(
        contracts.PRODUCT_REGISTRY,
        PRODUCT_REGISTRY_ABI,
        provider
      );

      const product = await registry.getProduct(merchantAddress, productId);
      
      return {
        name: product[0],
        description: product[1],
        productType: Number(product[2]),
        pricingMode: Number(product[3]),
        price: Number(product[4]), // Convert BigInt to Number for JSON serialization
        priceDisplay: (Number(product[4]) / 1e6).toFixed(2), // Convert to display format
        active: product[5]
      };
    } catch (error) {
      console.error('[Aruvi] Failed to fetch product from registry:', error);
      throw new Error('Product not found in registry');
    }
  }

  /**
   * Encode payment payload for x-payment header
   */
  function encodePaymentHeader(payload) {
    return btoa(JSON.stringify(payload));
  }

  /**
   * Parse payment requirements from 402 response
   */
  function parsePaymentRequirements(response) {
    const header = response.headers.get('X-Accept-Payment');
    if (!header) return [];
    try {
      return JSON.parse(header);
    } catch {
      return [];
    }
  }

  // =============================================================================
  // AruviSDK Class
  // =============================================================================

  class AruviSDK {
    constructor(config) {
      this.merchantAddress = config.merchantAddress;
      this.network = config.network || 'sepolia';
      this.tokenSystem = config.tokenSystem || 'USDC'; // 'USDC' or 'xUSD'
      this.verifierUrl = config.verifierUrl || ARUVI_VERIFY_URL;
      this.contracts = CONTRACTS[this.network];
      this.networkConfig = NETWORK_CONFIG[this.network];
      
      // Get token-specific contracts
      this.tokenContracts = this.contracts[this.tokenSystem] || this.contracts.USDC;
      
      if (!this.contracts) {
        throw new Error(`Unsupported network: ${this.network}`);
      }
      
      if (!this.merchantAddress || !this.merchantAddress.startsWith('0x')) {
        throw new Error('Invalid merchant address');
      }
    }
    
    /**
     * Get contracts for the configured token system
     */
    getContracts() {
      return this.tokenContracts;
    }
    
    /**
     * Switch to a different token system (USDC or xUSD)
     */
    switchTokenSystem(tokenSystem) {
      if (!['USDC', 'xUSD'].includes(tokenSystem)) {
        throw new Error(`Invalid token system: ${tokenSystem}. Use 'USDC' or 'xUSD'`);
      }
      this.tokenSystem = tokenSystem;
      this.tokenContracts = this.contracts[tokenSystem];
      return this.tokenContracts;
    }

    // =========================================================================
    // Checkout Flow (Redirect-based)
    // =========================================================================

    /**
     * Open checkout flow with trustless blockchain-verified pricing
     * 
     * Two modes:
     * 1. Trustless (recommended): Pass productId (0, 1, 2...), SDK fetches price from blockchain
     * 2. Legacy: Pass amount directly (merchant can lie about price)
     * 
     * @param {Object} options - Payment options
     * @param {number} [options.productId] - Product ID for trustless lookup (0, 1, 2...)
     * @param {number} [options.amount] - Legacy: Direct amount (not trustless!)
     * @param {string} [options.productName] - Display name (optional, overrides fetched name)
     * @param {string} options.orderId - Merchant's order ID
     * @param {Object} options.metadata - Additional metadata
     * @param {Function} options.onSuccess - Success callback
     * @param {Function} options.onError - Error callback
     * @returns {Promise<void>}
     */
    async checkout(options) {
      const {
        productId,
        amount,
        productName,
        orderId = '',
        metadata = {},
        type = 'product',
        onSuccess,
        onError
      } = options;

      try {
        let productData = null;

        // TRUSTLESS MODE: Fetch from ProductRegistry
        if (productId !== undefined && productId !== null) {
          try {
            // Use token-specific ProductRegistry
            const registryAddress = this.tokenContracts.PRODUCT_REGISTRY;
            const provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
            const registry = new ethers.Contract(
              registryAddress,
              PRODUCT_REGISTRY_ABI,
              provider
            );

            const product = await registry.getProduct(this.merchantAddress, productId);
            
            productData = {
              name: product[0],
              description: product[1],
              productType: Number(product[2]),
              pricingMode: Number(product[3]),
              price: Number(product[4]),
              priceDisplay: (Number(product[4]) / 1e6).toFixed(2),
              active: product[5],
              tokenSystem: this.tokenSystem
            };
            
            console.log(`[Aruvi] ✓ Blockchain-verified product from ${this.tokenSystem} registry:`, productData);
          } catch (error) {
            console.error('[Aruvi] Failed to fetch product from registry:', error);
            if (onError) onError(new Error('Product not found in registry'));
            return;
          }
        }

        // Create payment session
        const sessionResponse = await fetch(ARUVI_SESSION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantAddress: this.merchantAddress,
            productId: productId,
            amount: productData ? productData.price : amount, // Use blockchain price if available
            productName: productName || (productData ? productData.name : ''),
            orderId,
            type,
            tokenSystem: this.tokenSystem, // Include token system
            metadata: {
              ...metadata,
              trustless: !!productData, // Flag indicating blockchain-verified pricing
              productDescription: productData?.description,
              tokenSystem: this.tokenSystem
            }
          })
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to create payment session');
        }

        const { sessionId, checkoutUrl } = await sessionResponse.json();

        // Check if we're returning from payment
        const urlParams = new URL(window.location.href).searchParams;
        if (urlParams.get('aruvi_payment') === 'complete') {
          this._handleReturn(onSuccess, onError);
        } else {
          // Redirect to checkout with session (NO AMOUNT IN URL!)
          const finalUrl = new URL(checkoutUrl, ARUVI_BASE_URL);
          const returnUrl = new URL(window.location.href);
          returnUrl.searchParams.set('aruvi_payment', 'complete');
          finalUrl.searchParams.set('returnUrl', encodeURIComponent(returnUrl.toString()));
          
          window.location.href = finalUrl.toString();
        }
      } catch (err) {
        if (onError) onError(err);
      }
    }

    _handleReturn(onSuccess, onError) {
      const url = new URL(window.location.href);
      const status = url.searchParams.get('status');
      const paymentId = url.searchParams.get('paymentId');
      const txHash = url.searchParams.get('txHash');
      const returnedOrderId = url.searchParams.get('orderId');
      const sessionId = url.searchParams.get('sessionId');

      if (status === 'success') {
        const result = {
          success: true,
          paymentId,
          txHash,
          orderId: returnedOrderId,
          sessionId,
          merchant: this.merchantAddress
        };

        if (onSuccess) onSuccess(result);
        
        // Clean up URL
        url.searchParams.delete('aruvi_payment');
        url.searchParams.delete('status');
        url.searchParams.delete('paymentId');
        url.searchParams.delete('txHash');
        url.searchParams.delete('orderId');
        url.searchParams.delete('sessionId');
        window.history.replaceState({}, '', url.toString());
      } else {
        if (onError) onError(new Error('Payment failed or cancelled'));
      }
    }

    // =========================================================================
    // Protected Resource Access (HTTP 402 Flow)
    // =========================================================================

    /**
     * Fetch a protected resource with automatic payment handling
     * 
     * Flow:
     * 1. Make initial request
     * 2. If 402, parse requirements from X-Accept-Payment header
     * 3. Make confidential transfer
     * 4. Create decryption signature
     * 5. Retry request with x-payment header
     * 6. Server verifies payment and returns content
     * 
     * @param {string} url - URL of the protected resource
     * @param {Object} options - Options
     * @param {number} options.amount - Payment amount (in token decimals)
     * @param {Object} options.fhevmInstance - FHEVM instance for encryption
     * @param {Object} options.signer - Ethers signer for signing
     * @returns {Promise<Object>} Response data
     */
    async fetchProtected(url, options = {}) {
      const { fhevmInstance, signer } = options;

      // 1. Make initial request
      const initialResponse = await fetch(url);
      
      // If not 402, return response as-is
      if (initialResponse.status !== 402) {
        if (!initialResponse.ok) {
          throw new Error(`Request failed: ${initialResponse.status}`);
        }
        return initialResponse.json();
      }

      // 2. Parse payment requirements
      const requirements = parsePaymentRequirements(initialResponse);
      if (requirements.length === 0) {
        throw new Error('No payment requirements in 402 response');
      }

      const requirement = requirements[0];
      console.log('[Aruvi] Payment required:', requirement);

      // Need fhevmInstance and signer for automatic payment
      if (!fhevmInstance || !signer) {
        throw new Error('fhevmInstance and signer required for automatic payment');
      }

      // 3. Make confidential transfer
      const txHash = await this._makeConfidentialTransfer(
        fhevmInstance,
        signer,
        requirement.payTo,
        requirement.asset,
        BigInt(requirement.maxAmountRequired)
      );

      console.log('[Aruvi] Transfer completed:', txHash);

      // 4. Create decryption signature for verification
      const decryptionSignature = await this._createDecryptionSignature(
        fhevmInstance,
        signer,
        [requirement.asset]
      );

      // 5. Build payment payload
      const paymentPayload = {
        version: 1,
        scheme: 'confidential-transfer',
        network: this.networkConfig.name,
        chainId: this.networkConfig.chainId,
        payload: {
          txHash,
          decryptionSignature
        }
      };

      // 6. Retry request with payment header
      const paymentResponse = await fetch(url, {
        headers: {
          'x-payment': encodePaymentHeader(paymentPayload)
        }
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json().catch(() => ({}));
        throw new Error(error.reason || error.message || 'Payment verification failed');
      }

      return paymentResponse.json();
    }

    async _makeConfidentialTransfer(fhevmInstance, signer, to, tokenAddress, amount) {
      // Create encrypted amount
      const input = await fhevmInstance.createEncryptedInput(tokenAddress, await signer.getAddress());
      input.add64(amount);
      const encrypted = await input.encrypt();

      // Get token contract
      const tokenABI = [
        'function confidentialTransfer(address to, bytes32 amount, bytes inputProof) returns (bool)'
      ];
      const token = new ethers.Contract(tokenAddress, tokenABI, signer);

      // Make transfer
      const tx = await token.confidentialTransfer(to, encrypted.handles[0], encrypted.inputProof);
      const receipt = await tx.wait();

      return receipt.hash;
    }

    async _createDecryptionSignature(fhevmInstance, signer, contractAddresses) {
      const userAddress = await signer.getAddress();
      
      // Generate ephemeral keypair
      const ephemeralWallet = ethers.Wallet.createRandom();
      const publicKey = ephemeralWallet.publicKey;
      const privateKey = ephemeralWallet.privateKey;

      // Create EIP-712 signature for decryption authorization
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 1; // Short-lived for security

      const eip712 = fhevmInstance.createEIP712(publicKey, contractAddresses, startTimestamp, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      return {
        signature,
        publicKey,
        privateKey,
        userAddress,
        contractAddresses,
        startTimestamp,
        durationDays
      };
    }

    // =========================================================================
    // Payment Verification
    // =========================================================================

    /**
     * Verify a payment using the secure verification service
     * 
     * This uses server-side verification which:
     * - Extracts the transfer event from the blockchain
     * - Decrypts the amount using the user's authorization
     * - Cannot be manipulated by clients
     * 
     * @param {string} txHash - Transaction hash
     * @param {Object} decryptionSignature - User's decryption signature
     * @param {Object} requirement - Payment requirement to verify against
     * @returns {Promise<Object>} Verification result
     */
    async verifyPaymentSecure(txHash, decryptionSignature, requirement) {
      const response = await fetch(this.verifierUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: 1,
          paymentPayload: {
            version: 1,
            scheme: 'confidential-transfer',
            network: this.networkConfig.name,
            chainId: this.networkConfig.chainId,
            payload: {
              txHash,
              decryptionSignature
            }
          },
          paymentRequirements: requirement
        })
      });

      const result = await response.json();
      
      if (!result.isValid) {
        throw new Error(result.invalidReason || 'Payment verification failed');
      }

      return result;
    }

    /**
     * Verify payment on blockchain (basic check)
     * @param {string} paymentId - Payment ID from checkout
     * @returns {Promise<Object>} Payment details
     */
    async verifyPayment(paymentId) {
      if (!window.ethereum) {
        throw new Error('Web3 provider not found');
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const gateway = new ethers.Contract(
          this.contracts.GATEWAY,
          [
            'function getPayment(bytes32) view returns (address merchant, address token, uint256 timestamp, bool isRefunded, string orderId)'
          ],
          provider
        );

        const payment = await gateway.getPayment(paymentId);
        
        return {
          merchant: payment.merchant,
          token: payment.token,
          timestamp: payment.timestamp.toNumber(),
          isRefunded: payment.isRefunded,
          orderId: payment.orderId,
          verified: payment.merchant.toLowerCase() === this.merchantAddress.toLowerCase()
        };
      } catch (error) {
        console.error('[Aruvi SDK] Verification failed:', error);
        throw error;
      }
    }

    // =========================================================================
    // Event Listening
    // =========================================================================

    /**
     * Listen for payment events
     * @param {Function} callback - Called when payment received
     * @returns {Function} Unsubscribe function
     */
    listenForPayments(callback) {
      if (!window.ethereum) {
        throw new Error('Web3 provider not found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const gateway = new ethers.Contract(
        this.contracts.GATEWAY,
        [
          'event PaymentProcessed(bytes32 indexed paymentId, address indexed merchant, string orderId)'
        ],
        provider
      );

      const filter = gateway.filters.PaymentProcessed(null, this.merchantAddress);
      
      gateway.on(filter, (paymentId, merchant, orderId, event) => {
        callback({
          paymentId,
          merchant,
          orderId,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      });

      return () => {
        gateway.removeAllListeners(filter);
      };
    }

    // =========================================================================
    // UI Helpers
    // =========================================================================

    /**
     * Get payment button HTML
     */
    getButtonHTML(options = {}) {
      const {
        text = 'Pay with Aruvi',
        style = 'primary',
        className = ''
      } = options;

      const styles = {
        primary: 'background: #ec4899; color: white; border: none;',
        outline: 'background: transparent; color: #ec4899; border: 2px solid #ec4899;'
      };

      return `
        <button 
          onclick="window.aruviInstance.checkout(window.aruviCheckoutConfig)"
          style="${styles[style]} padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; border-radius: 4px;"
          class="${className}"
        >
          ${text}
        </button>
      `;
    }

    /**
     * Get contract addresses for this network
     */
    getContracts() {
      return { ...this.contracts };
    }

    /**
     * Get network configuration
     */
    getNetworkConfig() {
      return { ...this.networkConfig };
    }
  }

  // =============================================================================
  // Global Aruvi Object
  // =============================================================================

  window.Aruvi = {
    /**
     * Initialize Aruvi SDK
     * @param {Object} config - SDK configuration
     * @param {string} config.merchantAddress - Merchant's Ethereum address
     * @param {string} config.network - Network name (default: 'sepolia')
     * @param {string} config.verifierUrl - Custom verification service URL
     * @returns {AruviSDK} SDK instance
     */
    init: function (config) {
      const instance = new AruviSDK(config);
      window.aruviInstance = instance;
      return instance;
    },

    /**
     * Fetch product details from ProductRegistry (without initializing SDK)
     * @param {string} merchantAddress - Merchant's address  
     * @param {number} productId - Product ID (0, 1, 2...)
     * @param {string} [network='sepolia'] - Network
     * @returns {Promise<Object>} Product details
     */
    fetchProduct: fetchProductFromRegistry,

    /**
     * Get SDK version
     */
    version: '2.1.0',

    /**
     * Utility functions
     */
    utils: {
      encodePaymentHeader,
      parsePaymentRequirements,
      fetchProductFromRegistry
    }
  };

  console.log('[Aruvi SDK] Loaded v' + window.Aruvi.version);
})(window);
