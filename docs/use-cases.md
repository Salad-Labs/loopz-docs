---
id: use-cases
title: Use Cases
sidebar_label: Use Cases
sidebar_position: 4
keywords:
  - use cases
  - examples
  - marketplace
  - trading
  - chat
  - NFT
  - real world
description: Real-world use cases and implementation examples for the Loopz SDK
---

# Use Cases

This section demonstrates real-world applications of the Loopz SDK with complete implementation examples. Each use case includes code samples, best practices, and considerations for production deployment.

## 1. NFT Marketplace with Integrated Chat

Build a complete NFT marketplace where users can browse, list, buy NFTs and negotiate trades through encrypted chat.

### Features

- Browse NFT collections
- Create buy/sell orders
- Direct messaging between buyers and sellers
- Trade negotiation through chat
- Secure escrow via smart contracts

### Implementation

```tsx
// NFTMarketplace.tsx
import React, { useState, useEffect } from "react"
import {
  useLoopz,
  useLoopzAuth,
  useLoopzChat,
} from "@salad-labs/loopz-typescript"

function NFTMarketplace() {
  const { instance } = useLoopz()
  const { isAuthenticated, account } = useLoopzAuth()
  const { connect, sync } = useLoopzChat()
  const [listings, setListings] = useState([])
  const [selectedNFT, setSelectedNFT] = useState(null)

  // Load marketplace listings
  useEffect(() => {
    if (isAuthenticated) {
      loadListings()
    }
  }, [isAuthenticated])

  const loadListings = async () => {
    try {
      // Get orders from the marketplace using listOrders
      const response = await instance.order.listOrders({
        networkId: "1", // Ethereum mainnet
        status: "active", // Status of orders
        skip: 0,
        take: 20,
      })

      if (response) {
        setListings(response.orders)
      }
    } catch (error) {
      console.error("Failed to load listings:", error)
    }
  }

  // Create a listing for an NFT
  const createListing = async (nft) => {
    try {
      const order = await instance.order.create(
        wallet, // Connected wallet
        {
          address: account.wallet,
          assets: [
            {
              token: nft.contractAddress,
              tokenId: nft.tokenId,
              amount: "1",
              itemType: "ERC721",
            },
          ],
        },
        {
          address: "", // Any buyer
          assets: [
            {
              token: "0x0000000000000000000000000000000000000000", // ETH
              amount: nft.price,
              itemType: "NATIVE",
            },
          ],
        },
        7, // 7 days expiration
        [], // No additional fees
        null // No proposal ID
      )

      console.log("Listing created:", order)
      loadListings() // Refresh listings
    } catch (error) {
      console.error("Failed to create listing:", error)
    }
  }

  // Start chat with seller
  const contactSeller = async (listing) => {
    try {
      // Connect to chat if not connected
      if (!instance.chat.isConnected()) {
        await connect()
        await sync()
      }

      // Create or get existing conversation with seller
      const conversation = await instance.chat.createConversation({
        name: `Trade discussion: ${listing.nft.name}`,
        description: `Discussing trade for ${listing.nft.name}`,
        members: [listing.seller.did],
        type: "PRIVATE",
      })

      // Send initial message
      await instance.chat.createMessage({
        conversationId: conversation.id,
        content: `Hi! I'm interested in your ${listing.nft.name} listing.`,
        type: "TEXTUAL",
      })

      // Navigate to chat view
      navigateToChat(conversation.id)
    } catch (error) {
      console.error("Failed to start chat:", error)
    }
  }

  // Buy NFT directly
  const buyNFT = async (listing) => {
    try {
      const result = await instance.order.finalize(listing.orderId)

      if (result.success) {
        alert("NFT purchased successfully!")
        loadListings()
      }
    } catch (error) {
      console.error("Failed to buy NFT:", error)
    }
  }

  return (
    <div className="nft-marketplace">
      <h1>NFT Marketplace</h1>

      <div className="listings-grid">
        {listings.map((listing) => (
          <div key={listing.id} className="nft-card">
            <img src={listing.nft.imageUrl} alt={listing.nft.name} />
            <h3>{listing.nft.name}</h3>
            <p>Price: {listing.price} ETH</p>

            <div className="actions">
              <button onClick={() => buyNFT(listing)}>Buy Now</button>
              <button onClick={() => contactSeller(listing)}>
                Contact Seller
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 2. P2P Trading Platform

Create a peer-to-peer trading platform where users can create complex trade proposals involving multiple NFTs and tokens.

### Features

- Multi-asset trade proposals
- Counteroffers and negotiations
- Trade history tracking
- Reputation system
- Escrow protection

### Implementation

```tsx
// P2PTradingPlatform.tsx
import React, { useState } from "react"
import {
  useLoopz,
  useLoopzAuth,
  MessageMap,
} from "@salad-labs/loopz-typescript"

function P2PTradingPlatform() {
  const { instance } = useLoopz()
  const { account } = useLoopzAuth()
  const [tradeProposal, setTradeProposal] = useState({
    offered: [],
    wanted: [],
  })

  // Create a trade proposal
  const createTradeProposal = async () => {
    try {
      const proposal = await instance.proposal.create({
        type: "TRADE",
        networkId: "1",
        creatorAddress: account.wallet,
        expirationDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        assets: {
          offered: tradeProposal.offered.map((asset) => ({
            token: asset.contractAddress,
            tokenId: asset.tokenId,
            amount: asset.amount || "1",
            type: asset.type, // ERC721, ERC1155, ERC20
          })),
          wanted: tradeProposal.wanted.map((asset) => ({
            token: asset.contractAddress,
            tokenId: asset.tokenId,
            amount: asset.amount || "1",
            type: asset.type,
          })),
        },
        messages: [
          {
            type: MessageMap.MESSAGE_MATRIX["10"], // "This may be perfect for you"
          },
        ],
      })

      // Share proposal in chat
      await shareProposalInChat(proposal)

      console.log("Trade proposal created:", proposal)
    } catch (error) {
      console.error("Failed to create proposal:", error)
    }
  }

  // Share proposal in trading chat room
  const shareProposalInChat = async (proposal) => {
    try {
      // Get or create trading room
      const tradingRoom =
        (await instance.chat.getConversationByName("Global Trading Room")) ||
        (await instance.chat.createConversation({
          name: "Global Trading Room",
          description: "Public trading discussion room",
          type: "PUBLIC",
        }))

      // Send trade proposal message
      await instance.chat.createMessage({
        conversationId: tradingRoom.id,
        type: "TRADE_PROPOSAL",
        content: "Check out my new trade proposal!",
        proposal: {
          id: proposal.id,
          offered: proposal.assets.offered,
          wanted: proposal.assets.wanted,
        },
      })
    } catch (error) {
      console.error("Failed to share proposal:", error)
    }
  }

  // Accept a trade proposal
  const acceptProposal = async (proposalId) => {
    try {
      // Create order from proposal
      const order = await instance.order.createFromProposal(
        proposalId,
        account.wallet
      )

      // Finalize the trade
      const result = await instance.order.finalize(order.orderId)

      if (result.success) {
        console.log("Trade completed successfully!")
      }
    } catch (error) {
      console.error("Failed to accept proposal:", error)
    }
  }

  // Create a counteroffer
  const createCounteroffer = async (originalProposalId) => {
    try {
      // Get original proposal
      const original = await instance.proposal.getById(originalProposalId)

      // Create new proposal with modified terms
      const counteroffer = await instance.proposal.create({
        ...original,
        creatorAddress: account.wallet,
        assets: {
          offered: original.assets.wanted, // Swap offered/wanted
          wanted: original.assets.offered,
        },
        parentProposalId: originalProposalId, // Link to original
      })

      // Send counteroffer notification
      await notifyCounteroffer(original.creatorAddress, counteroffer)

      return counteroffer
    } catch (error) {
      console.error("Failed to create counteroffer:", error)
    }
  }

  return (
    <div className="p2p-trading">
      <h1>P2P Trading Platform</h1>

      <TradeBuilder proposal={tradeProposal} onChange={setTradeProposal} />

      <button onClick={createTradeProposal}>Create Trade Proposal</button>

      <ActiveProposals onAccept={acceptProposal} />
      <TradeHistory />
    </div>
  )
}
```

## 3. Gaming Item Exchange

Build an exchange for in-game items where players can trade assets across different games.

### Features

- Cross-game item trading
- Bulk trades for item sets
- Price discovery through offers
- Game-specific chat rooms
- Collection tracking

### Implementation

```tsx
// GamingItemExchange.tsx
import React, { useState, useEffect } from "react"
import {
  useLoopz,
  useLoopzAuth,
  useLoopzChat,
} from "@salad-labs/loopz-typescript"

function GamingItemExchange() {
  const { instance } = useLoopz()
  const { account } = useLoopzAuth()
  const [gameRooms, setGameRooms] = useState({})
  const [inventory, setInventory] = useState([])

  // Initialize game-specific chat rooms
  useEffect(() => {
    initializeGameRooms()
    loadPlayerInventory()
  }, [])

  const initializeGameRooms = async () => {
    const games = ["Axie Infinity", "Gods Unchained", "The Sandbox"]

    for (const game of games) {
      try {
        let room = await instance.chat.getConversationByName(`${game} Trading`)

        if (!room) {
          room = await instance.chat.createConversation({
            name: `${game} Trading`,
            description: `Trading room for ${game} items`,
            type: "PUBLIC",
            metadata: { game, type: "trading_room" },
          })
        }

        setGameRooms((prev) => ({ ...prev, [game]: room }))
      } catch (error) {
        console.error(`Failed to setup ${game} room:`, error)
      }
    }
  }

  // Create bulk trade for item set
  const createBulkTrade = async (items, targetGame) => {
    try {
      // Group items by collection
      const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.collection]) acc[item.collection] = []
        acc[item.collection].push(item)
        return acc
      }, {})

      // Create proposal with all items
      const proposal = await instance.proposal.create({
        type: "TRADE",
        networkId: "137", // Polygon
        creatorAddress: account.wallet,
        expirationDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
        assets: {
          offered: items.map((item) => ({
            token: item.contractAddress,
            tokenId: item.tokenId,
            amount: item.amount || "1",
            type: item.standard, // ERC721 or ERC1155
          })),
          wanted: [
            {
              token: "0x...", // Target game currency
              amount: calculateBulkPrice(items),
              type: "ERC20",
            },
          ],
        },
        messages: [
          {
            type: MessageMap.MESSAGE_MATRIX["001_002"], // "Anyone interested to these NFTs?"
          },
        ],
        metadata: {
          sourceGame: items[0].game,
          targetGame,
          itemCount: items.length,
          rarity: calculateAverageRarity(items),
        },
      })

      // Post in relevant game room
      await postTradeInGameRoom(proposal, targetGame)

      return proposal
    } catch (error) {
      console.error("Failed to create bulk trade:", error)
    }
  }

  // Match complementary trades
  const findMatchingTrades = async (myItems) => {
    try {
      // Get proposals using the list method
      const proposalsResponse = await instance.proposal.list(
        {
          // Filter by network and type
          networkId: "137",
          type: Proposal.PROPOSAL_TYPE.TRADE,
        },
        undefined, // no ordering
        0, // skip
        100 // take
      )

      if (!proposalsResponse) return []

      // Find proposals wanting what I have
      const matches = proposalsResponse.proposals.filter((proposal) => {
        const wantedTokens = proposal.assets.wanted.map((a) => a.token)
        const myTokens = myItems.map((i) => i.contractAddress)

        return wantedTokens.some((token) => myTokens.includes(token))
      })

      // Score matches by compatibility
      const scoredMatches = matches.map((match) => ({
        ...match,
        score: calculateMatchScore(myItems, match),
        mutualBenefit: checkMutualBenefit(myItems, match),
      }))

      return scoredMatches.sort((a, b) => b.score - a.score)
    } catch (error) {
      console.error("Failed to find matches:", error)
      return []
    }
  }

  // Create trade room for specific item set
  const createItemSetRoom = async (setName, items) => {
    try {
      const room = await instance.chat.createConversation({
        name: `Trading: ${setName}`,
        description: `Exclusive room for ${setName} collectors`,
        type: "PRIVATE",
        metadata: {
          itemSet: setName,
          requiredItems: items.map((i) => i.tokenId),
          createdBy: account.did,
        },
      })

      // Invite collectors who own pieces
      // Note: Finding collectors would require backend implementation
      // or analyzing blockchain data
      const collectors = [] // Would need to implement collector discovery

      if (collectors.length > 0) {
        // Add members to conversation
        // Implementation depends on chat system design
      }

      return room
    } catch (error) {
      console.error("Failed to create item set room:", error)
    }
  }

  return (
    <div className="gaming-exchange">
      <h1>Gaming Item Exchange</h1>

      <div className="exchange-sections">
        <InventoryManager
          inventory={inventory}
          onCreateTrade={createBulkTrade}
        />

        <TradeMatching onFindMatches={findMatchingTrades} />

        <GameRoomsList rooms={gameRooms} />
      </div>
    </div>
  )
}
```

## 4. Social Trading Network

Create a social platform where traders can follow each other, share strategies, and copy trades.

### Features

- Trader profiles with stats
- Follow/unfollow traders
- Copy trading functionality
- Strategy sharing in chat
- Performance leaderboards

### Implementation

```tsx
// SocialTradingNetwork.tsx
import React, { useState, useEffect } from "react"
import { useLoopz, useLoopzAuth } from "@salad-labs/loopz-typescript"

function SocialTradingNetwork() {
  const { instance } = useLoopz()
  const { account } = useLoopzAuth()
  const [following, setFollowing] = useState([])
  const [topTraders, setTopTraders] = useState([])
  const [strategyRooms, setStrategyRooms] = useState([])

  // Get top traders by performance
  const loadTopTraders = async () => {
    try {
      // Note: This is a hypothetical implementation
      // The Oracle class doesn't have a getTopTraders method
      // You would need to implement this logic using available methods
      // or fetch from your own backend

      console.log("Load top traders - implement with your backend")

      // Example: Get NFT collections and analyze trading volume
      const collections = await instance.oracle.listCollections({
        networkId: "1",
        searchType: "volume",
        skip: 0,
        take: 50,
      })

      // Process collections data to identify top traders
      // This would require additional backend logic
    } catch (error) {
      console.error("Failed to load top traders:", error)
    }
  }

  // Follow a trader and join their strategy room
  const followTrader = async (traderId) => {
    try {
      // Note: The notification class doesn't have a subscribe method
      // You would need to implement follower logic in your backend

      // Join trader's strategy discussion room
      const conversations = await instance.chat.getConversations()
      const traderRoom = conversations.find(
        (conv) => conv.name === `${traderId}'s Strategy Room`
      )

      if (traderRoom && traderRoom.type === "PUBLIC") {
        // Join existing conversation
        // Note: joinConversation might need to be implemented
        // depending on how chat membership works
        setStrategyRooms((prev) => [...prev, traderRoom])
      }

      // Update following list locally
      setFollowing((prev) => [...prev, traderId])

      // Analyze trader's recent trades
      const traderOrders = await instance.order.listUserOrders({
        networkId: "1",
        did: traderId,
        status: "*", // All statuses
        skip: 0,
        take: 20,
      })

      console.log("Trader orders:", traderOrders)
    } catch (error) {
      console.error("Failed to follow trader:", error)
    }
  }

  // Copy a trader's trade
  const copyTrade = async (originalTrade) => {
    try {
      // Adjust position size based on portfolio
      const adjustedSize = calculatePositionSize(
        originalTrade,
        account.portfolioValue
      )

      // Create similar order
      const copiedOrder = await instance.order.create(
        wallet,
        {
          address: account.wallet,
          assets: originalTrade.offered.map((asset) => ({
            ...asset,
            amount: adjustedSize,
          })),
        },
        {
          address: originalTrade.counterparty,
          assets: originalTrade.wanted,
        },
        originalTrade.expiration,
        originalTrade.fees,
        null
      )

      // Track as copied trade
      // Note: This would need to be implemented in your backend
      // The SDK doesn't have built-in analytics tracking
      console.log("Trade copied:", {
        originalTradeId: originalTrade.id,
        copiedOrderId: copiedOrder.orderId,
        originalTrader: originalTrade.creator,
        scaleFactor: adjustedSize / originalTrade.offered[0].amount,
      })

      return copiedOrder
    } catch (error) {
      console.error("Failed to copy trade:", error)
    }
  }

  // Share trading strategy
  const shareStrategy = async (strategy) => {
    try {
      // Create strategy document
      const strategyDoc = {
        title: strategy.title,
        description: strategy.description,
        rules: strategy.rules,
        backtestResults: strategy.backtest,
        riskMetrics: strategy.risk,
        author: account.did,
      }

      // Create dedicated strategy room
      const room = await instance.chat.createConversation({
        name: `Strategy: ${strategy.title}`,
        description: strategy.description,
        type: "PUBLIC",
        metadata: {
          type: "strategy_discussion",
          strategy: strategyDoc,
        },
      })

      // Share in main strategy feed
      await instance.chat.createMessage({
        conversationId: "strategy-feed",
        type: "TEXTUAL",
        content: `New strategy shared: ${strategy.title}`,
        attachments: [
          {
            type: "strategy",
            data: strategyDoc,
          },
        ],
      })

      // Create automated alerts for strategy signals
      // Note: This would need backend implementation
      // The SDK doesn't have built-in alert mechanisms
      console.log("Strategy shared:", room.id)

      return room
    } catch (error) {
      console.error("Failed to share strategy:", error)
    }
  }

  // Performance tracking dashboard
  const TraderDashboard = ({ trader }) => {
    const [stats, setStats] = useState(null)

    useEffect(() => {
      // Note: This is a simplified version
      // Real implementation would need proper stats tracking
      const loadTraderStats = async (traderId) => {
        try {
          const orders = await instance.order.listUserOrders({
            networkId: "1",
            did: traderId,
            status: "*",
            skip: 0,
            take: 100,
          })

          // Calculate stats from orders
          const stats = {
            winRate: 0, // Calculate from order history
            avgROI: 0, // Calculate from order values
            totalTrades: orders?.total || 0,
            followers: 0, // Would need backend tracking
          }

          return stats
        } catch (error) {
          console.error("Failed to load trader stats:", error)
          return null
        }
      }

      loadTraderStats(trader.id).then(setStats)
    }, [trader.id])

    return (
      <div className="trader-dashboard">
        <h3>{trader.username}</h3>
        <div className="stats-grid">
          <Stat label="Win Rate" value={`${stats?.winRate}%`} />
          <Stat label="Avg ROI" value={`${stats?.avgROI}%`} />
          <Stat label="Total Trades" value={stats?.totalTrades} />
          <Stat label="Followers" value={stats?.followers} />
        </div>

        <div className="actions">
          <button onClick={() => followTrader(trader.id)}>Follow</button>
          <button onClick={() => viewTraderHistory(trader.id)}>
            View History
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="social-trading">
      <h1>Social Trading Network</h1>

      <LeaderboardSection traders={topTraders} />

      <FollowingSection following={following} onCopyTrade={copyTrade} />

      <StrategyFeed rooms={strategyRooms} onShareStrategy={shareStrategy} />

      <PerformanceAnalytics />
    </div>
  )
}
```

## 5. DeFi Trading Terminal

Build a professional trading terminal for DeFi assets with advanced order types and real-time data.

### Features

- Real-time price feeds
- Advanced order types (limit, stop-loss)
- Portfolio tracking
- Trading signals via chat
- Multi-chain support

### Implementation

```tsx
// DeFiTradingTerminal.tsx
import React, { useState, useEffect } from "react"
import {
  useLoopz,
  useLoopzAuth,
  useLoopzChat,
} from "@salad-labs/loopz-typescript"

function DeFiTradingTerminal() {
  const { instance } = useLoopz()
  const { account } = useLoopzAuth()
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] })
  const [positions, setPositions] = useState([])
  const [signalsRoom, setSignalsRoom] = useState(null)

  // Initialize trading signals room
  useEffect(() => {
    initializeSignalsRoom()
    subscribeToMarketData()
  }, [])

  const initializeSignalsRoom = async () => {
    try {
      // Connect to chat
      await instance.chat.connect()
      await instance.chat.sync()

      // Create or get signals room
      const conversations = await instance.chat.getConversations()
      let room = conversations.find(
        (conv) => conv.name === "DeFi Trading Signals"
      )

      if (!room) {
        room = await instance.chat.createConversation({
          name: "DeFi Trading Signals",
          description: "Automated trading signals and alerts",
          type: "PUBLIC",
          metadata: {
            type: "signals",
            automated: true,
          },
        })
      }

      setSignalsRoom(room)

      // Listen for new messages in the signals room
      instance.chat.on("messageReceived", (message) => {
        if (message.conversationId === room.id) {
          handleTradingSignal(message)
        }
      })
    } catch (error) {
      console.error("Failed to setup signals room:", error)
    }
  }

  // Create limit order
  const createLimitOrder = async (params) => {
    try {
      const order = await instance.order.create(
        wallet,
        {
          address: account.wallet,
          assets: [
            {
              token: params.sellToken,
              amount: params.sellAmount,
              itemType: "ERC20",
            },
          ],
        },
        {
          address: "", // Any taker
          assets: [
            {
              token: params.buyToken,
              amount: params.buyAmount,
              itemType: "ERC20",
            },
          ],
        },
        params.expiration || 1, // 1 day default
        [
          {
            recipient: account.wallet,
            basisPoints: 0, // No fees for limit orders
          },
        ]
      )

      // Broadcast order to signals room
      await broadcastOrder(order, "LIMIT")

      return order
    } catch (error) {
      console.error("Failed to create limit order:", error)
    }
  }

  // Create stop-loss order
  const createStopLossOrder = async (position, stopPrice) => {
    try {
      // Note: Oracle doesn't have monitorPrice method
      // Stop-loss logic would need to be implemented in your backend
      // or using a combination of periodic checks

      console.log("Stop-loss order created:", {
        position,
        stopPrice,
      })

      // You could implement this by:
      // 1. Setting up a backend job to monitor prices
      // 2. Using a third-party service for price alerts
      // 3. Implementing client-side polling (not recommended)

      // When stop price is hit, create and execute order:
      /*
      const order = await instance.order.create(
        wallet,
        {
          address: account.wallet,
          assets: [{
            token: position.token,
            amount: position.amount,
            itemType: 'ERC20'
          }]
        },
        {
          address: '',
          assets: [{
            token: '0x...', // USDC
            amount: calculateMarketValue(position),
            itemType: 'ERC20'
          }]
        },
        0, // Immediate
        []
      )
      
      await instance.order.finalize(order.orderId)
      */

      return { id: Date.now(), position, stopPrice }
    } catch (error) {
      console.error("Failed to create stop-loss:", error)
    }
  }

  // Broadcast trading signals
  const broadcastOrder = async (order, type) => {
    if (!signalsRoom) return

    try {
      await instance.chat.createMessage({
        conversationId: signalsRoom.id,
        type: "TRADE_PROPOSAL",
        content: `New ${type} order created`,
        metadata: {
          orderType: type,
          orderId: order.orderId,
          pair: `${order.offer[0].token}/${order.consideration[0].token}`,
          price: calculatePrice(order),
          size: order.offer[0].amount,
          creator: account.did,
        },
      })
    } catch (error) {
      console.error("Failed to broadcast order:", error)
    }
  }

  // Portfolio tracker
  const PortfolioTracker = () => {
    const [portfolio, setPortfolio] = useState({
      totalValue: 0,
      positions: [],
      pnl: 0,
    })

    useEffect(() => {
      updatePortfolio()
      const interval = setInterval(updatePortfolio, 30000) // Update every 30s
      return () => clearInterval(interval)
    }, [])

    const updatePortfolio = async () => {
      try {
        // Get user's NFT collections
        const collectibles = await instance.oracle.listCollectibles({
          owner: account.wallet,
          networkId: "1",
        })

        // For tokens, you would need to use web3 libraries directly
        // or implement your own token balance fetching

        // Calculate portfolio value
        // Note: getTokenValue doesn't exist in Oracle
        // You would need to implement price fetching from external sources

        const portfolioData = {
          totalValue: 0, // Calculate based on current prices
          positions: collectibles || [],
          pnl: 0, // Calculate based on historical data
        }

        setPortfolio(portfolioData)

        // Send performance update to signals room if significant P&L
        if (Math.abs(portfolioData.pnl) > 100) {
          await instance.chat.createMessage({
            conversationId: signalsRoom.id,
            type: "TEXTUAL",
            content: `Portfolio Update: ${
              portfolioData.pnl >= 0 ? "+" : ""
            }${portfolioData.pnl.toFixed(2)}% P&L`,
          })
        }
      } catch (error) {
        console.error("Failed to update portfolio:", error)
      }
    }

    return (
      <div className="portfolio-tracker">
        <h3>Portfolio Value: ${portfolio.totalValue.toFixed(2)}</h3>
        <p className={portfolio.pnl >= 0 ? "profit" : "loss"}>
          P&L: {portfolio.pnl >= 0 ? "+" : ""}
          {portfolio.pnl.toFixed(2)}%
        </p>

        <PositionsList positions={portfolio.positions} />
      </div>
    )
  }

  return (
    <div className="defi-terminal">
      <h1>DeFi Trading Terminal</h1>

      <div className="terminal-layout">
        <ChartSection />

        <OrderBook book={orderBook} onPlaceOrder={createLimitOrder} />

        <TradingPanel
          onLimitOrder={createLimitOrder}
          onStopLoss={createStopLossOrder}
        />

        <PortfolioTracker />

        <SignalsChat room={signalsRoom} />
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Error Handling

Always implement comprehensive error handling:

```typescript
try {
  await instance.order.create(...)
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    // Handle specific error
  } else {
    // Generic error handling
  }
}
```

### 2. State Management

Use proper state management for complex applications:

```typescript
// Using Redux or Zustand for global state
const useTradeStore = create((set) => ({
  trades: [],
  addTrade: (trade) =>
    set((state) => ({
      trades: [...state.trades, trade],
    })),
  removeTrade: (id) =>
    set((state) => ({
      trades: state.trades.filter((t) => t.id !== id),
    })),
}))
```

### 3. Performance Optimization

Implement pagination and caching:

```typescript
const loadTrades = async (page = 1, limit = 20) => {
  const cached = cache.get(`trades_${page}`)
  if (cached) return cached

  const trades = await instance.order.getOrders({
    page,
    limit,
  })

  cache.set(`trades_${page}`, trades, 300) // 5 min cache
  return trades
}
```

### 4. Security Considerations

- Always validate user inputs
- Implement rate limiting
- Use environment variables for sensitive data
- Verify transaction parameters before execution
