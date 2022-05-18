const { REST } = require('@discordjs/rest');
const { Routes: routes } = require('discord-api-types/v9');
const config = require('../config/config.json');
const wait = require('util').promisify(setTimeout);
const fs = require('fs');

const warns_file = __dirname + '/../warns/warns.json';
let warns = {};
console.log(`Loading ${warns_file}...`);
if (fs.existsSync(warns_file)) {
    console.log(`Reading ${warns_file}...`);
    let bytes = fs.readFileSync(warns_file, 'ascii');
    try {
        warns = JSON.parse(bytes);
    } catch (err) {
        console.error(`Error reading ${warns_file}!`);
        console.error(err);
        process.exit(1);
    }
} else {
    console.log(`File ${warns_file} does not exist!`)
    console.log(`Creating ${warns_file}...`);
    try {
        fs.writeFileSync(warns_file, '{}\n');
    } catch (err) {
        console.error(`Error writing ${warns_file}!`);
        console.error(err);
        process.exit(1);
    }
}
console.log(`Successfully loaded ${warns_file}!`);

const fucks_file = __dirname + '/../warns/fucks.json';
let fucks = {};
console.log(`Loading ${fucks}...`);
if (fs.existsSync(fucks_file)) {
    console.log(`Reading ${fucks_file}...`);
    let bytes = fs.readFileSync(fucks_file, 'ascii');
    try {
        fucks = JSON.parse(bytes);
    } catch (err) {
        console.error(`Error reading ${fucks_file}!`);
        console.error(err);
        process.exit(1);
    }
} else {
    console.log(`File ${fucks_file} does not exist!`)
    console.log(`Creating ${fucks_file}...`);
    try {
        fs.writeFileSync(fucks_file, '{}\n');
    } catch (err) {
        console.error(`Error writing ${fucks_file}!`);
        console.error(err);
        process.exit(1);
    }
}
console.log(`Successfully loaded ${fucks_file}!`);

