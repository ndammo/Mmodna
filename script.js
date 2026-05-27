// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================
const API_URL = 'https://serv-production-dbf3.up.railway.app';

// ============================================================
// ОПТИМИЗАЦИЯ: ИНТЕРВАЛЫ ОБНОВЛЕНИЯ
// ============================================================
const UPDATE_INTERVALS = {
    LEADERBOARD: 5 * 60 * 1000,
    MARKETPLACE: 10 * 1000,
    SPECIAL_QUESTS: 5 * 60 * 1000
};

// ============================================================
// ЛОКАЛЬНЫЙ СЧЁТЧИК ДОХОДА
// ============================================================
let localPendingIncome = 0;
let localLastIncomeTime = Date.now();
let localIncomePerHour = 0;
let localTickerInterval = null;
let syncInProgress = false;
let pendingHintTimeout = null;

function startLocalIncomeTicker() {
    if (localTickerInterval) clearInterval(localTickerInterval);
    
    localTickerInterval = setInterval(() => {
        if (document.hidden) return;
        if (localIncomePerHour <= 0) return;
        
        const now = Date.now();
        const elapsedSeconds = (now - localLastIncomeTime) / 1000;
        
        if (elapsedSeconds >= 0.5) {
            const earnedThisTick = (localIncomePerHour / 3600) * elapsedSeconds;
            if (earnedThisTick > 0) {
                localPendingIncome += earnedThisTick;
                localLastIncomeTime = now;
                updateLocalBalance();
                
                if (localPendingIncome > 0.5 && !pendingHintTimeout) {
                    showPendingIncomeHint();
                }
            }
        }
    }, 1000);
}

function showPendingIncomeHint() {
    let hint = document.getElementById('pendingIncomeHint');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'pendingIncomeHint';
        hint.style.cssText = `
            position: fixed; bottom: 80px; left: 50%;
            transform: translateX(-50%);
            background: rgba(34,197,94,0.2);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(34,197,94,0.3);
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 10px;
            color: #22c55e;
            z-index: 50;
            transition: opacity 0.3s;
            pointer-events: none;
            white-space: nowrap;
            font-family: 'Orbitron', monospace;
        `;
        document.body.appendChild(hint);
    }
    hint.textContent = `💰 +${localPendingIncome.toFixed(2)} MMO`;
    hint.style.opacity = '1';
    
    if (pendingHintTimeout) clearTimeout(pendingHintTimeout);
    pendingHintTimeout = setTimeout(() => {
        hint.style.opacity = '0';
    }, 2000);
}

function updateLocalBalance() {
    if (!state.user) return;
    const displayBalance = state.user.balance + localPendingIncome;
    
    const balanceEl = document.getElementById('balanceDisplay');
    if (balanceEl) {
        const oldText = balanceEl.textContent;
        balanceEl.textContent = formatNum(displayBalance);
        if (localPendingIncome > 0.01 && oldText !== balanceEl.textContent) {
            balanceEl.classList.add('pending');
            setTimeout(() => balanceEl.classList.remove('pending'), 500);
        }
    }
    
    const walletBalanceEl = document.getElementById('walletBalance');
    if (walletBalanceEl) walletBalanceEl.textContent = formatNum(displayBalance);
}

async function syncPendingIncome() {
    if (syncInProgress) return;
    if (localPendingIncome < 0.01) return;
    
    syncInProgress = true;
    try {
        const pendingToSync = Math.floor(localPendingIncome * 100) / 100;
        const res = await apiRequest('POST', '/api/game/sync-income', { pendingAmount: pendingToSync });
        
        if (res?.success) {
            state.user.balance = res.balance;
            localPendingIncome = 0;
            localLastIncomeTime = Date.now();
            updateLocalBalance();
            updateHeader();
            const hint = document.getElementById('pendingIncomeHint');
            if (hint) hint.style.opacity = '0';
        }
    } catch (e) {
        console.warn('Sync error:', e);
    } finally {
        syncInProgress = false;
    }
}

setInterval(() => {
    if (localPendingIncome > 0) {
        localStorage.setItem('pendingIncome', localPendingIncome);
        localStorage.setItem('pendingTime', localLastIncomeTime);
    }
}, 10000);

function restorePendingIncome() {
    const saved = localStorage.getItem('pendingIncome');
    if (saved) {
        localPendingIncome = parseFloat(saved);
        localLastIncomeTime = parseInt(localStorage.getItem('pendingTime')) || Date.now();
        localStorage.removeItem('pendingIncome');
        localStorage.removeItem('pendingTime');
    }
}

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================
let intervals = {
    leaderboard: null,
    marketplace: null,
    specialQuests: null
};

let activeQuestTimers = new Map();
let currentLeaderboardController = null;
let isMarketplaceTabActive = false;

// КЭШИ
let creaturesCache = null;
let gameConfigCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000;

