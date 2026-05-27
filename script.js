// ============================================================
// DATA
// ============================================================

const CREATURES = [
    // DUCK - COMMON TO LEGENDARY
    { id:'duck_c', name:'Duck', rarity:'common', icon:'🦆', incomeBase:2, desc:'Young waterfowl. Just starting to learn.' },
    { id:'duck_u', name:'Duck', rarity:'uncommon', icon:'🦆', incomeBase:8, desc:'Mature waterfowl. Skilled swimmer.' },
    { id:'duck_r', name:'Duck', rarity:'rare', icon:'🦆', incomeBase:25, desc:'Ancient waterfowl. Master of waters.' },
    { id:'duck_e', name:'Duck', rarity:'epic', icon:'🦆', incomeBase:80, desc:'Eternal waterfowl. Supreme mastery.' },
    { id:'duck_l', name:'Duck', rarity:'legendary', icon:'🦆', incomeBase:250, desc:'Divine waterfowl. Reality bender.' },
    
    // OWL - COMMON TO LEGENDARY
    { id:'owl_c', name:'Owl', rarity:'common', icon:'🦉', incomeBase:2, desc:'Small night hunter. Learning to fly.' },
    { id:'owl_u', name:'Owl', rarity:'uncommon', icon:'🦉', incomeBase:8, desc:'Experienced night hunter. Sharp talons.' },
    { id:'owl_r', name:'Owl', rarity:'rare', icon:'🦉', incomeBase:25, desc:'Wise night guardian. All-seeing.' },
    { id:'owl_e', name:'Owl', rarity:'epic', icon:'🦉', incomeBase:80, desc:'Eternal guardian. Infinite wisdom.' },
    { id:'owl_l', name:'Owl', rarity:'legendary', icon:'🦉', incomeBase:250, desc:'Divine guardian. All-knowing entity.' },
    
    // SHARK - COMMON TO LEGENDARY
    { id:'shark_c', name:'Shark', rarity:'common', icon:'🦈', incomeBase:2, desc:'Young predator. Testing the waters.' },
    { id:'shark_u', name:'Shark', rarity:'uncommon', icon:'🦈', incomeBase:8, desc:'Experienced apex predator. Deadly bite.' },
    { id:'shark_r', name:'Shark', rarity:'rare', icon:'🦈', incomeBase:25, desc:'Legendary predator. Ocean terror.' },
    { id:'shark_e', name:'Shark', rarity:'epic', icon:'🦈', incomeBase:80, desc:'Eternal terror. Endless hunger.' },
    { id:'shark_l', name:'Shark', rarity:'legendary', icon:'🦈', incomeBase:250, desc:'Divine terror. Apex of apex.' },
    
    // WOLF - COMMON TO LEGENDARY
    { id:'wolf_c', name:'Wolf', rarity:'common', icon:'🐺', incomeBase:2, desc:'Young pack member. Growing stronger.' },
    { id:'wolf_u', name:'Wolf', rarity:'uncommon', icon:'🐺', incomeBase:8, desc:'Pack leader in training. Strong hunter.' },
    { id:'wolf_r', name:'Wolf', rarity:'rare', icon:'🐺', incomeBase:25, desc:'Alpha wolf. Pack dominance.' },
    { id:'wolf_e', name:'Wolf', rarity:'epic', icon:'🐺', incomeBase:80, desc:'Eternal alpha. Infinite power.' },
    { id:'wolf_l', name:'Wolf', rarity:'legendary', icon:'🐺', incomeBase:250, desc:'Divine alpha. Dimension walker.' },
    
    // DRAGON - COMMON TO LEGENDARY
    { id:'dragon_c', name:'Dragon', rarity:'common', icon:'🐉', incomeBase:2, desc:'Young fire breather. Learning to roar.' },
    { id:'dragon_u', name:'Dragon', rarity:'uncommon', icon:'🐉', incomeBase:8, desc:'Grown fire breather. Breathing flames.' },
    { id:'dragon_r', name:'Dragon', rarity:'rare', icon:'🐉', incomeBase:25, desc:'Ancient fire drake. Blazing power.' },
    { id:'dragon_e', name:'Dragon', rarity:'epic', icon:'🐉', incomeBase:80, desc:'Eternal flame. Infinite fire.' },
    { id:'dragon_l', name:'Dragon', rarity:'legendary', icon:'🐉', incomeBase:250, desc:'Divine flame. Eternal inferno.' },
    
    // UNICORN - COMMON TO LEGENDARY
    { id:'unicorn_c', name:'Unicorn', rarity:'common', icon:'🦄', incomeBase:2, desc:'Young magical beast. Horn growing.' },
    { id:'unicorn_u', name:'Unicorn', rarity:'uncommon', icon:'🦄', incomeBase:8, desc:'Magical evolution. Horn shines bright.' },
    { id:'unicorn_r', name:'Unicorn', rarity:'rare', icon:'🦄', incomeBase:25, desc:'Rare magical entity. Pure magic.' },
    { id:'unicorn_e', name:'Unicorn', rarity:'epic', icon:'🦄', incomeBase:80, desc:'Eternal magic. Pure radiance.' },
    { id:'unicorn_l', name:'Unicorn', rarity:'legendary', icon:'🦄', incomeBase:250, desc:'Divine magic. Existence itself.' },
    
    // MYTHIC
    { id:'lion_mythic', name:'Lion', rarity:'mythic', icon:'🦁', incomeBase:1000, desc:'THE MYTHIC KING. Absolute power.' },
    { id:'panther_mythic', name:'Black Panther', rarity:'mythic', icon:'🐆', incomeBase:2000, desc:'TOP 1 SEASON. Beyond comprehension.' },
];

const RARITY_WEIGHTS = {
    basic: { common:80, uncommon:20, rare:0, epic:0, legendary:0 },
    premium: { common:60, uncommon:30, rare:10, epic:2, legendary:1 }
};

const RARITY_COLORS = {
    common: '#94a3b8', uncommon: '#22c55e', rare: '#3b82f6',
    epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444'
};

const RARITY_ORDER = ['common','uncommon','rare','epic','legendary','mythic'];

const CAPSULE_COSTS = { basic: 50, premium: 200 };

// ============================================================
// STATE
// ============================================================

let state = {
    balance: 500,
    xp: 0,
    level: 1,
    cards: [], // { id, creatureId, count }
    discovered: new Set(),
    totalIncome: 0,
    mergeCount: 0,
    capsulesOpened: 0,
    transactions: [],
    adsCooldown: 0,
    boostActive: false,
    boostEnd: 0,
    inventorySlots: 10,
    inventoryUpgrades: 0,
    quests: {
        open5: { done: false, progress: 0, target: 5 },
        merge3: { done: false, progress: 0, target: 3 },
        earn500: { done: false, progress: 0, target: 500 },
        collect10: { done: false, progress: 0, target: 10 },
    },
    marketplaceListings: [], // { id, seller, creatureId, price, timestamp }
    myMarketplaceListings: [], // { id, creatureId, price, timestamp }
};

function saveState() {
    const s = { ...state, discovered: [...state.discovered] };
    localStorage.setItem('dna_mmo_v2', JSON.stringify(s));
}

function loadState() {
    try {
        const raw = localStorage.getItem('dna_mmo_v2');
        if (!raw) return;
        const s = JSON.parse(raw);
        state = { ...state, ...s, discovered: new Set(s.discovered || []) };
    } catch(e) {}
}

// ============================================================
// PARTICLES
// ============================================================

