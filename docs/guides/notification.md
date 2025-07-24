---
id: notifications
title: Notifications Guide
sidebar_label: Notifications
sidebar_position: 5
keywords:
  - notifications
  - websocket
  - real-time
  - alerts
  - messages
description: Guide to real-time notifications in the Loopz SDK
---

# Notifications Guide

The Loopz SDK provides a real-time notification system via WebSocket connections, allowing your application to receive instant updates about trades, messages, and system events.

## Overview

The notification system:

- Uses WebSocket for real-time communication
- Requires authenticated users (JWT token)
- Handles different notification types (deals, posts, account, system)
- Provides event-based message handling
- Automatically manages connection lifecycle

## Notification Types

The SDK supports several notification types and subtypes:

### Main Types

```typescript
enum NotificationType {
  DEAL = "0", // Trade-related notifications
  POST = "1", // Post/content notifications
  ACCOUNT = "2", // Account-related notifications
  SYSTEM = "3", // System messages
}
```

### Subtypes

```typescript
enum NotificationSubType {
  // Deal notifications
  MAKER_CREATED_DEAL = "0",
  TAKER_ACCEPTED_DEAL = "1",

  // Post notifications
  CREATOR_THREAD_PUT_LIKE = "0",
  CREATOR_THREAD_PUT_NO_LIKE = "1",
  THREAD_HAS_NEW_REPLY = "2",
  CREATOR_THREAD_ACCEPTED_REPLY = "3",
  SOMEONE_CREATED_THREAD = "4",
  FOLLOWED_CREATED_THREAD = "5",

  // Account notifications
  SOMEONE_FOLLOWED_YOU = "0",

  // System notifications
  SYSTEM = "0",
}
```

## Initializing Notifications

### Basic Setup

```typescript
import { useLoopz, useLoopzAuth } from "@salad-labs/loopz-typescript"

function NotificationManager() {
  const { instance } = useLoopz()
  const { isAuthenticated } = useLoopzAuth()

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize WebSocket connection
      instance.notification.init()

      // Cleanup on unmount
      return () => {
        instance.notification.close()
      }
    }
  }, [isAuthenticated])
}
```

### Connection Events

Monitor WebSocket connection status:

```typescript
function useNotificationConnection() {
  const { instance } = useLoopz()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Connection opened
    const openKey = instance.notification.onOpenConnection((event) => {
      console.log("Notification connection established")
      setIsConnected(true)
    })

    // Connection closed
    const closeKey = instance.notification.onCloseConnection((event) => {
      console.log("Notification connection closed", event.code, event.reason)
      setIsConnected(false)

      // Reconnect logic if needed
      if (event.code !== 1000) {
        // Abnormal closure
        setTimeout(() => {
          instance.notification.init()
        }, 5000)
      }
    })

    // Cleanup
    return () => {
      if (openKey) instance.notification.offOpenConnection(openKey)
      if (closeKey) instance.notification.offCloseConnection(closeKey)
    }
  }, [])

  return isConnected
}
```

## Handling Notifications

### Basic Message Handler

```typescript
function useNotifications() {
  const { instance } = useLoopz()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    const messageKey = instance.notification.onMessage((message) => {
      console.log("New notification:", message)

      // Parse the notification
      const notification = parseNotification(message)

      // Update state
      setNotifications((prev) => [notification, ...prev])

      // Handle different types
      handleNotificationByType(notification)
    })

    return () => {
      if (messageKey) {
        instance.notification.offMessage(messageKey)
      }
    }
  }, [])

  return notifications
}
```

### Type-Specific Handlers

```typescript
function handleNotificationByType(notification: NotificationItem) {
  switch (notification.type) {
    case NotificationType.DEAL:
      handleDealNotification(notification)
      break

    case NotificationType.POST:
      handlePostNotification(notification)
      break

    case NotificationType.ACCOUNT:
      handleAccountNotification(notification)
      break

    case NotificationType.SYSTEM:
      handleSystemNotification(notification)
      break
  }
}

function handleDealNotification(notification: NotificationItem) {
  switch (notification.subType) {
    case NotificationSubType.MAKER_CREATED_DEAL:
      // Someone created a deal
      showToast(`New deal created: ${notification.message}`)
      break

    case NotificationSubType.TAKER_ACCEPTED_DEAL:
      // Your deal was accepted
      showToast(`Deal accepted!`, "success")
      navigateToDeal(notification.operation?.dealId)
      break
  }
}

function handleAccountNotification(notification: NotificationItem) {
  if (notification.subType === NotificationSubType.SOMEONE_FOLLOWED_YOU) {
    showToast(`${notification.user?.username} started following you`)
    updateFollowerCount()
  }
}
```

## Notification UI Components

### Notification Bell

```typescript
function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const notifications = useNotifications()

  useEffect(() => {
    const unread = notifications.filter((n) => n.isUnread).length
    setUnreadCount(unread)
  }, [notifications])

  return (
    <div className="notification-bell">
      <button onClick={() => setShowDropdown(!showDropdown)}>
        <BellIcon />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
```

### Notification List

```typescript
function NotificationList({
  notifications,
}: {
  notifications: NotificationItem[]
}) {
  const groupedNotifications = groupNotificationsByDate(notifications)

  return (
    <div className="notification-list">
      {Object.entries(groupedNotifications).map(([date, items]) => (
        <div key={date}>
          <h3>{formatDate(date)}</h3>
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
}: {
  notification: NotificationItem
}) {
  const icon = getNotificationIcon(notification.type)
  const action = getNotificationAction(notification)

  return (
    <div
      className={`notification-item ${notification.isUnread ? "unread" : ""}`}
      onClick={action}
    >
      <div className="icon">{icon}</div>
      <div className="content">
        <p>{notification.message}</p>
        <time>{formatTime(notification.date)}</time>
      </div>
    </div>
  )
}
```

