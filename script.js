// ============================================================
// CONFIG
// ============================================================
const API_URL = 'https://serv-production-dbf3.up.railway.app'; // ← замените на ваш URL
// В dev режиме можно использовать: const API_URL = 'http://localhost:3000';

// ============================================================
// GAME DATA (только для отображения, логика на сервере)
// ============================================================
const CREATURES = [
  { id:'duck_c',       name:'Duck',         rarity:'common',    icon:'🦆', incomeBase:2,    desc:'Young waterfowl. Just starting to learn.' },
  { id:'duck_u',       name:'Duck',         rarity:'uncommon',  icon:'🦆', incomeBase:8,    desc:'Mature waterfowl. Skilled swimmer.' },
  { id:'duck_r',       name:'Duck',         rarity:'rare',      icon:'🦆', incomeBase:25,   desc:'Ancient waterfowl. Master of waters.' },
  { id:'duck_e',       name:'Duck',         rarity:'epic',      icon:'🦆', incomeBase:80,   desc:'Eternal waterfowl. Supreme mastery.' },
  { id:'duck_l',       name:'Duck',         rarity:'legendary', icon:'🦆', incomeBase:250,  desc:'Divine waterfowl. Reality bender.' },
  { id:'owl_c',        name:'Owl',          rarity:'common',    icon:'🦉', incomeBase:2,    desc:'Small night hunter. Learning to fly.' },
  { id:'owl_u',        name:'Owl',          rarity:'uncommon',  icon:'🦉', incomeBase:8,    desc:'Experienced night hunter. Sharp talons.' },
  { id:'owl_r',        name:'Owl',          rarity:'rare',      icon:'🦉', incomeBase:25,   desc:'Wise night guardian. All-seeing.' },
  { id:'owl_e',        name:'Owl',          rarity:'epic',      icon:'🦉', incomeBase:80,   desc:'Eternal guardian. Infinite wisdom.' },
  { id:'owl_l',        name:'Owl',          rarity:'legendary', icon:'🦉', incomeBase:250,  desc:'Divine guardian. All-knowing entity.' },
  { id:'shark_c',      name:'Shark',        rarity:'common',    icon:'🦈', incomeBase:2,    desc:'Young predator. Testing the waters.' },
  { id:'shark_u',      name:'Shark',        rarity:'uncommon',  icon:'🦈', incomeBase:8,    desc:'Experienced apex predator. Deadly bite.' },
  { id:'shark_r',      name:'Shark',        rarity:'rare',      icon:'🦈', incomeBase:25,   desc:'Legendary predator. Ocean terror.' },
  { id:'shark_e',      name:'Shark',        rarity:'epic',      icon:'🦈', incomeBase:80,   desc:'Eternal terror. Endless hunger.' },
  { id:'shark_l',      name:'Shark',        rarity:'legendary', icon:'🦈', incomeBase:250,  desc:'Divine terror. Apex of apex.' },
  { id:'wolf_c',       name:'Wolf',         rarity:'common',    icon:'🐺', incomeBase:2,    desc:'Young pack member. Growing stronger.' },
  { id:'wolf_u',       name:'Wolf',         rarity:'uncommon',  icon:'🐺', incomeBase:8,    desc:'Pack leader in training. Strong hunter.' },
  { id:'wolf_r',       name:'Wolf',         rarity:'rare',      icon:'🐺', incomeBase:25,   desc:'Alpha wolf. Pack dominance.' },
  { id:'wolf_e',       name:'Wolf',         rarity:'epic',      icon:'🐺', incomeBase:80,   desc:'Eternal alpha. Infinite power.' },
  { id:'wolf_l',       name:'Wolf',         rarity:'legendary', icon:'🐺', incomeBase:250,  desc:'Divine alpha. Dimension walker.' },
  { id:'dragon_c',     name:'Dragon',       rarity:'common',    icon:'🐉', incomeBase:2,    desc:'Young fire breather. Learning to roar.' },
  { id:'dragon_u',     name:'Dragon',       rarity:'uncommon',  icon:'🐉', incomeBase:8,    desc:'Grown fire breather. Breathing flames.' },
  { id:'dragon_r',     name:'Dragon',       rarity:'rare',      icon:'🐉', incomeBase:25,   desc:'Ancient fire drake. Blazing power.' },
  { id:'dragon_e',     name:'Dragon',       rarity:'epic',      icon:'🐉', incomeBase:80,   desc:'Eternal flame. Infinite fire.' },
  { id:'dragon_l',     name:'Dragon',       rarity:'legendary', icon:'🐉', incomeBase:250,  desc:'Divine flame. Eternal inferno.' },
  { id:'unicorn_c',    name:'Unicorn',      rarity:'common',    icon:'🦄', incomeBase:2,    desc:'Young magical beast. Horn growing.' },
  { id:'unicorn_u',    name:'Unicorn',      rarity:'uncommon',  icon:'🦄', incomeBase:8,    desc:'Magical evolution. Horn shines bright.' },
  { id:'unicorn_r',    name:'Unicorn',      rarity:'rare',      icon:'🦄', incomeBase:25,   desc:'Rare magical entity. Pure magic.' },
  { id:'unicorn_e',    name:'Unicorn',      rarity:'epic',      icon:'🦄', incomeBase:80,   desc:'Eternal magic. Pure radiance.' },
  { id:'unicorn_l',    name:'Unicorn',      rarity:'legendary', icon:'🦄', incomeBase:250,  desc:'Divine magic. Existence itself.' },
  { id:'lion_mythic',  name:'Lion',         rarity:'mythic',    icon:'🦁', incomeBase:1000, desc:'THE MYTHIC KING. Absolute power.' },
  { id:'panther_mythic',name:'Black Panther',rarity:'mythic',   icon:'🐆', incomeBase:2000, desc:'TOP 1 SEASON. Beyond comprehension.' },
];