(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            r: Math.random() * 1.5 + 0.3,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -Math.random() * 0.4 - 0.1,
            alpha: Math.random() * 0.4 + 0.1,
            color: Math.random() > 0.5 ? '124,58,237' : '6,182,212'
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
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
// HELPERS
// ============================================================

function getCreature(id) { return CREATURES.find(c => c.id === id); }

function rollRarity(type) {
    const w = RARITY_WEIGHTS[type];
    const roll = Math.random() * 100;
    let cum = 0;
    for (const [r, v] of Object.entries(w)) {
        cum += v;
        if (roll < cum) return r;
    }
    return 'common';
}

function getCreaturesByRarity(rarity) {
    return CREATURES.filter(c => c.rarity === rarity && c.rarity !== 'mythic');
}

function randomCreatureByRarity(rarity) {
    const pool = getCreaturesByRarity(rarity);
    if (!pool.length) return CREATURES[0];
    return pool[Math.floor(Math.random() * pool.length)];
}

function calcIncome(creature, count) {
    return creature.incomeBase * count;
}

function totalIncomePerHour() {
    let total = 0;
    state.cards.forEach(card => {
        const c = getCreature(card.creatureId);
        if (c) total += c.incomeBase * card.count;
    });
    if (state.boostActive && Date.now() < state.boostEnd) total = Math.floor(total * 1.5);
    return total;
}

function getUsedSlots() {
    return state.cards.reduce((total, card) => total + card.count, 0);
}

function getAvailableSlots() {
    return state.inventorySlots - getUsedSlots();
}

function getUpgradeCost() {
    return Math.floor(100 * Math.pow(1.5, state.inventoryUpgrades));
}

function canAddCard() {
    return getUsedSlots() < state.inventorySlots;
}

function upgradeInventory() {
    const cost = getUpgradeCost();
    if (state.balance < cost) {
        showToast(`Need ${cost} MMO to upgrade!`, '❌');
        return;
    }
    state.balance -= cost;
    state.inventorySlots += 1;
    state.inventoryUpgrades++;
    addTransaction('Inventory Upgrade', -cost);
    addXP(25);
    saveState();
    updateHeader();
    renderCards();
    updateUpgradeButton();
    showToast(`+1 slot! Now ${state.inventorySlots} total`, '📦');
}

function updateUpgradeButton() {
    const cost = getUpgradeCost();
    const btn = document.getElementById('quickUpgradeBtn');
    const costEl = document.getElementById('upgradeSlotCost');
    if (btn && costEl) {
        costEl.textContent = cost;
        if (state.balance < cost) {
            btn.style.opacity = '0.5';
            btn.disabled = true;
        } else {
            btn.style.opacity = '1';
            btn.disabled = false;
        }
    }
}

function formatNum(n) {
    if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n/1000).toFixed(1) + 'K';
    return Math.floor(n).toString();
}

function addTransaction(name, amount) {
    state.transactions.unshift({ name, amount, time: Date.now() });
    if (state.transactions.length > 20) state.transactions.pop();
}

function addXP(amount) {
    state.xp += amount;
    const needed = state.level * 100;
    if (state.xp >= needed) {
        state.xp -= needed;
        state.level++;
        showToast(`Level Up! Now LVL ${state.level}`, '🎉');
    }
    updateHeader();
}

// ============================================================
// CARD MANAGEMENT
// ============================================================

function addCard(creatureId) {
    const existing = state.cards.find(c => c.creatureId === creatureId);
    if (existing) {
        existing.count++;
    } else {
        if (!canAddCard()) {
            showToast('Inventory full! Upgrade storage', '📦');
            return false;
        }
        state.cards.push({ creatureId, count: 1 });
    }
    state.discovered.add(creatureId);
    updateQuestProgress('collect10', state.discovered.size);
    return true;
}

function getMergeResult(creatureId) {
    const c = getCreature(creatureId);
    if (!c) return null;
    const currentRarityIdx = RARITY_ORDER.indexOf(c.rarity);
    if (currentRarityIdx < 0) return null;

    // Legendary is max — can't merge further
    if (c.rarity === 'legendary') {
        return c;
    }

    // 70% chance success (upgrade), 30% stays same rarity
    const success = Math.random() < 0.7;

    if (success && currentRarityIdx < RARITY_ORDER.length - 2) {
        const nextRarity = RARITY_ORDER[currentRarityIdx + 1];
        const baseName = c.name;
        
        // Find next rarity of same creature
        const nextCreature = CREATURES.find(cr => cr.name === baseName && cr.rarity === nextRarity);
        return nextCreature || c;
    } else {
        // Stay same rarity of same creature
        return CREATURES.find(cr => cr.name === c.name && cr.rarity === c.rarity) || c;
    }
}

function canMerge(creatureId) {
    const card = state.cards.find(c => c.creatureId === creatureId);
    const creature = getCreature(creatureId);
    // Can't merge if Legendary (max level)
    return card && card.count >= 3 && creature && creature.rarity !== 'legendary';
}