let marketplaceCache = { data: null, hash: null, expiresAt: 0 };
let leaderboardCache = { data: null, expiresAt: 0 };

let state = {
    token: null,
    user: null,
    inventory: [],
    incomePerHour: 0,
    adsCooldown: 0,
    isLoading: false,
};

let CREATURES = [];
let CAPSULE_COSTS = { basic: 50, premium: 200 };
let RARITY_WEIGHTS = {
    basic: { common: 80, uncommon: 20, rare: 0, epic: 0, legendary: 0 },
    premium: { common: 60, uncommon: 30, rare: 10, epic: 2, legendary: 1 }
};
let AD_REWARD = 50;
let AD_COOLDOWN = 60;
let UPGRADE_BASE_COST = 100;
let UPGRADE_MULTIPLIER = 1.5;
let MAX_INVENTORY_SLOTS = 50;
let SPECIAL_QUESTS = [];

const RARITY_COLORS = {
    common: '#94a3b8', uncommon: '#22c55e', rare: '#3b82f6',
    epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444'
};
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// ============================================================
// API HELPER
// ============================================================
let pendingRequests = new Map();

async function apiRequest(method, path, body = null, signal = null) {
    const key = `${method}:${path}:${JSON.stringify(body)}`;
    if (pendingRequests.has(key)) return pendingRequests.get(key);
    
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
        signal
    };
    if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
    if (body) opts.body = JSON.stringify(body);
    
    const promise = (async () => {
        try {
            const res = await fetch(API_URL + path, opts);
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('token');
                    state.token = null;
                    showToast('Сессия истекла, войдите заново', '❌');
                }
            }
            return data;
        } catch (e) {
            if (e.name === 'AbortError') return null;
            console.error(`API ${path} error:`, e);
            return { success: false, message: 'Ошибка соединения' };
        } finally {
            setTimeout(() => pendingRequests.delete(key), 100);
        }
    })();
    
    pendingRequests.set(key, promise);
    return promise;
}

// ============================================================
// ЗАГРУЗКА КОНФИГА
// ============================================================
async function loadGameConfig(force = false) {
    const now = Date.now();
    if (!force && gameConfigCache && now - configCacheTime < CONFIG_CACHE_TTL) {
        return gameConfigCache;
    }
    
    const res = await apiRequest('GET', '/api/game/config');
    if (res && res.success) {
        const cfg = res.config;
        CAPSULE_COSTS = cfg.capsuleCosts || { basic: 50, premium: 200 };
        RARITY_WEIGHTS = cfg.capsuleRarities || RARITY_WEIGHTS;
        AD_REWARD = cfg.adReward || 50;
        AD_COOLDOWN = cfg.adCooldown || 60;
        UPGRADE_BASE_COST = cfg.upgradeBaseCost || 100;
        UPGRADE_MULTIPLIER = cfg.upgradeMultiplier || 1.5;
        MAX_INVENTORY_SLOTS = cfg.limits?.maxInventorySlots || 50;
        SPECIAL_QUESTS = cfg.specialQuests || [];
        
        gameConfigCache = { success: true, config: cfg };
        configCacheTime = now;
        return gameConfigCache;
    }
    return gameConfigCache || { success: false };
}

async function loadCreaturesFromServer(force = false) {
    if (!force && creaturesCache) return creaturesCache;
    
    const res = await apiRequest('GET', '/api/game/creatures');
    if (res && res.success && res.creatures) {
        CREATURES = res.creatures;
        creaturesCache = CREATURES;
        return true;
    }
    return false;
}

function getCreature(id) { return CREATURES.find(c => c.id === id); }