## Advanced Usage

### Notification Settings

Allow users to configure their notification preferences:

```typescript
function NotificationSettings() {
  const { account } = useLoopzAuth()
  const [settings, setSettings] = useState({
    proposalNotifications: true,
    orderNotifications: true,
    followNotifications: true,
    systemNotifications: true,
  })

  const updateSetting = async (key: string, value: boolean) => {
    try {
      // Update in backend
      await account?.updateSettings(
        `${key}Push` as any, // e.g., 'proposalNotificationPush'
        value
      )

      // Update local state
      setSettings((prev) => ({ ...prev, [key]: value }))

      showToast("Settings updated")
    } catch (error) {
      console.error("Failed to update settings:", error)
    }
  }

  return (
    <div className="notification-settings">
      <h2>Notification Preferences</h2>

      <Toggle
        label="Trade Proposals"
        checked={settings.proposalNotifications}
        onChange={(v) => updateSetting("proposalNotification", v)}
      />

      <Toggle
        label="Order Updates"
        checked={settings.orderNotifications}
        onChange={(v) => updateSetting("orderNotification", v)}
      />

      <Toggle
        label="New Followers"
        checked={settings.followNotifications}
        onChange={(v) => updateSetting("followNotification", v)}
      />

      <Toggle
        label="System Messages"
        checked={settings.systemNotifications}
        onChange={(v) => updateSetting("generalNotification", v)}
      />
    </div>
  )
}
```

### Notification Persistence

Store notifications locally for offline access:

```typescript
function usePersistedNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("notifications")
    if (stored) {
      setNotifications(JSON.parse(stored))
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  // Listen for new notifications
  useEffect(() => {
    const key = instance.notification.onMessage((message) => {
      const notification = parseNotification(message)

      setNotifications((prev) => {
        // Keep only last 100 notifications
        const updated = [notification, ...prev].slice(0, 100)
        return updated
      })
    })

    return () => instance.notification.offMessage(key)
  }, [])

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    )
  }

  const clearAll = () => {
    setNotifications([])
    localStorage.removeItem("notifications")
  }

  return { notifications, markAsRead, clearAll }
}
```

## Error Handling

### Connection Recovery

```typescript
function useResilientNotifications() {
  const { instance } = useLoopz()
  const { isAuthenticated } = useLoopzAuth()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!isAuthenticated) return

    try {
      instance.notification.init()
      reconnectAttempts.current = 0
    } catch (error) {
      console.error("Failed to initialize notifications:", error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    connect()

    const closeKey = instance.notification.onCloseConnection((event) => {
      if (event.code === 1000) return // Normal closure

      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000
        )

        console.log(
          `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`
        )
        setTimeout(connect, delay)
      } else {
        console.error("Max reconnection attempts reached")
        showError("Connection to notification service lost")
      }
    })

    return () => {
      instance.notification.offCloseConnection(closeKey)
      instance.notification.close()
    }
  }, [connect])
}
```

### Error Notifications

```typescript
function NotificationErrorBoundary({ children }: { children: ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes("notification")) {
        setHasError(true)
        setError(event.error)
      }
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  if (hasError) {
    return (
      <div className="notification-error">
        <p>Notification service is temporarily unavailable</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    )
  }

  return children
}
```

## Best Practices

1. **Connection Management**

   - Initialize notifications only after authentication
   - Always clean up connections on component unmount
   - Implement reconnection logic for resilience

2. **Performance**

   - Limit stored notifications (e.g., last 100)
   - Use pagination for notification history
   - Debounce notification updates

3. **User Experience**

   - Show connection status to users
   - Provide clear notification preferences
   - Use sound/vibration for important notifications
   - Group notifications by type/date

4. **Security**
   - Never expose JWT tokens in notifications
   - Validate notification data before rendering
   - Sanitize user-generated content in messages

## Integration with Other Features

### Chat Integration

```typescript
// Show notification when new chat message arrives
function useChatNotifications() {
  const { instance } = useLoopz()

  useEffect(() => {
    instance.chat.on("messageReceived", (message) => {
      // Create a notification
      showNotification({
        title: "New Message",
        body: `${message.user.username}: ${message.content}`,
        icon: message.user.avatarURL,
        onClick: () => navigateToChat(message.conversationId),
      })
    })
  }, [])
}
```

### Trade Notifications

```typescript
// Alert when trade status changes
function useTradeNotifications() {
  const notifications = useNotifications()

  useEffect(() => {
    const tradeNotifications = notifications.filter(
      (n) => n.type === NotificationType.DEAL
    )

    tradeNotifications.forEach((notification) => {
      if (notification.subType === NotificationSubType.TAKER_ACCEPTED_DEAL) {
        // Play success sound
        playSound("success")

        // Show prominent alert
        showAlert({
          type: "success",
          title: "Trade Accepted!",
          message:
            "Your trade has been accepted. Proceed to complete the transaction.",
          action: () => navigateToTrade(notification.operation?.dealId),
        })
      }
    })
  }, [notifications])
}
```

## Next Steps

- Explore [Chat Features](./chat.md) for messaging integration
- Learn about [Trading](./trading.md) for trade notifications
