---
id: installation
title: Installation & Requirements
sidebar_label: Installation
sidebar_position: 2
keywords:
  - installation
  - setup
  - requirements
  - npm
  - yarn
  - dependencies
description: How to install and set up the Loopz TypeScript SDK in your project
---

# Installation & Requirements

This guide will walk you through installing the Loopz TypeScript SDK and setting up your development environment.

## Prerequisites

Before installing the Loopz SDK, ensure your development environment meets the following requirements:

### System Requirements

- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 7.0.0 or higher (or **yarn** 1.22.0+)
- **TypeScript**: Version 4.5.0 or higher (if using TypeScript)

### Browser Compatibility

The SDK requires a modern browser with support for:

- ES6+ JavaScript features
- Local Storage API
- WebSocket API
- Web Crypto API

Supported browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Installation

### Using npm

```bash
npm install @salad-labs/loopz-typescript
```

### Using yarn

```bash
yarn add @salad-labs/loopz-typescript
```

### Using pnpm

```bash
pnpm add @salad-labs/loopz-typescript
```

## Peer Dependencies

The Loopz SDK requires the following peer dependencies to be installed in your project:

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "viem": "^2.17.3"
}
```

Install peer dependencies:

```bash
# Using npm
npm install react@^18.0.0 react-dom@^18.0.0 viem@^2.17.3

# Using yarn
yarn add react@^18.0.0 react-dom@^18.0.0 viem@^2.17.3
```

## Core Dependencies

The SDK automatically includes these core dependencies:

- **Web3 & Blockchain**

  - `ethers@^6.13.5` - Ethereum wallet implementation and utilities
  - `@opensea/seaport-js@^4.0.4` - NFT marketplace protocol
  - `viem@^2.17.3` - TypeScript interface for Ethereum

- **Authentication**

  - `@privy-io/react-auth@^2.0.1` - Web3 authentication provider
  - `jwt-decode@^4.0.0` - JWT token decoding

- **Data Management**

  - `dexie@^4.0.10` - IndexedDB wrapper for local storage
  - `@urql/core@^5.1.0` - GraphQL client
  - `subscriptions-transport-ws@^0.11.0` - WebSocket subscriptions

- **Cryptography**
  - `eciesjs@^0.3.19` - Elliptic Curve cryptography
  - `node-forge@^1.3.1` - TLS and crypto utilities
  - `jsrsasign@^11.1.0` - Cryptographic library

## Setup Requirements

### 1. API Key

You'll need a Loopz API key to use the SDK. To obtain one:

1. Visit [Salad Labs](https://www.saladlabs.xyz)
2. Create an account or sign in
3. Navigate to the SDK section
4. Generate your API key

### 2. Privy Configuration

The SDK uses Privy for Web3 authentication. You'll need:

1. A Privy App ID
2. Privy client configuration

Sign up at [Privy.io](https://privy.io) to get started.

### 3. Environment Variables

Create a `.env` file in your project root:

```bash
# Required
NEXT_PUBLIC_LOOPZ_API_KEY=your_api_key_here
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Optional (for different environments)
NEXT_PUBLIC_LOOPZ_ENV=production # or development
```

## TypeScript Configuration

If you're using TypeScript, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

## Build Tools Configuration

### Webpack

If you're using Webpack, you might need to add these configurations:

```javascript
module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
}
```

### Vite

For Vite projects, add to `vite.config.ts`:

```typescript
import { defineConfig } from "vite"

export default defineConfig({
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      process: "process/browser",
      buffer: "buffer",
    },
  },
})
```

## Next.js Configuration

For Next.js projects, update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    })
    return config
  },
}

module.exports = nextConfig
```

## React Native

The SDK currently does not support React Native. React Native support is planned for a future release.

## Verify Installation

After installation, verify everything is set up correctly:

```typescript
import { Loopz } from "@salad-labs/loopz-typescript"

// This should not throw any errors
console.log("Loopz SDK version:", Loopz.version)
```

## Common Installation Issues

### Module Resolution Errors

If you encounter module resolution errors:

```bash
# Clear your package manager cache
npm cache clean --force
# or
yarn cache clean

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Peer Dependency Conflicts

If you have conflicting React versions:

```bash
# Check your React version
npm list react

# Force install if needed (use with caution)
npm install --force
```

### TypeScript Errors

If TypeScript can't find type definitions:

```bash
# Install type definitions
npm install --save-dev @types/react @types/react-dom
```

## Development vs Production

The SDK supports both development and production modes:

```typescript
// Development mode (enables additional logging)
const loopz = await Loopz.boot(config, {
  devMode: true,
})

// Production mode (default)
const loopz = await Loopz.boot(config)
```

## Next Steps

Once installation is complete:

1. Continue to the [Quick Start Guide](./quick-start.md) for basic usage
2. Review [Authentication Setup](../guides/authentication.md) for user management

## Getting Help

If you encounter issues during installation:

- Check our [Troubleshooting Guide](../troubleshooting.md)
- Open an issue on [GitHub](https://github.com/Salad-Labs/loopz-typescript/issues)
- Contact support at [info@saladlabs.xyz](mailto:info@saladlabs.xyz)
