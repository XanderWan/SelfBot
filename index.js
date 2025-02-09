const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
require('dotenv').config();

const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
})

client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return; // Ensure the bot only responds to its own commands

  if (message.content === 'hello all!') {
    try {
      // Fetch only the last 20 messages
      const messages = await message.channel.messages.fetch({ limit: 20 });
      const allMessages = [...messages.map(msg => ({ 
        username: msg.author.username, 
        content: msg.content 
      }))];
      
      fs.writeFileSync('messages.json', JSON.stringify(allMessages, null, 2));
      console.log('Last 20 messages saved to messages.json');
      
      // Import and call the analyzeChatHistory function
      const { analyzeChatHistory } = require('./openapiCaller');
      await analyzeChatHistory();
      
      // message.channel.send('All messages saved and analyzed.');
    } catch (error) {
      console.error('Error fetching messages:', error);
      console.log('Failed to fetch or analyze messages');
      // message.channel.send('Failed to fetch or analyze messages.');
    }
  }
});

async function fetchAllMessages(channel) {
  const messages = [];
  let lastMessageId = null;

  while (true) {
    const batch = await channel.messages.fetch({
      limit: 100,
      before: lastMessageId
    });
    if (batch.size === 0) break;

    const processedBatch = batch.map(msg => ({
      // Core message data (Critical)
      id: msg.id,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      channelId: msg.channelId,
      
      // User context (High priority)
      author: {
        id: msg.author.id,
        username: msg.author.username
      },
      mentions: {
        users: Array.from(msg.mentions.users.values()).map(u => u.id),
        roles: Array.from(msg.mentions.roles.values()).map(r => r.id)
      },
      
      // Basic metadata (Medium priority)
      isPinned: msg.pinned,
      hasAttachments: msg.attachments.size > 0
    }));

    messages.push(...processedBatch);
    lastMessageId = batch.last().id;
  }

  return messages;
}

async function saveMessages(messages) {
  const outputPath = 'community_data.json';
  await fs.writeFile(outputPath, JSON.stringify({
    collectedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages
  }, null, 2));
  console.log(`Saved ${messages.length} messages to ${outputPath}`);
}

client.login(process.env.DISCORD_TOKEN);