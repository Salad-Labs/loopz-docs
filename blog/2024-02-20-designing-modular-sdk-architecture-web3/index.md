---
slug: designing-modular-sdk-architecture-web3
title: "Designing a Modular SDK Architecture for Web3 Applications"
authors: [mattiamigliore]
tags: [architecture, sdk, typescript, design-patterns, web3]
date: 2024-02-20
---

# Designing a Modular SDK Architecture for Web3 Applications

Building an SDK is like designing a city - you need to think about how different parts connect, how people (developers) will navigate it, and how it can grow without becoming a maze. When we started building the Loopz SDK, we knew we needed an architecture that could handle authentication, real-time chat, trading, and blockchain interactions - all while remaining intuitive for developers.

<!--truncate-->

## The Challenge

Our SDK needed to:

- Support multiple independent features (auth, chat, trading, etc.)
- Work in both React and vanilla JavaScript environments
- Handle complex state management
- Provide great TypeScript support
- Scale without becoming a monolith

## The Architecture

### 1. The Singleton Pattern with a Twist

Instead of traditional singletons, we created a managed singleton system:

```typescript
export class Loopz {
  private static _instance: Loopz
  private static _config: LoopzConfig

  // Boot method instead of direct instantiation
  static async boot(
    config: LoopzConfig,
    options?: {
      devMode?: boolean
      runAdapter?: boolean
      enableStorage?: boolean
    }
  ): Promise<Loopz> {
    if (!Loopz._instance) {
      // Create storage connection
      const storage = await Loopz.createOrConnectToStorage()

      // Initialize instance
      Loopz._instance = new Loopz(
        {
          ...config,
          storage,
        },
        options
      )
    }

    return Loopz._instance
  }

  // Initialize all modules
  init() {
    return {
      auth: Auth.getInstance(),
      chat: Chat.getInstance(),
      order: Order.getInstance(),
      proposal: Proposal.getInstance(),
      oracle: Oracle.getInstance(),
      notification: Notification.getInstance(),
    }
  }
}
```

This pattern provides:

- Lazy initialization
- Configuration validation
- Centralized module management
- Clean dependency injection

### 2. Module Independence

Each module follows a consistent pattern:

```typescript
export class Chat {
  private static _config: ChatConfig
  private static _instance: Chat

  // Configuration must happen before instantiation
  static config(config: ChatConfig) {
    if (Chat._config) throw new Error("Chat already configured")
    Chat._config = config
  }

  static getInstance() {
    return Chat._instance ?? new Chat()
  }

  private constructor() {
    if (!Chat._config) {
      throw new Error("Chat must be configured before getting instance")
    }
    // Initialize with config
  }
}
```

This ensures:

- Modules can't be used without configuration
- Each module manages its own lifecycle
- Clear initialization order

### 3. The Provider Pattern for React

We created a comprehensive provider system for React applications:

```typescript
// Root provider that manages everything
export const LoopzProvider: FC<LoopzProviderProps> = ({
  config,
  chatConfig,
  devMode = false,
  children,
}) => {
  const [loopz, setLoopz] = useState<ILoopzContext>({
    initialized: false,
    instance: null,
  })

  useEffect(() => {
    Loopz.boot(config, { devMode }).then((loopz) => {
      setLoopz({
        initialized: true,
        instance: loopz.init(),
      })
    })
  }, [])

  if (!loopz.initialized) return null

  return (
    <LoopzContext.Provider value={loopz}>
      <LoopzAuth {...config}>
        <LoopzAuthProvider>
          {chatConfig ? (
            <LoopzChatProvider {...chatConfig}>{children}</LoopzChatProvider>
          ) : (
            children
          )}
        </LoopzAuthProvider>
      </LoopzAuth>
    </LoopzContext.Provider>
  )
}
```

### 4. Hook Architecture

Our hooks follow a consistent pattern with built-in error handling:

```typescript
export const useLoopzAuth = () => {
  const loopzContext = useContext(LoopzContext)
  const authContext = useContext(LoopzAuthContext)

  if (!loopzContext || !authContext) {
    throw new Error("useLoopzAuth() must be used within <LoopzProvider>")
  }

  const { initialized, instance } = loopzContext
  const { isAuthenticated, isLoading, account } = authContext

  const authenticate = useCallback(() => {
    if (!initialized) throw new NotInitializedError()
    if (isLoading) throw new LoadingError("authenticate()", "Auth")

    return !isAuthenticated
      ? instance.auth.authenticate()
      : Promise.resolve({ auth, account })
  }, [initialized, isLoading, isAuthenticated])

  return {
    ...authContext,
    authenticate,
    // other methods
  }
}
```

## Type Safety First

### 1. Comprehensive Type Definitions

Every module has detailed TypeScript definitions:

```typescript
export type UseLoopzChat = (config?: {
  onMessageReceived?: (message: Message) => void
  onMessageUpdated?: (message: Message) => void
  onMessageDeleted?: (messageId: string) => void
  // ... 20+ more event handlers
}) => LoopzChatContextValue & {
  connect(): Promise<void>
  disconnect(): Promise<void>
  sync(): Promise<void>
  // ... more methods
}
```