function showMergePreview(creatureId) {
    const creature = getCreature(creatureId);
    if (!creature) return;

    // Legendary can't merge
    if (creature.rarity === 'legendary') {
        showToast('Legendary creatures cannot be merged further!', '⭐');
        return;
    }

    const currentRarityIdx = RARITY_ORDER.indexOf(creature.rarity);
    const nextRarity = currentRarityIdx < RARITY_ORDER.length - 2 ? RARITY_ORDER[currentRarityIdx + 1] : creature.rarity;
    const baseName = creature.name;
    
    // Find next rarity of same creature
    const nextCreature = CREATURES.find(cr => cr.name === baseName && cr.rarity === nextRarity)
        || CREATURES.find(cr => cr.name === baseName && cr.rarity === creature.rarity);
    
    const sameCreature = CREATURES.find(cr => cr.name === creature.name && cr.rarity === creature.rarity);

    const color = RARITY_COLORS[creature.rarity];

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div class="popup-title" style="margin-bottom:4px">Merge Preview</div>
        <div class="popup-subtitle">3x ${creature.name} → ?</div>
        
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                <div style="text-align:center;flex:1">
                    <div style="font-size:24px;margin-bottom:6px">${creature.icon}</div>
                    <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px">Input</div>
                    <div style="font-size:11px;font-weight:600;color:var(--text);margin-top:2px">3x ${creature.name}</div>
                </div>
                <div style="color:var(--text3);font-size:18px">→</div>
                <div style="text-align:center;flex:1">
                    <div style="font-size:24px;margin-bottom:6px">?</div>
                    <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px">Output</div>
                    <div style="font-size:11px;font-weight:600;color:var(--text);margin-top:2px">Unknown</div>
                </div>
            </div>

            <div style="border-top:1px solid var(--border);padding-top:14px">
                <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Possible Outcomes</div>
                
                <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:10px;margin-bottom:8px">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                        <span style="font-size:18px">${nextCreature.icon}</span>
                        <div style="flex:1">
                            <div style="font-size:11px;font-weight:600;color:var(--uncommon)">30% Success</div>
                            <div style="font-size:10px;color:var(--text2)">${nextCreature.name} (${nextRarity.toUpperCase()})</div>
                        </div>
                        <div style="font-size:12px;font-weight:700;color:var(--uncommon)">▲ RANK UP</div>
                    </div>
                </div>

                <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:10px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:18px">${sameCreature.icon}</span>
                        <div style="flex:1">
                            <div style="font-size:11px;font-weight:600;color:var(--legendary)">70% Mutation</div>
                            <div style="font-size:10px;color:var(--text2)">${sameCreature.name} (${creature.rarity.toUpperCase()})</div>
                        </div>
                        <div style="font-size:12px;font-weight:700;color:var(--legendary)">= SAME</div>
                    </div>
                </div>
            </div>
        </div>

        <button class="popup-btn" style="background:linear-gradient(135deg,#16a34a,#22c55e);margin-bottom:8px" onclick="closeOverlay();executeMerge('${creatureId}')">
            <i class="fa-solid fa-code-merge"></i> MERGE NOW
        </button>
        <button class="popup-btn" style="background:var(--surface2);color:var(--text)" onclick="closeOverlay()">
            CANCEL
        </button>
    `;

    document.getElementById('overlay').classList.add('show');
}

function executeMerge(creatureId) {
    if (!canMerge(creatureId)) return;

    const creature = getCreature(creatureId);
    
    // Can't merge Legendary — it's the max
    if (creature.rarity === 'legendary') {
        showToast('Legendary is max level! Can\'t merge further.', '⭐');
        return;
    }

    const card = state.cards.find(c => c.creatureId === creatureId);
    card.count -= 3;
    if (card.count <= 0) {
        state.cards = state.cards.filter(c => c.creatureId !== creatureId);
    }

    const currentRarityIdx = RARITY_ORDER.indexOf(creature.rarity);
    const success = Math.random() < 0.3;

    let result;
    if (success && currentRarityIdx < RARITY_ORDER.length - 2) {
        const nextRarity = RARITY_ORDER[currentRarityIdx + 1];
        const baseName = creature.name;
        result = CREATURES.find(cr => cr.name === baseName && cr.rarity === nextRarity) || creature;
    } else {
        result = CREATURES.find(cr => cr.name === creature.name && cr.rarity === creature.rarity) || creature;
    }

    addCard(result.id);
    state.mergeCount++;
    addXP(20);
    updateQuestProgress('merge3', state.mergeCount);
    addTransaction(`Merge → ${result.name}`, 0);

    saveState();
    renderCards();
    updateHeader();

    showMergeResultPopup(creature, result, success);
}

function showMergeResultPopup(from, to, success) {
    const color = RARITY_COLORS[to.rarity];

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div class="merge-popup-cards">
            <div class="merge-card-mini">${from.icon}</div>
            <div class="merge-card-mini">${from.icon}</div>
            <div class="merge-card-mini">${from.icon}</div>
            <div class="merge-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            <div class="merge-card-mini" style="border-color:${color};box-shadow:0 0 12px ${color}44;font-size:32px">${to.icon}</div>
        </div>
        <div class="popup-title" style="color:${color}">${to.name}</div>
        <div class="popup-subtitle">${success ? '🎉 Evolution successful!' : '⚗️ Mutation complete!'}</div>
        <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">
            ${to.rarity.toUpperCase()} ${success ? '▲ UPGRADED' : ''}
        </div>
        <div class="popup-stats">
            <div class="popup-stat">
                <div class="popup-stat-val" style="color:${color}">${to.incomeBase}</div>
                <div class="popup-stat-label">MMO/hr</div>
            </div>
            <div class="popup-stat">
                <div class="popup-stat-val" style="color:${success ? 'var(--uncommon)' : 'var(--text2)'}">${success ? '+RARITY' : '=RARITY'}</div>
                <div class="popup-stat-label">Result</div>
            </div>
        </div>
        <button class="popup-btn" onclick="closeOverlay()" style="${success ? 'background:linear-gradient(135deg,#16a34a,#22c55e)' : ''}">
            ${success ? 'EVOLUTION!' : 'CONTINUE'}
        </button>
    `;

    document.getElementById('overlay').classList.add('show');
    if (success) spawnStars(to.rarity);
}

// ============================================================
// CAPSULE OPENING
// ============================================================

function openCapsule(type) {
    const cost = CAPSULE_COSTS[type];
    if (state.balance < cost) {
        showToast('Not enough MMO!', '❌');
        return;
    }

    if (!canAddCard()) {
        showToast('Inventory full! Upgrade storage', '📦');
        return;
    }

    state.balance -= cost;
    state.capsulesOpened++;
    addTransaction(`${type === 'premium' ? 'Premium' : 'DNA'} Capsule`, -cost);
    updateQuestProgress('open5', state.capsulesOpened);

    const cardEl = document.getElementById(type === 'premium' ? 'premiumCapsuleCard' : 'basicCapsuleCard');
    const iconEl = cardEl.querySelector('.capsule-icon');
    iconEl.classList.add('capsule-opening');
    setTimeout(() => iconEl.classList.remove('capsule-opening'), 600);

    const rarity = rollRarity(type);
    const creature = randomCreatureByRarity(rarity);
    addCard(creature.id);
    addXP(10);

    saveState();
    renderCards();
    updateHeader();

    setTimeout(() => showCapsulePopup(creature), 300);
}

// ============================================================
// POPUPS
// ============================================================

function showCapsulePopup(creature) {
    const color = RARITY_COLORS[creature.rarity];
    const income = creature.incomeBase;

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${color})">${creature.icon}</span>
        <div class="popup-title" style="color:${color}">${creature.name}</div>
        <div class="popup-subtitle">${creature.desc}</div>
        <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">
            ${creature.rarity.toUpperCase()}
        </div>
        <div class="popup-stats">
            <div class="popup-stat">
                <div class="popup-stat-val" style="color:${color}">${income}</div>
                <div class="popup-stat-label">MMO/hr</div>
            </div>
            <div class="popup-stat">
                <div class="popup-stat-val">${creature.rarity === 'legendary' ? '★★★★★' : creature.rarity === 'epic' ? '★★★★' : creature.rarity === 'rare' ? '★★★' : creature.rarity === 'uncommon' ? '★★' : '★'}</div>
                <div class="popup-stat-label">Rating</div>
            </div>
        </div>
        <button class="popup-btn" onclick="closeOverlay()">AWESOME!</button>
    `;

    document.getElementById('overlay').classList.add('show');
    spawnStars(creature.rarity);
}

function showMergePopup(from, to) {
    const color = RARITY_COLORS[to.rarity];
    const upgraded = RARITY_ORDER.indexOf(to.rarity) > RARITY_ORDER.indexOf(from.rarity);

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div class="merge-popup-cards">
            <div class="merge-card-mini">${from.icon}</div>
            <div class="merge-card-mini">${from.icon}</div>
            <div class="merge-card-mini">${from.icon}</div>
            <div class="merge-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            <div class="merge-card-mini" style="border-color:${color};box-shadow:0 0 12px ${color}44;font-size:32px">${to.icon}</div>
        </div>
        <div class="popup-title" style="color:${color}">${to.name}</div>
        <div class="popup-subtitle">${upgraded ? '🎉 Evolution successful!' : '⚗️ Mutation complete!'}</div>
        <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">
            ${to.rarity.toUpperCase()} ${upgraded ? '▲ UPGRADED' : ''}
        </div>
        <div class="popup-stats">
            <div class="popup-stat">
                <div class="popup-stat-val" style="color:${color}">${to.incomeBase}</div>
                <div class="popup-stat-label">MMO/hr</div>
            </div>
            <div class="popup-stat">
                <div class="popup-stat-val" style="color:${upgraded ? 'var(--uncommon)' : 'var(--text2)'}">${upgraded ? '+RARITY' : '=RARITY'}</div>
                <div class="popup-stat-label">Result</div>
            </div>
        </div>
        <button class="popup-btn" onclick="closeOverlay()" style="${upgraded ? 'background:linear-gradient(135deg,#16a34a,#22c55e)' : ''}">
            ${upgraded ? 'EVOLUTION!' : 'CONTINUE'}
        </button>
    `;

    document.getElementById('overlay').classList.add('show');
    if (upgraded) spawnStars(to.rarity);
}

