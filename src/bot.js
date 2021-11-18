require('dotenv').config();

const Discord = require('discord.js');
const Memer = require('random-jokes-api');
const ytdl = require('ytdl-core');
const getytlink = require('youtube-search');
const util = require('util');
// const ytdl = require('ytdl-core-discord');

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
                if (prob <= 0.2) {
                    message.channel.send(Memer.joke());
                }
                else if (prob > 0.2 && prob <= 0.4) {
                    let embed = new Discord.MessageEmbed()
                        .setImage(Memer.meme().url);
                    message.channel.send(embed);
                }
                else if (prob > 0.4 && prob <= 0.6) {
                    message.channel.send('Try this website xD\n\n' + Memer.uselessweb());
                }
                else if (prob > 0.6 && prob <= 0.8) {
                    message.channel.send(Memer.showerThought());
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
                if (args.length == 0) {
                    resumeMusic(message, serverQueue);
                }
                else {
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
                }
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
            case 'repeat':
                songRepeat(message, serverQueue);
            break;
            case 'shuffle':
                songShuffle(message, serverQueue);
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
                playSong(message.guild, queueConstruct.songs[i]);
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

var shuffle = false
var repeat = false;
var i = 0;

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
    i = 0;
    shuffle = false;
    repeat = false;
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function pauseMusic(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('get into a voice channel first, then only you can ask me to pause my beautiful voice. 😌');
    }
    else if (!serverQueue) {
        return message.channel.send('There is no song that I could pause!');
    }
    else if (serverQueue.connection.dispatcher.paused) {
        return message.channel.send('Song already paused!');
    }
    else {
	    serverQueue.connection.dispatcher.pause();
    }
}

function resumeMusic(message, serverQueue){
    if (!message.member.voice.channel) {
        return message.channel.send('get into a voice channel first, then only you can ask me to resume my beautiful voice. 😌');
    }
    else if (!serverQueue) {
        return message.channel.send('There is no song that I could resume!');
    }
    else if (!serverQueue.connection.dispatcher.paused) {
        return message.channel.send("I'm already singing!");
    } 
    else {
        serverQueue.connection.dispatcher.resume();
    }
}

function songRepeat(message, serverQueue){
    if (!message.member.voice.channel) {
        return message.channel.send('get into a voice channel first, then only you can ask me to repeat my beautiful voice. 😌');
    }
    else if (!serverQueue) {
        return message.channel.send('There is no song that I could repeat!');
    } 
    else {
        repeat = true;
        return message.channel.send("LoLboy will now repeat songs!");
    }
}

function songShuffle(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('get into a voice channel first, then only you can ask me to shuffle my beautiful voice. 😌');
    }
    else if (!serverQueue) {
        return message.channel.send('There are no songs to shuffle!');
    } 
    else {
        shuffle = true;
        return message.channel.send("LoLboy will now shuffle songs!");
    }
}

function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);
    
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
  
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url, { filter : "audioonly" }))
        .on("finish", () => {
            i++;
            if (repeat == true) {
                if (i == serverQueue.songs.length) {
                    i = 0;
                }
            }
            else {
                if (i == serverQueue.songs.length) {
                    i = 0;
                    serverQueue.songs = [];
                    return;
                }
            }
            playSong(guild, serverQueue.songs[i]);
            console.log(i);
            console.log(repeat);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
  
client.login(process.env.LOLBOY_TOKEN);


// write shuffle completely and perfect pause and add song list, perfect repeat as well 
