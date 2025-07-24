---
id: quick-start
title: Quick Start Guide
sidebar_label: Quick Start
sidebar_position: 3
keywords:
  - quick start
  - tutorial
  - getting started
  - example
  - react
  - authentication
  - chat
description: Get up and running with the Loopz TypeScript SDK in minutes
---

# Quick Start Guide

This guide will help you get started with the Loopz SDK in a React application. We'll cover initialization, authentication, and basic trading/chat functionality.

## Prerequisites

Before starting, ensure you have:

- Completed the [installation steps](./installation)
- Your Loopz API key
- Your Privy App ID
- A React application (v18+)

## Step 1: Initialize the SDK

There are two ways to initialize the Loopz SDK: using React components or vanilla JavaScript.

### Option A: React Integration (Recommended)

Wrap your application with the `LoopzProvider`:

```tsx
// App.tsx
import { LoopzProvider } from "@salad-labs/loopz-typescript"

function App() {
  const loopzConfig = {
    apiKey: process.env.NEXT_PUBLIC_LOOPZ_API_KEY!,
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    privyClientConfig: {
      // Privy configuration options
      embeddedWallets: {
        createOnLogin: "users-without-wallets",
      },
      appearance: {
        theme: "light",
        accentColor: "#6B5FFF",
      },
    },
    // Internationalization settings
    intl: {
      locale: "en",
      messages: {
        en: {
          welcomeMessage: "Welcome to our marketplace!",
        },
      },
    },
    // Branding URLs
    logoURL: "https://your-domain.com/logo.png",
    tosURL: "https://your-domain.com/terms",
    privacyURL: "https://your-domain.com/privacy",
  }

  // Optional: Chat configuration
  const chatConfig = {
    autoConnect: true, // Auto-connect when authenticated
    autoSync: true, // Auto-sync messages
    syncingTime: 30000, // Sync interval in milliseconds
  }

  return (
    <LoopzProvider
      config={loopzConfig}
      chatConfig={chatConfig}
      devMode={true} // Enable dev mode for debugging
    >
      <YourApp />
    </LoopzProvider>
  )
}
```

### Option B: Vanilla JavaScript

For non-React environments or more control:

```typescript
import { Loopz } from "@salad-labs/loopz-typescript"

async function initializeLoopz() {
  const loopz = await Loopz.boot(
    {
      apiKey: "your-api-key",
      privyAppId: "your-privy-app-id",
      privyClientConfig: {
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      },
      intl: { locale: "en", messages: {} },
      logoURL: "https://your-domain.com/logo.png",
      tosURL: "https://your-domain.com/terms",
      privacyURL: "https://your-domain.com/privacy",
    },
    {
      devMode: true,
      runAdapter: true, // Set to false in React environments
    }
  )

  // Initialize modules
  const { auth, chat, order, proposal } = loopz.init()

  return { auth, chat, order, proposal }
}
```

## Step 2: Authentication

### Using React Hooks

```tsx
import { useLoopzAuth } from "@salad-labs/loopz-typescript"

function LoginComponent() {
  const { isAuthenticated, isLoading, account, authenticate, logout } =
    useLoopzAuth()

  const handleLogin = async () => {
    try {
      const { auth, account } = await authenticate()
      console.log("Logged in:", account.did)
      console.log("Wallet address:", account.wallet)
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {account?.username || account?.wallet}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Connect Wallet</button>
      )}
    </div>
  )
}
```

### Using Vanilla JavaScript

```typescript
// Authenticate user
const { auth, account } = await auth.authenticate()

// Check authentication status
if (auth.isAuthenticated()) {
  console.log("User DID:", account.did)
  console.log("Wallet:", account.wallet)
}

// Logout
await auth.logout()
```

## Step 3: Setting Up Chat

### Using React Hooks

```tsx
import { useLoopzChat } from "@salad-labs/loopz-typescript"

function ChatComponent() {
  const { isConnected, isSynced, connect, sync } = useLoopzChat({
    // Optional event handlers
    onMessageReceived: (message) => {
      console.log("New message:", message)
    },
    onConversationCreated: (conversation) => {
      console.log("New conversation:", conversation)
    },
  })

  useEffect(() => {
    if (!isConnected) {
      connect()
        .then(() => sync())
        .catch(console.error)
    }
  }, [isConnected])

  return (
    <div>
      <p>Chat Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Sync Status: {isSynced ? "Synced" : "Not synced"}</p>
    </div>
  )
}
```

### Creating a Conversation

```typescript
import { useLoopz } from "@salad-labs/loopz-typescript"

function CreateConversation() {
  const { instance } = useLoopz()

  const createNewConversation = async () => {
    try {
      const conversation = await instance.chat.createConversation({
        name: "Trading Discussion",
        description: "Let's discuss NFT trades",
        members: ["user-did-1", "user-did-2"], // User DIDs
      })

      console.log("Created conversation:", conversation.id)
    } catch (error) {
      console.error("Failed to create conversation:", error)
    }
  }

  return <button onClick={createNewConversation}>Start New Conversation</button>
}
```

