process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;

const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME || 'Dnammobot';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://ndammo.github.io/Mmodna';
const CHAT_LINK = 'https://t.me/+PYDJcgmaaU05ZGU6';
const CHANNEL_LINK = 'https://t.me/mmoDNA';
const API_URL = process.env.API_URL || 'https://serv-production-dbf3.up.railway.app';

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN not set');
    process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected (bot)'))
    .catch(err => console.error('MongoDB error:', err));

const UserSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    balance: { type: Number, default: 500 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    mergeCount: { type: Number, default: 0 },
    capsulesOpened: { type: Number, default: 0 },
    inventorySlots: { type: Number, default: 10 },
    inventoryUpgrades: { type: Number, default: 0 },
    discovered: [{ type: String }],
    completedSpecialQuests: [{ type: String }],
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    referralCount: { type: Number, default: 0 },
    lastDailyBonus: { type: Date, default: null },
    lastLogin: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

//  ADMIN_IDS  .env
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

//     
async function notifyAdmins(message, replyMarkup = null) {
    if (!BOT_TOKEN || ADMIN_IDS.length === 0) return;
    
    for (const adminId of ADMIN_IDS) {
        try {
            const body = {
                chat_id: adminId,
                text: message,
                parse_mode: 'HTML'
            };
            if (replyMarkup) {
                body.reply_markup = replyMarkup;
            }
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            console.log(`    ${adminId}`);
        } catch (e) {
            console.error('Failed to send admin notification:', e);
        }
    }
}

//     (/)
async function processTransaction(chatId, callbackId, requestId, action, bot, callbackQuery) {
    try {
        //  JWT   (      )
        //         
        const response = await fetch(`${API_URL}/api/admin/transaction-request/${requestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, note: '' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await bot.answerCallbackQuery(callbackId, { 
                text: `  ${action === 'approve' ? '' : ''}!`,
                show_alert: false 
            });
            
            //   
            const originalText = callbackQuery.message.text;
            const newText = originalText + `\n\n${action === 'approve' ? ' ' : ' '}`;
            
            await bot.editMessageText(newText, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'HTML'
            });
            
            //  inline 
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id
            });
        } else {
            await bot.answerCallbackQuery(callbackId, { 
                text: ` : ${result.message}`,
                show_alert: true 
            });
        }
    } catch (e) {
        console.error('processTransaction error:', e);
        await bot.answerCallbackQuery(callbackId, { 
            text: `  : ${e.message}`,
            show_alert: true 
        });
    }
}

async function startBot() {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drop_pending_updates: true })
        });
        const result = await response.json();
        console.log('Webhook deleted:', result);
        
        await new Promise(r => setTimeout(r, 1000));
        
        const bot = new TelegramBot(BOT_TOKEN, { polling: true });
        
        bot.on('polling_error', (err) => {
            console.log('Polling error:', err.message);
            if (err.message.includes('409')) {
                console.log('Conflict! Another bot instance is running.');
                process.exit(1);
            }
        });
        
        // ============================================
        //  /start
        // ============================================
        bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = String(msg.from.id);
            const username = msg.from.username || '';
            const firstName = msg.from.first_name || '';
            const referralCode = match ? match[1] : null;
            
            try {
                let user = await User.findOne({ telegramId });
                
                if (!user) {
                    const newReferralCode = 'REF' + telegramId + Math.random().toString(36).slice(2, 7).toUpperCase();
                    user = new User({
                        telegramId, username, firstName,
                        referralCode: newReferralCode, balance: 500
                    });
                    
                    let referrerInfo = null;
                    
                    if (referralCode && referralCode !== newReferralCode) {
                        const referrer = await User.findOne({ referralCode });
                        if (referrer && referrer.telegramId !== telegramId) {
                            user.referredBy = referrer.telegramId;
                            user.balance = 750;
                            referrer.referralCount += 1;
                            await referrer.save();
                            referrerInfo = referrer;
                            console.log(` : ${firstName}  ${referrer.username || referrer.firstName}`);
                        }
                    }
                    await user.save();
                    
                    const inviterName = referrerInfo 
                        ? (referrerInfo.username || referrerInfo.firstName || referrerInfo.telegramId)
                        : (referralCode ? ' ' : '');
                    
                    const notificationMessage = ` <b> !</b>\n\n` +
                        ` ID: <code>${telegramId}</code>\n` +
                        ` : ${firstName} ${msg.from.last_name || ''}\n` +
                        ` Username: ${username ? '@' + username : ''}\n` +
                        ` : ${inviterName}\n` +
                        ` : ${user.balance} MMO\n` +
                        ` : ${new Date().toLocaleString()}`;
                    
                    await notifyAdmins(notificationMessage);
                } else {
                    user.username = username || user.username;
                    user.firstName = firstName || user.firstName;
                    user.lastLogin = new Date();
                    await user.save();
                }
                
                let webappUrl = WEBAPP_URL;
                if (referralCode) {
                    webappUrl += `?startapp=${referralCode}`;
                }
                
                const message = ` Welcome to DNA MMO, ${firstName}!\n\n` +
                    ` Balance: ${user.balance} MMO\n` +
                    ` Level: ${user.level}\n` +
                    ` Friends: ${user.referralCount}\n\n` +
                    ` Press "START GAME" to begin!`;
                
                await bot.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: ' START GAME', web_app: { url: webappUrl } }],
                            [{ text: ' OUR CHAT', url: CHAT_LINK }],
                            [{ text: ' OUR CHANNEL', url: CHANNEL_LINK }]
                        ]
                    }
                });
            } catch (err) {
                console.error('Start error:', err);
                await bot.sendMessage(chatId, 'Error. Please try again.');
            }
        });
        
        // ============================================
        //  callback_query ( /)
        // ============================================
        bot.on('callback_query', async (callbackQuery) => {
            const data = callbackQuery.data;
            const chatId = callbackQuery.message.chat.id;
            const adminId = String(callbackQuery.from.id);
            
            if (!ADMIN_IDS.includes(adminId)) {
                await bot.answerCallbackQuery(callbackQuery.id, { 
                    text: '     ', 
                    show_alert: true 
                });
                return;
            }
            
            if (data.startsWith('approve_')) {
                const requestId = data.replace('approve_', '');
                await processTransaction(chatId, callbackQuery.id, requestId, 'approve', bot, callbackQuery);
            } else if (data.startsWith('reject_')) {
                const requestId = data.replace('reject_', '');
                await processTransaction(chatId, callbackQuery.id, requestId, 'reject', bot, callbackQuery);
            } else {
                await bot.answerCallbackQuery(callbackQuery.id, { 
                    text: '  ', 
                    show_alert: false 
                });
            }
        });
        
        // ============================================
        //  /approve_xxx ( )
        // ============================================
        bot.onText(/\/approve_(.+)/, async (msg, match) => {
            const adminId = String(msg.from.id);
            if (!ADMIN_IDS.includes(adminId)) {
                await bot.sendMessage(msg.chat.id, '     ');
                return;
            }
            
            const requestId = match[1];
            const chatId = msg.chat.id;
            
            try {
                const response = await fetch(`${API_URL}/api/admin/transaction-request/${requestId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'approve', note: '' })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    await bot.sendMessage(chatId, `  #${requestId.slice(-8)} !`);
                } else {
                    await bot.sendMessage(chatId, ` : ${result.message}`);
                }
            } catch (e) {
                console.error('approve error:', e);
                await bot.sendMessage(chatId, `  : ${e.message}`);
            }
        });
        
        // ============================================
        //  /reject_xxx ( )
        // ============================================
        bot.onText(/\/reject_(.+)/, async (msg, match) => {
            const adminId = String(msg.from.id);
            if (!ADMIN_IDS.includes(adminId)) {
                await bot.sendMessage(msg.chat.id, '     ');
                return;
            }
            
            const requestId = match[1];
            const chatId = msg.chat.id;
            
            try {
                const response = await fetch(`${API_URL}/api/admin/transaction-request/${requestId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'reject', note: '' })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    await bot.sendMessage(chatId, `  #${requestId.slice(-8)} !`);
                } else {
                    await bot.sendMessage(chatId, ` : ${result.message}`);
                }
            } catch (e) {
                console.error('reject error:', e);
                await bot.sendMessage(chatId, `  : ${e.message}`);
            }
        });
        
        // ============================================
        //   
        // ============================================
        bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;
            if (text && text.startsWith('/')) return;
            
            await bot.sendMessage(chatId, ' DNA MMO\n\n Press "START GAME" to begin!', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: ' START GAME', web_app: { url: WEBAPP_URL } }],
                        [{ text: ' OUR CHAT', url: CHAT_LINK }],
                        [{ text: ' OUR CHANNEL', url: CHANNEL_LINK }]
                    ]
                }
            });
        });
        
        console.log(`Bot @${BOT_USERNAME} started successfully`);
        console.log(` Admins: ${ADMIN_IDS.join(', ') || 'not set'}`);
        return bot;
        
    } catch (err) {
        console.error('Failed to start bot:', err.message);
        process.exit(1);
    }
}

startBot();

mongoose.connection.once('open', async () => {
    const userCount = await User.countDocuments();
    console.log(`Database has ${userCount} users`);
    console.log(`Game: ${WEBAPP_URL}`);
});

console.log('Bot initializing...');