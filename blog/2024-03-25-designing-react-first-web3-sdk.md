---
slug: designing-react-first-web3-sdk
title: "Designing a React-First Web3 SDK: Patterns and Pitfalls"
authors: [mattiamigliore]
tags: [react, sdk, architecture, hooks, web3]
date: 2024-02-15
description: The architectural decisions, patterns, and lessons learned while building a React-first SDK for Web3 trading and chat.
---

# Designing a React-First Web3 SDK: Patterns and Pitfalls

Building an SDK is hard. Building a React-first SDK for Web3 is harder. You need to balance developer experience, performance, and the complexities of blockchain interactions. Here's how we approached it with the Loopz SDK.

<!-- truncate -->

## The Vision: Progressive Complexity

We wanted developers to go from zero to trading platform in minutes, but also have the power to build complex features. This led to our layered architecture:

```typescript
// Level 1: Dead simple
;<LoopzProvider config={config}>
  <App />
</LoopzProvider>

// Level 2: Hook it up
const { authenticate } = useLoopzAuth()

// Level 3: Go deep
const chat = Chat.getInstance()
await chat.customImplementation()
```

## Architecture Decisions

### 1. Provider Pattern with Context

We went all-in on React Context, but with a twist - multiple nested providers for different concerns:

```typescript
export const LoopzProvider: FC<LoopzProviderProps> = ({ config, children }) => {
  // Core SDK initialization
  const [loopz, setLoopz] = useState<ILoopzContext>({
    initialized: false,
    instance: null,
  })

  useEffect(() => {
    Loopz.boot(config).then((instance) => {
      setLoopz({
        initialized: true,
        instance: instance.init(),
      })
    })
  }, [])

  if (!loopz.initialized) return null

  return (
    <LoopzContext.Provider value={loopz}>
      <LoopzAuth {...config}>
        <LoopzAuthProvider>
          <LoopzChatProvider>{children}</LoopzChatProvider>
        </LoopzAuthProvider>
      </LoopzAuth>
    </LoopzContext.Provider>
  )
}
```

**Why nested providers?**

- Separation of concerns
- Conditional feature loading
- Independent update cycles

### 2. The Hook Philosophy

Every major feature gets a hook, but not everything needs to be a hook:

```typescript
// ✅ Good: Stateful operations
export const useLoopzAuth = () => {
  const { instance } = useLoopz()
  const [isLoading, setIsLoading] = useState(false)

  const authenticate = useCallback(async () => {
    setIsLoading(true)
    try {
      return await instance.auth.authenticate()
    } finally {
      setIsLoading(false)
    }
  }, [instance])

  return { authenticate, isLoading }
}

// ❌ Bad: Simple getters don't need hooks
// Don't do this:
export const useApiKey = () => {
  const { instance } = useLoopz()
  return instance.apiKey // No state, no effects, no need for a hook
}
```

### 3. Error Boundaries That Make Sense

We created custom error classes for different scenarios:

```typescript
// Specific errors for specific problems
export class NotInitializedError extends Error {
  constructor() {
    super("SDK not initialized. Did you wrap your app with LoopzProvider?")
    this.name = "NotInitializedError"
  }
}

export class ClientCantChatError extends Error {
  constructor() {
    super("Client cannot chat. E2E keys not generated.")
    this.name = "ClientCantChatError"
  }
}

// Usage in hooks
const connect = useCallback(() => {
  if (!initialized) throw new NotInitializedError()
  if (!canChat) throw new ClientCantChatError()
  // ... rest of logic
}, [initialized, canChat])
```

### 4. State Management Strategy

We chose a hybrid approach:

```typescript
// Global state: In singleton classes
class Auth {
  private static _instance: Auth
  private static _isAuthenticated: boolean

  static getInstance() {
    return this._instance || new Auth()
  }
}

// Component state: In React Context
const ChatContext = createContext<ChatState>({
  isConnected: false,
  messages: [],
  conversations: [],
})

// Local state: In components
function ChatMessage() {
  const [isEditing, setIsEditing] = useState(false)
  // Local UI state stays local
}
```

## Patterns We Love

### 1. The Initialization Guard Pattern

```typescript
export const useLoopzChat = () => {
  const { initialized } = useLoopz()
  const { isAuthenticated } = useLoopzAuth()

  // Guard all methods
  const connect = useCallback(() => {
    if (!initialized) throw new NotInitializedError()
    if (!isAuthenticated) throw new UnauthenticatedError()

    // Safe to proceed
    return instance.chat.connect()
  }, [initialized, isAuthenticated])
}
```

### 2. Event Emitter + React Bridge

```typescript
// Core SDK uses event emitters
class Chat extends EventEmitter {
  async sendMessage(content: string) {
    const message = await this.api.send(content)
    this.emit("messageReceived", message)
    return message
  }
}

// React hook bridges events to state
export const useLoopzChatEvent = (eventName: string, handler: Function) => {
  const { instance } = useLoopz()

  useEffect(() => {
    if (!handler) return

    instance.chat.on(eventName, handler)
    return () => instance.chat.off(eventName, handler)
  }, [eventName, handler])
}
```