### Sending Messages

```typescript
const sendMessage = async (conversationId: string) => {
  try {
    const message = await instance.chat.createMessage({
      conversationId,
      content: "Hello! Anyone interested in trading?",
      type: "TEXTUAL",
    })

    console.log("Message sent:", message.id)
  } catch (error) {
    console.error("Failed to send message:", error)
  }
}
```

## Step 4: Creating a Trade Proposal

```typescript
import { useLoopz, useLoopzAuth } from "@salad-labs/loopz-typescript"

function CreateProposal() {
  const { instance } = useLoopz()
  const { account } = useLoopzAuth()

  const createTradeProposal = async () => {
    try {
      const proposal = await instance.proposal.create({
        type: "TRADE",
        networkId: "1", // Ethereum mainnet
        creatorAddress: account.wallet,
        expirationDate: Date.now() + 86400000, // 24 hours
        assets: {
          offered: [
            {
              token: "0x...", // NFT contract address
              tokenId: "123",
              amount: "1",
              type: "ERC721",
            },
          ],
          wanted: [
            {
              token: "0x...", // Token contract address
              amount: "1000000000000000000", // 1 ETH in wei
              type: "ERC20",
            },
          ],
        },
        messages: [{ type: "0" }], // Message type from MessageMap
      })

      console.log("Proposal created:", proposal.id)
    } catch (error) {
      console.error("Failed to create proposal:", error)
    }
  }

  return <button onClick={createTradeProposal}>Create Trade Proposal</button>
}
```

## Step 5: Handling Orders

```typescript
function OrderManagement() {
  const { instance } = useLoopz()

  // Create a buy order
  const createBuyOrder = async () => {
    const order = await instance.order.create({
      type: "BUY",
      asset: {
        token: "0x...", // NFT contract
        tokenId: "456",
        type: "ERC721",
      },
      price: {
        amount: "2000000000000000000", // 2 ETH
        currency: "ETH",
      },
      expirationDate: Date.now() + 604800000, // 7 days
    })

    console.log("Order created:", order.id)
  }

  // Get user's orders
  const getMyOrders = async () => {
    const orders = await instance.order.getUserOrders()
    console.log("My orders:", orders)
  }

  return (
    <div>
      <button onClick={createBuyOrder}>Create Buy Order</button>
      <button onClick={getMyOrders}>View My Orders</button>
    </div>
  )
}
```

## Complete Example: Trading Chat Room

Here's a complete example combining authentication, chat, and trading:

```tsx
import React, { useState, useEffect } from "react"
import {
  LoopzProvider,
  useLoopzAuth,
  useLoopzChat,
  useLoopz,
} from "@salad-labs/loopz-typescript"

function TradingChatRoom() {
  const { isAuthenticated, authenticate } = useLoopzAuth()
  const { instance } = useLoopz()
  const { isConnected, connect, sync } = useLoopzChat()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])

  // Initialize chat when authenticated
  useEffect(() => {
    if (isAuthenticated && !isConnected) {
      connect()
        .then(() => sync())
        .then(() => loadConversations())
        .catch(console.error)
    }
  }, [isAuthenticated, isConnected])

  const loadConversations = async () => {
    const convs = await instance.chat.getConversations()
    setConversations(convs)
  }

  const loadMessages = async (conversationId: string) => {
    const msgs = await instance.chat.getMessages(conversationId)
    setMessages(msgs)
    setActiveConversation(conversationId)
  }

  const sendTradeProposal = async () => {
    if (!activeConversation) return

    // Create a trade proposal message
    await instance.chat.createMessage({
      conversationId: activeConversation,
      type: "TRADE_PROPOSAL",
      content: "Check out my trade offer!",
      proposal: {
        // Proposal details
      },
    })
  }

  if (!isAuthenticated) {
    return <button onClick={authenticate}>Connect to Start Trading</button>
  }

  return (
    <div className="trading-chat">
      <div className="conversations-list">
        {conversations.map((conv) => (
          <div key={conv.id} onClick={() => loadMessages(conv.id)}>
            {conv.name}
          </div>
        ))}
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.user.username}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <button onClick={sendTradeProposal}>Send Trade Proposal</button>
    </div>
  )
}

// App wrapper
function App() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_LOOPZ_API_KEY!,
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    // ... rest of config
  }

  return (
    <LoopzProvider config={config} chatConfig={{ autoConnect: true }}>
      <TradingChatRoom />
    </LoopzProvider>
  )
}
```

## Common Issues

### "Not initialized" Error

Ensure you're accessing SDK methods after initialization completes:

```typescript
const { initialized, instance } = useLoopz()

if (!initialized) return <div>Loading SDK...</div>
```

### Chat Connection Failed

Check that the user is authenticated before connecting:

```typescript
if (isAuthenticated && canChat) {
  await connect()
}
```

### Missing Peer Dependencies

Install all required peer dependencies:

```bash
npm install react@^18 react-dom@^18 viem@^2.17.3
```

## Support

Need help?

- Open an [issue on GitHub](https://github.com/Salad-Labs/loopz-typescript/issues)
