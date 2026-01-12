# Noble Chain - Internal Wallet Platform

## Overview
Noble Chain is a production-grade internal wallet platform with real state management, security flows, and professional fintech interface. The platform operates as a closed-loop digital wallet system with no external blockchain integration or real crypto custody.

## Features

### ✅ Core Functionality
- **Real User Authentication**: Email/password signup with username selection
- **Security Phrase System**: 12-word recovery phrase generation and confirmation
- **Internal Ledger**: Real balance tracking and transaction processing
- **Asset Management**: Support for cryptocurrencies, stocks, and ETFs
- **Transaction Processing**: Send, receive, buy, sell, and swap operations
- **Real-time Updates**: Live balance and market price updates
- **Admin Console**: Hidden admin panel with user management
- **Support Chat**: Real-time customer support system

### ✅ Security Features
- Password hashing and secure session management
- Security phrase backup and recovery
- Input validation and sanitization
- Role-based access control (User/Admin)
- Transaction confirmation flows

### ✅ User Experience
- Mobile-first responsive design
- Trust Wallet-inspired interface patterns
- Professional fintech aesthetic (white/black theme)
- Smooth animations and micro-interactions
- Intuitive navigation and flows

## File Structure
```
/
├── index.html              # Authentication and onboarding
├── dashboard.html          # Main wallet dashboard
├── wallet.html            # Asset management
├── transactions.html      # Transaction history
├── swap.html              # Crypto swapping
├── admin.html             # Admin console (hidden access)
├── support.html           # Support chat interface
├── main.js                # Core application logic
├── resources/             # Assets and images
│   ├── hero-wallet.png
│   ├── security-shield.png
│   └── user-avatar.png
└── README.md
```

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Local web server (recommended for proper functionality)

### Installation
1. Extract all files to a web-accessible directory
2. Ensure `main.js` is in the same directory as HTML files
3. Start a local web server:
   ```bash
   python -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser

### Demo Credentials
- **Admin Access**: Username: `admin`, Password: `noblechain2024`
- **Hidden Entry**: Click the 40x40px area at bottom-left of any page

## Usage Guide

### User Registration
1. Click "Create Wallet" on the landing page
2. Enter email, username, and password
3. Save your 12-word security phrase securely
4. Confirm phrase by selecting words in correct order
5. Access your dashboard

### Wallet Operations
- **Add Money**: Contact support via the Add Money flow
- **Send Money**: Send to other users by username
- **Buy/Sell**: Trade assets with real price updates
- **Swap**: Exchange between crypto assets
- **View History**: Complete transaction records with filtering

### Asset Management
- Search and add new assets to your wallet
- View real-time prices and portfolio value
- Manage asset balances and transactions
- Remove assets from your dashboard

### Support System
- Access support chat from any page
- Real-time messaging with admin responses
- Email support: noblechainhelpdesk@gmail.com

## Technical Implementation

### Data Storage
- **LocalStorage**: User sessions and preferences
- **IndexedDB**: Transaction history and user data
- **In-memory**: Real-time state management

### Security Architecture
- Client-side data persistence (no server required)
- Hashed passwords and security phrases
- Session-based authentication
- Input validation and XSS protection

### Market Data
- Simulated real-time price updates
- 16+ crypto and stock assets
- 5-second update intervals
- Realistic price movements

### Admin Features
- Hidden admin console access
- User balance management
- Transaction monitoring
- Support chat management
- System statistics

## Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Considerations
⚠️ **IMPORTANT**: This is a demonstration platform with the following limitations:
- No server-side security (client-side only)
- Simulated authentication (no real password recovery)
- Local storage of sensitive data
- No real blockchain integration
- Demo admin credentials

For production use, implement:
- Server-side authentication and data storage
- Proper encryption and security measures
- Real blockchain integration if needed
- Professional security audit

## Support
For platform support, contact: noblechainhelpdesk@gmail.com

## License
This is a demonstration platform built for educational and testing purposes.