function formatNum(n) {
    const absN = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (absN >= 1000000) return sign + (absN/1000000).toFixed(1) + 'M';
    if (absN >= 1000) return sign + (absN/1000).toFixed(1) + 'K';
    return sign + Math.floor(absN).toString();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// UI ФУНКЦИИ
// ============================================================
function updatePlayerInfo() {
    if (!state.user) return;
    const name = state.user.username || state.user.firstName || 'GENOME_X';
    const avatarEl = document.getElementById('playerAvatar');
    const nameEl = document.querySelector('.player-name');
    if (avatarEl) avatarEl.textContent = name[0].toUpperCase();
    if (nameEl) nameEl.textContent = name.toUpperCase();
}

function updateHeader() {
    if (!state.user) return;
    
    let income = 0;
    state.inventory.forEach(item => {
        const c = getCreature(item.creatureId);
        if (c) income += c.incomeBase * item.count;
    });
    state.incomePerHour = income;
    localIncomePerHour = income;
    
    const displayBalance = state.user.balance + localPendingIncome;
    document.getElementById('balanceDisplay').textContent = formatNum(displayBalance);
    document.getElementById('incomeDisplay').textContent = `+${formatNum(income)}/hr`;
    
    const needed = state.user.level * 100;
    document.getElementById('xpLabel').textContent = `XP ${state.user.xp}/${needed}`;
    document.getElementById('xpFill').style.width = `${Math.min(100, (state.user.xp / needed) * 100)}%`;
    document.getElementById('playerLevelLabel').textContent = `LVL ${state.user.level}`;
    
    document.getElementById('walletBalance').textContent = formatNum(displayBalance);
    document.getElementById('walletIncome').textContent = formatNum(income);
    document.getElementById('walletCards').textContent = state.inventory.reduce((s, i) => s + i.count, 0);
    document.getElementById('walletMerges').textContent = state.user.mergeCount || 0;
    
    updateUpgradeButton();
}

function updateUpgradeButton() {
    if (!state.user) return;
    const cost = Math.floor(UPGRADE_BASE_COST * Math.pow(UPGRADE_MULTIPLIER, state.user.inventoryUpgrades || 0));
    const btn = document.getElementById('quickUpgradeBtn');
    const costEl = document.getElementById('upgradeSlotCost');
    if (btn && costEl) {
        costEl.textContent = cost;
        btn.style.opacity = state.user.balance >= cost ? '1' : '0.5';
        btn.disabled = state.user.balance < cost;
    }
}

function getUsedSlots() {
    return state.inventory.reduce((s, i) => s + i.count, 0);
}

function canMerge(creatureId) {
    const item = state.inventory.find(i => i.creatureId === creatureId);
    const c = getCreature(creatureId);
    return item && item.count >= 3 && c && c.rarity !== 'legendary' && c.rarity !== 'mythic';
}

function renderCards() {
    const grid = document.getElementById('cardsGrid');
    if (!grid) return;
    
    if (!state.inventory.length) {
        grid.innerHTML = `<div class="empty-grid"><i class="fa-solid fa-dna"></i>Open a capsule to get your first creature!</div>`;
        document.getElementById('inventorySlots').textContent = `0/${state.user?.inventorySlots || 10}`;
        return;
    }
    
    const sorted = [...state.inventory].sort((a, b) => {
        const ai = RARITY_ORDER.indexOf(getCreature(a.creatureId)?.rarity || 'common');
        const bi = RARITY_ORDER.indexOf(getCreature(b.creatureId)?.rarity || 'common');
        return bi - ai;
    });
    
    grid.innerHTML = sorted.map(item => {
        const c = getCreature(item.creatureId);
        if (!c) return '';
        const canMergeCreature = canMerge(item.creatureId);
        return `<div class="creature-card ${c.rarity}" onclick="onCardClick('${item.creatureId}')">
            ${canMergeCreature ? `<div class="merge-ready-badge">MERGE!</div>` : ''}
            ${item.count > 1 ? `<div class="card-count">${item.count}</div>` : ''}
            <div class="card-icon">${c.icon}</div>
            <div class="card-name">${escapeHtml(c.name)}</div>
            <div class="card-rarity-badge badge-${c.rarity}">${c.rarity}</div>
            <div class="card-income"><i class="fa-solid fa-bolt"></i>${c.incomeBase}/hr</div>
        </div>`;
    }).join('');
    
    document.getElementById('inventorySlots').textContent = `${getUsedSlots()}/${state.user?.inventorySlots || 10}`;
}

function renderTransactions() {
    const list = document.getElementById('txList');
    if (!list) return;
    const txs = state.user?.transactions || [];
    if (!txs.length) {
        list.innerHTML = `<div style="text-align:center;color:var(--text3);padding:20px">No transactions yet</div>`;
        return;
    }
    list.innerHTML = txs.slice(0, 10).map(tx => {
        const isPos = tx.amount > 0;
        const icon = isPos ? '⬆️' : '⬇️';
        const color = isPos ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
        return `<div class="tx-item">
            <div class="tx-icon" style="background:${color}"><span>${icon}</span></div>
            <div class="tx-info">
                <div class="tx-name">${escapeHtml(tx.name)}</div>
                <div class="tx-time">${new Date(tx.time).toLocaleTimeString()}</div>
            </div>
            <div class="tx-amount ${isPos ? 'positive' : 'negative'}">${isPos ? '+' : ''}${tx.amount} MMO</div>
        </div>`;
    }).join('');
}

function renderAll() {
    updateHeader();
    renderCards();
    updateUpgradeButton();
    renderLeaderboard();
    renderSpecialQuests();
    updateFriendRewardButtons();
    renderTransactions();
}

// ============================================================
// ЛИДЕРБОРД
// ============================================================
async function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    if (!state.token) return;
    
    if (Date.now() < leaderboardCache.expiresAt && leaderboardCache.data) {
        renderLeaderboardData(leaderboardCache.data);
        return;
    }
    
    if (currentLeaderboardController) currentLeaderboardController.abort();
    currentLeaderboardController = new AbortController();
    
    const res = await apiRequest('GET', '/api/user/leaderboard', null, currentLeaderboardController.signal);
    if (!res || !res.success) return;
    
    leaderboardCache = { data: res, expiresAt: Date.now() + UPDATE_INTERVALS.LEADERBOARD };
    renderLeaderboardData(res);
    currentLeaderboardController = null;
}

