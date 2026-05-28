// ============================================================
// CONFIG
// ============================================================
const API_URL = 'https://serv-production-dbf3.up.railway.app';

// ============================================================
// ЛОКАЛЬНЫЙ ТИКЕР ДОХОДА (0 ЗАПРОСОВ К СЕРВЕРУ!)
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
        balanceEl.textContent = formatNum(displayBalance);
        if (localPendingIncome > 0.01) {
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
    adsTimer: null,
    specialQuests: null,
    leaderboard: null,
    marketplace: null
};

let activeQuestTimers = new Map();
let currentLeaderboardController = null;
let isMarketplaceTabActive = false;

let leaderboardCache = { data: null, expiresAt: 0 };
let marketplaceCache = { data: null, hash: null, expiresAt: 0 };
let pendingRequests = new Map();

// ============================================================
// API REQUEST
// ============================================================
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
            if (!res.ok && (res.status === 401 || res.status === 403)) {
                localStorage.removeItem('token');
                state.token = null;
                showToast('Сессия истекла', '❌');
            }
            return data;
        } catch (e) {
            if (e.name === 'AbortError') return null;
            showToast('Ошибка соединения', '❌');
            return { success: false };
        } finally {
            setTimeout(() => pendingRequests.delete(key), 100);
        }
    })();
    
    pendingRequests.set(key, promise);
    return promise;
}

// ============================================================
// GAME DATA
// ============================================================
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
let SPECIAL_QUESTS = [];

const RARITY_COLORS = {
    common: '#94a3b8', uncommon: '#22c55e', rare: '#3b82f6',
    epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444'
};
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

