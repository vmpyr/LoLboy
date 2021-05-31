require('dotenv').config();

const Discord = require('discord.js');
const Memer = require('random-jokes-api');
const ytdl = require('ytdl-core');
const getytlink = require('youtube-search');

const queue = new Map();
const client = new Discord.Client();
const PREFIX = "-";

client.on('ready', () => {
    console.log(`${client.user.username} just logged in!`);
});

client.on('message', async (message) => {
    if (message.author.bot) return;
    const serverQueue = queue.get(message.guild.id);
    if (message.content.startsWith(PREFIX)) {
        const [CMD_NAME, ...args] = message.content
            .trim()
            .substring(PREFIX.length)
            .split(/\s+/);
        
        switch (CMD_NAME) {
            case 'help':
                message.channel.send(`**${`LoLboy is very funny, test through these:`}**\n\n**${`-lol`}** => to get something funny\n\n**${`-hehe {tag person}`}** => to mock them\n\n\n**${`LoLboy is also very singy, test through these`}**\n\n**${`-play {song name with/without artist name}`}** => to play music\n\n**${`-pause`}** => its self evident you illiterate\n\n**${`-next`}** => when you're bored of the current\n\n**${`-stop`}** => when you're bored of all of them\n\n**${`-song-list`}** => when you want to predict when you'll be bored`);
                break;

            case 'lol':
                prob = Math.random();
                if (prob < 0.25) {
                    message.channel.send(Memer.joke());
                }
                else if (prob > 0.25 && prob < 0.5) {
                    let embed = new Discord.MessageEmbed()
                        .setImage(Memer.meme().url);
                    message.channel.send(embed);
                }
                else if (prob > 0.75) {
                    message.channel.send(Memer.pun());
                }
                else {
                    message.channel.send(Memer.showerThought())
                }
                break;

            case 'hehe':
                if (args.length == 0) {
                    message.reply('YOU want me to mock YOURSELF? 😏\nIf not then bloody tag someone Mr Crooked Fingers!');
                }
                else if (args[0].charAt(0) != '<') {
                    message.reply('you had to simply TAG a person. You seriously cannot even do that? You lazy tomcat. 😞');
                }
                else {
                    message.channel.send(`${args[0]}, ${Memer.roast()}`);
                }
                break;

            case 'play':
                const opts = {
                    maxResults: 1,
                    key: process.env.LOLBOY_YT_API_TOKEN
                };
                getytlink(args.join(), opts, (err, results) => {
                    if(err) return console.log(err);
                    return results[0].link;
                });
                console.log(getytlink());
                songPlayer(message, serverQueue);
                break;
            case 'next':
                next(message, serverQueue);
                break;
            case 'stop':
                stop(message, serverQueue);
                break;
            case 'pause':
                pause(message, serverQueue);
                break;
            case 'song-list':
                songList(message, serverQueue);
                break;

            default:
                message.reply(`check -help and put in a valid command, you blind slug 🙂`);
                break;               
        }
    }
});

async function songPlayer(message, serverQueue) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
        return message.reply(`please take your kind ass to a voice channel first! 🙂`);
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send(`To the admin: You let LoLboy sing (permissions) or you'll face LoLboy's wrath!`);
    }
    
    const songInfo = await ytdl.getInfo(getytlink());
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
    };
    console.log(song);
  
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
  
        queue.set(message.guild.id, queueConstruct);
  
        queueConstruct.songs.push(song);
  
        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } 
        catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } 
    else {
        serverQueue.songs.push(song);
        return message.channel.send(`I'm going to sing **${song.title}**!`);
    }
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
  
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
  
client.login(process.env.LOLBOY_TOKEN);