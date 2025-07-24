---
slug: building-encrypted-chat-web3
title: "Building a Real-Time Encrypted Chat System for Web3 Trading"
authors: [mattiamigliore]
tags: [chat, encryption, websocket, architecture, web3]
date: 2024-02-01
---

# Building a Real-Time Encrypted Chat System for Web3 Trading

When we set out to build Loopz, we knew that trading NFTs and tokens required more than just a marketplace - it needed communication. Traders need to negotiate, discuss, and build relationships. But building a chat system for Web3 comes with unique challenges: How do you ensure privacy? How do you handle decentralized identities? How do you make it performant?

<!--truncate-->

## The Requirements

Our chat system needed to:

- Provide end-to-end encryption for all messages
- Work with Web3 identities (DIDs)
- Support real-time messaging via WebSocket
- Handle offline messages and sync
- Integrate seamlessly with trading features

## The Architecture

### 1. The Engine Pattern

We built our chat system around an "Engine" pattern that manages the complexity:

```typescript
export class Engine {
  private _client: Client // GraphQL client
  private _realtimeClient: WebSocket // Real-time subscriptions
  private _storage: DexieStorage // Local IndexedDB
  private _connectionParams: {
    Authorization: string
    host: string
  }

  // WebSocket timeout: 5 minutes of inactivity
  static readonly WS_TIMEOUT = 300000
}
```

This pattern provides:

- Centralized connection management
- Automatic reconnection logic
- Local storage integration
- Clean separation of concerns

### 2. End-to-End Encryption

Every user gets RSA key pairs for message encryption:

```typescript
// Key generation during user signup
const generateKeys = async () => {
  const keys = await Crypto.generateKeys("HIGH")

  // Public key: Shared with others
  // Private key: Encrypted and stored locally
  return {
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
  }
}

// Message encryption flow
const sendMessage = async (content: string, conversationId: string) => {
  // 1. Get conversation's AES key
  const aesKey = getConversationKey(conversationId)

  // 2. Encrypt message content
  const encrypted = Crypto.encryptAES(content, aesKey.AES, aesKey.iv)

  // 3. Send encrypted message
  await chat.createMessage({
    conversationId,
    content: encrypted,
    type: "TEXTUAL",
  })
}
```

### 3. Real-Time Synchronization

One of our biggest challenges was keeping messages synchronized across devices:

```typescript
// The sync process
async sync(): Promise<void> {
  // 1. Connect WebSocket
  await this._handleWSClient()

  // 2. Fetch latest data from server
  const data = await this._loadDataToLocalDB()

  // 3. Subscribe to real-time updates
  this._subscribeToUpdates()

  // 4. Handle offline messages
  await this._processOfflineQueue()
}

// Real-time subscription example
onChatMessageEvents(
  conversationId: string,
  callback: (message: Message) => void
) {
  return this._subscription(
    'onChatMessageEvents',
    { conversationId, jwt: Auth.authToken },
    callback
  )
}
```

### 4. Local-First Architecture

We use IndexedDB (via Dexie) for local storage, providing:

- Offline message access
- Fast UI rendering
- Reduced server load

```typescript
// Local database schema
const schema = {
  user: '++[did+organizationId]',
  conversation: '++[id+userDid], name, type, order',
  message: '++[id+userDid], conversationId, order, createdAt',
  member: '++[id+userId], conversationId'
}

// Syncing local and remote
private async _storeMessageLDB(message: MessageGraphQL) {
  await this._storage.message.put({
    id: message.id,
    content: this._decryptContent(message.content),
    conversationId: message.conversationId,
    // ... other fields
  })

  this._emit('messageCreatedLDB', localMessage)
}
```

## Integration with Trading

The real magic happens when chat meets trading:

### Trade Proposals in Chat

```typescript
// Creating a trade proposal message
const message = await chat.createMessage({
  conversationId,
  type: "TRADE_PROPOSAL",
  content: "Check out my offer!",
  proposal: {
    offered: [{ tokenId: "123", contract: "0x..." }],
    wanted: [{ amount: "1000000000000000000", token: "ETH" }],
  },
})
```

