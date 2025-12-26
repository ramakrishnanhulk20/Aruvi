/**
 * Aruvi SDK Constants
 * Contract addresses, ABIs, and configuration
 */
export declare const CONTRACTS: {
    readonly testnet: {
        readonly PaymentGateway: "0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b";
        readonly ConfidentialUSDCWrapper: "0xf99376BE228E8212C3C9b8B746683C96C1517e8B";
        readonly chainId: 11155111;
        readonly chainName: "Sepolia";
        readonly rpcUrl: "https://rpc.sepolia.org";
    };
    readonly mainnet: {
        readonly PaymentGateway: "0x...";
        readonly ConfidentialUSDCWrapper: "0x...";
        readonly chainId: 1;
        readonly chainName: "Ethereum";
        readonly rpcUrl: "https://eth.llamarpc.com";
    };
};
export declare const DEFAULTS: {
    readonly appUrl: {
        readonly testnet: "https://aruvi-dapp.vercel.app";
        readonly mainnet: "https://app.aruvi.io";
    };
    readonly theme: {
        readonly primaryColor: "#0070ba";
        readonly secondaryColor: "#003087";
        readonly borderRadius: 12;
        readonly fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
    };
};
export declare const PAYMENT_GATEWAY_ABI: readonly [{
    readonly name: "PaymentSent";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "from";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly name: "PaymentRefunded";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
        readonly indexed: true;
    }];
}, {
    readonly name: "getPaymentInfo";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "paymentId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "sender";
        readonly type: "address";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
    }, {
        readonly name: "isRefunded";
        readonly type: "bool";
    }];
}, {
    readonly name: "refunded";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}];
export declare const MESSAGE_TYPES: {
    readonly INIT_CHECKOUT: "ARUVI_INIT_CHECKOUT";
    readonly CLOSE_CHECKOUT: "ARUVI_CLOSE_CHECKOUT";
    readonly CHECKOUT_READY: "ARUVI_CHECKOUT_READY";
    readonly CHECKOUT_CLOSED: "ARUVI_CHECKOUT_CLOSED";
    readonly PAYMENT_PENDING: "ARUVI_PAYMENT_PENDING";
    readonly PAYMENT_SUCCESS: "ARUVI_PAYMENT_SUCCESS";
    readonly PAYMENT_ERROR: "ARUVI_PAYMENT_ERROR";
    readonly PAYMENT_CANCELLED: "ARUVI_PAYMENT_CANCELLED";
};
export declare const BUTTON_STYLES: {
    readonly base: "\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: 8px;\n    font-weight: 600;\n    cursor: pointer;\n    transition: all 0.2s ease;\n    border: none;\n    text-decoration: none;\n  ";
    readonly sizes: {
        readonly small: "\n      height: 36px;\n      padding: 0 16px;\n      font-size: 14px;\n      border-radius: 8px;\n    ";
        readonly medium: "\n      height: 44px;\n      padding: 0 24px;\n      font-size: 15px;\n      border-radius: 10px;\n    ";
        readonly large: "\n      height: 52px;\n      padding: 0 32px;\n      font-size: 16px;\n      border-radius: 12px;\n    ";
    };
    readonly variants: {
        readonly primary: "\n      background: linear-gradient(135deg, #0070ba 0%, #003087 100%);\n      color: #ffffff;\n    ";
        readonly secondary: "\n      background: #f5f7fa;\n      color: #003087;\n    ";
        readonly outline: "\n      background: transparent;\n      color: #0070ba;\n      border: 2px solid #0070ba;\n    ";
        readonly dark: "\n      background: #1a1a1a;\n      color: #ffffff;\n    ";
    };
    readonly hover: {
        readonly primary: "filter: brightness(1.1); transform: translateY(-1px);";
        readonly secondary: "background: #e8ecf2;";
        readonly outline: "background: rgba(0, 112, 186, 0.08);";
        readonly dark: "background: #2a2a2a;";
    };
    readonly disabled: "\n    opacity: 0.5;\n    cursor: not-allowed;\n    pointer-events: none;\n  ";
};
export declare const MODAL_STYLES = "\n  .aruvi-modal-overlay {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background: rgba(0, 0, 0, 0.6);\n    backdrop-filter: blur(4px);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    z-index: 999999;\n    animation: aruvi-fade-in 0.2s ease;\n  }\n  \n  .aruvi-modal-container {\n    background: #ffffff;\n    border-radius: 16px;\n    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n    width: 100%;\n    max-width: 420px;\n    max-height: 90vh;\n    overflow: hidden;\n    animation: aruvi-slide-up 0.3s ease;\n    position: relative;\n  }\n  \n  .aruvi-modal-header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    padding: 16px 20px;\n    border-bottom: 1px solid #e5e7eb;\n    background: linear-gradient(135deg, #0070ba 0%, #003087 100%);\n    color: white;\n  }\n  \n  .aruvi-modal-title {\n    font-size: 18px;\n    font-weight: 600;\n    display: flex;\n    align-items: center;\n    gap: 8px;\n  }\n  \n  .aruvi-modal-close {\n    background: rgba(255, 255, 255, 0.2);\n    border: none;\n    width: 32px;\n    height: 32px;\n    border-radius: 50%;\n    cursor: pointer;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    color: white;\n    transition: background 0.2s;\n  }\n  \n  .aruvi-modal-close:hover {\n    background: rgba(255, 255, 255, 0.3);\n  }\n  \n  .aruvi-modal-content {\n    padding: 0;\n  }\n  \n  .aruvi-modal-iframe {\n    width: 100%;\n    height: 500px;\n    border: none;\n  }\n  \n  .aruvi-modal-loading {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: center;\n    height: 300px;\n    gap: 16px;\n    color: #6b7280;\n  }\n  \n  .aruvi-spinner {\n    width: 40px;\n    height: 40px;\n    border: 3px solid #e5e7eb;\n    border-top-color: #0070ba;\n    border-radius: 50%;\n    animation: aruvi-spin 1s linear infinite;\n  }\n  \n  @keyframes aruvi-fade-in {\n    from { opacity: 0; }\n    to { opacity: 1; }\n  }\n  \n  @keyframes aruvi-slide-up {\n    from { \n      opacity: 0; \n      transform: translateY(20px) scale(0.95); \n    }\n    to { \n      opacity: 1; \n      transform: translateY(0) scale(1); \n    }\n  }\n  \n  @keyframes aruvi-spin {\n    to { transform: rotate(360deg); }\n  }\n  \n  @media (max-width: 480px) {\n    .aruvi-modal-container {\n      max-width: 100%;\n      max-height: 100%;\n      height: 100%;\n      border-radius: 0;\n    }\n    \n    .aruvi-modal-iframe {\n      height: calc(100vh - 60px);\n    }\n  }\n";
export declare const ARUVI_LOGO_SVG = "\n<svg width=\"24\" height=\"24\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"16\" cy=\"16\" r=\"14\" fill=\"currentColor\" opacity=\"0.2\"/>\n  <path d=\"M10 20L16 12L22 20\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  <path d=\"M13 16L16 12L19 16\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg>\n";
