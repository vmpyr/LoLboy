require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const PREFIX = "-";

client.on('ready', () => {
    console.log(`${client.user.username} just logged in!`);
});

client.on('message', (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith(PREFIX)) {
        const [CMD_NAME, ...args] = message.content
            .trim()
            .substring(PREFIX.length)
            .split(/\s+/);
        console.log(CMD_NAME);
        console.log(args);  
    }
});

client.login(process.env.LOLBOY_TOKEN);