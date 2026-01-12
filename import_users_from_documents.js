(async function(){
  function waitForNobleChain(timeout = 10000){
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check(){
        if (window.nobleChain) return resolve(window.nobleChain);
        if (Date.now() - start > timeout) return reject(new Error('window.nobleChain not available'));
        setTimeout(check, 100);
      })();
    });
  }

  // Embedded users.json data (from c:\\Users\\USER\\Documents\\users.json)
  const importedData = [
    { "name": "Kid1", "email": "kid1@email.com", "balance": 1000 },
    { "name": "Kid2", "email": "kid2@email.com", "balance": 500 }
  ];

  try {
    const nc = await waitForNobleChain();
    let added = 0;
    importedData.forEach(u => {
      if (!u || !u.email) return;
      const usernameBase = (u.name || u.email.split('@')[0] || 'user').toString();
      const username = usernameBase.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
      const exists = nc.users.find(x => x.email === u.email || x.username === username);
      if (!exists) {
        const user = {
          id: nc.generateId(),
          email: u.email,
          username: username,
          passwordHash: nc.hashPassword('password'),
          createdAt: Date.now(),
          lastLogin: null,
          hasLoggedInBefore: true
        };
        nc.users.push(user);
        nc.wallets[user.id] = nc.wallets[user.id] || { userId: user.id, dollarBalance: Number(u.balance) || 0, assets: {} };
        added++;
      }
    });

    if (added > 0) {
      nc.saveUsers();
      nc.saveWallets();
      document.dispatchEvent(new CustomEvent('noblechain:update'));
      alert('Imported ' + added + ' users from local JSON');
    } else {
      console.log('No new users to import from embedded JSON');
    }
  } catch (err) {
    console.error('Import failed:', err);
  }
})();
