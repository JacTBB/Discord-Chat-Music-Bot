const Discord = require('discord.js');
const { Client, GatewayIntentBits, Partials, Collection, Util } = require('discord.js')
const { EmbedBuilder, PermissionsBitField, MessageActionRow, MessageButton, MessageSelectMenu, Colors } = require('discord.js')
const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction
    ]
})
const { Player, QueryType, QueueRepeatMode } = require('discord-player');
require('dotenv').config()
const prefix = "...";



client.config = require('./config');



global.player = new Player(client, client.config.opt.discordPlayer);



require('./events');



client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`)
})



client.on('messageCreate', async (message) => {
	if (message.content.startsWith(prefix) && !message.author.bot) {
		const args = message.content.slice(prefix.length).trim().split(' ')
		const command = args.shift().toLowerCase()

		const ErrorEmbed = new Discord.EmbedBuilder()
		.setTitle('An error has occured!')
		.setDescription('If error persists, contact Support.')
		.setColor(Colors.Red)
		.setFooter({ text: 'Seward Whitelist System' })
		.setTimestamp()

		if (command === 'play') {
			if (message.guild === null) return message.channel.send({ embeds: [ErrorEmbed] }).catch(console.error)
			if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				if (!message.member.voice.channel) {
					return message.reply('Not in VC.')
				}
				if (message.guild.members.me.voice.channel && message.member.voice.channel.id !== message.guild.members.me.voice.channel.id) {
					return message.reply('Not in same VC.')
				}

				(async () => {
					if (args.length < 1) return message.channel.send({ embeds: [ErrorEmbed] }).catch(console.error)
					const song = message.content.slice(prefix.length+4+1)

					const res = await player.search(song, {
						requestedBy: message.member,
						searchEngine: QueryType.AUTO
					})

					if (!res || !res.tracks.length) return message.reply({ content: `No results found.` })

					let queue = player.getQueue(message.guildId)
					if (!queue) {
						queue = await player.createQueue(message.guild, {
						metadata: message.channel,
						spotifyBridge: client.config.opt.spotifyBridge,
						initialVolume: client.config.opt.defaultvolume,
						leaveOnEnd: client.config.opt.leaveOnEnd
						})

						try {
							if (!queue.connection) await queue.connect(message.member.voice.channel)
						} catch {
							await player.deleteQueue(message.guildId)
							return message.reply({ content: `I can't join the voice channel.` })
						}
					}

					res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0])

					if (!queue.playing) await queue.play();
				})()
			}
			else {
				const Embed = new Discord.EmbedBuilder()
				.setTitle('Unauthorized')
				.setColor(Colors.Blue)
				.setFooter({ text: 'Seward Whitelist System' })
				.setTimestamp()
				message.reply({ embeds: [Embed] }).catch(console.error)
			}
		}

		if (command === 'loop') {
			if (message.guild === null) return message.channel.send({ embeds: [ErrorEmbed] }).catch(console.error)
			if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				(async () => {
					const queue = player.getQueue(message.guildId)

					if (!queue || !queue.playing) return message.reply({ content:`No music currently playing.` })

					if (queue.repeatMode === 2) return message.reply({ content:`You must first disable the current music in the loop mode.` });

					const success = queue.setRepeatMode( QueueRepeatMode.TRACK );
					
					return message.reply({ content: `Repeat mode **enabled** the current song will be repeated endlessly (you can end the loop with /loop disable)` });
				})()
			}
			else {
				const Embed = new Discord.EmbedBuilder()
				.setTitle('Unauthorized')
				.setColor(Colors.Blue)
				.setFooter({ text: 'Seward Whitelist System' })
				.setTimestamp()
				message.reply({ embeds: [Embed] }).catch(console.error)
			}
		}

		if (command === 'stop') {
			if (message.guild === null) return message.channel.send({ embeds: [ErrorEmbed] }).catch(console.error)
			if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				(async () => {
					const queue = player.getQueue(message.guildId)

					if (!queue || !queue.playing) return message.reply({ content:`No music currently playing.` })

					queue.destroy()

					message.reply({ content: `Music stopped.`})
				})()
			}
			else {
				const Embed = new Discord.EmbedBuilder()
				.setTitle('Unauthorized')
				.setColor(Colors.Blue)
				.setFooter({ text: 'Seward Whitelist System' })
				.setTimestamp()
				message.reply({ embeds: [Embed] }).catch(console.error)
			}
		}
	}
})



client.login(process.env.BOT_TOKEN);