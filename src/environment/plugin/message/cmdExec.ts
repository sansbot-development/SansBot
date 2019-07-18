/**
 * This is module to run the commands.
 * Do not delete this file.
 */

import { Client, Message, ModuleCommand, CommandComponent } from '@type/Bot';
import { Collection } from 'discord.js';
import log from '../../../console';
import strTemplate from 'string-template';
import { Threadify } from 'synchronous-ify';

export default (client: Client, message: Message) => {
  let prefix = client.prefix;
  let args = message.content.slice(prefix.length).trim().split(/ +/g);
  let cmd = args[0].toLowerCase();
  let msg = message.content.toLowerCase();
  let commandFile = client.commands.get(cmd) || client.commands.get(<any>client.aliases.get(cmd));

  // If deveelopment
  if (process.env.DEV === 'dev') {
    if (message.content.startsWith(prefix) && !client.config.owners_id.includes(message.author.id)) {
      return message.channel.send(`:wave: | Hello <@${message.author.id}>, this bot is under maintenanced.`);
    }
  }

  // Prefix
  if (msg === `<@${client.user.id}>` || msg === `<@!${client.user.id}>`) {
    return message.channel.send(`:wave: | Hello <@${message.author.id}>, this bot prefix is \`${prefix}\``);
  }

  // Fix prefix override
  if (!message.content.startsWith(prefix)) return;

  // BEGIN COOLDOWN //
  let cooldown = new Collection<string, any>();

  if (!commandFile) return;
  if (!cooldown.has(commandFile.help.name)) {
    cooldown.set(commandFile.help.name, new Collection());
  }

  // Register member
  let member = message.author;
  let now = Date.now();
  let timestamps = cooldown.get(commandFile.help.name);
  let cooldownAmount = (commandFile.config.cooldown || 5) * 1000;

  if (!timestamps.has(member.id)) {
    timestamps.set(member.id, now);
  }
  else {
    let expirationTime = timestamps.get(member.id + cooldownAmount);
    if (now < expirationTime) {
      let timeLeft = (expirationTime - now) / 10000;
      return message.reply(`please wait about ${timeLeft} to using this command again.`);
    }
  }
  // END COOLDOWN //

  // Execute command
  try {
    // Make sure this command is execute in another core
    Threadify.runner((_stream) => {
      // If commandFile is null, return
      if (!commandFile) return;

      // If direct_message is false
      if (commandFile.config.direct_message == false && !message.guild) {
        return message.reply('You can not using this command in Direct Message!');
      }

      // If command is strict
      let strict: boolean = false;
      client.helps.forEach((help) => {
        // If command include in help
        // and if strict array include server id
        // and if strict array length more than 0
        if (help.cmds.includes(commandFile!.help.name) && !help.strict.includes(message.guild.id) && help.strict.length > 0)
          strict = true;
      });
      if (strict)
        return message.reply('You can not using this command in this server!');

      // Execute
      try {
        commandFile.run(client, message, args.splice(1));
      } catch (error) {
        log.error('MESSAGE', error);
      }
    });
  }
  catch (error) {
    log.error('MESSAGE', error);
  }
  finally {
    // If in textChannel
    if (message.guild) {
      log.info(
        'MESSAGE',
        strTemplate(
          '[{shard}] {tag}[{id}] using {command} command!\nGuild:\t{guildName} | {guildLocation}\nGuild_ID:\t{guildID}\nChannel_ID:\t{channelID}',
          {
            tag: message.author.tag,
            id: message.author.id,
            command: cmd,
            guildName: message.guild.name,
            guildLocation: message.guild.region,
            guildID: message.guild.id,
            channelID: message.channel.id,
            shard: client.shard.id
          }
        )
      )
    }
    // If in directMessage
    else {
      log.info(
        'MESSAGE',
        strTemplate(
          '[{shard}] {tag}[{id}] using {command} command!\nIn your Direct Message.',
          {
            tag: message.author.tag,
            id: message.author.id,
            command: cmd,
            shard: client.shard.id
          }
        )
      )
    }
  }
}