function renderLeaderboardData(data) {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    
    const leaders = data.leaders || [];
    list.innerHTML = leaders.map(l => {
        const rank = l.rank;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        const color = l.isMe ? '#a855f7' : '#94a3b8';
        return `<div class="lb-item ${l.isMe ? 'me' : ''}">
            <div class="lb-rank ${rankClass}">${rankIcon}</div>
            <div class="lb-avatar" style="background:${color}33;border:1px solid ${color}44;color:${color}">${(l.username[0] || '?').toUpperCase()}</div>
            <div class="lb-info">
                <div class="lb-name">${escapeHtml(l.username)} ${l.isMe ? '<span style="font-size:9px;color:#a855f7">(You)</span>' : ''}</div>
                <div class="lb-level">LVL ${l.level}</div>
            </div>
            <div class="lb-score">${formatNum(l.balance)}</div>
        </div>`;
    }).join('');
}

// ============================================================
// МАРКЕТПЛЕЙС
// ============================================================
function getDataHash(data) { return JSON.stringify(data); }

async function renderMarketplaceBuy() {
    const container = document.getElementById('marketplaceListings');
    if (!container) return;
    
    isMarketplaceTabActive = true;
    
    if (Date.now() < marketplaceCache.expiresAt && marketplaceCache.data) {
        renderMarketplaceListings(marketplaceCache.data);
        return;
    }
    
    container.innerHTML = `<div style="text-align:center;color:var(--text2);padding:20px">Loading...</div>`;
    
    const res = await apiRequest('GET', '/api/marketplace/listings');
    if (!res || !res.success) {
        container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px">Error loading listings</div>`;
        return;
    }
    
    const listings = Array.isArray(res.listings) ? res.listings : [];
    const newHash = getDataHash(listings);
    
    if (marketplaceCache.hash === newHash && marketplaceCache.data) {
        marketplaceCache.expiresAt = Date.now() + UPDATE_INTERVALS.MARKETPLACE;
        return;
    }
    
    marketplaceCache = { data: listings, hash: newHash, expiresAt: Date.now() + UPDATE_INTERVALS.MARKETPLACE };
    renderMarketplaceListings(listings);
}

function renderMarketplaceListings(listings) {
    const container = document.getElementById('marketplaceListings');
    if (!container) return;
    
    if (!listings.length) {
        container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px">No listings available</div>`;
        return;
    }
    
    container.innerHTML = listings.map(l => {
        const c = getCreature(l.creatureId);
        if (!c) return '';
        const color = RARITY_COLORS[c.rarity];
        const isOwn = l.sellerTgId === state.user?.telegramId;
        
        return `<div class="marketplace-listing">
            <div class="marketplace-listing-icon" style="background:${color}11;border-color:${color}44">${c.icon}</div>
            <div class="marketplace-listing-info">
                <div class="marketplace-listing-name">${escapeHtml(c.name)}</div>
                <div class="marketplace-listing-seller">by ${escapeHtml(l.sellerName)}${isOwn ? ' (You)' : ''}</div>
                <div class="marketplace-listing-rarity badge-${c.rarity}">${c.rarity}</div>
            </div>
            <div class="marketplace-listing-price">
                <div class="marketplace-listing-amount">${l.price}</div>
                ${isOwn
                    ? `<button class="marketplace-cancel-btn" onclick="cancelMarketplaceListing('${l._id}')">CANCEL</button>`
                    : `<button class="marketplace-buy-btn" onclick="buyFromMarketplace('${l._id}', ${l.price}, '${l.creatureId}')">BUY</button>`
                }
            </div>
        </div>`;
    }).join('');
}

function renderMarketplaceSell() {
    const cards = document.getElementById('marketplaceSellCards');
    if (!cards) return;
    
    if (!state.inventory.length) {
        cards.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:30px">No creatures to sell</div>`;
        return;
    }
    
    cards.innerHTML = state.inventory.map(item => {
        const c = getCreature(item.creatureId);
        if (!c || !item.count) return '';
        return `<div class="marketplace-sell-card" onclick="openSellModal('${item.creatureId}', '${c.name}', ${item.count})">
            <div class="marketplace-sell-card-icon">${c.icon}</div>
            <div class="marketplace-sell-card-name">${escapeHtml(c.name)}</div>
            <div style="font-size:9px;color:var(--text3)">x${item.count}</div>
            <div style="font-size:10px;color:#06b6d4;margin-top:4px">SET PRICE</div>
        </div>`;
    }).join('');
}

