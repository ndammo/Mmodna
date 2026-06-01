// ============================================================
// ЛОКАЛИЗАЦИЯ DNA MMO
// ============================================================

let currentLocale = localStorage.getItem('locale') || 'ru';

const translations = {
    ru: {
        // Navigation
        'nav.game': 'Игра',
        'nav.market': 'Маркет',
        'nav.rank': 'Рейтинг',
        'nav.friends': 'Друзья',
        'nav.special': 'Квесты',
        'nav.wallet': 'Кошелек',
        
        // Game tab
        'game.capsules': 'DNA Капсулы',
        'game.dnaCapsule': 'DNA КАПСУЛА',
        'game.premiumCapsule': 'ПРЕМИУМ DNA',
        'game.open': 'ОТКРЫТЬ',
        'game.watchAd': 'Смотреть Рекламу',
        'game.mmo': 'MMO',
        'game.ready': 'Готово',
        
        // Inventory
        'inventory.myCreatures': 'Мои Существа',
        'inventory.empty': 'Откройте капсулу, чтобы получить первое существо!',
        
        // Encyclopedia
        'encyclopedia.title': 'Коллекция Существ',
        'encyclopedia.subtitle': 'Откройте всех существ',
        
        // Marketplace
        'marketplace.title': 'Торговая Площадка',
        'marketplace.buy': 'Купить',
        'marketplace.sell': 'Продать',
        'marketplace.myListings': 'Мои',
        'marketplace.yourCreatures': 'Ваши Существа',
        'marketplace.yourListings': 'Ваши Лоты',
        'marketplace.loading': 'Загрузка...',
        'marketplace.noListings': 'Нет активных лотов',
        'marketplace.noCreatures': 'У вас нет существ для продажи',
        'marketplace.noMyListings': 'У вас нет активных лотов',
        'marketplace.error': 'Ошибка загрузки',
        'marketplace.price': 'Цена',
        'marketplace.setPrice': 'УСТАНОВИТЬ ЦЕНУ',
        'marketplace.listForSale': 'ВЫСТАВИТЬ НА ПРОДАЖУ',
        'marketplace.cancel': 'ОТМЕНИТЬ',
        'marketplace.buyNow': 'КУПИТЬ',
        'marketplace.platformFee': 'Комиссия платформы (10%)',
        'marketplace.youReceive': 'Вы получите',
        'marketplace.yourPrice': 'Ваша цена',
        
        // Leaderboard
        'leaderboard.title': 'Глобальный Рейтинг',
        'leaderboard.lvl': 'УР',
        'leaderboard.xp': 'ОП',
        'leaderboard.you': '(Вы)',
        
        // Friends
        'friends.inviteTitle': 'ПРИГЛАСИТЕ ДРУЗЕЙ',
        'friends.inviteBtn': 'ПРИГЛАСИТЬ ДРУГА',
        'friends.myFriends': 'Мои Друзья',
        'friends.noFriends': 'Нет друзей\nПригласите друзей и помогите им достичь 5 уровня!',
        'friends.friendsCount': '{count} друзей 5+ уровня из {total}',
        'friends.joined': 'Присоединился',
        'friends.needLevel': 'нужно {level} ур.',
        'friends.qualified': '✅ 5+ уровень',
        'friends.notQualified': '📈 нужно {left} ур.',
        'friends.levelRequirement': '🔥 ВАЖНО: Для получения наград друзья должны достичь 5 уровня!',
        
        // Special Quests
        'specialQuests.title': 'Особые Квесты',
        'specialQuests.noQuests': 'Нет активных спец-квестов',
        'specialQuests.comingSoon': 'Скоро появятся новые квесты!',
        'specialQuests.go': 'ПЕРЕЙТИ',
        'specialQuests.claim': 'ЗАБРАТЬ',
        'specialQuests.completed': 'ВЫПОЛНЕНО',
        'specialQuests.locked': 'НУЖНО {required} ДРУЗЕЙ 5+ УРОВНЯ ({current})',
        
        // Wallet (ОБНОВЛЁННЫЙ)
        'wallet.totalBalance': 'Общий Баланс',
        'wallet.deposit': 'ПОПОЛНИТЬ',
        'wallet.withdraw': 'ВЫВЕСТИ',
        'wallet.withdrawn': 'Выводы',
        'wallet.referralEarned': 'С рефералов',
        'wallet.adsWatched': 'Просмотров',
        'wallet.adsEarned': 'С рекламы',
        'wallet.activeRequests': 'Активных заявок: {count}/{max}',
        'wallet.pending': 'ОЖИДАНИЕ',
        'wallet.depositAmount': 'Сумма (MMO)',
        'wallet.withdrawAmount': 'Сумма (MMO)',
        'wallet.tonWallet': 'TON Кошелек',
        'wallet.minAmount': 'Минимальная сумма {min} MMO',
        'wallet.insufficientFunds': 'Недостаточно средств. Ваш баланс: {balance} MMO',
        'wallet.validWallet': 'Введите корректный TON адрес кошелька (минимум 20 символов)',
        'wallet.requestCreated': 'Заявка на {amount} MMO создана! Ожидайте подтверждения администратора.',
        'wallet.copied': 'Скопировано!',
        
        // Capsule Modal
        'capsule.premiumTitle': 'Премиум DNA Капсула',
        'capsule.basicTitle': 'DNA Капсула',
        'capsule.cost': 'Стоимость: {cost} MMO',
        'capsule.dropRates': 'Шансы выпадения',
        'capsule.notEnough': 'НЕДОСТАТОЧНО MMO',
        'capsule.openNow': 'ОТКРЫТЬ СЕЙЧАС',
        
        // Merge
        'merge.preview': 'Предпросмотр Слияния',
        'merge.input': 'Исходные',
        'merge.output': 'Результат',
        'merge.possibleOutcomes': 'Возможные результаты',
        'merge.success': 'Успех',
        'merge.fail': 'Провал',
        'merge.rankUp': '▲ ПОВЫШЕНИЕ',
        'merge.same': '= БЕЗ ИЗМЕНЕНИЙ',
        'merge.mergeNow': 'СЛИТЬ СЕЙЧАС',
        'merge.cancel': 'ОТМЕНА',
        'merge.evolutionSuccess': '🎉 Эволюция успешна!',
        'merge.failComplete': '❌ Провал! Существо не изменилось',
        'merge.evolution': 'ЭВОЛЮЦИЯ!',
        'merge.close': 'ЗАКРЫТЬ',
        'merge.successResult': '+РЕДКОСТЬ',
        'merge.sameResult': '=РЕДКОСТЬ',
        
        // Popups
        'popup.close': 'ЗАКРЫТЬ',
        'popup.awesome': 'ОТЛИЧНО!',
        'popup.owned': 'Владелец',
        
        // Transactions
        'transactions.none': 'Нет транзакций',
        'transactions.justNow': 'только что',
        'transactions.minAgo': '{minutes} мин назад',
        
        // Toast Messages
        'toast.tooFast': 'Слишком быстро! Подождите {seconds} секунд.',
        'toast.tooFast2': 'Слишком быстро! Подождите.',
        'toast.notEnoughMMO': 'Недостаточно MMO!',
        'toast.inventoryFull': 'Инвентарь полон! Улучшите хранилище',
        'toast.errorOpening': 'Ошибка открытия капсулы',
        'toast.mergeFailed': 'Ошибка слияния',
        'toast.needMore': 'Нужно {count} друзей 5+ уровня (у вас {current})',
        'toast.alreadyClaimed': 'Вы уже получили эту награду',
        'toast.watchingAd': 'Просмотр рекламы...',
        'toast.adReward': '+{amount} MMO за рекламу!',
        'toast.upgraded': '+1 слот! Теперь {slots} всего',
        'toast.creatureListed': '{name} выставлен на продажу за {price} MMO!',
        'toast.listingCancelled': 'Лот отменён, существо возвращено',
        'toast.bought': 'Куплен {name} за {price} MMO!',
        'toast.needPrice': 'Необходимо {price} MMO',
        'toast.errorListing': 'Ошибка при выставлении',
        'toast.errorBuying': 'Ошибка при покупке',
        'toast.copied': 'Ссылка скопирована!',
        
        // Errors
        'error.connection': 'Ошибка соединения',
        'error.server': 'Ошибка сервера',
        'error.sessionExpired': 'Сессия истекла',
        'error.unknown': 'Неизвестная ошибка',
        
        // Common
        'common.lvl': 'УР',
        'common.xp': 'ОП',
        'common.mmo': 'MMO',
        'common.hour': 'час',
        
        // Friend Rewards
        'friendReward.claimed': 'ПОЛУЧЕНО',
        'friendReward.claim': 'ЗАБРАТЬ',
        'friendReward.locked': '{friends} ДРУЗЕЙ 5+ УРОВНЯ',
        'friendReward.requirement': 'Требование: друзья должны достичь 5 уровня',
        
        // Encyclopedia
        'encyclopedia.discovered': 'обнаружено',
        'encyclopedia.undiscovered': '🔒 НЕ ОБНАРУЖЕНО',
        'encyclopedia.discoveredYes': '✓ ОБНАРУЖЕНО',
        
        // Ads Timer
        'ads.ready': 'Готово',
        'ads.wait': '{seconds}с'
    },
    en: {
        // Navigation
        'nav.game': 'Game',
        'nav.market': 'Market',
        'nav.rank': 'Rank',
        'nav.friends': 'Friends',
        'nav.special': 'Quests',
        'nav.wallet': 'Wallet',
        
        // Game tab
        'game.capsules': 'DNA Capsules',
        'game.dnaCapsule': 'DNA CAPSULE',
        'game.premiumCapsule': 'PREMIUM DNA',
        'game.open': 'OPEN',
        'game.watchAd': 'Watch Ad',
        'game.mmo': 'MMO',
        'game.ready': 'Ready',
        
        // Inventory
        'inventory.myCreatures': 'My Creatures',
        'inventory.empty': 'Open a capsule to get your first creature!',
        
        // Encyclopedia
        'encyclopedia.title': 'Collection Encyclopedia',
        'encyclopedia.subtitle': 'Discover all creatures',
        
        // Marketplace
        'marketplace.title': 'Marketplace',
        'marketplace.buy': 'Buy',
        'marketplace.sell': 'Sell',
        'marketplace.myListings': 'My',
        'marketplace.yourCreatures': 'Your Creatures',
        'marketplace.yourListings': 'Your Listings',
        'marketplace.loading': 'Loading...',
        'marketplace.noListings': 'No active listings',
        'marketplace.noCreatures': 'You have no creatures to sell',
        'marketplace.noMyListings': 'You have no active listings',
        'marketplace.error': 'Error loading',
        'marketplace.price': 'Price',
        'marketplace.setPrice': 'SET PRICE',
        'marketplace.listForSale': 'LIST FOR SALE',
        'marketplace.cancel': 'CANCEL',
        'marketplace.buyNow': 'BUY',
        'marketplace.platformFee': 'Platform Fee (10%)',
        'marketplace.youReceive': 'You Receive',
        'marketplace.yourPrice': 'Your Price',
        
        // Leaderboard
        'leaderboard.title': 'Global Leaderboard',
        'leaderboard.lvl': 'LVL',
        'leaderboard.xp': 'XP',
        'leaderboard.you': '(You)',
        
        // Friends
        'friends.inviteTitle': 'INVITE FRIENDS',
        'friends.inviteBtn': 'INVITE FRIEND',
        'friends.myFriends': 'My Friends',
        'friends.noFriends': 'No friends yet\nInvite friends and help them reach level 5!',
        'friends.friendsCount': '{count} friends level 5+ out of {total}',
        'friends.joined': 'Joined',
        'friends.needLevel': 'need {level} lvl',
        'friends.qualified': '✅ level 5+',
        'friends.notQualified': '📈 need {left} lvl',
        'friends.levelRequirement': '🔥 IMPORTANT: Friends must reach level 5 to count for rewards!',
        
        // Special Quests
        'specialQuests.title': 'Special Quests',
        'specialQuests.noQuests': 'No active special quests',
        'specialQuests.comingSoon': 'New quests coming soon!',
        'specialQuests.go': 'GO',
        'specialQuests.claim': 'CLAIM',
        'specialQuests.completed': 'COMPLETED',
        'specialQuests.locked': 'NEED {required} FRIENDS LEVEL 5+ ({current})',
        
        // Wallet (UPDATED)
        'wallet.totalBalance': 'Total Balance',
        'wallet.deposit': 'DEPOSIT',
        'wallet.withdraw': 'WITHDRAW',
        'wallet.withdrawn': 'Withdrawn',
        'wallet.referralEarned': 'From Referrals',
        'wallet.adsWatched': 'Ads Watched',
        'wallet.adsEarned': 'From Ads',
        'wallet.activeRequests': 'Active requests: {count}/{max}',
        'wallet.pending': 'PENDING',
        'wallet.depositAmount': 'Amount (MMO)',
        'wallet.withdrawAmount': 'Amount (MMO)',
        'wallet.tonWallet': 'TON Wallet',
        'wallet.minAmount': 'Minimum amount {min} MMO',
        'wallet.insufficientFunds': 'Insufficient funds. Your balance: {balance} MMO',
        'wallet.validWallet': 'Enter a valid TON wallet address (min 20 characters)',
        'wallet.requestCreated': 'Withdraw request for {amount} MMO created! Wait for admin approval.',
        'wallet.copied': 'Copied!',
        
        // Capsule Modal
        'capsule.premiumTitle': 'Premium DNA Capsule',
        'capsule.basicTitle': 'DNA Capsule',
        'capsule.cost': 'Cost: {cost} MMO',
        'capsule.dropRates': 'Drop Rates',
        'capsule.notEnough': 'NOT ENOUGH MMO',
        'capsule.openNow': 'OPEN NOW',
        
        // Merge
        'merge.preview': 'Merge Preview',
        'merge.input': 'Input',
        'merge.output': 'Output',
        'merge.possibleOutcomes': 'Possible Outcomes',
        'merge.success': 'Success',
        'merge.fail': 'Fail',
        'merge.rankUp': '▲ RANK UP',
        'merge.same': '= SAME',
        'merge.mergeNow': 'MERGE NOW',
        'merge.cancel': 'CANCEL',
        'merge.evolutionSuccess': '🎉 Evolution successful!',
        'merge.failComplete': '❌ Fail! Creature unchanged',
        'merge.evolution': 'EVOLUTION!',
        'merge.close': 'CLOSE',
        'merge.successResult': '+RARITY',
        'merge.sameResult': '=RARITY',
        
        // Popups
        'popup.close': 'CLOSE',
        'popup.awesome': 'AWESOME!',
        'popup.owned': 'Owned',
        
        // Transactions
        'transactions.none': 'No transactions yet',
        'transactions.justNow': 'just now',
        'transactions.minAgo': '{minutes}m ago',
        
        // Toast Messages
        'toast.tooFast': 'Too fast! Wait {seconds} seconds.',
        'toast.tooFast2': 'Too fast! Please wait.',
        'toast.notEnoughMMO': 'Not enough MMO!',
        'toast.inventoryFull': 'Inventory full! Upgrade storage',
        'toast.errorOpening': 'Error opening capsule',
        'toast.mergeFailed': 'Merge failed',
        'toast.needMore': 'Need {count} friends level 5+ (you have {current})',
        'toast.alreadyClaimed': 'You already claimed this reward',
        'toast.watchingAd': 'Watching ad...',
        'toast.adReward': '+{amount} MMO from ad!',
        'toast.upgraded': '+1 slot! Now {slots} total',
        'toast.creatureListed': '{name} listed for {price} MMO!',
        'toast.listingCancelled': 'Listing cancelled, card returned',
        'toast.bought': 'Bought {name} for {price} MMO!',
        'toast.needPrice': 'Need {price} MMO',
        'toast.errorListing': 'Error listing',
        'toast.errorBuying': 'Error buying',
        'toast.copied': 'Link copied!',
        
        // Errors
        'error.connection': 'Connection error',
        'error.server': 'Server error',
        'error.sessionExpired': 'Session expired',
        'error.unknown': 'Unknown error',
        
        // Common
        'common.lvl': 'LVL',
        'common.xp': 'XP',
        'common.mmo': 'MMO',
        'common.hour': 'hr',
        
        // Friend Rewards
        'friendReward.claimed': 'CLAIMED',
        'friendReward.claim': 'CLAIM',
        'friendReward.locked': '{friends} FRIENDS LEVEL 5+',
        'friendReward.requirement': 'Requirement: friends must reach level 5',
        
        // Encyclopedia
        'encyclopedia.discovered': 'discovered',
        'encyclopedia.undiscovered': '🔒 UNDISCOVERED',
        'encyclopedia.discoveredYes': '✓ DISCOVERED',
        
        // Ads Timer
        'ads.ready': 'Ready',
        'ads.wait': '{seconds}s'
    }
};