### Message Types

We support different message types for different purposes:

```typescript
enum MessageType {
  TEXTUAL = "TEXTUAL", // Regular text
  ATTACHMENT = "ATTACHMENT", // Files/images
  TRADE_PROPOSAL = "TRADE_PROPOSAL", // Trade offers
  NFT = "NFT", // Shared NFTs
  RENT = "RENT", // Rental proposals
}
```

## Performance Optimizations

### 1. Message Pagination

Loading thousands of messages would kill performance:

```typescript
async getMessages(conversationId: string, limit = 20, offset = 0) {
  // Fetch from local DB first
  const localMessages = await this._storage.message
    .where('[conversationId+order]')
    .between([conversationId, 0], [conversationId, Infinity])
    .reverse()
    .limit(limit)
    .offset(offset)
    .toArray()

  return localMessages
}
```

### 2. Subscription Management

We carefully manage WebSocket subscriptions to prevent memory leaks:

```typescript
// Track all subscriptions
private _subscriptionGarbageCollector: SubscriptionGarbage[] = []

// Cleanup on disconnect
private _reset(): void {
  this._realtimeClient?.unsubscribeAll()
  this._offUUIDSubscriptionEvents()
  this._realtimeClient?.close()
  this._offEventsFnsCollector = []
}
```

### 3. Message Queueing

For reliability, we queue messages when offline:

```typescript
// Queue message when offline
if (!this.isConnected()) {
  await this._storage.offlineQueue.add({
    action: "CREATE_MESSAGE",
    data: messageData,
    timestamp: Date.now(),
  })
  return
}
```

## Challenges We Faced

### 1. The Typing Indicator Problem

In a decentralized system, implementing "user is typing" is non-trivial:

- Too many events can overwhelm the WebSocket
- Privacy concerns about activity tracking
- Battery drain on mobile devices

Our solution: Local-only typing indicators with smart debouncing.

### 2. Message Ordering

With distributed systems, message ordering becomes complex:

```typescript
// We use a combination of timestamp and order field
type Message = {
  id: string
  order: number // Server-assigned order
  createdAt: Date // Client timestamp
  serverTimestamp: Date // Server timestamp
}

// Sort by server order, fallback to timestamp
messages.sort((a, b) => a.order - b.order)
```

### 3. Group Chat Scaling

Group chats with hundreds of members require special handling:

```typescript
// Lazy load members
async getConversationMembers(conversationId: string) {
  // Only load members when needed
  const cached = await this._storage.member
    .where('conversationId')
    .equals(conversationId)
    .toArray()

  if (cached.length > 0) return cached

  // Fetch from server if not cached
  return this._fetchMembers(conversationId)
}
```

## Security Considerations

### Key Management

The trickiest part of E2E encryption is key management:

```typescript
// Each conversation has its own AES key
type ConversationKeys = {
  AES: string // 256-bit key
  iv: string // Initialization vector
}

// Keys are encrypted with each member's public key
type ConversationMember = {
  userId: string
  encryptedConversationAESKey: string
  encryptedConversationIVKey: string
}
```

### Message Integrity

We ensure messages can't be tampered with:

- Messages are signed before encryption
- Server validates message structure
- Clients verify decryption success

## Lessons Learned

1. **Start with E2E encryption from day one** - Retrofitting encryption is painful
2. **Local-first is the way** - Users expect instant UI updates
3. **WebSocket management is critical** - Poor connection handling ruins UX
4. **Plan for scale early** - Group chats can grow quickly
5. **Message types matter** - Different content needs different handling

## What's Next

We're constantly improving our chat system:

- Voice messages and calls
- Improved group chat performance
- Cross-device message sync
- Richer trade proposal embeds

Building a chat system for Web3 is challenging, but the result - traders being able to communicate securely while negotiating deals - makes it all worthwhile.

---

_Want to integrate Loopz chat into your Web3 application? Check out our [documentation](/docs/guides/chat) or [reach out](mailto:dev@saladlabs.com) to our team!_
