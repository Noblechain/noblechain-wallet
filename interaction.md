# Noble Chain Wallet Platform - Interaction Design

## Core Interaction Philosophy
Trust Wallet-inspired mobile-first wallet experience with real state changes, internal ledger behavior, and production-grade security flows.

## Authentication & Security Flows

### 1. User Signup Flow
- **Step 1**: Email + password registration form
- **Step 2**: Username selection (unique, becomes wallet identity)
- **Step 3**: Security phrase generation (12 words, Trust Wallet style)
- **Step 4**: Security phrase confirmation (user must select words in correct order)
- **Step 5**: Dashboard access granted

### 2. Security Phrase Management
- **Generation**: 12-word phrase displayed in grid format
- **Confirmation**: Interactive word selection in correct order
- **Backup**: User must write down phrase (wallet-grade messaging)
- **Recovery**: Import wallet via 12-word phrase entry
- **Storage**: Secure hashing, never displayed again after signup

### 3. Authentication System
- **Login**: Email + password authentication
- **Password Reset**: Email-based reset flow
- **Session Management**: Secure session handling
- **Logout**: Clear session data

## Dashboard Interactions

### 4. Portfolio Dashboard
- **Header**: Profile picture + username (top left), notifications (top right)
- **Portfolio Balance Card**: Black card showing total balance, secured by recovery phrase
- **Dollar Wallet Card**: Black card showing USD balance
- **Primary Actions**: Add Money (black button), Send Money (white button with border)
- **Quick Actions**: Horizontal scrollable Pay, Buy, Sell buttons
- **Market Data**: Horizontal scrollable asset cards with prices
- **Transaction History**: Chronological list, color-coded by type

### 5. Asset Management
- **Add Assets**: Search-based asset discovery and addition
- **Asset Details**: Individual asset pages with balance, actions, history
- **Asset Types**: Cryptocurrencies, Stocks, ETFs
- **Remove Assets**: Option to remove assets from dashboard

## Transaction Flows

### 6. Send Money Flow
- **Step 1**: Select recipient (username search)
- **Step 2**: Enter amount
- **Step 3**: Select asset type
- **Step 4**: Confirm transaction
- **Step 5**: Update balances and create ledger entry

### 7. Receive Money Flow
- **Step 1**: Generate receive request
- **Step 2**: Share username with sender
- **Step 3**: Accept incoming transfers
- **Step 4**: Balance updates automatically

### 8. Buy/Sell Flow
- **Asset Selection**: Choose from available assets
- **Amount Entry**: Enter buy/sell amount
- **Price Display**: Current market price (display only)
- **Confirmation**: Review and confirm transaction
- **Execution**: Update balances, create ledger entries

### 9. Swap Functionality
- **Asset Selection**: Choose source and destination crypto assets
- **Amount Entry**: Enter amount to swap
- **Rate Display**: Internal exchange rate
- **Confirmation**: Review swap details
- **Execution**: Deduct source, credit destination, create dual ledger entries

### 10. Add Money Flow
- **Method Selection**: Choose deposit method
- **Processing**: Show "Preparing deposit setup..."
- **Support Routing**: Direct to live support chat
- **Completion**: Support-assisted deposit setup

## Wallet Page Interactions

### 11. Wallet Management
- **Balance Display**: Total crypto balance in black card
- **Asset Search**: Search bar for stocks/crypto/ETFs
- **Asset List**: Boxed layout with icon, name, price, user balance
- **Real-time Updates**: Live balance and price updates
- **Asset Actions**: Tap asset for details, buy, sell, send

## Transaction History

### 12. Transaction Management
- **Chronological List**: All transactions ordered by date
- **Color Coding**: Sent/Pay (red), Received/Buy (green), System (gray/blue)
- **Filter Options**: By asset, action type, date range
- **Detail View**: Tap transaction for full details
- **Export Options**: Transaction history export

## Support System

### 13. Live Support Chat
- **Floating Chat**: Persistent chat bubble
- **Real-time Messaging**: Instant message delivery
- **Admin Response**: Admin can respond in real-time
- **Email Integration**: noblechainhelpdesk@gmail.com
- **Chat History**: Persistent conversation history

## Admin Interactions

### 14. Admin Access
- **Hidden Entry**: 40x40px area, 20-30% opacity, hover to 60%
- **Authentication**: Admin login modal
- **User Management**: View users, balances, transactions
- **Support Console**: Monitor and respond to support chats
- **Balance Editing**: Modify user balances (no logging, only login attempts)

## Navigation System

### 15. Bottom Navigation
- **Home**: Main dashboard
- **Buy/Sell**: Trading hub
- **Swap**: Crypto swap interface
- **Transactions**: Transaction history
- **Wallet**: Asset management

## Data Persistence

### 16. Internal Ledger System
- **Wallet Model**: Wallet ID, asset balances, dollar balance, transaction history
- **Transaction Model**: All transaction types with metadata
- **User Model**: Authentication, profile, security data
- **Real-time Updates**: Instant UI updates on state changes

## Mobile-First Design

### 17. Responsive Interactions
- **Touch Targets**: Minimum 44px touch targets
- **Swipe Gestures**: Horizontal scrolling for asset lists
- **Pull-to-refresh**: Update market data and balances
- **Bottom Sheets**: Action menus from bottom
- **Modal Overlays**: Transaction confirmations and forms

## Error Handling

### 18. User Feedback
- **Loading States**: Progress indicators for all async operations
- **Error Messages**: Clear, actionable error messages
- **Success Confirmations**: Transaction success notifications
- **Validation**: Real-time form validation
- **Network Errors**: Offline state handling