### 3. Progressive Enhancement

```typescript
// Basic usage
function SimpleChat() {
  const { sendMessage } = useLoopzChat()
  return <button onClick={() => sendMessage("Hello!")}>Send</button>
}

// Advanced usage
function AdvancedChat() {
  const { instance } = useLoopz()

  const sendEncryptedFile = async (file: File) => {
    // Direct instance access for advanced features
    const encrypted = await instance.chat.encryptFile(file)
    return instance.chat.sendAttachment(encrypted)
  }
}
```

## Pitfalls We Hit (So You Don't Have To)

### 1. The SSR Nightmare

Next.js and Web3 don't play nice:

```typescript
// ❌ This breaks SSR
export const LoopzProvider = () => {
  const storage = new DexieStorage() // IndexedDB doesn't exist in Node!
}

// ✅ Solution: Dynamic checks
private static async createOrConnectToStorage() {
  if (typeof window === 'undefined') {
    return new MemoryStorage() // Fallback for SSR
  }

  return DexieStorage.createOrConnect({
    dbName: CLIENT_DB_NAME,
    dbVersion: 1
  })
}
```

### 2. The Re-render Explosion

Early versions triggered way too many re-renders:

```typescript
// ❌ Bad: New object every render
const value = {
  auth: instance.auth,
  chat: instance.chat,
  // ... etc
}

// ✅ Good: Stable references
const value = useMemo(
  () => ({
    auth: instance.auth,
    chat: instance.chat,
  }),
  [instance]
)
```

### 3. The Memory Leak Trap

WebSocket subscriptions are dangerous in React:

```typescript
// ❌ Leaky implementation
useEffect(() => {
  instance.chat.on("message", handleMessage)
  // Forgot to cleanup!
})

// ✅ Proper cleanup
useEffect(() => {
  const key = instance.notification.onMessage(handleMessage)

  return () => {
    instance.notification.offMessage(key) // Always cleanup!
  }
}, [])
```

## Testing Strategies

### 1. Mock Providers for Testing

```typescript
export const MockLoopzProvider: FC = ({ children }) => {
  const mockInstance = {
    auth: {
      authenticate: jest.fn().mockResolvedValue({ user: mockUser }),
      logout: jest.fn(),
    },
    chat: {
      connect: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn(),
    },
  }

  return (
    <LoopzContext.Provider
      value={{
        initialized: true,
        instance: mockInstance,
      }}
    >
      {children}
    </LoopzContext.Provider>
  )
}
```

### 2. Hook Testing

```typescript
import { renderHook } from "@testing-library/react-hooks"

test("useLoopzAuth throws when not initialized", () => {
  const { result } = renderHook(() => useLoopzAuth(), {
    wrapper: ({ children }) => (
      <LoopzContext.Provider value={{ initialized: false }}>
        {children}
      </LoopzContext.Provider>
    ),
  })

  expect(() => result.current.authenticate()).toThrow(NotInitializedError)
})
```

## Performance Optimizations

### 1. Lazy Loading Features

```typescript
// Only load chat when needed
const LoopzChatProvider = lazy(() => import("./LoopzChatProvider"))

function App() {
  const { needsChat } = useFeatureFlags()

  return (
    <LoopzProvider>
      {needsChat ? (
        <Suspense fallback={<ChatLoading />}>
          <LoopzChatProvider>
            <Chat />
          </LoopzChatProvider>
        </Suspense>
      ) : (
        <TradingOnly />
      )}
    </LoopzProvider>
  )
}
```

### 2. Subscription Deduplication

```typescript
class UUIDSubscriptionClient {
  private subscriptions = new Map()

  subscribe(query: string, variables: any) {
    const key = `${query}-${JSON.stringify(variables)}`

    // Return existing subscription
    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)
    }

    // Create new subscription with UUID
    const sub = this.client.request({
      id: uuid(), // Prevents server duplicates
      query,
      variables,
    })

    this.subscriptions.set(key, sub)
    return sub
  }
}
```

## Lessons for SDK Developers

1. **Start with the Developer Experience**: Write the code you want developers to write, then make it work.

2. **Embrace TypeScript**: Our types are our documentation. Make them excellent.

3. **Plan for Server-Side Rendering**: Even if you don't need it now, someone will.

4. **Error Messages are UX**: `throw new Error('bad')` helps no one. Be specific.

5. **Test the Unhappy Path**: Network failures, auth errors, race conditions - test them all.

## The Future

We're exploring:

- **Suspense Integration**: For better loading states
- **Concurrent Features**: For smoother updates
- **React Server Components**: For hybrid rendering
- **Custom DevTools**: For debugging complex states

## Final Thoughts

Building a React SDK is about finding the right abstractions. Too low-level and developers struggle. Too high-level and they hit walls. The sweet spot is providing great defaults while keeping escape hatches open.

Our mantra: Make simple things simple, and complex things possible.

---

_Building your own React SDK? We'd love to compare notes. Find us on [GitHub](https://github.com/Salad-Labs/loopz-typescript) or drop us a line at dev@saladlabs.xyz_
