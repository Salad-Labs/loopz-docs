---
id: troubleshooting
title: Troubleshooting & FAQ
sidebar_label: Troubleshooting
sidebar_position: 6
keywords:
  - troubleshooting
  - errors
  - FAQ
  - common issues
  - debugging
  - solutions
description: Common issues, solutions, and frequently asked questions for the Loopz SDK
---

# Troubleshooting & FAQ

This guide covers common issues, error codes, and frequently asked questions when working with the Loopz SDK.

## Common Errors

### SDK Initialization Errors

#### NotInitializedError

**Error**: `NotInitializedError: SDK not initialized`

**Cause**: Trying to use SDK methods before initialization is complete.

**Solution**:

```typescript
// ❌ Wrong
const { instance } = useLoopz()
instance.auth.authenticate() // Error if not initialized

// ✅ Correct
const { instance, initialized } = useLoopz()

useEffect(() => {
  if (initialized) {
    instance.auth.authenticate()
  }
}, [initialized])

// Or check in the handler
const handleAuth = () => {
  if (!initialized) {
    console.log("SDK still initializing...")
    return
  }
  instance.auth.authenticate()
}
```

#### localStorage Not Supported

**Error**: `localStorage is not supported. Use a browser that provides the window.localStorage feature.`

**Cause**: Browser doesn't support localStorage or it's disabled.

**Solution**:

1. Check if user is in private/incognito mode
2. Enable localStorage in browser settings
3. Add fallback for SSR:

```typescript
// For Next.js/SSR
if (typeof window !== "undefined") {
  const loopz = await Loopz.boot(config)
}
```

#### IndexedDB Error

**Error**: `Error during the creation of the local database`

**Cause**: IndexedDB is blocked or corrupted.

**Solution**:

```typescript
// Clear IndexedDB and retry
async function clearAndRetry() {
  if ("indexedDB" in window) {
    try {
      await indexedDB.deleteDatabase("loopz:client_db")
      window.location.reload()
    } catch (error) {
      console.error("Failed to clear database:", error)
    }
  }
}
```

### Authentication Errors

#### Network Error During OTP

**Error**: `Network error. Please try again.`

**Common Causes**:

1. Invalid API key
2. CORS issues
3. Backend unreachable

**Solutions**:

1. **Check API Key**:

```typescript
const config = {
  apiKey: process.env.NEXT_PUBLIC_LOOPZ_API_KEY, // Ensure this is set
}
```

2. **CORS Configuration**:

```typescript
// If self-hosting backend, ensure CORS headers
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Headers: x-api-key, Content-Type
```

3. **Check Network**:

```typescript
// Add retry logic
const requestOtpWithRetry = async (email: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sendEmailOTPCode(email)
      return
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
}
```

#### Invalid OTP Code

**Error**: `Invalid code. Please check and try again.`

**Causes**:

1. Code expired (5 minutes)
2. Wrong code entered
3. Multiple code requests

**Solution**:

```typescript
// Add code expiry warning
const [codeRequestTime, setCodeRequestTime] = useState<Date | null>(null)

const isCodeExpired = () => {
  if (!codeRequestTime) return false
  const now = new Date()
  const diff = now.getTime() - codeRequestTime.getTime()
  return diff > 5 * 60 * 1000 // 5 minutes
}

// Show warning
{
  isCodeExpired() && (
    <p className="warning">Code may have expired. Request a new one.</p>
  )
}
```

#### Session Not Persisting

**Error**: User logged out after page refresh

**Causes**:

1. Token expired
2. localStorage cleared
3. Invalid token format

**Solution**:

```typescript
// Debug token issues
const debugSession = () => {
  const token = localStorage.getItem("loopz:token")
  const refreshToken = localStorage.getItem("loopz:refresh_token")

  console.log("Token exists:", !!token)
  console.log("Refresh token exists:", !!refreshToken)

  if (token) {
    try {
      const decoded = jwtDecode(token)
      console.log("Token expiry:", new Date(decoded.exp * 1000))
      console.log("Is expired:", decoded.exp < Date.now() / 1000)
    } catch (e) {
      console.error("Invalid token format:", e)
    }
  }
}
```

