import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Aruvi',
  tagline: 'Privacy-First Payments on Blockchain',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://aruvi-documentation.vercel.app',
  baseUrl: '/',

  organizationName: 'ramakrishnanhulk20',
  projectName: 'Aruvi',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/ramakrishnanhulk20/Aruvi/tree/master/docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/ramakrishnanhulk20/Aruvi/tree/master/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/aruvi-social-card.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Aruvi',
      logo: {
        alt: 'Aruvi Logo',
        src: 'img/aruvi-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/guides/send-money',
          label: 'Guides',
          position: 'left',
        },
        {
          to: '/docs/api/payment-gateway',
          label: 'API',
          position: 'left',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/ramakrishnanhulk20/Aruvi',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://aruvi-dapp.vercel.app',
          label: 'Launch App',
          position: 'right',
          className: 'navbar-launch-button',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'How It Works',
              to: '/docs/concepts/how-it-works',
            },
            {
              label: 'Privacy Guide',
              to: '/docs/concepts/privacy',
            },
          ],
        },
        {
          title: 'Developers',
          items: [
            {
              label: 'Smart Contracts',
              to: '/docs/developers/contracts',
            },
            {
              label: 'Integration Guide',
              to: '/docs/developers/integration',
            },
            {
              label: 'API Reference',
              to: '/docs/api/payment-gateway',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/aruvi',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/aruvi_app',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/ramakrishnanhulk20/Aruvi',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'FAQ',
              to: '/docs/faq',
            },
            {
              label: 'Security',
              to: '/docs/security/overview',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Aruvi. Built with 🔐 by Ram.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['solidity', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