function showEncyclopedia() {
    const total = CREATURES.length;
    const found = state.discovered.size;

    // Group creatures by rarity
    const grouped = {};
    RARITY_ORDER.forEach(r => grouped[r] = []);
    CREATURES.forEach(c => {
        if (grouped[c.rarity]) grouped[c.rarity].push(c);
    });

    // Build sections
    const sections = RARITY_ORDER.map(rarity => {
        if (!grouped[rarity].length) return '';
        const color = RARITY_COLORS[rarity];
        const items = grouped[rarity].map(c => {
            const isFound = state.discovered.has(c.id);
            return `<div class="coll-item ${isFound ? 'found' : 'not-found'}" style="${isFound ? `border-color:${color}44` : ''};cursor:pointer;transition:all 0.2s" onclick="showCreatureInfo('${c.id}')">
                <span style="font-size:22px;${isFound ? `filter:drop-shadow(0 0 6px ${color})` : ''}">${c.icon}</span>
                <div class="coll-item-name">${isFound ? c.name : '???'}</div>
            </div>`;
        }).join('');

        return `<div style="margin-bottom:16px">
            <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">${rarity}</div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">${items}</div>
        </div>`;
    }).join('');

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div class="popup-title" style="margin-bottom:4px">Encyclopedia</div>
        <div class="popup-subtitle">${found}/${total} creatures discovered</div>
        <div style="height:6px;background:var(--border);border-radius:3px;margin-bottom:16px;overflow:hidden">
            <div style="height:100%;width:${(found/total*100).toFixed(0)}%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width 0.5s"></div>
        </div>
        <div style="max-height:50vh;overflow-y:auto;padding:4px">${sections}</div>
    `;

    document.getElementById('overlay').classList.add('show');
}

function showCreatureInfo(creatureId) {
    const c = getCreature(creatureId);
    if (!c) return;
    
    const isFound = state.discovered.has(creatureId);
    const color = RARITY_COLORS[c.rarity];
    
    // Simple obtain info based on rarity
    let obtainInfo = '';
    let ways = [];
    
    if (c.rarity === 'mythic') {
        ways.push({ type: 'merge', title: '★ Merge 3x Legendary', desc: 'Merge any 3 Legendary creatures', chance: '70%' });
    } else if (c.rarity === 'legendary') {
        ways.push({ type: 'capsule', title: 'Premium Capsule', desc: '200 MMO', chance: '7%' });
        ways.push({ type: 'merge', title: 'Merge 3x Epic', desc: 'Merge any 3 Epic creatures', chance: '70%' });
    } else if (c.rarity === 'epic') {
        ways.push({ type: 'capsule', title: 'Premium Capsule', desc: '200 MMO', chance: '18%' });
        ways.push({ type: 'merge', title: 'Merge 3x Rare', desc: 'Merge any 3 Rare creatures', chance: '70%' });
    } else if (c.rarity === 'rare') {
        ways.push({ type: 'capsule', title: 'Premium Capsule', desc: '200 MMO', chance: '35%' });
        ways.push({ type: 'merge', title: 'Merge 3x Uncommon', desc: 'Merge any 3 Uncommon creatures', chance: '70%' });
    } else if (c.rarity === 'uncommon') {
        ways.push({ type: 'capsule', title: 'DNA Capsule', desc: '50 MMO', chance: '25%' });
        ways.push({ type: 'capsule', title: 'Premium Capsule', desc: '200 MMO', chance: '40%' });
        ways.push({ type: 'merge', title: 'Merge 3x Common', desc: 'Merge any 3 Common creatures', chance: '70%' });
    } else {
        ways.push({ type: 'capsule', title: 'DNA Capsule', desc: '50 MMO', chance: '60%' });
        ways.push({ type: 'capsule', title: 'Premium Capsule', desc: '200 MMO', chance: '40%' });
    }
    
    const waysHtml = ways.map(way => {
        const bgColor = way.type === 'merge' ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.1)';
        const borderColor = way.type === 'merge' ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.3)';
        const icon = way.type === 'merge' ? '🔀' : '🧬';
        
        return `<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:10px;padding:10px;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:16px">${icon}</span>
                <div style="flex:1">
                    <div style="font-size:11px;font-weight:700;color:${way.type === 'merge' ? 'var(--uncommon)' : 'var(--accent3)'};">${way.title}</div>
                    <div style="font-size:9px;color:var(--text2)">${way.desc}</div>
                </div>
                <div style="font-size:11px;font-weight:700;color:var(--legendary)">${way.chance}</div>
            </div>
        </div>`;
    }).join('');
    
    obtainInfo = `<div style="border-top:1px solid var(--border);padding-top:14px;margin-top:14px">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:700">How to Obtain</div>
        ${waysHtml}
    </div>`;

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="showEncyclopedia()"><i class="fa-solid fa-arrow-left"></i></div>
        <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${color})">${c.icon}</span>
        <div class="popup-title" style="color:${color}">${c.name}</div>
        <div class="popup-subtitle">${c.desc}</div>
        <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">
            ${c.rarity.toUpperCase()} ${isFound ? '✓ DISCOVERED' : '🔒 UNDISCOVERED'}
        </div>
        <div class="popup-stats" style="margin-bottom:14px">
            <div class="popup-stat">
                <div class="popup-stat-val" style="color:${color}">${c.incomeBase}</div>
                <div class="popup-stat-label">MMO/hr</div>
            </div>
            <div class="popup-stat">
                <div class="popup-stat-val">${c.rarity === 'legendary' ? '★★★★★' : c.rarity === 'epic' ? '★★★★' : c.rarity === 'rare' ? '★★★' : c.rarity === 'uncommon' ? '★★' : '★'}</div>
                <div class="popup-stat-label">Power</div>
            </div>
        </div>
        ${obtainInfo}
    `;

    document.getElementById('overlay').classList.add('show');
}

function closeOverlay(e) {
    if (e && e.target !== document.getElementById('overlay')) return;
    document.getElementById('overlay').classList.remove('show');
}

// ============================================================
// RENDER
// ============================================================

function renderCards() {
    const grid = document.getElementById('cardsGrid');
    
    if (!state.cards.length) {
        grid.innerHTML = `<div class="empty-grid"><i class="fa-solid fa-dna"></i>Open a capsule to get your first creature!</div>`;
        document.getElementById('upgradeSlotCard').style.display = 'none';
        return;
    }

    // Sort by rarity desc
    const sorted = [...state.cards].sort((a, b) => {
        const ai = RARITY_ORDER.indexOf(getCreature(a.creatureId)?.rarity || 'common');
        const bi = RARITY_ORDER.indexOf(getCreature(b.creatureId)?.rarity || 'common');
        return bi - ai;
    });

    const cardsHtml = sorted.map(card => {
        const c = getCreature(card.creatureId);
        if (!c) return '';
        const color = RARITY_COLORS[c.rarity];
        const merge = canMerge(card.creatureId);

        return `<div class="creature-card ${c.rarity}" onclick="onCardClick('${card.creatureId}')">
            ${merge ? `<div class="merge-ready-badge">MERGE!</div>` : ''}
            ${card.count > 1 ? `<div class="card-count">${card.count}</div>` : ''}
            <div class="card-icon">${c.icon}</div>
            <div class="card-name">${c.name}</div>
            <div class="card-rarity-badge badge-${c.rarity}">${c.rarity}</div>
            <div class="card-income"><i class="fa-solid fa-bolt" style="font-size:7px"></i>${c.incomeBase}/hr</div>

        </div>`;
    }).join('');

    const cost = getUpgradeCost();
    const upgradeHtml = `<div class="creature-card" style="border-color:rgba(6,182,212,0.4);cursor:pointer" onclick="upgradeInventory()">
        <div style="font-size:28px;line-height:1">📦</div>
        <div style="font-size:10px;font-weight:600;color:var(--text);text-align:center">Add Slot</div>
        <div style="font-size:9px;color:var(--text2);text-align:center">${cost} MMO</div>
        <button style="width:100%;padding:6px;border:none;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;font-size:9px;font-weight:700;font-family:'Orbitron',monospace;cursor:pointer;transition:all 0.2s;margin-top:2px" onclick="event.stopPropagation();upgradeInventory()">UPGRADE</button>
    </div>`;

    grid.innerHTML = cardsHtml;
    document.getElementById('inventorySlots').textContent = `${getUsedSlots()}/${state.inventorySlots}`;
    document.getElementById('encyclopediaProgress').textContent = `${state.discovered.size}/${CREATURES.length}`;
}

