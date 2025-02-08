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

client.login(process.env.DISCORD_TOKEN);