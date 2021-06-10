require('dotenv').config();

const Discord = require('discord.js');
const Memer = require('random-jokes-api');
const ytdl = require('ytdl-core');
const getytlink = require('youtube-search');
const util = require('util')

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
                if (prob < 0.33) {
                    message.channel.send(Memer.joke());
                }
                else if (prob > 0.33 && prob < 0.66) {
                    let embed = new Discord.MessageEmbed()
                        .setImage(Memer.meme().url);
                    message.channel.send(embed);
                }
                else {
                    message.channel.send(Memer.pun());
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
                getlink = util.promisify(getytlink);
                var result;
                try {
                    result = await getlink(args.join(), opts);
                } catch (err) {
                    console.log("ytlink error: ", err);
                }
                songPlayer(message, serverQueue, result);
                break;
            case 'next':
                next(message, serverQueue);
                break;
            case 'stop':
                stop(message, serverQueue);
                break;
            case 'pause':
                pauseMusic(message, serverQueue);
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

async function songPlayer(message, serverQueue, ytlink) {
    try {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply(`please take your kind ass to a voice channel first! 🙂`);
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send(`To the admin: You let LoLboy sing (permissions) or you'll face LoLboy's wrath!`);
        }
    
        const songInfo = await ytdl.getInfo(ytlink[0].link);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url
        };
          
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
    catch (error) {
        console.log(error);
        message.channel.send(error.message);
    }
} 


function next(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.reply(`get into a voice channel first, then only you can ask me to sing the next one. 😌`);
    if (!serverQueue)
        return message.reply(`you need songs to skip songs!`);
    serverQueue.connection.dispatcher.end();
}
  
function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("get into a voice channel first, then only you can ask me to stop singing. 😌");
      
    if (!serverQueue)
        return message.channel.send("There is no song that I could stop!");
      
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function pauseMusic(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('get into a voice channel first, then only you can ask me to pause my beautiful voice. 😌');
    }
    if (!serverQueue) {
        return message.channel.send('There is no song that I could pause!');
    }
    if (serverQueue.connection.dispatcher.paused) {
        return message.channel.send('Song already paused!');
    } 
	serverQueue.connection.dispatcher.pause();
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
            this.play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
  
client.login(process.env.LOLBOY_TOKEN);