function onCardClick(creatureId) {
    const c = getCreature(creatureId);
    if (!c) return;
    const card = state.cards.find(cd => cd.creatureId === creatureId);
    const color = RARITY_COLORS[c.rarity];

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${color})">${c.icon}</span>
        <div class="popup-title" style="color:${color}">${c.name}</div>
        <div class="popup-subtitle">${c.desc}</div>
        <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">${c.rarity.toUpperCase()}</div>
        <div class="popup-stats">
            <div class="popup-stat">
                <div class="popup-stat-val" style="color:${color}">${c.incomeBase}</div>
                <div class="popup-stat-label">MMO/hr each</div>
            </div>
            <div class="popup-stat">
                <div class="popup-stat-val">${card ? card.count : 0}</div>
                <div class="popup-stat-label">Owned</div>
            </div>
        </div>
        ${canMerge(creatureId) ? `<button class="popup-btn" style="background:linear-gradient(135deg,#16a34a,#22c55e)" onclick="closeOverlay();showMergePreview('${creatureId}')">
            <i class="fa-solid fa-code-merge"></i> MERGE x3
        </button>` : `<button class="popup-btn" onclick="closeOverlay()">CLOSE</button>`}
    `;
    document.getElementById('overlay').classList.add('show');
}

function updateHeader() {
    document.getElementById('balanceDisplay').textContent = formatNum(state.balance);
    const income = totalIncomePerHour();
    document.getElementById('incomeDisplay').textContent = `+${formatNum(income)}/hr`;
    state.totalIncome = income;

    const needed = state.level * 100;
    document.getElementById('xpLabel').textContent = `XP ${state.xp}/${needed}`;
    document.getElementById('xpFill').style.width = `${Math.min(100, (state.xp/needed)*100)}%`;
    document.getElementById('playerLevelLabel').textContent = `LVL ${state.level} · ${getLevelTitle(state.level)}`;

    // Wallet
    document.getElementById('walletBalance').textContent = formatNum(state.balance);
    document.getElementById('walletSub').textContent = `≈ $${(state.balance * 0.001).toFixed(3)} USD`;
    document.getElementById('walletIncome').textContent = formatNum(income);
    document.getElementById('walletCards').textContent = state.cards.reduce((a,c) => a + c.count, 0);
    document.getElementById('walletMerges').textContent = state.mergeCount;
    document.getElementById('walletStorage').textContent = `${getUsedSlots()}/${state.inventorySlots}`;

    updateUpgradeButton();
    renderTransactions();
}

function getLevelTitle(lvl) {
    if (lvl >= 20) return 'God Scientist';
    if (lvl >= 15) return 'DNA Master';
    if (lvl >= 10) return 'Geneticist';
    if (lvl >= 5) return 'Lab Expert';
    if (lvl >= 3) return 'Biologist';
    return 'Researcher';
}

function renderTransactions() {
    const list = document.getElementById('txList');
    if (!state.transactions.length) {
        list.innerHTML = `<div style="text-align:center;color:var(--text3);padding:20px;font-size:12px">No transactions yet</div>`;
        return;
    }
    list.innerHTML = state.transactions.slice(0, 10).map(tx => {
        const isPos = tx.amount > 0;
        const isNeg = tx.amount < 0;
        const icon = isPos ? '⬆️' : isNeg ? '⬇️' : '🔀';
        const color = isPos ? 'rgba(34,197,94,0.15)' : isNeg ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)';
        const iconColor = isPos ? 'var(--uncommon)' : isNeg ? 'var(--mythic)' : 'var(--accent3)';
        const timeAgo = Math.floor((Date.now() - tx.time) / 60000);
        const timeStr = timeAgo < 1 ? 'just now' : `${timeAgo}m ago`;

        return `<div class="tx-item">
            <div class="tx-icon" style="background:${color}">
                <span style="font-size:16px">${icon}</span>
            </div>
            <div class="tx-info">
                <div class="tx-name">${tx.name}</div>
                <div class="tx-time">${timeStr}</div>
            </div>
            <div class="tx-amount ${isPos ? 'positive' : isNeg ? 'negative' : ''}" style="${!isPos && !isNeg ? 'color:var(--accent3)' : ''}">
                ${isPos ? '+' : ''}${tx.amount !== 0 ? formatNum(tx.amount) + ' MMO' : 'MERGE'}
            </div>
        </div>`;
    }).join('');
}

// ============================================================
// LEADERBOARD
// ============================================================

const MOCK_LEADERS = [
    { name: 'CryptoGene', level: 24, score: 128400, color: '#f59e0b' },
    { name: 'DNAKing', level: 21, score: 98200, color: '#a855f7' },
    { name: 'MutantX', level: 19, score: 76500, color: '#3b82f6' },
    { name: 'GENOME_X', level: 0, score: 0, isMe: true, color: '#7c3aed' },
    { name: 'BioHacker', level: 15, score: 45300, color: '#22c55e' },
    { name: 'LabRat99', level: 12, score: 32100, color: '#06b6d4' },
    { name: 'EvoMaster', level: 10, score: 21800, color: '#94a3b8' },
];

function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    const leaders = [...MOCK_LEADERS];
    const meIdx = leaders.findIndex(l => l.isMe);
    if (meIdx >= 0) {
        leaders[meIdx].level = state.level;
        leaders[meIdx].score = state.balance;
    }
    leaders.sort((a, b) => b.score - a.score);

    list.innerHTML = leaders.map((l, i) => {
        const rank = i + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        return `<div class="lb-item ${l.isMe ? 'me' : ''}">
            <div class="lb-rank ${rankClass}">${rankIcon}</div>
            <div class="lb-avatar" style="background:${l.color}33;border:1px solid ${l.color}44;color:${l.color}">${l.name[0]}</div>
            <div class="lb-info">
                <div class="lb-name">${l.name} ${l.isMe ? '<span style="font-size:9px;color:var(--accent3)">(You)</span>' : ''}</div>
                <div class="lb-level">LVL ${l.level} · ${getLevelTitle(l.level)}</div>
            </div>
            <div class="lb-score">${formatNum(l.score)}</div>
        </div>`;
    }).join('');
}

// ============================================================
// QUESTS
// ============================================================

const QUEST_DEFS = [
    { id: 'open5', name: 'Capsule Collector', desc: 'Open 5 DNA capsules', icon: '🧬', iconBg: 'rgba(124,58,237,0.2)', reward: 200, color: 'var(--accent3)' },
    { id: 'merge3', name: 'Merge Master', desc: 'Merge 3 times', icon: '🔀', iconBg: 'rgba(34,197,94,0.2)', reward: 150, color: 'var(--uncommon)' },
    { id: 'earn500', name: 'MMO Earner', desc: 'Earn 500 MMO total', icon: '💰', iconBg: 'rgba(245,158,11,0.2)', reward: 100, color: 'var(--legendary)' },
    { id: 'collect10', name: 'Discoverer', desc: 'Discover 10 creatures', icon: '📖', iconBg: 'rgba(6,182,212,0.2)', reward: 300, color: 'var(--accent2)' },
];

const ACHIEVEMENT_DEFS = [
    { id: 'first_open', name: 'First Contact', desc: 'Open your first capsule', icon: '🎯', reward: 50, done: false },
    { id: 'first_merge', name: 'Alchemist', desc: 'Perform your first merge', icon: '⚗️', reward: 100, done: false },
    { id: 'get_legendary', name: 'Legend Born', desc: 'Obtain a Legendary creature', icon: '🌟', reward: 500, done: false },
    { id: 'level5', name: 'Rising Star', desc: 'Reach Level 5', icon: '⭐', reward: 200, done: false },
];

function updateQuestProgress(id, value) {
    const q = state.quests[id];
    if (!q || q.done) return;
    q.progress = Math.min(value, q.target);
    if (q.progress >= q.target) {
        // Auto-notify but don't auto-claim
    }
    renderQuests();
}

function claimQuest(id) {
    const q = state.quests[id];
    if (!q || q.done || q.progress < q.target) return;
    const def = QUEST_DEFS.find(d => d.id === id);
    if (!def) return;
    q.done = true;
    state.balance += def.reward;
    addTransaction(`Quest: ${def.name}`, def.reward);
    addXP(30);
    saveState();
    updateHeader();
    renderQuests();
    showToast(`Quest complete! +${def.reward} MMO`, '✅');
}

function renderQuests() {
    const list = document.getElementById('questsList');
    list.innerHTML = QUEST_DEFS.map(def => {
        const q = state.quests[def.id];
        const pct = Math.min(100, (q.progress / q.target) * 100);
        const complete = q.progress >= q.target;
        return `<div class="quest-item ${q.done ? 'completed' : ''}">
            <div class="quest-icon" style="background:${def.iconBg}">${def.icon}</div>
            <div class="quest-info">
                <div class="quest-name">${def.name}</div>
                <div class="quest-desc">${def.desc} (${q.progress}/${q.target})</div>
                <div class="quest-progress-bar">
                    <div class="quest-progress-fill" style="width:${pct}%;background:${def.color}"></div>
                </div>
            </div>
            <div class="quest-reward">
                <div class="quest-reward-val">+${def.reward}</div>
                <button class="quest-claim-btn" ${(!complete || q.done) ? 'disabled' : ''} onclick="claimQuest('${def.id}')">
                    ${q.done ? 'DONE' : complete ? 'CLAIM' : 'LOCKED'}
                </button>
            </div>
        </div>`;
    }).join('');

    const achList = document.getElementById('achievementsList');
    achList.innerHTML = ACHIEVEMENT_DEFS.map(ach => {
        const unlocked = checkAchievement(ach.id);
        return `<div class="quest-item ${unlocked ? '' : 'completed'}">
            <div class="quest-icon" style="background:rgba(245,158,11,0.15)">${ach.icon}</div>
            <div class="quest-info">
                <div class="quest-name">${ach.name}</div>
                <div class="quest-desc">${ach.desc}</div>
            </div>
            <div class="quest-reward">
                <div class="quest-reward-val" style="color:var(--legendary)">+${ach.reward}</div>
                <div style="font-size:9px;color:${unlocked ? 'var(--uncommon)' : 'var(--text3)'}">
                    ${unlocked ? '✓ DONE' : 'LOCKED'}
                </div>
            </div>
        </div>`;
    }).join('');
}

function checkAchievement(id) {
    if (id === 'first_open') return state.capsulesOpened >= 1;
    if (id === 'first_merge') return state.mergeCount >= 1;
    if (id === 'get_legendary') return state.discovered.has('cyber_duck') || state.discovered.has('void_dragon') || state.discovered.has('omega_wolf') || state.discovered.has('god_duck');
    if (id === 'level5') return state.level >= 5;
    return false;
}

function showCapsuleModal(type) {
    const odds = RARITY_WEIGHTS[type];
    const cost = CAPSULE_COSTS[type];
    const title = type === 'premium' ? 'Premium DNA Capsule' : 'DNA Capsule';
    const canAfford = state.balance >= cost;
    
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const oddsHtml = rarities.map(r => {
        const pct = odds[r] || 0;
        if (pct === 0) return '';
        const color = RARITY_COLORS[r];
        return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="flex:1;font-size:12px;font-weight:600;color:${color};text-transform:uppercase">${r}</div>
            <div style="width:100px;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${color};border-radius:3px"></div>
            </div>
            <div style="width:35px;text-align:right;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;color:${color}">${pct}%</div>
        </div>`;
    }).join('');

    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${type === 'premium' ? 'rgba(245,158,11,0.8)' : 'rgba(124,58,237,0.8)'})">${type === 'premium' ? '💎' : '🧬'}</span>
        <div class="popup-title">${title}</div>
        <div class="popup-subtitle" style="margin-bottom:16px">
            Cost: <span style="color:${type === 'premium' ? 'var(--legendary)' : 'var(--accent3)'};font-weight:700">${cost} MMO</span>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:16px">
            <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Drop Rates</div>
            ${oddsHtml}
        </div>
        <button class="popup-btn" ${!canAfford ? 'disabled' : ''} style="${!canAfford ? 'opacity:0.5;cursor:not-allowed;background:var(--surface2)' : type === 'premium' ? 'background:linear-gradient(135deg,#b45309,#f59e0b)' : ''}" onclick="closeOverlay();openCapsule('${type}')">
            <i class="fa-solid fa-flask-vial"></i> ${canAfford ? 'OPEN NOW' : 'NOT ENOUGH MMO'}
        </button>
    `;

    document.getElementById('overlay').classList.add('show');
}

// ============================================================
// ADS
// ============================================================

function watchAd() {
    if (state.adsCooldown > 0) {
        showToast(`Ad available in ${state.adsCooldown}s`, '⏳');
        return;
    }

    const btn = document.getElementById('adsBtn');
    const timer = document.getElementById('adsTimer');
    const reward = document.getElementById('adsReward');
    
    btn.style.opacity = '0.5';
    btn.disabled = true;
    timer.textContent = '...';
    reward.textContent = '';

    showToast('Watching ad...', '📺');

    setTimeout(() => {
        state.balance += 50;
        state.adsCooldown = 30;
        addTransaction('Watch Ad Reward', 50);
        addXP(15);
        saveState();
        updateHeader();
        showToast('+50 MMO from ad!', '🎉');
        spawnFloatingMMO(50);
        renderCards();
        startAdsCooldown();
    }, 2000);
}

function startAdsCooldown() {
    const btn = document.getElementById('adsBtn');
    const timer = document.getElementById('adsTimer');
    const reward = document.getElementById('adsReward');
    
    const countdown = setInterval(() => {
        if (state.adsCooldown <= 0) {
            clearInterval(countdown);
            btn.style.opacity = '1';
            btn.disabled = false;
            timer.textContent = 'Ready';
            reward.textContent = '+50';
            return;
        }
        timer.textContent = `${state.adsCooldown}s`;
        state.adsCooldown--;
    }, 1000);
}

function tickAdsCooldown() {
    // Removed: cooldown now handled by startAdsCooldown()
}

// ============================================================
// SHOP
// ============================================================

// ============================================================
// MARKETPLACE
// ============================================================

function switchMarketplaceTab(tab) {
    document.querySelectorAll('.marketplace-subtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.marketplace-tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`marketplace-${tab}`).classList.add('active');
    event.target.closest('.marketplace-tab-btn').classList.add('active');

    if (tab === 'buy') renderMarketplaceBuy();
    if (tab === 'sell') renderMarketplaceSell();
    if (tab === 'mylistings') renderMarketplaceMyListings();
}

function renderMarketplaceBuy() {
    const listings = document.getElementById('marketplaceListings');

    // Mock marketplace listings from other players + own listings
    const mockListings = [
        { id: 'list1', seller: 'CryptoGene', creatureId: 'duck_r', price: 150, timestamp: Date.now() - 3600000 },
        { id: 'list2', seller: 'DNAKing', creatureId: 'dragon_e', price: 450, timestamp: Date.now() - 7200000 },
        { id: 'list3', seller: 'MutantX', creatureId: 'shark_r', price: 400, timestamp: Date.now() - 1800000 },
        { id: 'list4', seller: 'BioHacker', creatureId: 'unicorn_e', price: 1200, timestamp: Date.now() - 5400000 },
        { id: 'list5', seller: 'LabRat99', creatureId: 'wolf_u', price: 180, timestamp: Date.now() - 2700000 },
    ];

    const allListings = [...mockListings, ...state.myMarketplaceListings.map(l => ({
        ...l,
        seller: 'GENOME_X'
    }))];

    if (!allListings.length) {
        listings.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px 20px;font-size:12px">No listings available</div>`;
        return;
    }

    listings.innerHTML = allListings.map(l => {
        const c = getCreature(l.creatureId);
        if (!c) return '';
        const color = RARITY_COLORS[c.rarity];
        const timeAgo = Math.floor((Date.now() - l.timestamp) / 60000);
        const timeStr = timeAgo < 1 ? 'just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo/60)}h ago`;

        return `<div class="marketplace-listing">
            <div class="marketplace-listing-icon" style="background:${color}11;border-color:${color}44">${c.icon}</div>
            <div class="marketplace-listing-info">
                <div class="marketplace-listing-name">${c.name}</div>
                <div class="marketplace-listing-seller">by ${l.seller}</div>
                <div class="marketplace-listing-rarity badge-${c.rarity}">${c.rarity}</div>
            </div>
            <div class="marketplace-listing-price">
                <div class="marketplace-listing-amount">${l.price}</div>
                <button class="marketplace-buy-btn" onclick="buyFromMarketplace('${l.id}', ${l.price}, '${l.creatureId}', '${l.seller}')">BUY</button>
            </div>
        </div>`;
    }).join('');
}

