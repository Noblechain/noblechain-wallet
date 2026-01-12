// Clean, single-file NobleChain client model
class NobleChain {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('noblechain_users') || '[]');
        this.wallets = JSON.parse(localStorage.getItem('noblechain_wallets') || '{}');
        this.transactions = JSON.parse(localStorage.getItem('noblechain_transactions') || '[]');
        this.supportChats = JSON.parse(localStorage.getItem('noblechain_support') || '[]');
        this.loginHistory = JSON.parse(localStorage.getItem('noblechain_login_history') || '[]');
        this.marketData = this.generateMarketData();
        // If there are no users in storage, seed demo data for local testing
        if (!this.users || this.users.length === 0) {
            this.seedDemoData(3);
        }
        this.init();
    }

    init() { this.checkSession(); this.startMarketUpdates(); }

    // Basic persistence helpers
    saveUsers() { localStorage.setItem('noblechain_users', JSON.stringify(this.users)); }
    saveWallets() { localStorage.setItem('noblechain_wallets', JSON.stringify(this.wallets)); }
    saveTransactions() { localStorage.setItem('noblechain_transactions', JSON.stringify(this.transactions)); }
    saveSupportChats() { localStorage.setItem('noblechain_support', JSON.stringify(this.supportChats)); }
    saveLoginHistory() { localStorage.setItem('noblechain_login_history', JSON.stringify(this.loginHistory)); }

    generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
    hashPassword(p){ return btoa(String(p)).split('').reverse().join(''); }

    formatCurrency(amount, decimals = 2) {
        const val = Number(amount) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(val);
    }

    formatNumber(amount, decimals = 4) {
        const val = Number(amount) || 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(val);
    }

    saveSession(){ if(this.currentUser) localStorage.setItem('noblechain_session', JSON.stringify({userId:this.currentUser.id,ts:Date.now()})); }
    checkSession(){ try{ const s = JSON.parse(localStorage.getItem('noblechain_session')||'null'); if(s){ const u = this.users.find(x=>x.id===s.userId); if(u){ this.currentUser=u; return true; } } }catch(e){} return false; }

    signup(email,password,username){ if(this.users.find(u=>u.email===email)) throw new Error('Email already registered'); if(this.users.find(u=>u.username===username)) throw new Error('Username taken'); const user={id:this.generateId(),email,username,passwordHash:this.hashPassword(password),createdAt:Date.now(),lastLogin:null,hasLoggedInBefore:false}; this.users.push(user); this.saveUsers(); this.wallets[user.id]={userId:user.id,dollarBalance:0,assets:{}}; this.saveWallets(); this.currentUser=user; this.saveSession(); return user; }

    login(email,password,deviceInfo='Unknown'){ const user=this.users.find(u=>u.email===email); if(!user||user.passwordHash!==this.hashPassword(password)){ if(user) this.loginHistory.push({id:this.generateId(),userId:user.id,success:false,device:deviceInfo,timestamp:Date.now()}); this.saveLoginHistory(); throw new Error('Invalid credentials'); } user.lastLogin=Date.now(); this.saveUsers(); this.currentUser=user; this.saveSession(); this.loginHistory.push({id:this.generateId(),userId:user.id,success:true,device:deviceInfo,timestamp:Date.now()}); this.saveLoginHistory(); if(!user.hasLoggedInBefore){ user.hasLoggedInBefore=true; this.saveUsers(); this.sendAdminNotification('new_user',{username:user.username,email:user.email,timestamp:Date.now()}); } return user; }

    logout(){ this.currentUser=null; localStorage.removeItem('noblechain_session'); window.location.href='index.html'; }

    // PINs
    createPinEntry(userId){ const s=JSON.parse(localStorage.getItem('noblechain_pins')||'{}'); s[userId]={userId,pinHash:null,mustSetPin:true,createdAt:Date.now()}; localStorage.setItem('noblechain_pins',JSON.stringify(s)); }
    setTransferPin(userId,pin){ if(!/^\d{4,6}$/.test(pin)) throw new Error('Invalid PIN'); const s=JSON.parse(localStorage.getItem('noblechain_pins')||'{}'); if(!s[userId]) throw new Error('PIN setup required'); s[userId].pinHash=this.hashPassword(pin); s[userId].mustSetPin=false; s[userId].lastUpdated=Date.now(); localStorage.setItem('noblechain_pins',JSON.stringify(s)); const u=this.users.find(x=>x.id===userId); if(u){u.transferPinHash=s[userId].pinHash; this.saveUsers(); } this.sendEmailNotification(userId,'pin_changed',{timestamp:Date.now()}); }
    verifyTransferPin(userId,pin){ const s=JSON.parse(localStorage.getItem('noblechain_pins')||'{}'); const d=s[userId]; if(!d||!d.pinHash) throw new Error('Transfer PIN not set'); const ok=this.hashPassword(pin)===d.pinHash; if(!ok){ this.sendEmailNotification(userId,'pin_failed',{timestamp:Date.now()}); throw new Error('Invalid Transfer PIN'); } return true; }

    // Wallet helpers
    getWallet(userId=null){ const id=userId||this.currentUser?.id; return this.wallets[id]||null; }
    getTotalBalance(userId=null){ const w=this.getWallet(userId); if(!w) return 0; let t=w.dollarBalance||0; Object.entries(w.assets||{}).forEach(([k,v])=>{ t+= (v.balance||0)*(this.marketData[k]?.price||0); }); return t; }
    addAsset(userId,assetId){ const w=this.getWallet(userId); if(!w) return; if(!w.assets[assetId]){ w.assets[assetId]={balance:0,averageCost:0}; this.saveWallets(); } }
    getWalletAddress(userId,assetId){ const clean=String(assetId).replace(/[^a-z0-9]/ig,'').toUpperCase(); const uh=btoa(String(userId)).slice(0,8); return `NBL-${clean}-${uh}-${this.generateId().slice(0,4)}`; }

    // Transactions + notifications
    createTransaction(type,asset,amount,counterparty=null,userId=null,metadata={}){ const tx={id:this.generateId(),userId:userId||this.currentUser?.id,type,asset,amount,counterparty,timestamp:Date.now(),status:'completed',metadata}; this.transactions.push(tx); this.saveTransactions(); try{ this.addNotification(`Transaction: ${type.replace(/_/g,' ')}`, `${amount} ${asset}${counterparty? ' — '+counterparty:''}`, 'transaction'); }catch(e){} return tx; }
    addNotification(title,message,type='info'){ try{ const note={id:this.generateId(),title,message,type,timestamp:Date.now(),read:false}; const list=JSON.parse(localStorage.getItem('noblechain_notifications')||'[]'); list.unshift(note); if(list.length>100) list.splice(100); localStorage.setItem('noblechain_notifications',JSON.stringify(list)); document.dispatchEvent(new CustomEvent('noblechain:notification',{detail:note})); return note;}catch(e){console.warn(e);return null;} }

    // Market
    generateMarketData(){
        // Expanded market catalogue with simple demo prices, logos and colors
        const md = {
            'BTC':{ symbol:'BTC', name:'Bitcoin', price:45000, change: 1.2, color:'#f7931a' },
            'ETH':{ symbol:'ETH', name:'Ethereum', price:3000, change:-0.4, color:'#627eea' },
            'USDT':{ symbol:'USDT', name:'Tether', price:1, change:0.0, color:'#26a17b' },
            'LTC':{ symbol:'LTC', name:'Litecoin', price:150, change:0.5, color:'#b8b8b8' },
            'ADA':{ symbol:'ADA', name:'Cardano', price:0.45, change:2.1, color:'#0033ad' },
            'SOL':{ symbol:'SOL', name:'Solana', price:100, change:3.4, color:'#00FFA3' },
              'DOT':{ symbol:'DOT', name:'Polkadot', price:6.5, change:-1.0, color:'#e6007a', logo:'resources/icons/DOT.svg' },
              'XRP':{ symbol:'XRP', name:'XRP', price:0.6, change:-0.2, color:'#346aa9', logo:'resources/icons/XRP.svg' },
              'DOGE':{ symbol:'DOGE', name:'Dogecoin', price:0.12, change:5.6, color:'#ba9f33', logo:'resources/icons/DOGE.svg' },
              'BNB':{ symbol:'BNB', name:'Binance Coin', price:350, change:0.8, color:'#f3ba2f', logo:'resources/icons/BNB.svg' },
              'SHIB':{ symbol:'SHIB', name:'Shiba Inu', price:0.00001, change:12.0, color:'#f97316', logo:'resources/icons/SHIB.svg' },
              'AVAX':{ symbol:'AVAX', name:'Avalanche', price:25, change:-0.6, color:'#e84142', logo:'resources/icons/AVAX.svg' },
              'MATIC':{ symbol:'MATIC', name:'Polygon', price:1.2, change:0.9, color:'#8247e5', logo:'resources/icons/MATIC.svg' },
              'LINK':{ symbol:'LINK', name:'Chainlink', price:7.5, change:-0.3, color:'#2a5ada', logo:'resources/icons/LINK.svg' },
              'UNI':{ symbol:'UNI', name:'Uniswap', price:6.0, change:1.8, color:'#ff3e8d', logo:'resources/icons/UNI.svg' },
              // A few stocks for demo
              'AAPL':{ symbol:'AAPL', name:'Apple Inc.', price:170, change:0.4, color:'#666666', logo:'resources/icons/AAPL.svg' },
              'TSLA':{ symbol:'TSLA', name:'Tesla Inc.', price:230, change:-2.2, color:'#cc0000', logo:'resources/icons/TSLA.svg' },
              'AMZN':{ symbol:'AMZN', name:'Amazon.com', price:130, change:0.7, color:'#ff9900', logo:'resources/icons/AMZN.svg' }
        };

        // Generate a small inline SVG logo for each entry (simple text-based mark)
        Object.keys(md).forEach(key => {
            const s = (md[key].symbol || key).toString();
            const short = s.substring(0,2);
            const color = md[key].color || '#000000';
            // simple SVG with centered text; text color white to contrast background
            md[key].logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="${md[key].name}"><rect width="24" height="24" rx="6" fill="${color}"/><text x="12" y="16" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" text-anchor="middle" fill="#ffffff">${short}</text></svg>`;
        });

        return md;
    }
    startMarketUpdates(){ setInterval(()=>{ Object.values(this.marketData).forEach(d=>d.price*=(1+(Math.random()-0.5)*0.02)); document.dispatchEvent(new CustomEvent('noblechain:market_update')); },5000); }

    // Admin helpers
    getAllUsers(){ return this.users; }
    getAllTransactions(){ return this.transactions; }

    // Seed demo data for local testing when no users exist
    seedDemoData(count = 3) {
        for (let i = 1; i <= count; i++) {
            const username = `demo_user_${i}`;
            const email = `demo${i}@example.com`;
            const password = 'password';
            const user = {
                id: this.generateId(),
                email,
                username,
                passwordHash: this.hashPassword(password),
                createdAt: Date.now() - i * 86400000,
                lastLogin: Date.now() - i * 3600000,
                hasLoggedInBefore: true
            };
            this.users.push(user);
            this.wallets[user.id] = { userId: user.id, dollarBalance: 1000 * i, assets: { 'BTC': { balance: 0.01 * i, averageCost: 40000 } } };
            this.transactions.push({ id: this.generateId(), userId: user.id, type: 'receive', asset: 'USD', amount: 1000 * i, timestamp: Date.now() - i * 3600000, status: 'completed' });
        }
        this.saveUsers();
        this.saveWallets();
        this.saveTransactions();
        console.log(`Seeded ${count} demo users for NobleChain.`);
    }

    // Support
    sendSupportMessage(message,isAdmin=false,senderType='user'){ const c={id:this.generateId(),userId:this.currentUser?.id||'admin',message,isAdmin,senderType,timestamp:Date.now()}; this.supportChats.push(c); this.saveSupportChats(); return c; }
    getSupportChats(userId=null){ return userId? this.supportChats.filter(c=>c.userId===userId): this.supportChats; }

    // Simple AI-like response generator for demo chat; synchronous and lightweight
    generateAIResponse(userMessage){
        if(!userMessage) return "Thanks for reaching out — we'll get back to you shortly.";
        const msg = String(userMessage).toLowerCase();
        if(msg.includes('balance')) return "You can view your balances on the dashboard. If something looks wrong, contact support with details.";
        if(msg.includes('send') || msg.includes('transfer')) return "To send funds, open Send Money from your dashboard and enter the recipient's username and amount.";
        if(msg.includes('fees')) return "Our platform charges minimal network fees for crypto transfers; internal USD transfers are instant and fee-free in this demo.";
        return "Thanks for your message. A support agent will reply soon. For quick help, include your username and a short description.";
    }

    // Simple internal sendMoney implementation for demo purposes
    sendMoney(recipientUsername, amount){
        if(!this.currentUser) throw new Error('Not signed in');
        const amt = Number(amount);
        if(isNaN(amt) || amt <= 0) throw new Error('Invalid amount');
        const senderId = this.currentUser.id;
        const recipient = this.users.find(u=>u.username===recipientUsername);
        if(!recipient) throw new Error('Recipient not found');

        const senderWallet = this.getWallet(senderId) || { dollarBalance:0, assets:{} };
        const recipientWallet = this.getWallet(recipient.id) || { dollarBalance:0, assets:{} };

        if((senderWallet.dollarBalance || 0) < amt) throw new Error('Insufficient balance');

        senderWallet.dollarBalance = (senderWallet.dollarBalance || 0) - amt;
        recipientWallet.dollarBalance = (recipientWallet.dollarBalance || 0) + amt;

        this.wallets[senderId] = senderWallet;
        this.wallets[recipient.id] = recipientWallet;
        this.saveWallets();

        const txOut = this.createTransaction('send','USD',amt,recipientUsername,senderId,{direction:'outgoing'});
        const txIn = this.createTransaction('receive','USD',amt,this.currentUser.username,recipient.id,{direction:'incoming'});

        this.addNotification('Transfer Sent', `You sent $${amt} to ${recipientUsername}`, 'transaction');
        this.addNotification('Transfer Received', `${this.currentUser.username} sent you $${amt}`, 'transaction');

        // dispatch update events so UI can refresh
        document.dispatchEvent(new CustomEvent('noblechain:update'));
        return { txOut, txIn };
    }
    getEmailSubject(type) {
        const subjects = {
            login_success: 'Successful Login to Noble Chain',
            new_device_login: 'New Device Login Detected',
            password_reset: 'Password Reset Request',
            transfer_sent: 'Transfer Sent Successfully',
            transfer_received: 'Transfer Received',
            pin_changed: 'Transfer PIN Changed',
            new_user: 'New User Registration'
        };
        return subjects[type] || 'Noble Chain Notification';
    }

    getEmailBody(type, username, data) {
        const bodies = {
            login_success: `Hello ${username},\n\nYou have successfully logged in to your Noble Chain account on ${new Date(data?.timestamp || Date.now()).toLocaleString()}.\n\nDevice: ${data?.deviceInfo || 'Unknown'}\n\nIf you did not initiate this login, please contact support immediately.\n\nBest regards,\nNoble Chain Security Team`,
            transfer_sent: `Hello ${username},\n\nYou have sent ${data?.amount || 'N/A'} ${data?.asset || ''} to ${data?.recipient || 'a recipient'} on ${new Date(data?.timestamp || Date.now()).toLocaleString()}.\nTransaction ID: ${data?.transactionId || 'N/A'}\n\nIf you did not authorize this transaction, please contact support immediately.\n\nRegards,\nNoble Chain`,
            transfer_received: `Hello ${username},\n\nYou have received ${data?.amount || 'N/A'} ${data?.asset || ''} from ${data?.sender || 'a sender'} on ${new Date(data?.timestamp || Date.now()).toLocaleString()}.\nTransaction ID: ${data?.transactionId || 'N/A'}\n\nRegards,\nNoble Chain`,
            pin_changed: `Hello ${username},\n\nYour transfer PIN was changed on ${new Date(data?.timestamp || Date.now()).toLocaleString()}. If this was not you, please contact support immediately.\n\nRegards,\nNoble Chain Security Team`,
            new_user: `Hello ${username || 'Admin'},\n\nA new user has registered: ${data?.username || 'N/A'} (${data?.email || 'N/A'}) on ${new Date(data?.timestamp || Date.now()).toLocaleString()}.`,
            default: `Hello ${username || ''},\n\nThis is a notification from Noble Chain.\n\nRegards,\nNoble Chain Team`
        };
        return bodies[type] || bodies['default'];
    }

    getAdminEmailBody(type, data) {
        switch (type) {
            case 'new_user':
                return `New user registration:\nUsername: ${data?.username || 'N/A'}\nEmail: ${data?.email || 'N/A'}\nTimestamp: ${new Date(data?.timestamp || Date.now()).toLocaleString()}`;
            case 'suspicious_activity':
                return `Suspicious activity detected:\nDetails: ${JSON.stringify(data || {})}`;
            default:
                return `Admin alert - ${type}: ${JSON.stringify(data || {})}`;
        }
    }

}

// Instantiate the app and expose it globally so UI pages can interact
try {
    if (!window.nobleChain || !(window.nobleChain instanceof NobleChain)) {
        window.nobleChain = new NobleChain();
    }
} catch (e) {
    console.error('Failed to initialize NobleChain app', e);
}