let state = {
    token: null,
    user: null,
    inventory: [],
    incomePerHour: 0,
    adsCooldown: 0,
    isLoading: false,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function getCreature(id) { return CREATURES.find(c => c.id === id); }
function formatNum(n) {
    const absN = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (absN >= 1000000) return sign + (absN/1000000).toFixed(1) + 'M';
    if (absN >= 1000) return sign + (absN/1000).toFixed(1) + 'K';
    return sign + Math.floor(absN).toString();
}
function getUsedSlots() { return state.inventory.reduce((s, i) => s + i.count, 0); }
function getUpgradeCost() { return Math.floor(UPGRADE_BASE_COST * Math.pow(UPGRADE_MULTIPLIER, state.user?.inventoryUpgrades || 0)); }
function canMerge(creatureId) {
    const item = state.inventory.find(i => i.creatureId === creatureId);
    const c = getCreature(creatureId);
    return item && item.count >= 3 && c && c.rarity !== 'legendary' && c.rarity !== 'mythic';
}
function getLevelTitle(lvl) {
    if (lvl >= 20) return 'God Scientist';
    if (lvl >= 15) return 'DNA Master';
    if (lvl >= 10) return 'Geneticist';
    if (lvl >= 5) return 'Lab Expert';
    return 'Researcher';
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function loadGameConfig() {
    const res = await apiRequest('GET', '/api/game/config');
    if (res?.success) {
        const cfg = res.config;
        CAPSULE_COSTS = cfg.capsuleCosts || { basic: 50, premium: 200 };
        RARITY_WEIGHTS = cfg.capsuleRarities || RARITY_WEIGHTS;
        AD_REWARD = cfg.adReward || 50;
        AD_COOLDOWN = cfg.adCooldown || 60;
        UPGRADE_BASE_COST = cfg.upgradeBaseCost || 100;
        UPGRADE_MULTIPLIER = cfg.upgradeMultiplier || 1.5;
        SPECIAL_QUESTS = cfg.specialQuests || [];
        return true;
    }
    return false;
}

async function loadCreaturesFromServer() {
    const res = await apiRequest('GET', '/api/game/creatures');
    if (res?.success && res.creatures) {
        CREATURES = res.creatures;
        return true;
    }
    return false;
}

// ============================================================
// TELEGRAM WEBAPP INIT
// ============================================================
async function initTelegramApp() {
    showLoadingScreen(true);
    restorePendingIncome();

    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); }

    let initData = tg?.initData || '';

    if (!initData && window.location.hostname === 'localhost') {
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

    if (!loginRes?.success) {
        showLoadingScreen(false);
        showToast(loginRes?.message || 'Ошибка авторизации', '❌');
        return;
    }

    state.token = loginRes.token;
    state.user = loginRes.user;
    state.inventory = loginRes.inventory || [];

    await loadGameConfig();
    await loadCreaturesFromServer();

    updatePlayerInfo();

    const profileRes = await apiRequest('GET', '/api/user/profile');
    if (profileRes?.success) {
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
    startOptimizedIntervals();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (loginRes.isNewUser) {
        setTimeout(() => showToast('Welcome! Open a DNA Capsule to start!', '🧬'), 800);
    }
}

function startOptimizedIntervals() {
    intervals.leaderboard = setInterval(() => {
        if (!document.hidden) renderLeaderboard();
    }, 5 * 60 * 1000);
    
    intervals.specialQuests = setInterval(() => {
        if (!document.hidden) {
            loadGameConfig();
            renderSpecialQuests();
        }
    }, 5 * 60 * 1000);
    
    intervals.marketplace = setInterval(() => {
        if (!document.hidden && isMarketplaceTabActive) {
            renderMarketplaceBuy();
        }
    }, 10 * 1000);
    
    intervals.adsTimer = setInterval(updateAdsTimer, 1000);
}

function handleVisibilityChange() {
    if (document.hidden) {
        if (intervals.marketplace) clearInterval(intervals.marketplace);
        intervals.marketplace = null;
    } else {
        if (isMarketplaceTabActive) {
            renderMarketplaceBuy();
            intervals.marketplace = setInterval(() => {
                if (!document.hidden && isMarketplaceTabActive) renderMarketplaceBuy();
            }, 10 * 1000);
        }
        renderLeaderboard();
        renderSpecialQuests();
        syncPendingIncome();
    }
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
// UI UPDATE
// ============================================================
function updatePlayerInfo() {
    if (!state.user) return;
    const name = state.user.username || state.user.firstName || 'GENOME_X';
    const avatarEl = document.getElementById('playerAvatar');
    const nameEl = document.querySelector('.player-name');
    if (avatarEl) avatarEl.textContent = name[0].toUpperCase();
    if (nameEl) nameEl.textContent = name.toUpperCase();
}

function renderAll() {
    updateHeader();
    renderCards();
    updateUpgradeButton();
    renderLeaderboard();
    renderSpecialQuests();
    updateFriendRewardButtons();
}

function updateHeader() {
    if (!state.user) return;
    const u = state.user;

    let income = 0;
    state.inventory.forEach(item => {
        const c = getCreature(item.creatureId);
        if (c) income += c.incomeBase * item.count;
    });
    state.incomePerHour = income;
    localIncomePerHour = income;

    const displayBalance = u.balance + localPendingIncome;
    document.getElementById('balanceDisplay').textContent = formatNum(displayBalance);
    document.getElementById('incomeDisplay').textContent = `+${formatNum(income)}/hr`;

    const needed = u.level * 100;
    document.getElementById('xpLabel').textContent = `XP ${u.xp}/${needed}`;
    document.getElementById('xpFill').style.width = `${Math.min(100, (u.xp / needed) * 100)}%`;
    document.getElementById('playerLevelLabel').textContent = `LVL ${u.level} · ${getLevelTitle(u.level)}`;

    document.getElementById('walletBalance').textContent = formatNum(displayBalance);
    document.getElementById('walletIncome').textContent = formatNum(income);
    document.getElementById('walletCards').textContent = state.inventory.reduce((s, i) => s + i.count, 0);
    document.getElementById('walletMerges').textContent = u.mergeCount || 0;
    document.getElementById('walletStorage').textContent = `${getUsedSlots()}/${u.inventorySlots}`;

    updateUpgradeButton();
    renderTransactions();

    const friendCountDisplay = document.getElementById('friendCountDisplay');
    if (friendCountDisplay) friendCountDisplay.textContent = `${state.user.referralCount || 0} friends invited`;
}

function updateUpgradeButton() {
    if (!state.user) return;
    const cost = getUpgradeCost();
    const btn = document.getElementById('quickUpgradeBtn');
    const costEl = document.getElementById('upgradeSlotCost');
    if (btn && costEl) {
        costEl.textContent = cost;
        const canAfford = state.user.balance >= cost;
        btn.style.opacity = canAfford ? '1' : '0.5';
        btn.disabled = !canAfford;
    }
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
        const merge = canMerge(item.creatureId);
        return `<div class="creature-card ${c.rarity}" onclick="onCardClick('${item.creatureId}')">
            ${merge ? `<div class="merge-ready-badge">MERGE!</div>` : ''}
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
        list.innerHTML = `<div style="text-align:center;color:#4a5568;padding:20px">No transactions yet</div>`;
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

// ============================================================
// PARTICLES
// ============================================================
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * 1000, y: Math.random() * 1000,
            r: Math.random() * 1.5 + 0.3,
            vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.1,
            alpha: Math.random() * 0.4 + 0.1,
            color: Math.random() > 0.5 ? '124,58,237' : '6,182,212'
        });
    }
    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
            if (p.x < -5) p.x = W + 5;
            if (p.x > W + 5) p.x = -5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
})();

// ============================================================
// CAPSULE
// ============================================================
let lastCapsuleOpen = 0;

function showCapsuleModal(type) {
    const odds = RARITY_WEIGHTS[type];
    const cost = CAPSULE_COSTS[type];
    const title = type === 'premium' ? 'Premium DNA Capsule' : 'DNA Capsule';
    const canAfford = (state.user?.balance + localPendingIncome) >= cost;

    const oddsHtml = Object.entries(odds).filter(([_, pct]) => pct > 0).map(([r, pct]) => {
        const color = RARITY_COLORS[r];
        return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="flex:1;font-size:12px;font-weight:600;color:${color};text-transform:uppercase">${r}</div>
            <div style="width:100px;height:6px;background:#1e2d4a;border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${color}"></div>
            </div>
            <div style="width:35px;text-align:right;color:${color}">${pct}%</div>
        </div>`;
    }).join('');

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon">${type === 'premium' ? '💎' : '🧬'}</span>
        <div class="popup-title">${title}</div>
        <div class="popup-subtitle">Cost: ${cost} MMO</div>
        <div style="background:#0d1120;border-radius:12px;padding:14px;margin:16px 0">${oddsHtml}</div>
        <button class="popup-btn" ${!canAfford ? 'disabled' : ''} onclick="closeOverlay();openCapsule('${type}')">
            ${canAfford ? 'OPEN NOW' : 'NOT ENOUGH MMO'}
        </button>
    `;
    document.getElementById('overlay').classList.add('show');
}

async function openCapsule(type) {
    if (state.isLoading) return;
    await syncPendingIncome();
    
    if (Date.now() - lastCapsuleOpen < 2000) {
        showToast('Слишком быстро! Подождите 2 секунды.', '⏳');
        return;
    }
    lastCapsuleOpen = Date.now();

    if ((state.user?.balance || 0) < CAPSULE_COSTS[type]) {
        showToast('Not enough MMO!', '❌'); return;
    }
    if (getUsedSlots() >= (state.user?.inventorySlots || 10)) {
        showToast('Inventory full!', '📦'); return;
    }

    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/open-capsule', { type });
    state.isLoading = false;

    if (!res?.success) {
        showToast(res?.message || 'Error', '❌'); return;
    }

    state.user = res.user;
    state.inventory = res.inventory;
    localIncomePerHour = state.incomePerHour;
    updateHeader();
    renderCards();
    showCapsulePopup(res.creature);
}

function showCapsulePopup(creature) {
    const c = getCreature(creature.id) || creature;
    const color = RARITY_COLORS[c.rarity];
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon">${c.icon}</span>
        <div class="popup-title" style="color:${color}">${escapeHtml(c.name)}</div>
        <div class="popup-subtitle">${escapeHtml(c.desc || '')}</div>
        <div class="popup-rarity" style="background:${color}22;color:${color}">${c.rarity.toUpperCase()}</div>
        <button class="popup-btn" onclick="closeOverlay()">AWESOME!</button>
    `;
    document.getElementById('overlay').classList.add('show');
    spawnStars(c.rarity);
}

// ============================================================
// CARD CLICK & MERGE
// ============================================================
let lastMergeTime = 0;

function onCardClick(creatureId) {
    const c = getCreature(creatureId);
    if (!c) return;
    const item = state.inventory.find(i => i.creatureId === creatureId);
    const color = RARITY_COLORS[c.rarity];
    const mergeAvailable = canMerge(creatureId);

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon">${c.icon}</span>
        <div class="popup-title" style="color:${color}">${escapeHtml(c.name)}</div>
        <div class="popup-stats">
            <div class="popup-stat"><div class="popup-stat-val">${c.incomeBase}</div><div>MMO/hr</div></div>
            <div class="popup-stat"><div class="popup-stat-val">${item?.count || 0}</div><div>Owned</div></div>
        </div>
        ${mergeAvailable ? `<button class="popup-btn" style="background:#22c55e" onclick="closeOverlay();showMergePreview('${creatureId}')">MERGE x3</button>` : `<button class="popup-btn" onclick="closeOverlay()">CLOSE</button>`}
    `;
    document.getElementById('overlay').classList.add('show');
}

function showMergePreview(creatureId) {
    const creature = getCreature(creatureId);
    if (!creature || creature.rarity === 'legendary') return;

    const nextRarity = RARITY_ORDER[RARITY_ORDER.indexOf(creature.rarity) + 1] || creature.rarity;
    const nextCreature = CREATURES.find(c => c.name === creature.name && c.rarity === nextRarity) || creature;

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div class="popup-title">Merge 3x ${escapeHtml(creature.name)}</div>
        <div style="display:flex;justify-content:center;gap:16px;margin:16px 0">
            <span style="font-size:32px">${creature.icon}</span>
            <span style="font-size:32px">${creature.icon}</span>
            <span style="font-size:32px">${creature.icon}</span>
            <span style="font-size:32px">→</span>
            <span style="font-size:32px">${nextCreature.icon}</span>
        </div>
        <div style="margin-bottom:16px;font-size:12px">30% chance to evolve to ${nextCreature.name}</div>
        <button class="popup-btn" style="background:#22c55e" onclick="closeOverlay();executeMerge('${creatureId}')">MERGE NOW</button>
        <button class="popup-btn" style="background:#1a2540;margin-top:8px" onclick="closeOverlay()">CANCEL</button>
    `;
    document.getElementById('overlay').classList.add('show');
}

async function executeMerge(creatureId) {
    if (state.isLoading || !canMerge(creatureId)) return;
    await syncPendingIncome();
    
    if (Date.now() - lastMergeTime < 1000) {
        showToast('Слишком быстро!', '⏳');
        return;
    }
    lastMergeTime = Date.now();

    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/merge', { creatureId });
    state.isLoading = false;

    if (!res?.success) {
        showToast(res?.message || 'Merge failed', '❌');
        return;
    }

    state.user = res.user;
    state.inventory = res.inventory;
    localIncomePerHour = state.incomePerHour;
    updateHeader();
    renderCards();
    showMergeResultPopup(res.resultCreature, res.upgraded);
}

function showMergeResultPopup(creature, success) {
    const color = RARITY_COLORS[creature.rarity];
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon">${creature.icon}</span>
        <div class="popup-title" style="color:${color}">${escapeHtml(creature.name)}</div>
        <div class="popup-subtitle">${success ? '🎉 Evolution!' : '⚗️ Mutation!'}</div>
        <button class="popup-btn" onclick="closeOverlay()">CONTINUE</button>
    `;
    document.getElementById('overlay').classList.add('show');
    if (success) spawnStars(creature.rarity);
}

// ============================================================
// UPGRADE & ADS
// ============================================================
async function upgradeInventory() {
    if (state.isLoading) return;
    await syncPendingIncome();
    
    const cost = getUpgradeCost();
    if ((state.user?.balance || 0) < cost) {
        showToast(`Need ${cost} MMO`, '❌');
        return;
    }

    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/upgrade-inventory');
    state.isLoading = false;

    if (res?.success) {
        state.user = res.user;
        updateHeader();
        renderCards();
        showToast(`+1 slot! Now ${state.user.inventorySlots} total`, '📦');
    }
}

async function watchAd() {
    if (state.isLoading) return;
    await syncPendingIncome();

    if (state.adsCooldown > 0) {
        showToast(`Ad in ${state.adsCooldown}s`, '⏳');
        return;
    }

    showToast('Watching ad...', '📺');
    await new Promise(r => setTimeout(r, 2000));

    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/watch-ad');
    state.isLoading = false;

    if (res?.success) {
        state.user = res.user;
        state.adsCooldown = AD_COOLDOWN;
        updateHeader();
        showToast(`+${AD_REWARD} MMO!`, '🎉');
    } else {
        showToast(res?.message || 'Error', '❌');
    }
}

function updateAdsTimer() {
    if (state.user?.adsCooldownUntil) {
        const secondsLeft = Math.ceil((new Date(state.user.adsCooldownUntil) - Date.now()) / 1000);
        state.adsCooldown = Math.max(0, secondsLeft);
    }

    const btn = document.getElementById('adsBtn');
    const timer = document.getElementById('adsTimer');
    const reward = document.getElementById('adsReward');
    
    if (state.adsCooldown > 0) {
        state.adsCooldown--;
        if (btn) { btn.style.opacity = '0.5'; btn.disabled = true; }
        if (timer) timer.textContent = `${state.adsCooldown}s`;
        if (reward) reward.textContent = '';
    } else {
        if (btn) { btn.style.opacity = '1'; btn.disabled = false; }
        if (timer) timer.textContent = 'Ready';
        if (reward) reward.textContent = `+${AD_REWARD}`;
    }
}

// ============================================================
// LEADERBOARD
// ============================================================
async function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    if (!list || !state.token) return;
    
    if (Date.now() < leaderboardCache.expiresAt && leaderboardCache.data) {
        renderLeaderboardData(leaderboardCache.data);
        return;
    }

    if (currentLeaderboardController) currentLeaderboardController.abort();
    currentLeaderboardController = new AbortController();

    const res = await apiRequest('GET', '/api/user/leaderboard', null, currentLeaderboardController.signal);
    if (!res?.success) return;
    
    leaderboardCache = { data: res, expiresAt: Date.now() + 5 * 60 * 1000 };
    renderLeaderboardData(res);
}

function renderLeaderboardData(data) {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    
    list.innerHTML = (data.leaders || []).map(l => {
        const rank = l.rank;
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        const color = l.isMe ? '#a855f7' : '#94a3b8';
        return `<div class="lb-item ${l.isMe ? 'me' : ''}">
            <div class="lb-rank">${rankIcon}</div>
            <div class="lb-avatar" style="background:${color}33;color:${color}">${(l.username[0] || '?').toUpperCase()}</div>
            <div class="lb-info"><div class="lb-name">${escapeHtml(l.username)}${l.isMe ? ' (You)' : ''}</div><div class="lb-level">LVL ${l.level}</div></div>
            <div class="lb-score">${formatNum(l.balance)}</div>
        </div>`;
    }).join('');
}

// ============================================================
// MARKETPLACE
// ============================================================
function switchMarketplaceTab(tab) {
    document.querySelectorAll('.marketplace-subtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.marketplace-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`marketplace-${tab}`).classList.add('active');
    document.querySelector(`.marketplace-tab-btn[onclick*="${tab}"]`)?.classList.add('active');
    
    isMarketplaceTabActive = true;
    if (tab === 'buy') renderMarketplaceBuy();
    if (tab === 'sell') renderMarketplaceSell();
    if (tab === 'mylistings') renderMarketplaceMyListings();
}

async function renderMarketplaceBuy() {
    const container = document.getElementById('marketplaceListings');
    if (!container) return;
    
    if (Date.now() < marketplaceCache.expiresAt && marketplaceCache.data) {
        renderMarketplaceListings(marketplaceCache.data);
        return;
    }
    
    container.innerHTML = '<div style="padding:20px;color:#94a3b8">Loading...</div>';
    const res = await apiRequest('GET', '/api/marketplace/listings');
    if (!res?.success) {
        container.innerHTML = '<div style="padding:30px;color:#4a5568">Error loading</div>';
        return;
    }

    const listings = res.listings || [];
    const newHash = JSON.stringify(listings);
    
    if (marketplaceCache.hash !== newHash) {
        marketplaceCache = { data: listings, hash: newHash, expiresAt: Date.now() + 10000 };
    }
    renderMarketplaceListings(listings);
}

function renderMarketplaceListings(listings) {
    const container = document.getElementById('marketplaceListings');
    if (!container) return;
    
    if (!listings.length) {
        container.innerHTML = '<div style="padding:30px;color:#4a5568">No listings</div>';
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
                <div class="marketplace-listing-seller">${escapeHtml(l.sellerName)}${isOwn ? ' (You)' : ''}</div>
            </div>
            <div class="marketplace-listing-price">
                <div>${l.price} MMO</div>
                ${isOwn ? `<button onclick="cancelMarketplaceListing('${l._id}')">CANCEL</button>` : `<button onclick="buyFromMarketplace('${l._id}', ${l.price})">BUY</button>`}
            </div>
        </div>`;
    }).join('');
}