const RARITY_COLORS = {
  common:'#94a3b8', uncommon:'#22c55e', rare:'#3b82f6',
  epic:'#a855f7', legendary:'#f59e0b', mythic:'#ef4444'
};
const RARITY_ORDER = ['common','uncommon','rare','epic','legendary','mythic'];
const CAPSULE_COSTS = { basic: 50, premium: 200 };
const RARITY_WEIGHTS = {
  basic:   { common:80, uncommon:20, rare:0,  epic:0, legendary:0 },
  premium: { common:60, uncommon:30, rare:10, epic:2, legendary:1 }
};

// ============================================================
// STATE (синхронизируется с сервером)
// ============================================================
let state = {
  token: null,
  user: null,
  inventory: [],       // [{ _id, creatureId, count }]
  incomePerHour: 0,
  adsCooldown: 0,
  isLoading: false,
};

// ============================================================
// API HELPER
// ============================================================
async function apiRequest(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(API_URL + path, opts);
    const data = await res.json();
    if (!res.ok) {
      console.warn(`API ${path} error:`, data.message);
    }
    return data;
  } catch (e) {
    console.error(`API ${path} fetch error:`, e);
    return { success: false, message: 'Нет соединения с сервером' };
  }
}

// ============================================================
// TELEGRAM WEB APP INIT
// ============================================================
async function initTelegramApp() {
  showLoadingScreen(true);

  // Инициализируем Telegram WebApp
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#080b14');
    tg.setBackgroundColor('#080b14');
  }

  // Получаем initData
  let initData = tg?.initData || '';
  let tgUser = tg?.initDataUnsafe?.user;

  // Dev режим: если нет Telegram, создаём тестового пользователя
  if (!initData && window.location.hostname === 'localhost') {
    console.warn('⚠️ Dev mode: using mock Telegram user');
    const mockUser = { id: 123456789, first_name: 'Test', username: 'testuser' };
    initData = `user=${encodeURIComponent(JSON.stringify(mockUser))}&hash=devhash`;
    tgUser = mockUser;
  }

  if (!initData) {
    showLoadingScreen(false);
    showToast('Открой игру через Telegram!', '⚠️');
    return;
  }

  // Авторизуемся
  const referralCode = new URLSearchParams(window.location.search).get('ref') ||
                       tg?.initDataUnsafe?.start_param || null;

  const loginRes = await apiRequest('POST', '/api/auth/login', { initData, referralCode });

  if (!loginRes.success) {
    showLoadingScreen(false);
    showToast(loginRes.message || 'Ошибка авторизации', '❌');
    return;
  }

  // Сохраняем токен и данные
  state.token = loginRes.token;
  state.user = loginRes.user;
  state.inventory = loginRes.inventory || [];

  // Обновляем UI с данными пользователя
  updatePlayerInfo();

  // Загружаем полный профиль (с пассивным доходом)
  const profileRes = await apiRequest('GET', '/api/user/profile');
  if (profileRes.success) {
    state.user = profileRes.user;
    state.inventory = profileRes.inventory || [];
    state.incomePerHour = profileRes.incomePerHour || 0;

    if (profileRes.offlineEarned > 10) {
      setTimeout(() => showToast(`+${formatNum(profileRes.offlineEarned)} MMO offline income!`, '💤'), 1000);
    }
  }

  showLoadingScreen(false);
  renderAll();

  // Запускаем тики
  setInterval(idleTick, 5000);     // каждые 5 сек синхронизируем доход
  setInterval(updateAdsTimer, 1000); // таймер рекламы

  if (loginRes.isNewUser) {
    setTimeout(() => showToast('Welcome! Open a DNA Capsule to start!', '🧬'), 800);
  }
}

