import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/quick-start',
        'getting-started/connect-wallet',
        'getting-started/get-test-tokens',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'concepts/how-it-works',
        'concepts/privacy',
        'concepts/fhe-encryption',
        'concepts/confidential-tokens',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/send-money',
        'guides/request-payment',
        'guides/wrap-unwrap',
        'guides/subscriptions',
        'guides/refunds',
        'guides/business-payments',
      ],
    },
    {
      type: 'category',
      label: 'Developers',
      items: [
        'developers/architecture',
        'developers/contracts',
        'developers/integration',
        'developers/frontend-sdk',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/payment-gateway',
        'api/confidential-wrapper',
        'api/events',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'security/overview',
        'security/threat-model',
        'security/audits',
      ],
    },
    'faq',
  ],
};

export default sidebars;