function renderMarketplaceSell() {
    const cards = document.getElementById('marketplaceSellCards');
    if (!cards) return;
    
    if (!state.inventory.length) {
        cards.innerHTML = '<div style="grid-column:1/-1;padding:30px;color:#4a5568">No creatures to sell</div>';
        return;
    }

    cards.innerHTML = state.inventory.map(item => {
        const c = getCreature(item.creatureId);
        if (!c) return '';
        return `<div class="marketplace-sell-card" onclick="openSellModal('${item.creatureId}', '${c.name}')">
            <div class="marketplace-sell-card-icon">${c.icon}</div>
            <div class="marketplace-sell-card-name">${escapeHtml(c.name)}</div>
            <div style="font-size:10px;color:#06b6d4">SET PRICE</div>
        </div>`;
    }).join('');
}

function openSellModal(creatureId, creatureName) {
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div class="popup-title">Sell ${escapeHtml(creatureName)}</div>
        <input type="number" id="sellPriceInput" placeholder="Price" min="10" max="100000" value="100" style="width:100%;padding:10px;margin:16px 0;border-radius:10px;background:#0d1120;border:1px solid #1e2d4a;color:#fff">
        <div class="fee-calculator" style="margin-bottom:16px">
            <div>Price: <span id="priceDisplay">100</span> MMO</div>
            <div style="color:#ef4444">Fee (10%): -<span id="feeDisplay">10</span></div>
            <div style="color:#22c55e">You get: <span id="finalDisplay">90</span> MMO</div>
        </div>
        <button class="popup-btn" onclick="confirmSellListing('${creatureId}')">LIST FOR SALE</button>
        <button class="popup-btn" style="background:#1a2540;margin-top:8px" onclick="closeOverlay()">CANCEL</button>
    `;
    document.getElementById('overlay').classList.add('show');
    
    const input = document.getElementById('sellPriceInput');
    if (input) input.oninput = () => {
        const price = Math.max(10, Math.min(100000, parseInt(input.value) || 0));
        document.getElementById('priceDisplay').textContent = price;
        document.getElementById('feeDisplay').textContent = Math.floor(price * 0.1);
        document.getElementById('finalDisplay').textContent = price - Math.floor(price * 0.1);
    };
}

async function confirmSellListing(creatureId) {
    const price = parseInt(document.getElementById('sellPriceInput')?.value || 0);
    if (price < 10) { showToast('Min price 10 MMO', '❌'); return; }
    await syncPendingIncome();

    const res = await apiRequest('POST', '/api/marketplace/list', { creatureId, price });
    if (res?.success) {
        state.inventory = res.inventory;
        closeOverlay();
        renderCards();
        renderMarketplaceSell();
        marketplaceCache.expiresAt = 0;
        showToast('Listed for sale!', '✅');
    }
}

async function renderMarketplaceMyListings() {
    const container = document.getElementById('marketplaceMyListings');
    if (!container) return;
    
    const res = await apiRequest('GET', '/api/marketplace/my-listings');
    if (!res?.success) {
        container.innerHTML = '<div style="padding:30px;color:#4a5568">Error</div>';
        return;
    }

    const listings = res.listings || [];
    if (!listings.length) {
        container.innerHTML = '<div style="padding:30px;color:#4a5568">No active listings</div>';
        return;
    }

    container.innerHTML = listings.map(l => {
        const c = getCreature(l.creatureId);
        if (!c) return '';
        return `<div class="marketplace-my-listing">
            <div class="marketplace-my-listing-icon">${c.icon}</div>
            <div class="marketplace-my-listing-info">
                <div class="marketplace-my-listing-name">${escapeHtml(c.name)}</div>
                <div>${l.price} MMO</div>
            </div>
            <button onclick="cancelMarketplaceListing('${l._id}')">CANCEL</button>
        </div>`;
    }).join('');
}

async function cancelMarketplaceListing(listingId) {
    const res = await apiRequest('POST', '/api/marketplace/cancel', { listingId });
    if (res?.success) {
        state.inventory = res.inventory;
        renderCards();
        renderMarketplaceMyListings();
        marketplaceCache.expiresAt = 0;
        showToast('Listing cancelled', '✅');
    }
}

async function buyFromMarketplace(listingId, price) {
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
        marketplaceCache.expiresAt = 0;
        renderMarketplaceBuy();
        showToast('Purchase successful!', '✅');
    }
}

// ============================================================
// FRIENDS & SPECIAL QUESTS
// ============================================================
async function inviteFriend() {
    const res = await apiRequest('GET', '/api/user/referrals');
    const link = res.referralLink || `https://t.me/your_bot?start=${state.user?.referralCode}`;
    window.Telegram?.WebApp?.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Join DNA MMO!`);
}

function updateFriendRewardButtons() {
    const currentFriends = state.user?.referralCount || 0;
    const rewards = [
        { friends: 10, btnId: 'reward-10-btn', cardId: 'reward-10', creatureId: 'wolf_r', name: 'Rare Wolf', icon: '🐺', rarity: 'rare' },
        { friends: 50, btnId: 'reward-50-btn', cardId: 'reward-50', creatureId: 'wolf_e', name: 'Epic Wolf', icon: '🐺', rarity: 'epic' },
        { friends: 150, btnId: 'reward-150-btn', cardId: 'reward-150', creatureId: 'wolf_l', name: 'Legendary Wolf', icon: '🐺', rarity: 'legendary' }
    ];
    
    rewards.forEach(r => {
        const btn = document.getElementById(r.btnId);
        const card = document.getElementById(r.cardId);
        if (!btn) return;
        
        if (currentFriends >= r.friends) {
            btn.textContent = '🎁 ЗАБРАТЬ';
            btn.style.background = `linear-gradient(135deg, var(--${r.rarity}), var(--${r.rarity}))`;
            btn.disabled = false;
            btn.onclick = () => claimFriendReward(r.friends, r.creatureId, r.name, r.icon);
            if (card) card.style.borderColor = `var(--${r.rarity})`;
        } else {
            btn.textContent = `🔒 ${r.friends} ДРУЗЕЙ`;
            btn.style.background = '#1a2540';
            btn.disabled = true;
        }
    });
}

async function claimFriendReward(requiredFriends, creatureId, creatureName, creatureIcon) {
    if (state.isLoading) return;
    await syncPendingIncome();
    
    if ((state.user?.referralCount || 0) < requiredFriends) {
        showToast(`Need ${requiredFriends} friends`, '❌');
        return;
    }
    
    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/claim-friend-reward', { requiredFriends, creatureId });
    state.isLoading = false;
    
    if (res?.success) {
        state.user = res.user;
        state.inventory = res.inventory;
        updateHeader();
        renderCards();
        updateFriendRewardButtons();
        showToast(`+${creatureName}!`, '🎁');
        spawnStars('epic');
    }
}

async function renderSpecialQuests() {
    const container = document.getElementById('specialQuestsList');
    if (!container) return;
    await loadGameConfig();
    
    if (!SPECIAL_QUESTS.length) {
        container.innerHTML = '<div class="empty-grid">📢 Нет активных квестов</div>';
        return;
    }

    const completed = new Set(state.user?.completedSpecialQuests || []);
    container.innerHTML = SPECIAL_QUESTS.filter(q => q.isActive).map(quest => {
        const isCompleted = completed.has(quest.id);
        let actionHtml = '';
        
        if (isCompleted) {
            actionHtml = '<button class="special-quest-btn completed" disabled>ВЫПОЛНЕНО</button>';
        } else if (quest.type === 'referral_count') {
            const current = state.user?.referralCount || 0;
            const required = quest.required_count || 1;
            if (current >= required) {
                actionHtml = `<button class="special-quest-btn claim" onclick="claimSpecialQuest('${quest.id}')">ЗАБРАТЬ (${current}/${required})</button>`;
            } else {
                actionHtml = `<button class="special-quest-btn locked" disabled>НУЖНО ${required} ДРУЗЕЙ (${current})</button>`;
            }
        } else {
            actionHtml = `<button class="special-quest-btn" onclick="openQuestLink('${quest.id}', '${quest.link}')">ПЕРЕЙТИ</button>`;
        }
        
        return `<div class="special-quest-card">
            <div class="special-quest-header">
                <div class="special-quest-icon">${quest.icon || '🎯'}</div>
                <div>
                    <div class="special-quest-title">${escapeHtml(quest.title)}</div>
                    <div class="special-quest-desc">${escapeHtml(quest.description || '')}</div>
                </div>
                <div class="special-quest-reward">+${quest.reward}</div>
            </div>
            <div class="special-quest-footer">${actionHtml}</div>
        </div>`;
    }).join('');
}

function openQuestLink(questId, link) {
    if (link && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(link);
    } else if (link) {
        window.open(link, '_blank');
    }
    setTimeout(() => claimSpecialQuest(questId), 2000);
}

async function claimSpecialQuest(questId) {
    if (state.isLoading) return;
    await syncPendingIncome();
    
    state.isLoading = true;
    const res = await apiRequest('POST', '/api/game/complete-special-quest', { questId });
    state.isLoading = false;
    
    if (res?.success) {
        state.user = res.user;
        updateHeader();
        await renderSpecialQuests();
        showToast(`+${res.reward} MMO`, '✅');
    }
}

// ============================================================
// NAVIGATION
// ============================================================
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    document.getElementById(`nav-${tab}`)?.classList.add('active');
    
    isMarketplaceTabActive = (tab === 'shop');
    if (tab === 'leaderboard') renderLeaderboard();
    if (tab === 'special') renderSpecialQuests();
    if (tab === 'shop') renderMarketplaceBuy();
}

function closeOverlay(e) {
    if (e?.target !== document.getElementById('overlay') && e !== undefined) return;
    document.getElementById('overlay')?.classList.remove('show');
}

function showToast(msg, icon = '') {
    const t = document.getElementById('toast');
    t.textContent = (icon ? icon + ' ' : '') + msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function spawnStars(rarity) {
    const count = rarity === 'legendary' ? 8 : rarity === 'epic' ? 5 : 3;
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'star-burst';
            el.textContent = '✨';
            el.style.left = (30 + Math.random() * 40) + '%';
            el.style.top = (20 + Math.random() * 40) + '%';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 900);
        }, i * 80);
    }
}

// ============================================================
// STYLES
// ============================================================
const style = document.createElement('style');
style.textContent = `
    .balance-amount.pending { animation: incomePulse 0.5s ease; color: #22c55e; }
    @keyframes incomePulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); text-shadow: 0 0 8px #22c55e; } 100% { transform: scale(1); } }
    .special-quest-card { background: linear-gradient(135deg, #141c2e, #0d1120); border: 1px solid #1e2d4a; border-radius: 16px; padding: 12px; margin-bottom: 10px; }
    .special-quest-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .special-quest-icon { font-size: 32px; }
    .special-quest-info { flex: 1; }
    .special-quest-title { font-weight: 700; font-size: 14px; }
    .special-quest-desc { font-size: 11px; color: #94a3b8; }
    .special-quest-reward { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .special-quest-footer { display: flex; justify-content: flex-end; border-top: 1px solid #1e2d4a; padding-top: 10px; }
    .special-quest-btn { background: linear-gradient(135deg, #7c3aed, #a855f7); border: none; border-radius: 10px; padding: 6px 16px; color: white; font-size: 11px; cursor: pointer; }
    .special-quest-btn.completed { background: #22c55e; opacity: 0.6; cursor: default; }
    .special-quest-btn.claim { background: linear-gradient(135deg, #eab308, #ca8a04); animation: pulse 1.5s infinite; }
    .special-quest-btn.locked { background: #1e2d4a; cursor: not-allowed; opacity: 0.6; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(234,179,8,0.4); } 50% { box-shadow: 0 0 0 8px rgba(234,179,8,0); } }
`;
document.head.appendChild(style);

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', () => initTelegramApp());