function renderMarketplaceSell() {
    const cards = document.getElementById('marketplaceSellCards');
    if (!state.cards.length) {
        cards.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:30px 20px;font-size:12px">You have no creatures to sell</div>`;
        return;
    }

    cards.innerHTML = state.cards.map(card => {
        const c = getCreature(card.creatureId);
        if (!c || !card.count) return '';
        const color = RARITY_COLORS[c.rarity];

        return `<div class="marketplace-sell-card" style="border-color:${color}44;cursor:pointer" onclick="openSellModal('${card.creatureId}', '${c.name}', ${card.count})">
            <div class="marketplace-sell-card-icon">${c.icon}</div>
            <div class="marketplace-sell-card-name">${c.name}</div>
            <div style="font-size:9px;color:var(--text3)">x${card.count}</div>
            <div style="font-size:10px;color:var(--accent2);font-weight:600;margin-top:4px">SET PRICE</div>
        </div>`;
    }).filter(html => html).join('');
}

function openSellModal(creatureId, creatureName, count) {
    document.getElementById('popup').innerHTML = `
        <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
        <div class="popup-title">Sell ${creatureName}</div>
        <div class="popup-subtitle" style="margin-bottom:16px">Set your listing price</div>
        
        <div class="price-input-modal">
            <div>
                <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Price (MMO)</div>
                <input type="number" class="price-input-field" id="sellPriceInput" placeholder="Enter price" min="10" value="100" onkeyup="updateFeeCalculator()">
            </div>

            <div class="fee-calculator">
                <div class="fee-row">
                    <span class="fee-label">Your Price</span>
                    <span class="fee-value" id="priceDisplay">100</span>
                </div>
                <div class="fee-row" style="color:var(--mythic)">
                    <span class="fee-label">Platform Fee (10%)</span>
                    <span class="fee-value fee" id="feeDisplay">-10</span>
                </div>
                <div class="fee-row total">
                    <span>You Receive</span>
                    <span class="fee-value final" id="finalDisplay">90</span>
                </div>
            </div>
        </div>

        <button class="popup-btn" style="background:linear-gradient(135deg,var(--uncommon),#16a34a);margin-top:16px" onclick="confirmSellListing('${creatureId}')">
            <i class="fa-solid fa-check"></i> LIST FOR SALE
        </button>
        <button class="popup-btn" style="background:var(--surface2);color:var(--text);margin-top:8px" onclick="closeOverlay()">
            CANCEL
        </button>
    `;

    document.getElementById('overlay').classList.add('show');
    updateFeeCalculator();
}

