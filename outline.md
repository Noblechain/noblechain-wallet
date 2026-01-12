# Noble Chain Platform Architecture

## File Structure

```
/mnt/okcomputer/output/
├── index.html                 # Landing page with signup/login
├── dashboard.html             # Main dashboard with portfolio
├── wallet.html               # Wallet management page
├── transactions.html          # Transaction history
├── swap.html                 # Crypto swap interface
├── security.html             # Security phrase setup/confirmation
├── admin.html                # Admin panel (hidden)
├── support.html              # Support chat interface
├── main.js                   # Core application logic
├── resources/                # Assets directory
│   ├── icons/               # Asset icons (crypto, stocks, ETFs)
│   ├── images/              # UI images and backgrounds
│   └── data/                # Mock data files
└── README.md               # Platform documentation
```

## Page Architecture

### 1. index.html - Authentication Hub
**Purpose**: User signup, login, and initial wallet creation
**Key Sections**:
- Landing hero with Noble Chain branding
- Signup form (email, password, username)
- Login form (email, password)
- Password reset flow
- Security phrase generation (post-signup)
- Security phrase confirmation

**Interactive Components**:
- Form validation with real-time feedback
- Security phrase word selection grid
- Progress indicators for onboarding
- Typewriter effect for security messaging

### 2. dashboard.html - Main Dashboard
**Purpose**: Primary wallet interface with portfolio overview
**Key Sections**:
- Header: Profile picture + username, notifications
- Portfolio Balance Card: Total balance, security message
- Dollar Wallet Card: USD balance
- Primary Actions: Add Money, Send Money
- Quick Actions: Pay, Buy, Sell (horizontal scroll)
- Market Data: Asset cards with prices (horizontal scroll)
- Transaction History: Chronological list
- Bottom Navigation: Home, Buy/Sell, Swap, Transactions, Wallet

**Interactive Components**:
- Balance cards with subtle animations
- Action buttons with state changes
- Horizontal scrolling asset lists
- Transaction list with filtering
- Real-time balance updates

### 3. wallet.html - Asset Management
**Purpose**: Comprehensive asset portfolio management
**Key Sections**:
- Header: "My Wallet" title
- Crypto Balance Card: Total wallet value
- Search Bar: Asset search functionality
- Asset List: Boxed layout with icons, names, prices, balances
- Add Asset Button: Search and add new assets

**Interactive Components**:
- Real-time search filtering
- Asset detail modals
- Add/remove asset functionality
- Balance updates
- Asset-specific actions (buy, sell, send)

### 4. transactions.html - Transaction History
**Purpose**: Complete transaction record with filtering
**Key Sections**:
- Header: "Transactions" title
- Filter Controls: By date, asset, action type
- Transaction List: Chronological with color coding
- Transaction Details: Expandable detail view

**Interactive Components**:
- Advanced filtering system
- Transaction detail expansion
- Export functionality
- Color-coded transaction types
- Search within transactions

### 5. swap.html - Crypto Exchange
**Purpose**: Internal cryptocurrency swapping
**Key Sections**:
- Header: "Swap Assets" title
- From Asset: Source asset selection and amount
- To Asset: Destination asset selection
- Exchange Rate: Internal rate display
- Confirmation: Transaction preview

**Interactive Components**:
- Asset dropdown selectors
- Amount input with validation
- Rate calculation display
- Confirmation modal
- Balance updates post-swap

### 6. security.html - Security Management
**Purpose**: Security phrase backup and recovery
**Key Sections**:
- Security Phrase Display: 12-word grid (signup)
- Confirmation Flow: Word order verification
- Backup Instructions: Security best practices
- Recovery Mode: Import existing wallet

**Interactive Components**:
- Word selection grid
- Drag-and-drop confirmation
- Progress tracking
- Security warnings and tips
- Recovery phrase validation

### 7. admin.html - Admin Console
**Purpose**: User and system management (hidden access)
**Key Sections**:
- User Management: View all users and balances
- Transaction Monitor: All transactions view
- Support Chat: Real-time support interface
- Balance Editor: User balance modification
- System Stats: Platform overview

**Interactive Components**:
- Hidden entry point (40x40px, low opacity)
- Admin authentication modal
- Real-time user data tables
- Support chat interface
- Balance edit forms

### 8. support.html - Customer Support
**Purpose**: Live support chat system
**Key Sections**:
- Chat Interface: Message display and input
- User Context: Current user info and history
- Admin Panel: Support agent interface
- Message History: Persistent conversation log

**Interactive Components**:
- Real-time messaging
- File attachment support
- Typing indicators
- Message status (sent, delivered, read)
- Admin response interface

## Core Application Logic (main.js)

### Data Models
```javascript
// User Model
{
  id: string,
  email: string,
  username: string,
  passwordHash: string,
  securityPhraseHash: string,
  profilePicture: string,
  createdAt: timestamp,
  lastLogin: timestamp
}

// Wallet Model
{
  userId: string,
  dollarBalance: number,
  assets: {
    [assetId]: {
      balance: number,
      averageCost: number
    }
  },
  totalValue: number
}

// Transaction Model
{
  id: string,
  userId: string,
  type: 'send'|'receive'|'buy'|'sell'|'swap'|'add_money',
  asset: string,
  amount: number,
  counterparty: string,
  timestamp: timestamp,
  status: 'pending'|'completed'|'failed',
  metadata: object
}
```

### Key Functions
- **Authentication**: signup, login, password reset, session management
- **Security**: phrase generation, confirmation, hashing, recovery
- **Transactions**: send, receive, buy, sell, swap, balance updates
- **Asset Management**: add assets, update prices, calculate totals
- **Admin**: user management, balance editing, support chat
- **Real-time Updates**: WebSocket-like updates for balances and messages

### Storage System
- **LocalStorage**: User session, temporary data, UI preferences
- **IndexedDB**: Transaction history, asset data, user profiles
- **In-memory**: Real-time state management, active sessions

## Navigation Flow

### User Journey
1. **Landing** → Signup/Login → Security Setup → Dashboard
2. **Dashboard** → Any action → Return to Dashboard
3. **Wallet** → Asset selection → Actions → Confirmations
4. **Transactions** → Filter/Search → Detail view
5. **Swap** → Asset selection → Confirmation → Balance update

### Bottom Navigation
- **Home**: dashboard.html
- **Buy/Sell**: Integrated into dashboard actions
- **Swap**: swap.html
- **Transactions**: transactions.html
- **Wallet**: wallet.html

## Security Implementation

### Authentication Flow
1. Email/password signup with validation
2. Username selection (unique identifier)
3. 12-word security phrase generation
4. Phrase confirmation (word order verification)
5. Hash storage (never plain text)
6. Session management with secure tokens

### Transaction Security
- Confirmation modals for all transactions
- Balance validation before processing
- Audit trail for all state changes
- Rate limiting for transaction frequency
- Admin override capabilities

### Data Protection
- No sensitive data in URLs or localStorage
- Input sanitization and validation
- XSS and CSRF protection
- Secure session handling
- Encrypted sensitive data storage

## Real-time Features

### Live Updates
- Balance changes (transactions, swaps)
- Market price updates (simulated)
- Support chat messages
- Notification delivery

### State Synchronization
- Cross-tab session management
- Real-time balance updates
- Transaction status changes
- Admin console updates

This architecture ensures Noble Chain operates as a fully functional internal wallet platform with production-grade security, real-time updates, and professional fintech interface standards.