async function renderMarketplaceMyListings() {
    const container = document.getElementById('marketplaceMyListings');
    if (!container) return;
    
    const res = await apiRequest('GET', '/api/marketplace/my-listings');
    if (!res || !res.success) {
        container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px">Error</div>`;
        return;
    }
    
    const listings = res.listings || [];
    if (!listings.length) {
        container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px">No active listings</div>`;
        return;
    }
    
    container.innerHTML = listings.map(l => {
        const c = getCreature(l.creatureId);
        if (!c) return '';
        return `<div class="marketplace-my-listing">
            <div class="marketplace-my-listing-icon">${c.icon}</div>
            <div class="marketplace-my-listing-info">
                <div class="marketplace-my-listing-name">${escapeHtml(c.name)}</div>
                <div class="marketplace-my-listing-status">Listed ${new Date(l.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="marketplace-my-listing-price">
                <div class="marketplace-my-listing-amount">${l.price}</div>
                <button class="marketplace-cancel-btn" onclick="cancelMarketplaceListing('${l._id}')">CANCEL</button>
            </div>
        </div>`;
    }).join('');
}

async function cancelMarketplaceListing(listingId) {
    const res = await apiRequest('POST', '/api/marketplace/cancel', { listingId });
    if (res?.success) {
        state.inventory = res.inventory;
        renderCards();
        await refreshMarketplaceAfterAction();
        showToast('Listing cancelled', '✅');
    }
}

async function buyFromMarketplace(listingId, price, creatureId) {
    if ((state.user?.balance || 0) < price) {
        showToast(`Need ${price} MMO`, '❌');
        return;
    }
    await syncPendingIncome();
    
    const res = await apiRequest('POST', '/api/marketplace/buy', { listingId });
    if (res?.success) {
        state.user = res.user;
        state.inventory = res.inventory;
        updateHeader();
        renderCards();
        await refreshMarketplaceAfterAction();
        showToast(`Bought for ${price} MMO!`, '✅');
    }
}

async function refreshMarketplaceAfterAction() {
    marketplaceCache.expiresAt = 0;
    if (isMarketplaceTabActive) await renderMarketplaceBuy();
    await renderMarketplaceMyListings();
    await renderMarketplaceSell();
}

