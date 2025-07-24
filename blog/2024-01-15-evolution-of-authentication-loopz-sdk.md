---
slug: evolution-of-authentication-loopz-sdk
title: "From Privy to OTP: The Evolution of Authentication in Loopz SDK"
authors: [mattiamigliore]
tags: [authentication, architecture, web3, development]
date: 2024-01-15
---

# From Privy to OTP: The Evolution of Authentication in Loopz SDK

When we first started building the Loopz SDK, we made what seemed like an obvious choice: use Privy for all authentication. After all, we were building a Web3 trading platform, and Privy offered seamless wallet connections with social logins. However, as our platform evolved, we discovered that what works for simple DApps doesn't always scale for complex applications with real-time features.

<!--truncate-->

## The Initial Architecture

Our initial authentication flow was straightforward:

```typescript
// Original implementation (simplified)
const { login } = usePrivy()

const authenticate = async () => {
  const user = await login()
  // User authenticated with wallet/social/email via Privy
  return user
}
```

Everything went through Privy - wallet connections, email authentication, social logins. It was elegant and simple.

## The Problem Emerges

As we developed our real-time chat feature, we hit a major roadblock: **Privy's JWT tokens expire after just 1 hour**.

For a trading platform where users might browse NFTs for a few minutes, this wasn't an issue. But for a chat application where users stay connected for hours, it became a nightmare:

```typescript
// The dreaded token expiration during active chat
WebSocket disconnected: 401 Unauthorized
Token expired while user was mid-conversation
```

Imagine typing a long message about a trade, hitting send, and getting logged out. Not exactly the user experience we were aiming for.

## The Cost Factor

Beyond the technical limitations, there was another consideration: **cost**. Privy's pricing model made sense for simple authentication needs, but for an application where users might authenticate multiple times per day due to token expiration, the costs started adding up quickly.

## The Hybrid Solution

Instead of completely abandoning Privy, we developed a hybrid approach that leverages the best of both worlds:

### 1. Custom OTP Authentication for App Access

We built our own email/SMS OTP system for primary authentication:

```typescript
// New OTP-based authentication
const requestOtpCode = async (email: string) => {
  const response = await fetch("/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
  // Send 6-digit code via email
}

const verifyOtpCode = async (email: string, code: string) => {
  const response = await fetch("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  })
  // Returns JWT with 18-hour expiration
  return response.json()
}
```

### 2. Privy for Blockchain Operations Only

We kept Privy, but only for when users need to interact with the blockchain:

```typescript
// Privy is now only used when creating orders
const createOrder = async () => {
  // Check if wallet is connected
  const wallet = account.getActiveWallets()[0]

  if (!wallet) {
    // NOW we trigger Privy
    // User connects wallet only when needed
  }

  // Execute blockchain transaction
  await order.create(wallet, ...)
}
```

## The Technical Implementation

The refactoring wasn't trivial. We had to:

1. **Maintain Backward Compatibility**: Keep the existing API surface while changing the underlying implementation
2. **Handle Legacy Code**: Deal with remnants of the old system (those `link`/`unlink` methods you might notice)
3. **Separate Concerns**: Clearly distinguish between app authentication and blockchain authentication

Here's how the new architecture looks:

```typescript
// App authentication (OTP)
LoopzAuth Component
  ├── Handles email/SMS OTP flow
  ├── Manages JWT tokens (18-hour expiry)
  └── Controls the authentication UI

// Blockchain authentication (Privy)
Order.init(wallet)
  ├── Triggered only for blockchain operations
  ├── Uses Privy for wallet connection
  └── Minimal token expiration impact
```

## The Results

The benefits of this hybrid approach have been significant:

1. **Better User Experience**: Users stay logged in for entire trading sessions without interruption
2. **Reduced Costs**: Dramatic reduction in authentication costs
3. **Improved Chat Stability**: No more disconnections due to token expiration
4. **Flexible Authentication**: Users don't need a wallet just to browse and chat

## Lessons Learned

This evolution taught us several valuable lessons:

1. **One Size Doesn't Fit All**: What works for simple DApps might not work for complex applications
2. **Cost Matters at Scale**: Always model costs based on realistic usage patterns
3. **User Experience Trumps Elegance**: A slightly more complex architecture is worth it for a better UX
4. **Incremental Migration**: You don't have to throw everything away - hybrid solutions can work

## Code Artifacts and Legacy

If you dig through our codebase, you'll still find remnants of the old system:

```typescript
// These methods are legacy - no longer functional
const link = useCallback((method: AuthLinkMethod) => {
  // Legacy Privy integration
}, [])

const unlink = useCallback((method: AuthLinkMethod) => {
  // Legacy Privy integration
}, [])
```

We kept these to maintain API compatibility, but they're essentially non-functional now.

## Looking Forward

This architectural evolution has positioned us well for future growth. We can now:

- Support users who want to chat and browse without wallets
- Offer extended sessions for better user experience
- Keep costs predictable as we scale
- Maintain security where it matters most (blockchain operations)

The journey from a Privy-only solution to our hybrid approach shows that sometimes the best architecture isn't the simplest one - it's the one that best serves your users' needs.

---

_Have you faced similar authentication challenges in your Web3 projects? We'd love to hear about your experiences and solutions!_
