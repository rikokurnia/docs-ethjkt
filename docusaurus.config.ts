import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type {PluginOptions} from 'docusaurus-plugin-search-local';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  title: 'Ethereum Jakarta',
  tagline: 'Technical Documentation for Ethereum Jakarta',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://docs.ethjkt.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ethereumjakarta', // Usually your GitHub org/user name.
  projectName: 'docs-ethjkt', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      'docusaurus-plugin-search-local',
      {
        hashed: true,          // keeps search index cache-friendly
        highlightSearchTermsOnTargetPage: true,
        docsRouteBasePath: '/', // indexes docs at /
      } satisfies PluginOptions,
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      disableSwitch: true, // Disables the dark mode toggle button
    },
    navbar: {
      logo: {
        alt: 'ethjkt Logo',
        src: 'img/logo-outline-text.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Home',
        },
        {
          href: 'https://github.com/Ethereum-Jakarta',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Home',
              to: '/docs/home',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Instagram',
              href: 'https://www.instagram.com/ethjkt/',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/p5b6RFEnnk',
            },
            {
              label: 'X / Twitter',
              href: 'https://x.com/ethjkt',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Ethereum-Jakarta',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ethereum Jakarta, Inc.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['solidity', 'bash', 'json', 'rust'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