function updateFeeCalculator() {
    const input = document.getElementById('sellPriceInput');
    const price = Math.max(10, parseInt(input.value) || 0);
    
    const fee = Math.floor(price * 0.1);
    const final = price - fee;

    document.getElementById('priceDisplay').textContent = price;
    document.getElementById('feeDisplay').textContent = `-${fee}`;
    document.getElementById('finalDisplay').textContent = final;
}

function confirmSellListing(creatureId) {
    const input = document.getElementById('sellPriceInput');
    const price = Math.max(10, parseInt(input.value) || 0);

    if (!price || price < 10) {
        showToast('Price must be at least 10 MMO', '❌');
        return;
    }

    const card = state.cards.find(c => c.creatureId === creatureId);
    if (!card || card.count < 1) {
        showToast('Creature not found', '❌');
        return;
    }

    const c = getCreature(creatureId);
    const listingId = 'list_' + Date.now();
    
    card.count--;
    if (card.count <= 0) {
        state.cards = state.cards.filter(c => c.creatureId !== creatureId);
    }
    
    state.myMarketplaceListings.push({
        id: listingId,
        creatureId,
        price,
        timestamp: Date.now()
    });

    saveState();
    closeOverlay();
    showToast(`${c.name} listed for ${price} MMO!`, '✅');
    renderCards();
    renderMarketplaceSell();
    switchMarketplaceTab('mylistings');
}

function renderMarketplaceMyListings() {
    const listings = document.getElementById('marketplaceMyListings');
    if (!state.myMarketplaceListings.length) {
        listings.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px 20px;font-size:12px">You have no active listings</div>`;
        return;
    }

    listings.innerHTML = state.myMarketplaceListings.map(l => {
        const c = getCreature(l.creatureId);
        const color = RARITY_COLORS[c.rarity];
        const timeAgo = Math.floor((Date.now() - l.timestamp) / 60000);
        const timeStr = timeAgo < 1 ? 'just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo/60)}h ago`;

        return `<div class="marketplace-my-listing">
            <div class="marketplace-my-listing-icon" style="background:${color}11;border-color:${color}44">${c.icon}</div>
            <div class="marketplace-my-listing-info">
                <div class="marketplace-my-listing-name">${c.name}</div>
                <div class="marketplace-my-listing-status">Listed ${timeStr}</div>
                <div class="marketplace-listing-rarity badge-${c.rarity}">${c.rarity}</div>
            </div>
            <div class="marketplace-my-listing-price">
                <div class="marketplace-my-listing-amount">${l.price}</div>
                <button class="marketplace-cancel-btn" onclick="cancelMarketplaceListing('${l.id}')">CANCEL</button>
            </div>
        </div>`;
    }).join('');
}