### 2. Discriminated Unions for Errors

We use discriminated unions for better error handling:

```typescript
export class QIError extends CombinedError {
  reason: Maybe<string> = null
  standardError: boolean = true

  constructor(
    input: {
      networkError?: Error
      graphQLErrors?: ErrorLike[]
      response?: any
    },
    reason: string,
    standardError: boolean
  ) {
    super(input)
    this.reason = reason
    this.standardError = standardError
  }
}
```

### 3. Branded Types for Safety

We use branded types to prevent mixing up IDs:

```typescript
type ConversationId = string & { __brand: "ConversationId" }
type MessageId = string & { __brand: "MessageId" }
type UserId = string & { __brand: "UserId" }

// Prevents accidents like:
// sendMessage(userId, message) // TypeScript error!
// sendMessage(conversationId, message) // Correct
```

## State Management Philosophy

### 1. Local-First with IndexedDB

We built a complete storage layer on top of Dexie:

```typescript
export class DexieStorage {
  private _db: Dexie
  private _storageEnabled: boolean = true

  constructor(config: DexieConfig) {
    this._db = new Dexie(config.dbName)

    // Define schema
    this._db.version(config.dbVersion).stores({
      user: "++[did+organizationId], wallet",
      conversation: "++[id+userDid], name, type, order",
      message: "++[id+userDid], conversationId, order",
      member: "++[id+userId], conversationId",
      // ... more tables
    })
  }

  // Typed table access
  get user() {
    return this._db.table<LocalDBUser>("user")
  }
  get conversation() {
    return this._db.table<LocalDBConversation>("conversation")
  }
  // ... more getters
}
```

### 2. Event-Driven Architecture

Every module emits events for state changes:

```typescript
// Internal event system
class EventEmitter {
  private _events: Map<string, Set<Function>> = new Map()

  on(event: string, callback: Function, once = false) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set())
    }

    const wrapper = once
      ? (...args: any[]) => {
          callback(...args)
          this.off(event, wrapper)
        }
      : callback

    this._events.get(event)!.add(wrapper)

    return () => this.off(event, wrapper)
  }

  emit(event: string, ...args: any[]) {
    this._events.get(event)?.forEach((callback) => {
      callback(...args)
    })
  }
}
```

## Handling Complexity

### 1. The Adapter Pattern

For third-party integrations, we use adapters:

```typescript
export class PrivyAdapter {
  private _container: HTMLElement
  private _root: Root

  constructor(options: PrivyAdapterOptions) {
    // Create isolated React root for Privy
    this._container = document.createElement("div")
    document.body.appendChild(this._container)
    this._root = createRoot(this._container)
  }

  render() {
    this._root.render(
      <PrivyContext appId={this._privyAppId} config={this._privyConfig} />
    )
  }

  cleanup() {
    this._root.unmount()
    document.body.removeChild(this._container)
  }
}
```

### 2. Graceful Degradation

The SDK works even when some features aren't available:

```typescript
// Storage can be disabled for testing
if (options.enableStorage === false) {
  storage.disableStorage()
}

// Chat works without notifications
if (!instance.notification.isInitialized()) {
  console.warn("Notifications unavailable, chat will work without them")
}
```

## Performance Considerations

### 1. Lazy Loading

Modules are only initialized when needed:

```typescript
// Heavy modules like Order only initialize when used
async initializeOrder(wallet: ConnectedWallet) {
  if (!this._initialized) {
    await this.init(wallet) // Connect to blockchain
    this._initialized = true
  }
}
```

### 2. Tree Shaking Support

The modular architecture enables effective tree shaking:

```typescript
// Users can import only what they need
import { useLoopzAuth } from "@salad-labs/loopz-typescript/auth"
// Instead of importing everything
import { useLoopzAuth } from "@salad-labs/loopz-typescript"
```

## Lessons Learned

1. **Configuration Before Instantiation**: Forcing configuration before module creation prevents runtime errors

2. **Consistent Patterns**: Using the same patterns across modules reduces cognitive load

3. **Type Safety Pays Off**: Investing in comprehensive types catches bugs early

4. **Events Over Callbacks**: Event-driven architecture is more flexible than callback props

5. **Provider Composition**: Nested providers allow feature-specific configuration

## What This Enables

Our architecture allows developers to:

```typescript
// Use only what they need
<LoopzProvider config={config}>
  <MyApp /> {/* Just auth */}
</LoopzProvider>

// Or everything
<LoopzProvider config={config} chatConfig={chatConfig}>
  <TradingApp /> {/* Full features */}
</LoopzProvider>

// Or vanilla JS
const loopz = await Loopz.boot(config)
const { auth } = loopz.init()
await auth.authenticate()
```

## Future Improvements

We're constantly evolving the architecture:

- Plugin system for third-party extensions
- Better code splitting strategies
- WebAssembly modules for performance-critical paths
- More granular event subscriptions

Building an SDK is a journey, not a destination. Each decision shapes how developers will interact with your platform for years to come.

---

\_Interested in the technical details? Check out our [GitHub repository](https://github.com/Salad-Labs/loopz-typescript)