const { global_commands: GlobalCommands } = require('../config/commands.json');
const { major_gaming_hub_commands: MajorGamingHubCommands } = require('../config/commands.json');

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            routes.applicationCommands('969662152594042880'),
            { body: GlobalCommands },
        );
        await rest.put(
            routes.applicationGuildCommands('969662152594042880', '969632304936931398'),
            { body: MajorGamingHubCommands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client(
    {
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_BANS
        ]
    }
);

async function log_channel(...attachments) {
    let channel_id = '969668507589574686';
    let channel = client.channels.cache.get(channel_id);
    channel = channel ? channel : client.channels.fetch(channel_id);
    if (channel) {
        try {
            return await channel.send({ embeds: attachments });
        } catch (err) {
            throw { error: err, msg: 'Error sending message. Check bot permission' };
        }
    } else {
        throw { error: null, msg: 'Could not find channel' };
    }
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// fucks
client.on('messageCreate', async (message) => {
    // if guild doesn't exist in config or is not an array (for some reason), return
    if (!Array.isArray(fucks[message.guild.id])) return;
    // if message author is not in the array, return
    if (!fucks[message.guild.id].includes(message.author.id)) return;
    // if message author is bot owner, return
    if (message.author.id === "607196862017044491") return;
    // if message author is the bot itself, return
    if (message.author.id === client.user.id) return;
    // if the message author is the guild owner, return
    if (message.author.id === await message.guild.fetchOwner().id) return;
    // if the message isn't deletable, return
    if (!message.deletable) return;

    // finally, delete the message
    message.delete();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    // Misc commands
    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
    // Moderation commands
    else if (interaction.commandName === 'ban') {
        if (!interaction.member.permissions.has('BAN_MEMBERS')) {
            await interaction.reply('You need ban members permission to use this command!');
            return;
        }

        let member = interaction.options.getMember('member');
        let member_user = member.user;
        let reason = interaction.options.getString('reason');
        reason = reason ? reason : '<No reason provided>';
        if (!member) {
            await interaction.reply('You need to specify a member!');
            return;
        }

        if (!member.bannable) {
            await interaction.reply(`Cannot ban ${member}. Check bot permission`);
            return;
        }
        await member.ban({ reason: reason });
        await interaction.reply(`Successfully banned ${member}.`);

        let embed = new MessageEmbed()
            .setTitle('Member Banned')
            .addField('Member', `${member_user.tag} (${member_user.id})`, false)
            .addField('Reason', reason, false)
            .addField('Duration', '.', false)
            .addField('Moderator',
                `${interaction.user.tag} ${interaction.member.nickname ? `(aka ${interaction.member.nickname})` : ''} (${interaction.user.id})`,
                false
            )
            .setTimestamp(Date.now())
            .setColor(config.colors.embed);
        await log_channel(embed);
    } else if (interaction.commandName === 'kick') {
        if (!interaction.member.permissions.has('KICK_MEMBERS')) {
            await interaction.reply('You need kick members permission to use this command!');
            return;
        }

        let member = interaction.options.getMember('member', true);
        let reason = interaction.options.getString('reason', false);
        reason = reason ? reason : '<No reason provided>';

        if (!member.kickable) {
            await interaction.reply(`Cannot kick ${member}. Check bot permission`);
            return;
        }
        await member.kick(reason);
        await interaction.reply(`Successfully kicked ${member}.`);

        let embed = new MessageEmbed()
            .setTitle('Member Kicked')
            .addField('Member', `${member.user.tag} (${member.user.id})`, false)
            .addField('Reason', reason, false)
            .addField('Moderator',
                `${interaction.user.tag} ${interaction.member.nickname ? `(${interaction.member.nickname})` : ''} (${interaction.user.id})`,
                false
            )
            .setTimestamp(Date.now())
            .setColor(config.colors.embed_critical);
        await log_channel(embed);
    } else if (interaction.commandName === 'clear') {
        if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
            await interaction.reply('You need manage messages permission to use this command!');
            return;
        }

        let amount = interaction.options.getInteger('messages', true);
        let channel = interaction.channel;
        try {
            await channel.bulkDelete(amount);
            await interaction.reply(`Successfully deleted ${amount} messages.`);
            await wait(1000);
            await interaction.deleteReply();
        } catch (err) {
            await interaction.reply(`There was an error deleting ${amount} messages. Check permission`);
            console.error(err);
        }
    } else if (interaction.commandName === 'warn') {
        if (!interaction.member.permissions.has('KICK_MEMBERS') || !interaction.member.permissions.has('BAN_MEMBERS')) {
            await interaction.reply('You need kick and ban members permission to use this command!');
            return;
        }

        let member = interaction.options.getMember('member', true);
        let reason = interaction.options.getString('reason', false);

        if (!warns.hasOwnProperty(interaction.guildId)) {
            warns[interaction.guildId] = {};
            warns[interaction.guildId][member.id] = { "warns": 1 }
        } else if (!warns[interaction.guildId].hasOwnProperty(member.id)) {
            warns[interaction.guildId][member.id] = { "warns": 1 }
        } else {
            warns[interaction.guildId][member.id].warns++;
        }

        reason = reason ? reason : '<No reason provided>';
        let log_embed = new MessageEmbed()
            .setTitle('Member Warn')
            .addField('Member', `${member.user.tag} ${member.nick ? `(${member.nickname})` : ''} (${member.id})`, false)
            .addField('Moderator',
                `${interaction.user.tag} ${interaction.member.nickname ? `(${interaction.member.nickname})` : ''} (${interaction.user.id})`,
                false
            )
            .addField('Reason', reason, true)
            .setTimestamp()
            .setColor(config.colors.embed)
            .setThumbnail(member.user.avatarURL() ? member.user.avatarURL() : client.user.avatarURL());
        let dm_embed = new MessageEmbed()
            .setTitle('Warning')
            .addField('Moderator',
                `${interaction.user.tag} ${interaction.member.nickname ? `(${interaction.member.nickname})` : ''} (${interaction.user.id})`,
                false
            )
            .addField('Reason', reason, true)
            .setDescription(`You have been warned on \`${member.guild.name}\`!`)
            .setTimestamp()
            .setColor(config.colors.embed_critical)
            .setThumbnail(member.guild.iconURL());

        let warn_pretty_num;
        if (warns[interaction.guildId][member.id].warns === 1)
            warn_pretty_num = '1st';
        else if (warns[interaction.guildId][member.id].warns === 2)
            warn_pretty_num = '2nd';
        else if (warns[interaction.guildId][member.id].warns === 3)
            warn_pretty_num = '3rd';
        else
            warn_pretty_num = warns[interaction.guildId][member.id].warns + 'th';
        log_embed.setFooter({ text: `This is their ${warn_pretty_num} warn!` });

        if (warns[interaction.guildId][member.id].warns < 3) {
            log_embed.addField('Punishment', 'None', true);
            dm_embed.addField('Punishment', 'None', true);
            try {
                await member.send({ embeds: [dm_embed] });
                await interaction.reply(`Successfully warned ${member.user.tag}!`);
            } catch (err) {
                console.error(err);
                await interaction.reply(`Unable to send ${member.user.tag} a DM!`)
            }
            await log_channel(log_embed);
        } else if (warns[interaction.guildId][member.id].warns == 3) {
            log_embed.setColor(config.colors.embed_critical);
            try {
                dm_embed.addField('Punishment', 'Kick', true);
                await member.send({ embeds: [dm_embed] });
                if (!member.kickable) {
                    await interaction.reply('Error: cannot kick member!\nWarned the user anyways.');
                    log_embed.addField('Punishment', 'Failed Kick', true);
                } else {
                    await member.kick(reason);
                    await interaction.reply(`Successfully kicked ${member.user.tag} due to 3rd warn!`);
                    log_embed.addField('Punishment', 'Kick', true);
                }
            } catch (err) {
                console.error(err);
                await interaction.reply(`Unable to send ${member.user.tag} a DM!`)
            }
            await log_channel(log_embed);
        } else {
            log_embed.setColor(config.colors.embed_critical);
            dm_embed.addField('Punishment', 'Ban', true);
            try {
                await member.send({ embeds: [dm_embed] });
                if (!member.bannable) {
                    await interaction.reply('Error: cannot ban member!\nWarned the user anyways.');
                    log_embed.addField('Punishment', 'Failed Ban', true)
                } else {
                    await member.ban({ reason: reason });
                    await interaction.reply(`Successfully banned ${member.user.tag} due to 4 or more warnings!`);
                    log_embed.addField('Punishment', 'Ban', true);
                }
            } catch (err) {
                console.error(err);
                await interaction.reply(`Unable to send ${member.user.tag} a DM!`)
            }
            await log_channel(log_embed);
        }

        try {
            console.log(`Saving ${warns_file}...`);
            fs.writeFileSync(warns_file, JSON.stringify(warns, undefined, 4), { encoding: 'ascii' });
            console.log(`Successfully saved ${warns_file}!`);
        } catch (err) {
            console.error(`Could not write to ${warns_file}!`);
            console.error(err);
        }
    } else if (interaction.commandName === 'fuckyou') {
        if (interaction.user.id === interaction.guild.fetchOwner().id || interaction.user.id === "607196862017044491") {
            let member = interaction.options.getMember('member', true);

            if (Array.isArray(fucks[interaction.guildId])) {
                if (fucks[interaction.guildId].includes(member.user.id)) {
                    await interaction.reply("This member already is fucked")
                } else {
                    fucks[interaction.guildId].push(member.user.id);
                }
            } else {
                fucks[interaction.guildId] = [member.user.id];
            }
            if (!interaction.replied)
                await interaction.reply(`Successfully fucked ${member.nick ? member.nickname : member.user.tag} >:)`);

            try {
                console.log(`Saving ${fucks_file}...`);
                fs.writeFileSync(fucks_file, JSON.stringify(fucks, undefined, 4), { encoding: 'ascii' });
                console.log(`Successfully saved ${fucks_file}!`);
            } catch (err) {
                console.error(`Could not write to ${fucks_file}!`);
                console.error(err);
            }
        } else {
            await interaction.reply("You do not have enough permission to use this command!")
        }
    } else if (interaction.commandName === "unfuckyou") {
        if (interaction.user.id === interaction.guild.fetchOwner().id || interaction.user.id === "607196862017044491") {
            let member = interaction.options.getMember('member', true);

            if (Array.isArray(fucks[interaction.guildId])) {
                if (fucks[interaction.guildId].includes(member.user.id)) {
                    let index = fucks[interaction.guildId].indexOf(member.user.id);
                    fucks[interaction.guildId].splice(index, 1);
                } else {
                    await interaction.reply("This member isn't fucked")
                }
            }
            if (!interaction.replied)
                await interaction.reply(`Successfully unfucked ${member.nick ? member.nickname : member.user.tag} >:)`);

            try {
                console.log(`Saving ${fucks_file}...`);
                fs.writeFileSync(fucks_file, JSON.stringify(fucks, undefined, 4), { encoding: 'ascii' });
                console.log(`Successfully saved ${fucks_file}!`);
            } catch (err) {
                console.error(`Could not write to ${fucks_file}!`);
                console.error(err);
            }
        } else {
            await interaction.reply("You do not have enough permission to use this command!")
        }
    }
});

client.login(process.env.TOKEN);
