import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/loopz-docs/blog',
    component: ComponentCreator('/loopz-docs/blog', '79a'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/archive',
    component: ComponentCreator('/loopz-docs/blog/archive', 'de8'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/authors',
    component: ComponentCreator('/loopz-docs/blog/authors', '554'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/authors/mattiamigliore',
    component: ComponentCreator('/loopz-docs/blog/authors/mattiamigliore', 'f77'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/building-encrypted-chat-web3',
    component: ComponentCreator('/loopz-docs/blog/building-encrypted-chat-web3', '495'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/designing-modular-sdk-architecture-web3',
    component: ComponentCreator('/loopz-docs/blog/designing-modular-sdk-architecture-web3', 'd62'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/designing-react-first-web3-sdk',
    component: ComponentCreator('/loopz-docs/blog/designing-react-first-web3-sdk', '961'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/evolution-of-authentication-loopz-sdk',
    component: ComponentCreator('/loopz-docs/blog/evolution-of-authentication-loopz-sdk', '360'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags',
    component: ComponentCreator('/loopz-docs/blog/tags', '636'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/architecture',
    component: ComponentCreator('/loopz-docs/blog/tags/architecture', 'af6'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/authentication',
    component: ComponentCreator('/loopz-docs/blog/tags/authentication', '337'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/chat',
    component: ComponentCreator('/loopz-docs/blog/tags/chat', 'e38'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/design-patterns',
    component: ComponentCreator('/loopz-docs/blog/tags/design-patterns', 'ce5'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/development',
    component: ComponentCreator('/loopz-docs/blog/tags/development', '34d'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/encryption',
    component: ComponentCreator('/loopz-docs/blog/tags/encryption', '428'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/hooks',
    component: ComponentCreator('/loopz-docs/blog/tags/hooks', '0b7'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/react',
    component: ComponentCreator('/loopz-docs/blog/tags/react', '63b'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/sdk',
    component: ComponentCreator('/loopz-docs/blog/tags/sdk', 'd84'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/typescript',
    component: ComponentCreator('/loopz-docs/blog/tags/typescript', '31c'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/web-3',
    component: ComponentCreator('/loopz-docs/blog/tags/web-3', 'a7e'),
    exact: true
  },
  {
    path: '/loopz-docs/blog/tags/websocket',
    component: ComponentCreator('/loopz-docs/blog/tags/websocket', '8a0'),
    exact: true
  },
  {
    path: '/loopz-docs/markdown-page',
    component: ComponentCreator('/loopz-docs/markdown-page', 'c63'),
    exact: true
  },
  {
    path: '/loopz-docs/docs',
    component: ComponentCreator('/loopz-docs/docs', 'ff5'),
    routes: [
      {
        path: '/loopz-docs/docs',
        component: ComponentCreator('/loopz-docs/docs', '0d2'),
        routes: [
          {
            path: '/loopz-docs/docs',
            component: ComponentCreator('/loopz-docs/docs', '1ff'),
            routes: [
              {
                path: '/loopz-docs/docs',
                component: ComponentCreator('/loopz-docs/docs', 'e8a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/category/getting-started',
                component: ComponentCreator('/loopz-docs/docs/category/getting-started', '343'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/category/guides',
                component: ComponentCreator('/loopz-docs/docs/category/guides', 'bcf'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/getting-started/installation',
                component: ComponentCreator('/loopz-docs/docs/getting-started/installation', '68c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/getting-started/quick-start',
                component: ComponentCreator('/loopz-docs/docs/getting-started/quick-start', '2df'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/guides/authentication',
                component: ComponentCreator('/loopz-docs/docs/guides/authentication', '0e7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/guides/chat',
                component: ComponentCreator('/loopz-docs/docs/guides/chat', '48d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/guides/notifications',
                component: ComponentCreator('/loopz-docs/docs/guides/notifications', '0e5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/guides/trading',
                component: ComponentCreator('/loopz-docs/docs/guides/trading', 'ee3'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/troubleshooting',
                component: ComponentCreator('/loopz-docs/docs/troubleshooting', 'c86'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/loopz-docs/docs/use-cases',
                component: ComponentCreator('/loopz-docs/docs/use-cases', '09c'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/loopz-docs/',
    component: ComponentCreator('/loopz-docs/', '0bc'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