function switchMarketplaceTab(tab) {
    document.querySelectorAll('.marketplace-subtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.marketplace-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`marketplace-${tab}`).classList.add('active');
    
    if (tab === 'buy') renderMarketplaceBuy();
    if (tab === 'sell') renderMarketplaceSell();
    if (tab === 'mylistings') renderMarketplaceMyListings();
}

function openSellModal(creatureId, creatureName, count) {
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div class="popup-title">Sell ${escapeHtml(creatureName)}</div>
        <div style="margin:16px 0">
            <input type="number" id="sellPriceInput" placeholder="Price" min="10" max="100000" value="100" style="width:100%;padding:12px;border-radius:10px;background:#0d1120;border:1px solid #1e2d4a;color:#e2e8f0">
            <div style="margin-top:12px;font-size:12px;color:#94a3b8">Fee: 10%</div>
        </div>
        <button class="popup-btn" onclick="confirmSellListing('${creatureId}')">LIST FOR SALE</button>
        <button class="popup-btn" style="background:#1a2540;margin-top:8px" onclick="closeOverlay()">CANCEL</button>
    `;
    document.getElementById('overlay').classList.add('show');
}

async function confirmSellListing(creatureId) {
    const price = parseInt(document.getElementById('sellPriceInput')?.value || 0);
    if (price < 10) { showToast('Min price 10 MMO', '❌'); return; }
    
    const res = await apiRequest('POST', '/api/marketplace/list', { creatureId, price });
    if (res?.success) {
        state.inventory = res.inventory;
        closeOverlay();
        renderCards();
        await refreshMarketplaceAfterAction();
        showToast('Listed for sale!', '✅');
    }
}

// ============================================================
// СПЕЦ-КВЕСТЫ
// ============================================================
async function renderSpecialQuests() {
    const container = document.getElementById('specialQuestsList');
    if (!container) return;
    await loadGameConfig();
    
    if (!SPECIAL_QUESTS.length) {
        container.innerHTML = `<div class="empty-grid">📢 Нет активных квестов</div>`;
        return;
    }
    
    const completedQuests = new Set(state.user?.completedSpecialQuests || []);
    const filteredQuests = SPECIAL_QUESTS.filter(q => q.isActive);
    
    container.innerHTML = filteredQuests.map(quest => {
        const isCompleted = completedQuests.has(quest.id);
        
        let actionHtml = '';
        if (isCompleted) {
            actionHtml = `<button class="special-quest-btn completed" disabled><i class="fa-solid fa-check"></i> ВЫПОЛНЕНО</button>`;
        } else if (quest.type === 'referral_count') {
            const currentFriends = state.user?.referralCount || 0;
            const required = quest.required_count || 1;
            if (currentFriends >= required) {
                actionHtml = `<button class="special-quest-btn claim" onclick="claimSpecialQuest('${quest.id}')"><i class="fa-solid fa-gift"></i> ЗАБРАТЬ (${currentFriends}/${required})</button>`;
            } else {
                actionHtml = `<button class="special-quest-btn locked" disabled><i class="fa-solid fa-lock"></i> НУЖНО ${required} ДРУЗЕЙ (${currentFriends})</button>`;
            }
        } else {
            actionHtml = `<button class="special-quest-btn" onclick="openChannelAndStartTimer('${quest.id}', '${quest.link}')"><i class="fa-brands fa-telegram"></i> ПЕРЕЙТИ</button>`;
        }
        
        return `<div class="special-quest-card">
            <div class="special-quest-header">
                <div class="special-quest-icon">${quest.icon || '🎯'}</div>
                <div class="special-quest-info">
                    <div class="special-quest-title">${escapeHtml(quest.title)}</div>
                    <div class="special-quest-desc">${escapeHtml(quest.description || '')}</div>
                </div>
                <div class="special-quest-reward">+${quest.reward} MMO</div>
            </div>
            <div class="special-quest-footer">${actionHtml}</div>
        </div>`;
    }).join('');
}

async function claimSpecialQuest(questId) {
    if (state.isLoading) return;
    await syncPendingIncome();
    
    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/complete-special-quest', { questId });
    state.isLoading = false;
    
    if (!res.success) {
        showToast(res.message || 'Ошибка', '❌');
        return;
    }
    
    state.user = res.user;
    updateHeader();
    await renderSpecialQuests();
    showToast(`+${res.reward} MMO`, '✅');
}

function openChannelAndStartTimer(questId, channelLink) {
    if (channelLink && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(channelLink);
    }
    setTimeout(() => claimSpecialQuest(questId), 2000);
}

// ============================================================
// ДРУЗЬЯ
// ============================================================
function updateFriendRewardButtons() {
    const currentFriends = state.user?.referralCount || 0;
    const rewards = [
        { friends: 10, btnId: 'reward-10-btn', cardId: 'reward-10' },
        { friends: 50, btnId: 'reward-50-btn', cardId: 'reward-50' },
        { friends: 150, btnId: 'reward-150-btn', cardId: 'reward-150' }
    ];
    
    rewards.forEach(reward => {
        const btn = document.getElementById(reward.btnId);
        const card = document.getElementById(reward.cardId);
        if (!btn) return;
        
        if (currentFriends >= reward.friends) {
            btn.textContent = '🎁 ЗАБРАТЬ';
            btn.style.background = 'linear-gradient(135deg, #a855f7, #f59e0b)';
            btn.disabled = false;
            if (card) card.style.borderColor = '#f59e0b';
        } else {
            btn.textContent = `🔒 ${reward.friends} ДРУЗЕЙ`;
            btn.style.background = '#1a2540';
            btn.disabled = true;
        }
    });
}

function inviteFriend() {
    const link = `https://t.me/${window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'dna_mmo_bot'}?start=${state.user?.referralCode}`;
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Join DNA MMO!`);
    } else {
        navigator.clipboard.writeText(link);
        showToast('Link copied!', '🔗');
    }
}

// ============================================================
// ДЕЙСТВИЯ
// ============================================================
async function openCapsule(type) {
    if (state.isLoading) return;
    await syncPendingIncome();
    
    const cost = CAPSULE_COSTS[type];
    if ((state.user?.balance || 0) < cost) {
        showToast('Not enough MMO!', '❌');
        return;
    }
    if (getUsedSlots() >= (state.user?.inventorySlots || 10)) {
        showToast('Inventory full! Upgrade storage', '📦');
        return;
    }
    
    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/open-capsule', { type });
    state.isLoading = false;
    
    if (!res.success) {
        showToast(res.message || 'Error', '❌');
        return;
    }
    
    state.user = res.user;
    state.inventory = res.inventory;
    updateHeader();
    renderCards();
    showCapsulePopup(res.creature);
}

async function executeMerge(creatureId) {
    if (state.isLoading) return;
    if (!canMerge(creatureId)) return;
    await syncPendingIncome();
    
    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/merge', { creatureId });
    state.isLoading = false;
    
    if (!res.success) {
        showToast(res.message || 'Merge failed', '❌');
        return;
    }
    
    state.user = res.user;
    state.inventory = res.inventory;
    updateHeader();
    renderCards();
    showMergeResultPopup(res.fromCreature, res.resultCreature, res.upgraded);
}

async function watchAd() {
    if (state.isLoading) return;
    await syncPendingIncome();
    
    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/watch-ad');
    state.isLoading = false;
    
    if (!res.success) {
        showToast(res.message || 'Error', '❌');
        return;
    }
    
    state.user = res.user;
    updateHeader();
    showToast(`+${AD_REWARD} MMO from ad!`, '🎉');
}

async function upgradeInventory() {
    if (state.isLoading) return;
    await syncPendingIncome();
    
    const cost = Math.floor(UPGRADE_BASE_COST * Math.pow(UPGRADE_MULTIPLIER, state.user?.inventoryUpgrades || 0));
    if ((state.user?.balance || 0) < cost) {
        showToast(`Need ${cost} MMO!`, '❌');
        return;
    }
    
    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/upgrade-inventory');
    state.isLoading = false;
    
    if (!res.success) {
        showToast(res.message || 'Error', '❌');
        return;
    }
    
    state.user = res.user;
    updateHeader();
    renderCards();
    showToast(`+1 slot! Now ${state.user.inventorySlots} total`, '📦');
}

// ============================================================
// ПОПАПЫ
// ============================================================
function showCapsuleModal(type) {
    const cost = CAPSULE_COSTS[type];
    const title = type === 'premium' ? 'Premium DNA Capsule' : 'DNA Capsule';
    const canAfford = (state.user?.balance || 0) >= cost;
    
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon" style="filter:drop-shadow(0 0 16px rgba(124,58,237,0.8))">${type === 'premium' ? '💎' : '🧬'}</span>
        <div class="popup-title">${title}</div>
        <div class="popup-subtitle" style="margin-bottom:16px">Cost: <span style="color:#a855f7;font-weight:700">${cost} MMO</span></div>
        <button class="popup-btn" ${!canAfford ? 'disabled style="opacity:0.5"' : ''} onclick="closeOverlay();openCapsule('${type}')">
            ${canAfford ? 'OPEN NOW' : 'NOT ENOUGH MMO'}
        </button>
    `;
    document.getElementById('overlay').classList.add('show');
}

function showCapsulePopup(creature) {
    const c = getCreature(creature.id) || creature;
    const color = RARITY_COLORS[c.rarity];
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${color})">${c.icon}</span>
        <div class="popup-title" style="color:${color}">${escapeHtml(c.name)}</div>
        <div class="popup-subtitle">${escapeHtml(c.desc || '')}</div>
        <div class="popup-stats">
            <div class="popup-stat"><div class="popup-stat-val" style="color:${color}">${c.incomeBase}</div><div class="popup-stat-label">MMO/hr</div></div>
        </div>
        <button class="popup-btn" onclick="closeOverlay()">AWESOME!</button>
    `;
    document.getElementById('overlay').classList.add('show');
}

function showMergeResultPopup(from, to, success) {
    const fromC = getCreature(from.id) || from;
    const toC = getCreature(to.id) || to;
    const color = RARITY_COLORS[toC.rarity];
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div style="display:flex;justify-content:center;gap:12px;margin-bottom:16px">
            <div style="font-size:40px">${fromC.icon}</div>
            <div style="font-size:40px">${fromC.icon}</div>
            <div style="font-size:40px">${fromC.icon}</div>
            <div style="font-size:30px;color:#22c55e">→</div>
            <div style="font-size:40px">${toC.icon}</div>
        </div>
        <div class="popup-title" style="color:${color}">${escapeHtml(toC.name)}</div>
        <div class="popup-subtitle">${success ? '🎉 Evolution successful!' : '⚗️ Mutation!'}</div>
        <button class="popup-btn" onclick="closeOverlay()">CONTINUE</button>
    `;
    document.getElementById('overlay').classList.add('show');
}