// ============================================================
// LOADING SCREEN
// ============================================================
function showLoadingScreen(show) {
  let el = document.getElementById('loadingScreen');
  if (!el && show) {
    el = document.createElement('div');
    el.id = 'loadingScreen';
    el.style.cssText = `
      position:fixed;inset:0;background:var(--bg);z-index:9999;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
    `;
    el.innerHTML = `
      <div style="font-size:48px;animation:float 1.5s ease-in-out infinite">🧬</div>
      <div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:var(--accent3)">DNA MMO</div>
      <div style="font-size:12px;color:var(--text2)">Loading...</div>
      <div style="width:120px;height:3px;background:var(--border);border-radius:2px;overflow:hidden">
        <div style="height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:2px;animation:loadBar 1.5s ease-in-out infinite"></div>
      </div>
    `;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes loadBar {
        0%{width:0%} 50%{width:80%} 100%{width:100%}
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(el);
  } else if (el && !show) {
    el.style.transition = 'opacity 0.4s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }
}

// ============================================================
// HELPERS
// ============================================================
function getCreature(id) { return CREATURES.find(c => c.id === id); }
function formatNum(n) {
  n = Math.floor(n);
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}
function getUsedSlots() {
  return state.inventory.reduce((s, i) => s + i.count, 0);
}
function getUpgradeCost() {
  return Math.floor(100 * Math.pow(1.5, state.user?.inventoryUpgrades || 0));
}
function canMerge(creatureId) {
  const item = state.inventory.find(i => i.creatureId === creatureId);
  const c = getCreature(creatureId);
  return item && item.count >= 3 && c && c.rarity !== 'legendary' && c.rarity !== 'mythic';
}
function getLevelTitle(lvl) {
  if (lvl >= 20) return 'God Scientist';
  if (lvl >= 15) return 'DNA Master';
  if (lvl >= 10) return 'Geneticist';
  if (lvl >= 5)  return 'Lab Expert';
  if (lvl >= 3)  return 'Biologist';
  return 'Researcher';
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
// UPDATE UI
// ============================================================
function updatePlayerInfo() {
  if (!state.user) return;
  const u = state.user;
  const name = u.username || u.firstName || 'GENOME_X';
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
  renderQuests();
}

function updateHeader() {
  if (!state.user) return;
  const u = state.user;

  // Пересчитываем доход на клиенте
  let income = 0;
  state.inventory.forEach(item => {
    const c = getCreature(item.creatureId);
    if (c) income += c.incomeBase * item.count;
  });
  state.incomePerHour = income;

  document.getElementById('balanceDisplay').textContent = formatNum(u.balance);
  document.getElementById('incomeDisplay').textContent = `+${formatNum(income)}/hr`;

  const needed = u.level * 100;
  document.getElementById('xpLabel').textContent = `XP ${u.xp}/${needed}`;
  document.getElementById('xpFill').style.width = `${Math.min(100, (u.xp / needed) * 100)}%`;
  document.getElementById('playerLevelLabel').textContent = `LVL ${u.level} · ${getLevelTitle(u.level)}`;

  // Wallet
  document.getElementById('walletBalance').textContent = formatNum(u.balance);
  document.getElementById('walletSub').textContent = `≈ ${(u.balance * 0.001).toFixed(3)} USD`;
  document.getElementById('walletIncome').textContent = formatNum(income);
  document.getElementById('walletCards').textContent = state.inventory.reduce((s, i) => s + i.count, 0);
  document.getElementById('walletMerges').textContent = u.mergeCount || 0;
  document.getElementById('walletStorage').textContent = `${getUsedSlots()}/${u.inventorySlots}`;

  updateUpgradeButton();
  renderTransactions();
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

// ============================================================
// RENDER CARDS
// ============================================================
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;

  if (!state.inventory.length) {
    grid.innerHTML = `<div class="empty-grid"><i class="fa-solid fa-dna"></i>Open a capsule to get your first creature!</div>`;
    document.getElementById('inventorySlots').textContent = `0/${state.user?.inventorySlots || 10}`;
    document.getElementById('encyclopediaProgress').textContent = `${state.user?.discovered?.length || 0}/${CREATURES.length}`;
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
    const color = RARITY_COLORS[c.rarity];
    const merge = canMerge(item.creatureId);
    return `<div class="creature-card ${c.rarity}" onclick="onCardClick('${item.creatureId}')">
      ${merge ? `<div class="merge-ready-badge">MERGE!</div>` : ''}
      ${item.count > 1 ? `<div class="card-count">${item.count}</div>` : ''}
      <div class="card-icon">${c.icon}</div>
      <div class="card-name">${c.name}</div>
      <div class="card-rarity-badge badge-${c.rarity}">${c.rarity}</div>
      <div class="card-income"><i class="fa-solid fa-bolt" style="font-size:7px"></i>${c.incomeBase}/hr</div>
    </div>`;
  }).join('');

  document.getElementById('inventorySlots').textContent = `${getUsedSlots()}/${state.user?.inventorySlots || 10}`;
  document.getElementById('encyclopediaProgress').textContent = `${state.user?.discovered?.length || 0}/${CREATURES.length}`;
}

// ============================================================
// CAPSULE
// ============================================================
function showCapsuleModal(type) {
  const odds = RARITY_WEIGHTS[type];
  const cost = CAPSULE_COSTS[type];
  const title = type === 'premium' ? 'Premium DNA Capsule' : 'DNA Capsule';
  const canAfford = (state.user?.balance || 0) >= cost;
  const rarities = ['common','uncommon','rare','epic','legendary'];

  const oddsHtml = rarities.map(r => {
    const pct = odds[r] || 0;
    if (!pct) return '';
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
    <button class="popup-btn" ${!canAfford ? 'disabled' : ''} 
      style="${!canAfford ? 'opacity:0.5;cursor:not-allowed;background:var(--surface2)' : type === 'premium' ? 'background:linear-gradient(135deg,#b45309,#f59e0b)' : ''}" 
      onclick="closeOverlay();openCapsule('${type}')">
      <i class="fa-solid fa-flask-vial"></i> ${canAfford ? 'OPEN NOW' : 'NOT ENOUGH MMO'}
    </button>
  `;
  document.getElementById('overlay').classList.add('show');
}

async function openCapsule(type) {
  if (state.isLoading) return;

  const cost = CAPSULE_COSTS[type];
  if ((state.user?.balance || 0) < cost) {
    showToast('Not enough MMO!', '❌'); return;
  }
  if (getUsedSlots() >= (state.user?.inventorySlots || 10)) {
    showToast('Inventory full! Upgrade storage', '📦'); return;
  }

  state.isLoading = true;

  // Анимация капсулы
  const cardEl = document.getElementById(type === 'premium' ? 'premiumCapsuleCard' : 'basicCapsuleCard');
  const iconEl = cardEl?.querySelector('.capsule-icon');
  iconEl?.classList.add('capsule-opening');
  setTimeout(() => iconEl?.classList.remove('capsule-opening'), 600);

  const res = await apiRequest('POST', '/api/game/open-capsule', { type });
  state.isLoading = false;

  if (!res.success) {
    showToast(res.message || 'Error opening capsule', '❌'); return;
  }

  state.user = res.user;
  state.inventory = res.inventory;

  updateHeader();
  renderCards();

  setTimeout(() => showCapsulePopup(res.creature), 300);
}

function showCapsulePopup(creature) {
  const c = getCreature(creature.id) || creature;
  const color = RARITY_COLORS[c.rarity];

  document.getElementById('popup').innerHTML = `
    <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
    <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${color})">${c.icon}</span>
    <div class="popup-title" style="color:${color}">${c.name}</div>
    <div class="popup-subtitle">${c.desc || ''}</div>
    <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">${c.rarity.toUpperCase()}</div>
    <div class="popup-stats">
      <div class="popup-stat">
        <div class="popup-stat-val" style="color:${color}">${c.incomeBase}</div>
        <div class="popup-stat-label">MMO/hr</div>
      </div>
      <div class="popup-stat">
        <div class="popup-stat-val">${c.rarity === 'legendary' ? '★★★★★' : c.rarity === 'epic' ? '★★★★' : c.rarity === 'rare' ? '★★★' : c.rarity === 'uncommon' ? '★★' : '★'}</div>
        <div class="popup-stat-label">Rating</div>
      </div>
    </div>
    <button class="popup-btn" onclick="closeOverlay()">AWESOME!</button>
  `;
  document.getElementById('overlay').classList.add('show');
  spawnStars(c.rarity);
}

// ============================================================
// CARD CLICK
// ============================================================
function onCardClick(creatureId) {
  const c = getCreature(creatureId);
  if (!c) return;
  const item = state.inventory.find(i => i.creatureId === creatureId);
  const color = RARITY_COLORS[c.rarity];

  document.getElementById('popup').innerHTML = `
    <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
    <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${color})">${c.icon}</span>
    <div class="popup-title" style="color:${color}">${c.name}</div>
    <div class="popup-subtitle">${c.desc || ''}</div>
    <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">${c.rarity.toUpperCase()}</div>
    <div class="popup-stats">
      <div class="popup-stat">
        <div class="popup-stat-val" style="color:${color}">${c.incomeBase}</div>
        <div class="popup-stat-label">MMO/hr each</div>
      </div>
      <div class="popup-stat">
        <div class="popup-stat-val">${item ? item.count : 0}</div>
        <div class="popup-stat-label">Owned</div>
      </div>
    </div>
    ${canMerge(creatureId)
      ? `<button class="popup-btn" style="background:linear-gradient(135deg,#16a34a,#22c55e)" onclick="closeOverlay();showMergePreview('${creatureId}')">
           <i class="fa-solid fa-code-merge"></i> MERGE x3
         </button>`
      : `<button class="popup-btn" onclick="closeOverlay()">CLOSE</button>`
    }
  `;
  document.getElementById('overlay').classList.add('show');
}

// ============================================================
// MERGE
// ============================================================
function showMergePreview(creatureId) {
  const creature = getCreature(creatureId);
  if (!creature) return;
  if (creature.rarity === 'legendary') { showToast('Legendary is max!', '⭐'); return; }

  const currentRarityIdx = RARITY_ORDER.indexOf(creature.rarity);
  const nextRarity = currentRarityIdx < RARITY_ORDER.length - 2 ? RARITY_ORDER[currentRarityIdx + 1] : creature.rarity;
  const nextCreature = CREATURES.find(c => c.name === creature.name && c.rarity === nextRarity) || creature;
  const color = RARITY_COLORS[creature.rarity];

  document.getElementById('popup').innerHTML = `
    <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
    <div class="popup-title" style="margin-bottom:4px">Merge Preview</div>
    <div class="popup-subtitle">3x ${creature.name} → ?</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="text-align:center;flex:1">
          <div style="font-size:24px;margin-bottom:6px">${creature.icon}</div>
          <div style="font-size:10px;color:var(--text2)">Input</div>
          <div style="font-size:11px;font-weight:600;color:var(--text);margin-top:2px">3x ${creature.name}</div>
        </div>
        <div style="color:var(--text3);font-size:18px">→</div>
        <div style="text-align:center;flex:1">
          <div style="font-size:24px;margin-bottom:6px">?</div>
          <div style="font-size:10px;color:var(--text2)">Output</div>
          <div style="font-size:11px;font-weight:600;color:var(--text);margin-top:2px">Unknown</div>
        </div>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:14px">
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Possible Outcomes</div>
        <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:10px;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px">
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
            <span style="font-size:18px">${creature.icon}</span>
            <div style="flex:1">
              <div style="font-size:11px;font-weight:600;color:var(--legendary)">70% Mutation</div>
              <div style="font-size:10px;color:var(--text2)">${creature.name} (${creature.rarity.toUpperCase()})</div>
            </div>
            <div style="font-size:12px;font-weight:700;color:var(--legendary)">= SAME</div>
          </div>
        </div>
      </div>
    </div>
    <button class="popup-btn" style="background:linear-gradient(135deg,#16a34a,#22c55e);margin-bottom:8px" onclick="closeOverlay();executeMerge('${creatureId}')">
      <i class="fa-solid fa-code-merge"></i> MERGE NOW
    </button>
    <button class="popup-btn" style="background:var(--surface2);color:var(--text)" onclick="closeOverlay()">CANCEL</button>
  `;
  document.getElementById('overlay').classList.add('show');
}

async function executeMerge(creatureId) {
  if (state.isLoading) return;
  if (!canMerge(creatureId)) return;

  state.isLoading = true;
  const res = await apiRequest('POST', '/api/game/merge', { creatureId });
  state.isLoading = false;

  if (!res.success) {
    showToast(res.message || 'Merge failed', '❌'); return;
  }

  state.user = res.user;
  state.inventory = res.inventory;

  updateHeader();
  renderCards();
  showMergeResultPopup(res.fromCreature, res.resultCreature, res.upgraded);
}

function showMergeResultPopup(from, to, success) {
  const fromC = getCreature(from.id) || from;
  const toC = getCreature(to.id) || to;
  const color = RARITY_COLORS[toC.rarity];

  document.getElementById('popup').innerHTML = `
    <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
    <div class="merge-popup-cards">
      <div class="merge-card-mini">${fromC.icon}</div>
      <div class="merge-card-mini">${fromC.icon}</div>
      <div class="merge-card-mini">${fromC.icon}</div>
      <div class="merge-arrow"><i class="fa-solid fa-arrow-right"></i></div>
      <div class="merge-card-mini" style="border-color:${color};box-shadow:0 0 12px ${color}44;font-size:32px">${toC.icon}</div>
    </div>
    <div class="popup-title" style="color:${color}">${toC.name}</div>
    <div class="popup-subtitle">${success ? '🎉 Evolution successful!' : '⚗️ Mutation complete!'}</div>
    <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">
      ${toC.rarity.toUpperCase()} ${success ? '▲ UPGRADED' : ''}
    </div>
    <div class="popup-stats">
      <div class="popup-stat">
        <div class="popup-stat-val" style="color:${color}">${toC.incomeBase}</div>
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
  if (success) spawnStars(toC.rarity);
}

// ============================================================
// UPGRADE INVENTORY
// ============================================================
async function upgradeInventory() {
  if (state.isLoading) return;
  const cost = getUpgradeCost();
  if ((state.user?.balance || 0) < cost) {
    showToast(`Need ${cost} MMO to upgrade!`, '❌'); return;
  }

  state.isLoading = true;
  const res = await apiRequest('POST', '/api/game/upgrade-inventory');
  state.isLoading = false;

  if (!res.success) {
    showToast(res.message || 'Error', '❌'); return;
  }

  state.user = res.user;
  updateHeader();
  renderCards();
  showToast(`+1 slot! Now ${state.user.inventorySlots} total`, '📦');
}

// ============================================================
// ADS
// ============================================================
async function watchAd() {
  if (state.isLoading) return;

  // Проверяем кулдаун на клиенте
  if (state.adsCooldown > 0) {
    showToast(`Ad available in ${state.adsCooldown}s`, '⏳'); return;
  }

  const btn = document.getElementById('adsBtn');
  const timer = document.getElementById('adsTimer');
  const reward = document.getElementById('adsReward');
  if (btn) { btn.style.opacity = '0.5'; btn.disabled = true; }
  if (timer) timer.textContent = '...';
  if (reward) reward.textContent = '';

  showToast('Watching ad...', '📺');

  // Симулируем просмотр рекламы
  await new Promise(r => setTimeout(r, 2000));

  state.isLoading = true;
  const res = await apiRequest('POST', '/api/game/watch-ad');
  state.isLoading = false;

  if (!res.success) {
    if (btn) { btn.style.opacity = '1'; btn.disabled = false; }
    if (timer) timer.textContent = 'Ready';
    if (reward) reward.textContent = '+50';
    showToast(res.message || 'Error', '❌');
    return;
  }

  state.user = res.user;
  state.adsCooldown = 30;
  updateHeader();
  showToast('+50 MMO from ad!', '🎉');
  spawnFloatingMMO(50);
}

function updateAdsTimer() {
  const btn = document.getElementById('adsBtn');
  const timer = document.getElementById('adsTimer');
  const reward = document.getElementById('adsReward');

  // Синхронизируем с сервером
  if (state.user?.adsCooldownUntil) {
    const secondsLeft = Math.ceil((new Date(state.user.adsCooldownUntil) - Date.now()) / 1000);
    state.adsCooldown = Math.max(0, secondsLeft);
  }

  if (state.adsCooldown > 0) {
    state.adsCooldown--;
    if (btn) { btn.style.opacity = '0.5'; btn.disabled = true; }
    if (timer) timer.textContent = `${state.adsCooldown}s`;
    if (reward) reward.textContent = '';
  } else {
    if (btn) { btn.style.opacity = '1'; btn.disabled = false; }
    if (timer) timer.textContent = 'Ready';
    if (reward) reward.textContent = '+50';
  }
}

// ============================================================
// IDLE TICK (каждые 5 секунд)
// ============================================================
async function idleTick() {
  if (!state.token || state.isLoading) return;

  const res = await apiRequest('POST', '/api/game/income-tick');
  if (res.success && res.earned > 0) {
    state.user.balance = res.balance;
    updateHeader();
  }
}

// ============================================================
// TRANSACTIONS
// ============================================================
function renderTransactions() {
  const list = document.getElementById('txList');
  if (!list) return;
  const txs = state.user?.transactions || [];
  if (!txs.length) {
    list.innerHTML = `<div style="text-align:center;color:var(--text3);padding:20px;font-size:12px">No transactions yet</div>`;
    return;
  }
  list.innerHTML = txs.slice(0, 10).map(tx => {
    const isPos = tx.amount > 0;
    const isNeg = tx.amount < 0;
    const icon = isPos ? '⬆️' : isNeg ? '⬇️' : '🔀';
    const color = isPos ? 'rgba(34,197,94,0.15)' : isNeg ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)';
    const timeAgo = Math.floor((Date.now() - new Date(tx.time).getTime()) / 60000);
    const timeStr = timeAgo < 1 ? 'just now' : `${timeAgo}m ago`;
    return `<div class="tx-item">
      <div class="tx-icon" style="background:${color}"><span style="font-size:16px">${icon}</span></div>
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
// ENCYCLOPEDIA
// ============================================================
function showEncyclopedia() {
  const discovered = new Set(state.user?.discovered || []);
  const total = CREATURES.length;
  const found = discovered.size;

  const grouped = {};
  RARITY_ORDER.forEach(r => grouped[r] = []);
  CREATURES.forEach(c => { if (grouped[c.rarity]) grouped[c.rarity].push(c); });

  const sections = RARITY_ORDER.map(rarity => {
    if (!grouped[rarity].length) return '';
    const color = RARITY_COLORS[rarity];
    const items = grouped[rarity].map(c => {
      const isFound = discovered.has(c.id);
      return `<div class="coll-item ${isFound ? 'found' : 'not-found'}" style="${isFound ? `border-color:${color}44` : ''};cursor:pointer" onclick="showCreatureInfo('${c.id}')">
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
  const discovered = new Set(state.user?.discovered || []);
  const isFound = discovered.has(creatureId);
  const color = RARITY_COLORS[c.rarity];

  document.getElementById('popup').innerHTML = `
    <div class="popup-close" onclick="showEncyclopedia()"><i class="fa-solid fa-arrow-left"></i></div>
    <span class="popup-icon" style="filter:drop-shadow(0 0 16px ${color})">${c.icon}</span>
    <div class="popup-title" style="color:${color}">${c.name}</div>
    <div class="popup-subtitle">${c.desc || ''}</div>
    <div class="popup-rarity" style="background:${color}22;color:${color};border:1px solid ${color}44">
      ${c.rarity.toUpperCase()} ${isFound ? '✓ DISCOVERED' : '🔒 UNDISCOVERED'}
    </div>
    <div class="popup-stats">
      <div class="popup-stat">
        <div class="popup-stat-val" style="color:${color}">${c.incomeBase}</div>
        <div class="popup-stat-label">MMO/hr</div>
      </div>
      <div class="popup-stat">
        <div class="popup-stat-val">${c.rarity === 'legendary' ? '★★★★★' : c.rarity === 'epic' ? '★★★★' : c.rarity === 'rare' ? '★★★' : c.rarity === 'uncommon' ? '★★' : '★'}</div>
        <div class="popup-stat-label">Power</div>
      </div>
    </div>
  `;
  document.getElementById('overlay').classList.add('show');
}

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

async function renderMarketplaceBuy() {
  const container = document.getElementById('marketplaceListings');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;color:var(--text2);padding:20px;font-size:12px">Loading...</div>`;

  const res = await apiRequest('GET', '/api/marketplace/listings');
  if (!res.success) {
    container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px;font-size:12px">Error loading listings</div>`;
    return;
  }

  const listings = res.listings || [];
  if (!listings.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px 20px;font-size:12px">No listings available</div>`;
    return;
  }

  container.innerHTML = listings.map(l => {
    const c = getCreature(l.creatureId);
    if (!c) return '';
    const color = RARITY_COLORS[c.rarity];
    const timeAgo = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 60000);
    const timeStr = timeAgo < 1 ? 'just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo/60)}h ago`;
    const isOwn = l.sellerTgId === state.user?.telegramId;

    return `<div class="marketplace-listing">
      <div class="marketplace-listing-icon" style="background:${color}11;border-color:${color}44">${c.icon}</div>
      <div class="marketplace-listing-info">
        <div class="marketplace-listing-name">${c.name}</div>
        <div class="marketplace-listing-seller">by ${l.sellerName}${isOwn ? ' (You)' : ''}</div>
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
    cards.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:30px 20px;font-size:12px">You have no creatures to sell</div>`;
    return;
  }

  cards.innerHTML = state.inventory.map(item => {
    const c = getCreature(item.creatureId);
    if (!c || !item.count) return '';
    const color = RARITY_COLORS[c.rarity];
    return `<div class="marketplace-sell-card" style="border-color:${color}44;cursor:pointer" onclick="openSellModal('${item.creatureId}', '${c.name}', ${item.count})">
      <div class="marketplace-sell-card-icon">${c.icon}</div>
      <div class="marketplace-sell-card-name">${c.name}</div>
      <div style="font-size:9px;color:var(--text3)">x${item.count}</div>
      <div style="font-size:10px;color:var(--accent2);font-weight:600;margin-top:4px">SET PRICE</div>
    </div>`;
  }).filter(Boolean).join('');
}

function openSellModal(creatureId, creatureName, count) {
  document.getElementById('popup').innerHTML = `
    <div class="popup-close" onclick="closeOverlay()"><i class="fa-solid fa-xmark"></i></div>
    <div class="popup-title">Sell ${creatureName}</div>
    <div class="popup-subtitle" style="margin-bottom:16px">Set your listing price</div>
    <div class="price-input-modal">
      <div>
        <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Price (MMO)</div>
        <input type="number" class="price-input-field" id="sellPriceInput" placeholder="Enter price" min="10" value="100" oninput="updateFeeCalculator()">
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
    <button class="popup-btn" style="background:var(--surface2);color:var(--text);margin-top:8px" onclick="closeOverlay()">CANCEL</button>
  `;
  document.getElementById('overlay').classList.add('show');
  updateFeeCalculator();
}

function updateFeeCalculator() {
  const input = document.getElementById('sellPriceInput');
  if (!input) return;
  const price = Math.max(10, parseInt(input.value) || 0);
  const fee = Math.floor(price * 0.1);
  document.getElementById('priceDisplay').textContent = price;
  document.getElementById('feeDisplay').textContent = `-${fee}`;
  document.getElementById('finalDisplay').textContent = price - fee;
}

async function confirmSellListing(creatureId) {
  const input = document.getElementById('sellPriceInput');
  const price = Math.max(10, parseInt(input?.value) || 0);

  if (price < 10) { showToast('Price must be at least 10 MMO', '❌'); return; }

  state.isLoading = true;
  const res = await apiRequest('POST', '/api/marketplace/list', { creatureId, price });
  state.isLoading = false;

  if (!res.success) {
    showToast(res.message || 'Error listing', '❌'); return;
  }

  state.inventory = res.inventory;
  closeOverlay();
  const c = getCreature(creatureId);
  showToast(`${c?.name || 'Creature'} listed for ${price} MMO!`, '✅');
  renderCards();
  renderMarketplaceSell();
  switchMarketplaceTab('mylistings');
}

async function renderMarketplaceMyListings() {
  const container = document.getElementById('marketplaceMyListings');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;color:var(--text2);padding:20px;font-size:12px">Loading...</div>`;

  const res = await apiRequest('GET', '/api/marketplace/my-listings');
  if (!res.success) {
    container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px;font-size:12px">Error</div>`;
    return;
  }

  const listings = res.listings || [];
  if (!listings.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--text3);padding:30px 20px;font-size:12px">You have no active listings</div>`;
    return;
  }

  container.innerHTML = listings.map(l => {
    const c = getCreature(l.creatureId);
    if (!c) return '';
    const color = RARITY_COLORS[c.rarity];
    const timeAgo = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 60000);
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
        <button class="marketplace-cancel-btn" onclick="cancelMarketplaceListing('${l._id}')">CANCEL</button>
      </div>
    </div>`;
  }).join('');
}

async function cancelMarketplaceListing(listingId) {
  state.isLoading = true;
  const res = await apiRequest('POST', '/api/marketplace/cancel', { listingId });
  state.isLoading = false;

  if (!res.success) {
    showToast(res.message || 'Error', '❌'); return;
  }

  state.inventory = res.inventory;
  renderCards();
  renderMarketplaceMyListings();
  showToast('Listing cancelled, card returned', '✅');
}

async function buyFromMarketplace(listingId, price, creatureId) {
  if (state.isLoading) return;
  if ((state.user?.balance || 0) < price) {
    showToast(`Need ${price} MMO`, '❌'); return;
  }

  state.isLoading = true;
  const res = await apiRequest('POST', '/api/marketplace/buy', { listingId });
  state.isLoading = false;

  if (!res.success) {
    showToast(res.message || 'Error buying', '❌'); return;
  }

  state.user = res.user;
  state.inventory = res.inventory;

  const c = getCreature(creatureId);
  updateHeader();
  renderCards();
  renderMarketplaceBuy();
  showToast(`Bought ${c?.name || 'creature'} for ${price} MMO!`, '✅');
  spawnFloatingMMO(-price);
}

// ============================================================
// LEADERBOARD
// ============================================================
async function renderLeaderboard() {
  const list = document.getElementById('leaderboardList');
  if (!list) return;

  if (!state.token) {
    // Показываем заглушку если не авторизованы
    list.innerHTML = `<div style="text-align:center;color:var(--text3);padding:20px;font-size:12px">Loading...</div>`;
    return;
  }

  const res = await apiRequest('GET', '/api/user/leaderboard');
  if (!res.success) {
    list.innerHTML = `<div style="text-align:center;color:var(--text3);padding:20px;font-size:12px">Error loading leaderboard</div>`;
    return;
  }

  const leaders = res.leaders || [];
  list.innerHTML = leaders.map(l => {
    const rank = l.rank;
    const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    const color = l.isMe ? 'var(--accent3)' : '#94a3b8';
    return `<div class="lb-item ${l.isMe ? 'me' : ''}">
      <div class="lb-rank ${rankClass}">${rankIcon}</div>
      <div class="lb-avatar" style="background:${color}33;border:1px solid ${color}44;color:${color}">${l.username[0]?.toUpperCase() || '?'}</div>
      <div class="lb-info">
        <div class="lb-name">${l.username} ${l.isMe ? '<span style="font-size:9px;color:var(--accent3)">(You)</span>' : ''}</div>
        <div class="lb-level">LVL ${l.level} · ${getLevelTitle(l.level)}</div>
      </div>
      <div class="lb-score">${formatNum(l.balance)}</div>
    </div>`;
  }).join('');
}

// ============================================================
// QUESTS
// ============================================================
const QUEST_DEFS = [
  { id:'open5',    name:'Capsule Collector', desc:'Open 5 DNA capsules',      icon:'🧬', iconBg:'rgba(124,58,237,0.2)',  reward:200, color:'var(--accent3)' },
  { id:'merge3',   name:'Merge Master',      desc:'Merge 3 times',            icon:'🔀', iconBg:'rgba(34,197,94,0.2)',   reward:150, color:'var(--uncommon)' },
  { id:'earn500',  name:'MMO Earner',         desc:'Earn 500 MMO total',       icon:'💰', iconBg:'rgba(245,158,11,0.2)', reward:100, color:'var(--legendary)' },
  { id:'collect10',name:'Discoverer',         desc:'Discover 10 creatures',    icon:'📖', iconBg:'rgba(6,182,212,0.2)',  reward:300, color:'var(--accent2)' },
];

const ACHIEVEMENT_DEFS = [
  { id:'first_open',  name:'First Contact', desc:'Open your first capsule',       icon:'🎯', reward:50 },
  { id:'first_merge', name:'Alchemist',     desc:'Perform your first merge',      icon:'⚗️', reward:100 },
  { id:'get_legendary',name:'Legend Born',  desc:'Obtain a Legendary creature',   icon:'🌟', reward:500 },
  { id:'level5',      name:'Rising Star',   desc:'Reach Level 5',                 icon:'⭐', reward:200 },
];

function checkAchievement(id) {
  if (!state.user) return false;
  const discovered = new Set(state.user.discovered || []);
  if (id === 'first_open')   return (state.user.capsulesOpened || 0) >= 1;
  if (id === 'first_merge')  return (state.user.mergeCount || 0) >= 1;
  if (id === 'get_legendary') return CREATURES.filter(c => c.rarity === 'legendary').some(c => discovered.has(c.id));
  if (id === 'level5')       return (state.user.level || 1) >= 5;
  return false;
}

function renderQuests() {
  const list = document.getElementById('questsList');
  const achList = document.getElementById('achievementsList');
  if (!list || !achList) return;

  const quests = state.user?.quests || {};

  list.innerHTML = QUEST_DEFS.map(def => {
    const q = quests[def.id] || { done: false, progress: 0, target: def.id === 'open5' ? 5 : def.id === 'merge3' ? 3 : def.id === 'earn500' ? 500 : 10 };
    const pct = Math.min(100, (q.progress / q.target) * 100);
    const complete = q.progress >= q.target;
    return `<div class="quest-item ${q.done ? 'completed' : ''}">
      <div class="quest-icon" style="background:${def.iconBg}">${def.icon}</div>
      <div class="quest-info">
        <div class="quest-name">${def.name}</div>
        <div class="quest-desc">${def.desc} (${Math.floor(q.progress)}/${q.target})</div>
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

async function claimQuest(questId) {
  if (state.isLoading) return;
  state.isLoading = true;
  const res = await apiRequest('POST', '/api/game/claim-quest', { questId });
  state.isLoading = false;

  if (!res.success) {
    showToast(res.message || 'Error', '❌'); return;
  }

  state.user = res.user;
  updateHeader();
  renderQuests();
  showToast(`Quest complete! +${res.reward} MMO`, '✅');
}

// ============================================================
// FRIENDS
// ============================================================
async function inviteFriend() {
  const res = await apiRequest('GET', '/api/user/referrals');
  const link = res.referralLink || `https://t.me/your_bot?start=${state.user?.referralCode}`;

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join DNA MMO and get bonus MMO!')}`);
  } else {
    try {
      await navigator.clipboard.writeText(link);
      showToast('Invite link copied!', '🔗');
    } catch {
      showToast(link, '🔗');
    }
  }
}

function claimFriendReward(requiredFriends, creatureId) {
  const currentFriends = state.user?.referralCount || 0;
  if (currentFriends < requiredFriends) {
    showToast(`Need ${requiredFriends} friends (${currentFriends}/${requiredFriends})`, '❌');
    return;
  }
  showToast('Feature coming soon!', 'ℹ️');
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

  if (tab === 'leaderboard') renderLeaderboard();
  if (tab === 'quests')      renderQuests();
  if (tab === 'wallet')      updateHeader();
  if (tab === 'shop')        renderMarketplaceBuy();
}

// ============================================================
// OVERLAY
// ============================================================
function closeOverlay(e) {
  if (e && e.target !== document.getElementById('overlay')) return;
  document.getElementById('overlay').classList.remove('show');
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
  const icons = ['✨','⭐','🌟','💫','✦'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'star-burst';
      el.textContent = icons[Math.floor(Math.random() * icons.length)];
      el.style.left = (30 + Math.random() * 40) + '%';
      el.style.top  = (20 + Math.random() * 40) + '%';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }, i * 80);
  }
}

function spawnFloatingMMO(amount) {
  const el = document.createElement('div');
  el.className = 'float-mmo';
  el.textContent = `${amount > 0 ? '+' : ''}${amount} MMO`;
  el.style.left = '50%';
  el.style.top  = '40%';
  el.style.transform = 'translateX(-50%)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTelegramApp();
});