### Chat Connection Errors

#### ClientCantChatError

**Error**: `Client can't chat. Are you missing to pairing the keys?`

**Cause**: E2E encryption keys not generated.

**Solution**:

```typescript
const { account } = useLoopzAuth()

// Check if user can chat
if (!account?.e2ePublicKey) {
  console.log("User needs to complete profile setup for chat")
  // Redirect to profile completion
}
```

#### NotConnectedError

**Error**: `Chat not connected`

**Solution**:

```typescript
const { connect, isConnected } = useLoopzChat()

// Always check connection before operations
const sendMessage = async (content: string) => {
  if (!isConnected) {
    await connect()
  }

  // Now send message
  await instance.chat.createMessage({
    conversationId,
    content,
    type: "TEXTUAL",
  })
}
```

#### WebSocket Connection Failed

**Error**: WebSocket disconnects repeatedly

**Solution**:

```typescript
// Implement reconnection logic
const { instance } = useLoopz()
let reconnectAttempts = 0

instance.chat.on("disconnected", () => {
  if (reconnectAttempts < 5) {
    setTimeout(() => {
      reconnectAttempts++
      instance.chat.reconnect()
    }, 1000 * Math.pow(2, reconnectAttempts))
  }
})

instance.chat.on("connected", () => {
  reconnectAttempts = 0
})
```

### Trading/Order Errors

#### Wallet Not Connected

**Error**: Trying to create order without wallet

**Solution**:

```typescript
const createOrder = async () => {
  const wallets = account?.getActiveWallets()

  if (!wallets || wallets.length === 0) {
    // This will trigger Privy modal
    console.log("Please connect your wallet first")
    return
  }

  const wallet = wallets[0]
  await instance.order.init(wallet)
  // Now create order
}
```

#### Gas Estimation Failed

**Error**: Transaction fails during order creation

**Solution**:

```typescript
// Add gas buffer
const order = await instance.order.create(
  wallet,
  participantOne,
  participantTwo,
  7, // days
  [],
  proposalId
)

// If gas estimation fails, try with manual gas
try {
  await instance.order.finalize(orderId)
} catch (error) {
  if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
    // Retry with higher gas limit
    await instance.order.finalize(orderId, 3000000) // 3M gas
  }
}
```

### GraphQL/API Errors

#### QIError (Query Interaction Error)

**Error**: `QIError: UnauthorizedException`

**Cause**: JWT token expired or invalid.

**Solution**:

```typescript
// The SDK handles token refresh automatically, but you can force it
import { Auth } from "@salad-labs/loopz-typescript"

// Force token refresh
await Auth.fetchAuthToken()

// Or handle in error catch
try {
  await instance.chat.getConversations()
} catch (error) {
  if (error instanceof QIError && error.reason === "_401_") {
    // Token expired, logout user
    await instance.auth.logout()
  }
}
```

## Environment-Specific Issues

### Next.js Issues

#### Hydration Mismatch

**Problem**: React hydration errors with SSR

**Solution**:

```typescript
// Wrap SDK initialization
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) return null

return <LoopzProvider config={config}>{children}</LoopzProvider>
```

#### Build Errors

**Problem**: `window is not defined` during build

**Solution**:

```typescript
// Dynamic import for client-only components
const LoopzChat = dynamic(() => import("./LoopzChat"), { ssr: false })
```

### Webpack Configuration

#### Polyfill Issues

**Problem**: Missing Node.js polyfills

**Solution**:

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      process: require.resolve("process/browser"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
}
```

### TypeScript Issues

#### Type Errors

**Problem**: TypeScript can't find types

**Solution**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@salad-labs/loopz-typescript"]
  }
}
```

## Performance Issues

### Slow Initial Load

**Problem**: SDK takes long to initialize

**Solutions**:

1. **Lazy load heavy features**:

```typescript
// Only initialize chat when needed
const [chatInitialized, setChatInitialized] = useState(false)

const initializeChat = async () => {
  if (!chatInitialized) {
    await instance.chat.connect()
    setChatInitialized(true)
  }
}
```

2. **Optimize bundle size**:

```typescript
// Import only what you need
import { useLoopzAuth } from "@salad-labs/loopz-typescript/auth"
// Instead of
import { useLoopzAuth } from "@salad-labs/loopz-typescript"
```

### Memory Leaks

**Problem**: Memory usage increases over time

**Solution**:

```typescript
// Always cleanup subscriptions
useEffect(() => {
  const messageKey = instance.notification.onMessage(handler)

  return () => {
    instance.notification.offMessage(messageKey)
  }
}, [])

// Cleanup chat listeners
useEffect(() => {
  instance.chat.on("messageReceived", handler)

  return () => {
    instance.chat.off("messageReceived", handler)
  }
}, [])
```

## Debugging Tips

### Enable Dev Mode

```typescript
const loopz = await Loopz.boot(config, {
  devMode: true, // Enables additional logging
})
```

### Check SDK Version

```typescript
import { version } from "@salad-labs/loopz-typescript/package.json"
console.log("Loopz SDK version:", version)
```

### Network Request Debugging

```typescript
// Monitor API calls
if (process.env.NODE_ENV === "development") {
  // Log all fetch requests
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    console.log("Fetch:", args[0])
    const response = await originalFetch(...args)
    console.log("Response:", response.status)
    return response
  }
}
```

### State Debugging

```typescript
// Log authentication state
const { isAuthenticated, isLoading, account } = useLoopzAuth()

useEffect(() => {
  console.log("Auth State:", {
    isAuthenticated,
    isLoading,
    accountId: account?.did,
    canChat: account?.e2ePublicKey !== null,
  })
}, [isAuthenticated, isLoading, account])
```

## Frequently Asked Questions

### General

**Q: What's the difference between Loopz auth and Privy?**
A: Loopz uses OTP authentication for app access. Privy is only used when you need to connect a wallet for blockchain operations.

**Q: Why do I need two authentication systems?**
A: OTP auth provides longer sessions suitable for chat (18 hours), while Privy handles secure wallet connections for on-chain transactions.

**Q: Can I use the SDK in React Native?**
A: Currently, the SDK only supports web applications. React Native support is planned for future releases.

### Authentication

**Q: How long do sessions last?**
A: JWT tokens last 18 hours. The SDK automatically refreshes tokens before expiration.

**Q: Can users login with just a wallet?**
A: No, initial authentication requires email/phone OTP. Wallet connection is only for blockchain operations.

**Q: Why can't I use social logins?**
A: Social login methods (Google, Twitter, etc.) were part of the old Privy-only system and are no longer supported.

### Chat

**Q: Why can't some users access chat?**
A: Users need E2E encryption keys generated during profile completion. Check if `account.e2ePublicKey` exists.

**Q: Are messages stored locally?**
A: Yes, messages are stored in IndexedDB for offline access and performance.

**Q: What's the message size limit?**
A: Text messages have no hard limit, but very large messages may impact performance.

### Trading

**Q: Do I need ETH for gas fees?**
A: Yes, users need ETH in their wallet to pay for transaction gas fees when creating or accepting orders.

**Q: Which networks are supported?**
A: Check your configuration, but typically Ethereum mainnet and Polygon are supported.

**Q: Can I trade without chat?**
A: Yes, trading and chat are independent features. You can use one without the other.

## Getting Help

If you're still experiencing issues:

1. **Check the examples**: Review our [use cases](./use-cases) for working implementations
2. **Enable dev mode**: Get detailed logs for debugging
3. **GitHub Issues**: Search or create an issue on [GitHub](https://github.com/Salad-Labs/loopz-typescript/issues)
4. **Community Support**: Join our Discord for community help

### Reporting Bugs

When reporting issues, please include:

- SDK version
- Browser and version
- Error messages and stack traces
- Minimal code to reproduce
- Network logs if relevant