function onCardClick(creatureId) {
    const c = getCreature(creatureId);
    if (!c) return;
    const item = state.inventory.find(i => i.creatureId === creatureId);
    const color = RARITY_COLORS[c.rarity];
    const mergeAvailable = canMerge(creatureId);
    
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${color})">${c.icon}</span>
        <div class="popup-title" style="color:${color}">${escapeHtml(c.name)}</div>
        <div class="popup-subtitle">${escapeHtml(c.desc || '')}</div>
        <div class="popup-stats">
            <div class="popup-stat"><div class="popup-stat-val" style="color:${color}">${c.incomeBase}</div><div class="popup-stat-label">MMO/hr</div></div>
            <div class="popup-stat"><div class="popup-stat-val">${item ? item.count : 0}</div><div class="popup-stat-label">Owned</div></div>
        </div>
        ${mergeAvailable ? `<button class="popup-btn" style="background:linear-gradient(135deg,#16a34a,#22c55e)" onclick="closeOverlay();executeMerge('${creatureId}')">MERGE x3</button>` : `<button class="popup-btn" onclick="closeOverlay()">CLOSE</button>`}
    `;
    document.getElementById('overlay').classList.add('show');
}

// ============================================================
// НАВИГАЦИЯ
// ============================================================
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`nav-${tab}`).classList.add('active');
    
    isMarketplaceTabActive = (tab === 'shop');
    
    if (tab === 'leaderboard') renderLeaderboard();
    if (tab === 'special') renderSpecialQuests();
    if (tab === 'shop') renderMarketplaceBuy();
    if (tab === 'wallet') updateHeader();
}

function closeOverlay(e) {
    if (e && e.target !== document.getElementById('overlay')) return;
    document.getElementById('overlay').classList.remove('show');
}

function showToast(msg, icon = '') {
    const t = document.getElementById('toast');
    t.textContent = (icon ? icon + ' ' : '') + msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function showLoadingScreen(show) {
    let el = document.getElementById('loadingScreen');
    if (!el && show) {
        el = document.createElement('div');
        el.id = 'loadingScreen';
        el.style.cssText = `position:fixed;inset:0;background:#080b14;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px`;
        el.innerHTML = `<div style="font-size:48px;animation:float 1.5s infinite">🧬</div><div style="font-family:Orbitron;color:#a855f7">DNA MMO</div><div style="font-size:12px;color:#94a3b8">Loading...</div>`;
        document.body.appendChild(el);
    } else if (el && !show) {
        el.style.transition = 'opacity 0.4s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 400);
    }
}