function t(key, params = {}) {
    let text = translations[currentLocale]?.[key] || translations['en'][key] || key;
    Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
    return text;
}

function applyLocaleStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t(key);
            } else {
                el.textContent = t(key);
            }
        }
    });
}

function setLanguage(lang) {
    currentLocale = lang;
    localStorage.setItem('locale', lang);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    applyLocaleStatic();
    
    const friendsHeroSub = document.querySelector('.friends-hero-sub');
    if (friendsHeroSub) {
        friendsHeroSub.innerHTML = `🔥 <strong>${t('friends.levelRequirement').replace('🔥 ', '')}</strong>`;
    }
    
    if (typeof window.updateHeader === 'function') window.updateHeader();
    if (typeof window.renderCards === 'function') window.renderCards();
    if (typeof window.renderLeaderboard === 'function') window.renderLeaderboard();
    if (typeof window.renderSpecialQuests === 'function') window.renderSpecialQuests();
    if (typeof window.renderFriendsList === 'function') window.renderFriendsList();
    if (typeof window.updateFriendRewardButtons === 'function') window.updateFriendRewardButtons();
    if (typeof window.renderMarketplaceBuy === 'function' && document.getElementById('marketplace-buy')?.classList.contains('active')) window.renderMarketplaceBuy();
    if (typeof window.renderMarketplaceSell === 'function' && document.getElementById('marketplace-sell')?.classList.contains('active')) window.renderMarketplaceSell();
    if (typeof window.renderMarketplaceMyListings === 'function' && document.getElementById('marketplace-mylistings')?.classList.contains('active')) window.renderMarketplaceMyListings();
    if (typeof window.loadUserStats === 'function') window.loadUserStats();
    
    if (typeof window.showToast === 'function') {
        window.showToast(`🌐 Language: ${lang.toUpperCase()}`, '✅');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyLocaleStatic();
    
    setTimeout(() => {
        const activeBtn = document.querySelector(`.lang-btn[data-lang="${currentLocale}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        } else {
            const ruBtn = document.querySelector('.lang-btn[data-lang="ru"]');
            if (ruBtn) ruBtn.classList.add('active');
        }
    }, 100);
});

window.t = t;
window.setLanguage = setLanguage;
window.currentLocale = currentLocale;
window.applyLocaleStatic = applyLocaleStatic;