function listOnMarketplace(creatureId) {
    const priceInput = document.getElementById(`price_${creatureId}`);
    const price = parseInt(priceInput.value);

    if (!price || price < 10) {
        showToast('Price must be at least 10 MMO', '❌');
        return;
    }

    const card = state.cards.find(c => c.creatureId === creatureId);
    if (!card || card.count < 1) {
        showToast('Creature not found', '❌');
        return;
    }

    const c = getCreature(creatureId);
    const listingId = 'list_' + Date.now();
    
    // Remove card from inventory
    card.count--;
    if (card.count <= 0) {
        state.cards = state.cards.filter(c => c.creatureId !== creatureId);
    }
    
    state.myMarketplaceListings.push({
        id: listingId,
        creatureId,
        price,
        timestamp: Date.now()
    });

    saveState();
    renderCards();
    renderMarketplaceSell();
    showToast(`${c.name} listed for ${price} MMO!`, '✅');
    renderMarketplaceMyListings();
}

function cancelMarketplaceListing(listingId) {
    const listing = state.myMarketplaceListings.find(l => l.id === listingId);
    if (listing) {
        addCard(listing.creatureId);
    }
    state.myMarketplaceListings = state.myMarketplaceListings.filter(l => l.id !== listingId);
    saveState();
    renderCards();
    showToast('Listing cancelled, card returned', '✅');
    renderMarketplaceMyListings();
}

function buyFromMarketplace(listingId, price, creatureId, seller) {
    if (state.balance < price) {
        showToast(`Need ${price} MMO`, '❌');
        return;
    }

    const c = getCreature(creatureId);
    if (!c) {
        showToast('Item not found', '❌');
        return;
    }

    state.balance -= price;
    addCard(creatureId);
    addTransaction(`Marketplace: ${c.name} from ${seller}`, -price);
    addXP(5);

    // Remove listing from marketplace
    state.myMarketplaceListings = state.myMarketplaceListings.filter(l => l.id !== listingId);

    saveState();
    updateHeader();
    renderCards();
    renderMarketplaceBuy();
    showToast(`Bought ${c.name} for ${price} MMO!`, '✅');
    spawnFloatingMMO(-price);
}

// ============================================================
// FRIENDS
// ============================================================

function inviteFriend() {
    showToast('Invite link copied!', '🔗');
}

function claimFriendReward(requiredFriends, creatureId) {
    const currentFriends = MOCK_LEADERS.length - 1;
    
    if (currentFriends < requiredFriends) {
        showToast(`Need ${requiredFriends} friends (${currentFriends}/${requiredFriends})`, '❌');
        return;
    }

    const card = document.getElementById(`reward-${requiredFriends}`);
    if (!card || card.classList.contains('claimed')) {
        showToast('Already claimed!', 'ℹ️');
        return;
    }

    const c = getCreature(creatureId);
    if (!addCard(creatureId)) {
        showToast('Inventory full!', '📦');
        return;
    }

    card.classList.add('claimed');
    const btn = card.querySelector('.friends-reward-btn');
    btn.textContent = 'CLAIMED ✓';
    btn.style.background = 'var(--surface2)';
    btn.style.color = 'var(--text3)';
    btn.style.cursor = 'not-allowed';

    addXP(100);
    addTransaction(`Friend Reward: ${c.name}`, 0);
    saveState();
    renderCards();
    updateHeader();
    showToast(`Claimed ${c.name}!`, '🎉');
    spawnStars(c.rarity);
}

// ============================================================
// NAVIGATION
// ============================================================

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`nav-${tab}`).classList.add('active');

    document.getElementById('mainContent').scrollTop = 0;

    if (tab === 'friends') renderLeaderboard();
    if (tab === 'quests') renderQuests();
    if (tab === 'wallet') updateHeader();
    if (tab === 'shop') renderMarketplaceBuy();
}

// ============================================================
// TOAST
// ============================================================

function showToast(msg, icon = '') {
    const t = document.getElementById('toast');
    t.textContent = (icon ? icon + ' ' : '') + msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ============================================================
// EFFECTS
// ============================================================

function spawnStars(rarity) {
    const count = rarity === 'legendary' || rarity === 'mythic' ? 8 : rarity === 'epic' ? 5 : 3;
    const icons = ['✨', '⭐', '🌟', '💫', '✦'];
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'star-burst';
            el.textContent = icons[Math.floor(Math.random() * icons.length)];
            el.style.left = (30 + Math.random() * 40) + '%';
            el.style.top = (20 + Math.random() * 40) + '%';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 900);
        }, i * 80);
    }
}

function spawnFloatingMMO(amount) {
    const el = document.createElement('div');
    el.className = 'float-mmo';
    el.textContent = `+${amount} MMO`;
    el.style.left = '50%';
    el.style.top = '40%';
    el.style.transform = 'translateX(-50%)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
}

// ============================================================
// IDLE INCOME
// ============================================================

let lastTick = Date.now();
let totalEarnedForQuest = 0;

function idleTick() {
    const now = Date.now();
    const elapsed = (now - lastTick) / 1000;
    lastTick = now;

    const incomePerSec = totalIncomePerHour() / 3600;
    const earned = incomePerSec * elapsed;

    if (earned > 0) {
        state.balance += earned;
        totalEarnedForQuest += earned;
        updateQuestProgress('earn500', Math.floor(totalEarnedForQuest));
    }

    tickAdsCooldown();
    updateHeader();
    saveState();
}

// ============================================================
// INIT
// ============================================================

// RESET PROGRESS
localStorage.removeItem('dna_mmo_v2');
localStorage.removeItem('dna_mmo_lastSave');
state = {
    balance: 500,
    xp: 0,
    level: 1,
    cards: [],
    discovered: new Set(),
    totalIncome: 0,
    mergeCount: 0,
    capsulesOpened: 0,
    transactions: [],
    adsCooldown: 0,
    boostActive: false,
    boostEnd: 0,
    inventorySlots: 10,
    inventoryUpgrades: 0,
    quests: {
        open5: { done: false, progress: 0, target: 5 },
        merge3: { done: false, progress: 0, target: 3 },
        earn500: { done: false, progress: 0, target: 500 },
        collect10: { done: false, progress: 0, target: 10 },
    },
    marketplaceListings: [],
    myMarketplaceListings: [],
};
lastTick = Date.now();
totalEarnedForQuest = 0;

// Offline income
const lastSave = localStorage.getItem('dna_mmo_lastSave');
if (lastSave) {
    const offlineMs = Date.now() - parseInt(lastSave);
    const offlineSec = Math.min(offlineMs / 1000, 3600 * 8);
    const offlineIncome = (totalIncomePerHour() / 3600) * offlineSec;
    if (offlineIncome > 10) {
        state.balance += offlineIncome;
        totalEarnedForQuest += offlineIncome;
        addTransaction('Offline Income', Math.floor(offlineIncome));
        updateQuestProgress('earn500', Math.floor(totalEarnedForQuest));
        setTimeout(() => showToast(`+${formatNum(offlineIncome)} MMO offline income!`, '💤'), 1000);
    }
}
localStorage.setItem('dna_mmo_lastSave', Date.now().toString());

renderCards();
updateHeader();
updateUpgradeButton();
renderLeaderboard();
renderQuests();

setInterval(idleTick, 1000);
updateHeader();

// Initial welcome if new
if (state.capsulesOpened === 0 && state.balance === 500) {
    setTimeout(() => showToast('Welcome! Open a DNA Capsule to start!', '🧬'), 800);
}