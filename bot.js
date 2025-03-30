
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();

// Replace 'YOUR_BOT_TOKEN' with your actual bot token from BotFather
const token = '7314377304:AAFavnxEksxiWaZ3pZOkhXnmQ31h3TYfslA';
const bot = new TelegramBot(token, {polling: true});

// Simple webpage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Telegram Bot Status</title>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
          .status { padding: 20px; background: #e8f5e9; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>Telegram Bot Status</h1>
        <div class="status">
          <h2>✅ Bot is running</h2>
          <p>The bot is active and listening for messages.</p>
        </div>
      </body>
    </html>
  `);
});

// Almacenamiento de usuarios muteados por grupo
const mutedUsers = new Map();

// Función para verificar si un usuario es administrador
async function isAdmin(chatId, userId) {
  try {
    const chatMember = await bot.getChatMember(chatId, userId);
    return ['creator', 'administrator'].includes(chatMember.status);
  } catch (error) {
    return false;
  }
}

// Basic bot commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '¡Hola! Soy tu bot. Usa /help para ver los comandos.');
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Comandos disponibles:\n/start - Iniciar bot\n/help - Ver comandos\n/mute @usuario - Mutear usuario\n/unmute @usuario - Desmutear usuario\n/listmute - Ver usuarios muteados');
});

// Comando mute
bot.onText(/\/mute (@\w+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1];
  
  if (!await isAdmin(chatId, msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Solo los administradores pueden usar este comando.');
  }

  if (!mutedUsers.has(chatId)) {
    mutedUsers.set(chatId, new Set());
  }
  
  mutedUsers.get(chatId).add(username);
  bot.sendMessage(chatId, `🔇 ${username} ha sido muteado.`);
});

// Comando unmute
bot.onText(/\/unmute (@\w+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1];
  
  if (!await isAdmin(chatId, msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Solo los administradores pueden usar este comando.');
  }

  if (mutedUsers.has(chatId)) {
    mutedUsers.get(chatId).delete(username);
    bot.sendMessage(chatId, `🔊 ${username} ha sido desmuteado.`);
  }
});

// Comando listmute
bot.onText(/\/listmute/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!await isAdmin(chatId, msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Solo los administradores pueden usar este comando.');
  }

  const mutedList = mutedUsers.get(chatId);
  if (!mutedList || mutedList.size === 0) {
    return bot.sendMessage(chatId, '📝 No hay usuarios muteados en este grupo.');
  }
  
  const userList = Array.from(mutedList).join('\n');
  bot.sendMessage(chatId, `📝 Usuarios muteados en este grupo:\n${userList}`);
});

// Listener para borrar mensajes de usuarios muteados
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (msg.from.username && mutedUsers.has(chatId)) {
    const username = '@' + msg.from.username;
    if (mutedUsers.get(chatId).has(username)) {
      bot.deleteMessage(chatId, msg.message_id);
    }
  }
});

// Start web server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