// ============================================================
// ИНТЕРВАЛЫ
// ============================================================
function startUpdateIntervals() {
    intervals.leaderboard = setInterval(() => {
        if (!document.hidden) renderLeaderboard();
    }, UPDATE_INTERVALS.LEADERBOARD);
    
    intervals.specialQuests = setInterval(() => {
        if (!document.hidden) {
            loadGameConfig(true);
            renderSpecialQuests();
        }
    }, UPDATE_INTERVALS.SPECIAL_QUESTS);
    
    intervals.marketplace = setInterval(() => {
        if (!document.hidden && isMarketplaceTabActive) {
            renderMarketplaceBuy();
        }
    }, UPDATE_INTERVALS.MARKETPLACE);
}

function handleVisibilityChange() {
    if (document.hidden) {
        if (intervals.marketplace) clearInterval(intervals.marketplace);
        intervals.marketplace = null;
    } else {
        if (isMarketplaceTabActive) {
            renderMarketplaceBuy();
            startUpdateIntervals();
        }
        renderLeaderboard();
        renderSpecialQuests();
        syncPendingIncome();
    }
}

// ============================================================
// АВТОРИЗАЦИЯ (Telegram WebApp)
// ============================================================
async function initTelegramApp() {
    showLoadingScreen(true);
    restorePendingIncome();
    
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
    }
    
    let initData = tg?.initData || '';
    
    if (!initData && window.location.hostname === 'localhost') {
        console.warn('⚠️ Dev mode: using mock Telegram user');
        const mockUser = { id: 123456789, first_name: 'Test', username: 'testuser' };
        initData = `user=${encodeURIComponent(JSON.stringify(mockUser))}&hash=devhash`;
    }
    
    if (!initData) {
        showLoadingScreen(false);
        showToast('Открой игру через Telegram!', '⚠️');
        return;
    }
    
    const referralCode = new URLSearchParams(window.location.search).get('ref') ||
                         tg?.initDataUnsafe?.start_param || null;
    
    const loginRes = await apiRequest('POST', '/api/auth/login', { initData, referralCode });
    
    if (!loginRes.success) {
        showLoadingScreen(false);
        showToast(loginRes.message || 'Ошибка авторизации', '❌');
        return;
    }
    
    state.token = loginRes.token;
    localStorage.setItem('token', state.token);
    state.user = loginRes.user;
    state.inventory = loginRes.inventory || [];
    
    await loadGameConfig();
    await loadCreaturesFromServer();
    
    updatePlayerInfo();
    
    const profileRes = await apiRequest('GET', '/api/user/profile');
    if (profileRes.success) {
        state.user = profileRes.user;
        state.inventory = profileRes.inventory || [];
        state.incomePerHour = profileRes.incomePerHour || 0;
        localIncomePerHour = state.incomePerHour;
        
        if (profileRes.offlineEarned > 10) {
            setTimeout(() => showToast(`+${formatNum(profileRes.offlineEarned)} MMO offline!`, '💤'), 1000);
        }
    }
    
    showLoadingScreen(false);
    renderAll();
    
    startLocalIncomeTicker();
    startUpdateIntervals();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    if (loginRes.isNewUser) {
        setTimeout(() => showToast('Welcome! Open a DNA Capsule to start!', '🧬'), 800);
    }
}

// ============================================================
// СТИЛЬ ДЛЯ АНИМАЦИИ
// ============================================================
const style = document.createElement('style');
style.textContent = `
    .balance-amount.pending {
        animation: incomePulse 0.5s ease;
        color: #22c55e;
    }
    @keyframes incomePulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); text-shadow: 0 0 8px #22c55e; }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// ============================================================
// ЗАПУСК
// ============================================================
initTelegramApp();