require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`${client.user.username} just logged in!`);
});

client.on('message', (message) => {
    console.log(`${message.author.username} sent ${message.content}`);
});

client.login(process.env.LOLBOY_TOKEN);