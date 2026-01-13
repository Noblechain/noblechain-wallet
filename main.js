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

    signup(email,password,username){ if(this.users.find(u=>u.email===email)) throw new Error('Email already registered'); if(this.users.find(u=>u.username===username)) throw new Error('Username taken'); const user={id:this.generateId(),email,username,passwordHash:this.hashPassword(password),createdAt:Date.now(),lastLogin:null,hasLoggedInBefore:false}; this.users.push(user); this.saveUsers(); this.wallets[user.id]={userId:user.id,dollarBalance:0,assets:{}}; this.saveWallets(); this.currentUser=user; this.saveSession();
        // Attempt to persist the new user and wallet to Supabase in background (non-blocking)
        try{ this.saveUserToSupabase(user).catch(e=>console.warn('saveUserToSupabase failed',e)); this.saveWalletToSupabase(this.wallets[user.id]).catch(e=>console.warn('saveWalletToSupabase failed',e)); }catch(e){}
        return user; }

    login(email,password,deviceInfo='Unknown'){ const user=this.users.find(u=>u.email===email); if(!user||user.passwordHash!==this.hashPassword(password)){ if(user) this.loginHistory.push({id:this.generateId(),userId:user.id,success:false,device:deviceInfo,timestamp:Date.now()}); this.saveLoginHistory(); throw new Error('Invalid credentials'); } user.lastLogin=Date.now(); this.saveUsers(); this.currentUser=user; this.saveSession(); this.loginHistory.push({id:this.generateId(),userId:user.id,success:true,device:deviceInfo,timestamp:Date.now()}); this.saveLoginHistory(); if(!user.hasLoggedInBefore){ user.hasLoggedInBefore=true; this.saveUsers(); this.sendAdminNotification('new_user',{username:user.username,email:user.email,timestamp:Date.now()}); }
        // Sync last-login info to Supabase in background (non-blocking)
        try{ this.saveUserToSupabase(user).catch(e=>console.warn('saveUserToSupabase failed',e)); }catch(e){}
        return user; }

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

    // Fetch a JSON array of users from a URL (throws on non-200 or invalid JSON)
    async fetchUsers(url){
        const resp = await fetch(url);
        if(!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        if(!Array.isArray(data)) throw new Error('Expected JSON array of users');
        return data;
    }

    // Fetch and merge users into the local store; returns number added
    async fetchAndMergeUsers(url){
        const data = await this.fetchUsers(url);
        let added = 0;
        data.forEach(u=>{
            if(!u || !u.id) return;
            const exists = this.users.find(x => x.id === u.id || x.email === u.email || x.username === u.username);
            if(!exists){
                this.users.push(u);
                this.wallets[u.id] = this.wallets[u.id] || { userId: u.id, dollarBalance: 0, assets: {} };
                added++;
            }
        });
        if(added){ this.saveUsers(); this.saveWallets(); document.dispatchEvent(new CustomEvent('noblechain:update')); }
        return added;
    }

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

    // Support: send a support message. If user sends and no admin online, auto-reply with AI.
    // signature: sendSupportMessage(message, isAdmin=false, senderType='user', userId=null, metadata={})
    sendSupportMessage(message, isAdmin=false, senderType='user', userId=null, metadata={}){
        const targetUserId = userId || this.currentUser?.id || 'admin';
        const c = { id: this.generateId(), userId: targetUserId, message, isAdmin, senderType, timestamp: Date.now() };
        this.supportChats.push(c);
        this.saveSupportChats();
        // notify listeners (admin UI, user UI)
        try{ document.dispatchEvent(new CustomEvent('noblechain:support_update',{ detail: c })); }catch(e){}

        // If a user sent the message and no admin is online, generate an AI response
        if (senderType === 'user') {
            const adminOnline = localStorage.getItem('noblechain_admin_online') === 'true';
            if (!adminOnline) {
                setTimeout(() => {
                    try {
                        // Select calming AI response if metadata requests it
                        const aiText = metadata && metadata.aiTone === 'calming' ? this.generateCalmingResponse(message) : this.generateAIResponse(message);
                        const aiMsg = { id: this.generateId(), userId: targetUserId, message: aiText, isAdmin: false, senderType: 'ai', timestamp: Date.now() };
                        this.supportChats.push(aiMsg);
                        this.saveSupportChats();
                        document.dispatchEvent(new CustomEvent('noblechain:support_update',{ detail: aiMsg }));
                    } catch (err) {
                        console.error('AI response failed', err);
                    }
                }, 1200);
            }
        }

        return c;
    }

    // Calming AI response used when admin wants a reassuring tone for sensitive flows
    generateCalmingResponse(userMessage){
        if(!userMessage) return "Thanks — a support agent will review this shortly and reach out to help. For your safety, we may review transaction patterns before processing.";
        const base = String(userMessage);
        return "Thanks — we received your request. To protect your account and ensure safety, we may review this activity briefly. A support agent will contact you shortly to assist and confirm details. " +
               "If you have any questions, please reply here — we're here to help.";
    }
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

    // Supabase client scaffolding (client-only). Uses session-stored config saved by admin UI.
    async initSupabaseClient(){
        try{
            const cfg = this.supabaseConfig || (function(){ try{ return JSON.parse(sessionStorage.getItem('noblechain_supabase')||'null'); }catch(e){return null;} })();
            if(!cfg || !cfg.url || !cfg.key) return null;

            // Reuse existing client when possible to avoid multiple GoTrue instances
            if(this.supabase && this.supabaseConfig && this.supabaseConfig.url === cfg.url && this.supabaseConfig.key === cfg.key){
                return this.supabase;
            }

            // If UMD build loaded, use window.supabase
            if(window.supabase && typeof window.supabase.createClient === 'function'){
                try{
                    this.supabase = window.supabase.createClient(cfg.url, cfg.key);
                    this.supabaseConfig = cfg;
                    return this.supabase;
                }catch(err){ console.warn('Failed to create supabase client from window.supabase', err); }
            }

            // Try dynamic ESM import of supabase-js if available (handles +esm CDN usage)
            try{
                const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
                if(mod && typeof mod.createClient === 'function'){
                    this.supabase = mod.createClient(cfg.url, cfg.key);
                    this.supabaseConfig = cfg;
                    return this.supabase;
                }
            }catch(err){
                // ignore dynamic import errors but log for debugging
                console.warn('Dynamic ESM import of supabase-js failed', err);
            }

            console.warn('Supabase library not loaded (no UMD window.supabase and dynamic import failed)');
            return null;
        }catch(e){ console.warn('initSupabaseClient error', e); return null; }
    }

    // Pull remote data (users, wallets, transactions, support) and merge into local store
    async fetchRemoteData(){
        const sb = await this.initSupabaseClient();
        if(!sb) throw new Error('Supabase not configured. Use Admin Console Connect.');
        const summary = { users:0, wallets:0, transactions:0, support:0 };
        try{
            const [{ data: rUsers, error: eU }, { data: rWallets, error: eW }, { data: rTx, error: eT }, { data: rSupport, error: eS }] = await Promise.all([
                sb.from('users').select('*').limit(1000),
                sb.from('wallets').select('*').limit(1000),
                sb.from('transactions').select('*').limit(2000),
                sb.from('support').select('*').limit(2000)
            ]);
            if(eU) console.warn('users fetch error', eU);
            if(eW) console.warn('wallets fetch error', eW);
            if(eT) console.warn('transactions fetch error', eT);
            if(eS) console.warn('support fetch error', eS);

            // Merge users (non-destructive: only add missing)
            (rUsers||[]).forEach(u => {
                if(!u || !u.id) return;
                const exists = this.users.find(x=>x.id===u.id || x.email===u.email || x.username===u.username);
                if(!exists){ this.users.push(u); summary.users++; }
            });

            // Merge wallets
            (rWallets||[]).forEach(w => {
                if(!w || !w.userId) return;
                if(!this.wallets[w.userId]){ this.wallets[w.userId] = { userId: w.userId, dollarBalance: w.dollarBalance || 0, assets: w.assets || {} }; summary.wallets++; }
            });

            // Merge transactions
            (rTx||[]).forEach(tx => { if(!tx || !tx.id) return; if(!this.transactions.find(t=>t.id===tx.id)){ this.transactions.push(tx); summary.transactions++; } });

            // Merge support chats
            (rSupport||[]).forEach(s => { if(!s || !s.id) return; if(!this.supportChats.find(x=>x.id===s.id)){ this.supportChats.push(s); summary.support++; } });

            // Persist
            if(summary.users) this.saveUsers();
            if(summary.wallets) this.saveWallets();
            if(summary.transactions) this.saveTransactions();
            if(summary.support) this.saveSupportChats();

            document.dispatchEvent(new CustomEvent('noblechain:update',{ detail: summary }));
            return summary;
        }catch(err){ console.error('fetchRemoteData failed', err); throw err; }
    }

    // Push local arrays to remote (upsert). Be cautious: this is client-side and uses anon keys.
    async pushLocalData(){
        const sb = await this.initSupabaseClient();
        if(!sb) throw new Error('Supabase not configured. Use Admin Console Connect.');
        const results = { users:null, wallets:null, transactions:null, support:null };
        try{
            // Upsert users
            if(Array.isArray(this.users) && this.users.length>0){
                const { data, error } = await sb.from('users').upsert(this.users);
                if(error) console.warn('users upsert error', error); results.users = { data, error };
            }

            if(this.wallets && Object.keys(this.wallets).length>0){
                // Convert wallet map to array for upsert
                const arr = Object.values(this.wallets).map(w => ({ userId: w.userId, dollarBalance: w.dollarBalance, assets: w.assets }));
                const { data, error } = await sb.from('wallets').upsert(arr);
                if(error) console.warn('wallets upsert error', error); results.wallets = { data, error };
            }

            if(Array.isArray(this.transactions) && this.transactions.length>0){
                // upsert transactions individually via helper to get per-item results
                const txPromises = this.transactions.map(tx => this.saveTransactionToSupabase(tx).then(d=>({ data: d })).catch(e=>({ error: e })));
                const txResults = await Promise.all(txPromises);
                results.transactions = txResults;
            }

            if(Array.isArray(this.supportChats) && this.supportChats.length>0){
                // upsert support chat messages individually via helper
                const spPromises = this.supportChats.map(s => this.saveSupportToSupabase(s).then(d=>({ data: d })).catch(e=>({ error: e })));
                const spResults = await Promise.all(spPromises);
                results.support = spResults;
            }

            return results;
        }catch(err){ console.error('pushLocalData failed', err); throw err; }
    }

    // Upsert a single user record to Supabase (returns data or throws)
    async saveUserToSupabase(user){
        // Schema-adaptive upsert: iteratively remove remote-missing columns returned by PostgREST and retry
        try{
            if(!user || !user.id) throw new Error('Invalid user');
            const sb = await this.initSupabaseClient();
            if(!sb) throw new Error('Supabase not configured');

            // only safe fields (no passwordHash)
            let payload = {
                id: user.id,
                email: user.email,
                username: user.username,
                createdAt: user.createdAt || Date.now(),
                lastLogin: user.lastLogin || null,
                hasLoggedInBefore: !!user.hasLoggedInBefore
            };

            const maxAttempts = 6;
            let attempt = 0;

            while(attempt < maxAttempts){
                attempt++;
                try{
                    const res = await sb.from('users').upsert(payload, { onConflict: 'id' });
                    if(res.error) throw res.error;
                    return res.data;
                }catch(err){
                    const msg = (err && (err.message || err.msg || JSON.stringify(err))) || '';
                    const colMatch = msg.match(/Could not find the '([^']+)' column of 'users' in the schema cache|Could not find the '([^']+)' column/);
                    const col = colMatch ? (colMatch[1]||colMatch[2]) : null;
                    if(col && Object.prototype.hasOwnProperty.call(payload, col)){
                        console.warn('Remote schema missing column', col, '— removing and retrying (attempt', attempt, ')');
                        delete payload[col];
                        continue;
                    }
                    // If remote DB complains about ON CONFLICT because there's no unique constraint,
                    // fall back to a manual upsert: check existence then update or insert.
                    if(err && (err.code === '42P10' || (msg && msg.includes('no unique or exclusion constraint')))){
                        try{
                            console.warn('Remote missing unique constraint — performing manual upsert for user', payload.id);
                            const sel = await sb.from('users').select('id').eq('id', payload.id).limit(1);
                            if(sel && sel.error) throw sel.error;
                            const exists = Array.isArray(sel.data) ? sel.data.length>0 : !!sel.data;
                            if(exists){
                                const upd = await sb.from('users').update(payload).eq('id', payload.id);
                                if(upd && upd.error) throw upd.error;
                                return upd.data;
                            } else {
                                const ins = await sb.from('users').insert(payload);
                                if(ins && ins.error) throw ins.error;
                                return ins.data;
                            }
                        }catch(innerErr){
                            throw innerErr;
                        }
                    }
                    // If table missing or other error, rethrow to surface
                    throw err;
                }
            }
            throw new Error('Failed to upsert user after multiple attempts due to remote schema differences');
        }catch(err){ console.warn('saveUserToSupabase error', err); throw err; }
    }

    // Upsert a single wallet record to Supabase (assets as JSON)
    async saveWalletToSupabase(wallet){
        try{
            if(!wallet || !wallet.userId) throw new Error('Invalid wallet');
            const sb = await this.initSupabaseClient();
            if(!sb) throw new Error('Supabase not configured');
            const payload = {
                userId: wallet.userId,
                dollarBalance: wallet.dollarBalance || 0,
                assets: wallet.assets || {}
            };
            const { data, error } = await sb.from('wallets').upsert(payload, { onConflict: 'userId' });
            if(error) throw error;
            return data;
        }catch(err){ console.warn('saveWalletToSupabase error', err); throw err; }
    }

    // Upsert a single transaction record to Supabase
    async saveTransactionToSupabase(tx){
        // Attempts to upsert a transaction; if the remote table lacks columns,
        // iteratively remove offending fields and retry (up to a limit).
        try{
            if(!tx || !tx.id) throw new Error('Invalid transaction');
            const sb = await this.initSupabaseClient();
            if(!sb) throw new Error('Supabase not configured');

            let payload = Object.assign({}, tx, { metadata: tx.metadata || null });
            const maxAttempts = 6;
            let attempt = 0;

            while(attempt < maxAttempts){
                attempt++;
                try{
                    const res = await sb.from('transactions').upsert(payload, { onConflict: 'id' });
                    if(res.error) throw res.error;
                    return res.data;
                }catch(err){
                    const msg = (err && (err.message || err.msg || JSON.stringify(err))) || '';
                    // Detect PostgREST missing-column error messages (PGRST204)
                    const colMatch = msg.match(/Could not find the '([^']+)' column of 'transactions' in the schema cache|Could not find the '([^']+)' column/);
                    const col = colMatch ? (colMatch[1]||colMatch[2]) : null;
                    if(col && Object.prototype.hasOwnProperty.call(payload, col)){
                        console.warn('Remote schema missing column', col, '— removing and retrying (attempt', attempt, ')');
                        delete payload[col];
                        // continue loop to retry
                        continue;
                    }
                    // If error indicates table missing (PGRST205) or not a missing-column, rethrow
                    throw err;
                }
            }
            throw new Error('Failed to upsert transaction after multiple attempts due to remote schema differences');
        }catch(err){ console.warn('saveTransactionToSupabase error', err); throw err; }
    }

    // Upsert a single support chat message to Supabase
    async saveSupportToSupabase(msg){
        // Schema-adaptive upsert for support messages (iteratively remove missing columns)
        try{
            if(!msg || !msg.id) throw new Error('Invalid support message');
            const sb = await this.initSupabaseClient();
            if(!sb) throw new Error('Supabase not configured');

            let payload = Object.assign({}, msg);
            const maxAttempts = 6; let attempt = 0;
            while(attempt < maxAttempts){
                attempt++;
                try{
                    const res = await sb.from('support').upsert(payload, { onConflict: 'id' });
                    if(res.error) throw res.error;
                    return res.data;
                }catch(err){
                    const msgErr = (err && (err.message || err.msg || JSON.stringify(err))) || '';
                    const colMatch = msgErr.match(/Could not find the '([^']+)' column of 'support' in the schema cache|Could not find the '([^']+)' column/);
                    const col = colMatch ? (colMatch[1]||colMatch[2]) : null;
                    if(col && Object.prototype.hasOwnProperty.call(payload, col)){
                        console.warn('Remote schema missing column', col, '— removing and retrying (attempt', attempt, ')');
                        delete payload[col];
                        continue;
                    }
                    // if error indicates table missing (PGRST205) or other, rethrow
                    throw err;
                }
            }
            throw new Error('Failed to upsert support message after multiple attempts due to remote schema differences');
        }catch(err){ console.warn('saveSupportToSupabase error', err); throw err; }
    }

    // Subscribe to Supabase realtime changes for core tables and merge them locally.
    async subscribeToChanges(tables = ['users','wallets','transactions','support']){
        try{
            if(this._supabaseSubscriptions && this._supabaseSubscriptions.length>0){ console.warn('Already subscribed to realtime changes'); return this._supabaseSubscriptions; }
            const sb = await this.initSupabaseClient();
            if(!sb) throw new Error('Supabase not configured. Use Admin Console Connect.');

            this._supabaseSubscriptions = [];

            tables.forEach(tbl => {
                try{
                    // Use Supabase JS v2 realtime channel with postgres_changes
                    const channel = sb.channel(`realtime:${tbl}`);
                    channel.on('postgres_changes', { event: '*', schema: 'public', table: tbl }, (payload) => {
                        try{ this._handleRealtimePayload(tbl, payload); }catch(e){ console.warn('handleRealtime error', e); }
                    });
                    // subscribe() returns a Promise-like object; keep the channel for unsubscribe
                    channel.subscribe();
                    this._supabaseSubscriptions.push({ table: tbl, channel });
                }catch(e){ console.warn('subscribe error for', tbl, e); }
            });

            console.log('Subscribed to realtime tables:', tables.join(','));
            return this._supabaseSubscriptions;
        }catch(err){ console.error('subscribeToChanges failed', err); throw err; }
    }

    // Unsubscribe any active Supabase realtime subscriptions
    unsubscribeSupabaseSubscriptions(){
        try{
            if(!this._supabaseSubscriptions || this._supabaseSubscriptions.length===0) return;
            this._supabaseSubscriptions.forEach(entry => {
                try{
                    const ch = entry.channel || entry.sub;
                    if(!ch) return;
                    // v2 channel unsubscribe
                    if(typeof ch.unsubscribe === 'function') ch.unsubscribe();
                    // also attempt legacy removal methods
                    else if(typeof ch.remove === 'function') ch.remove();
                }catch(e){ console.warn('unsubscribe error', e); }
            });
            this._supabaseSubscriptions = [];
            console.log('Unsubscribed from Supabase realtime');
        }catch(e){ console.warn('unsubscribeSupabaseSubscriptions error', e); }
    }

    // Internal handler to merge realtime payloads into local state
    _handleRealtimePayload(table, payload){
        // payload may contain different shapes depending on supabase client version
        const event = payload.event || payload.eventType || payload.type || (payload.new ? 'INSERT' : payload.old ? 'UPDATE' : 'UNKNOWN');
        const record = payload.new || payload.record || payload.current || payload.data || null;
        const old = payload.old || payload.previous || null;

        if(!record && !old) return;

        if(table === 'users'){
            if(event === 'DELETE' || event === 'delete'){
                this.users = this.users.filter(u => u.id !== (old?.id || record?.id));
            } else {
                const idx = this.users.findIndex(u => u.id === record.id);
                if(idx >= 0) this.users[idx] = Object.assign({}, this.users[idx], record);
                else this.users.push(record);
            }
            this.saveUsers();
            document.dispatchEvent(new CustomEvent('noblechain:update',{ detail: { table:'users' } }));
            return;
        }

        if(table === 'wallets'){
            const userId = record.userId || (old && old.userId);
            if(!userId) return;
            if(event === 'DELETE' || event === 'delete'){
                delete this.wallets[userId];
            } else {
                // Ensure assets is an object (remote may send JSON string)
                const assets = (typeof record.assets === 'string') ? (function(){ try{ return JSON.parse(record.assets); }catch(e){return {}; } })() : (record.assets || {});
                this.wallets[userId] = Object.assign({}, this.wallets[userId] || { userId, dollarBalance:0, assets:{} }, { dollarBalance: record.dollarBalance || 0, assets });
            }
            this.saveWallets();
            document.dispatchEvent(new CustomEvent('noblechain:update',{ detail: { table:'wallets' } }));
            return;
        }

        if(table === 'transactions'){
            if(event === 'DELETE' || event === 'delete'){
                this.transactions = this.transactions.filter(t => t.id !== (old?.id || record?.id));
            } else {
                const idx = this.transactions.findIndex(t => t.id === record.id);
                if(idx >= 0) this.transactions[idx] = Object.assign({}, this.transactions[idx], record);
                else this.transactions.push(record);
            }
            this.saveTransactions();
            document.dispatchEvent(new CustomEvent('noblechain:update',{ detail: { table:'transactions' } }));
            return;
        }

        if(table === 'support'){
            if(event === 'DELETE' || event === 'delete'){
                this.supportChats = this.supportChats.filter(s => s.id !== (old?.id || record?.id));
            } else {
                const idx = this.supportChats.findIndex(s => s.id === record.id);
                if(idx >= 0) this.supportChats[idx] = Object.assign({}, this.supportChats[idx], record);
                else this.supportChats.push(record);
            }
            this.saveSupportChats();
            document.dispatchEvent(new CustomEvent('noblechain:support_update',{ detail: record }));
            return;
        }
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

