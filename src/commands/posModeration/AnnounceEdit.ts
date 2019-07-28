import { Client, Message, CommandComponent, TextChannel } from '@type/Bot';
import { RichEmbed } from 'discord.js';

const AnnouncementChannel: string = '336877836680036352';
const AfterRevision = (count: number): string => {
  return `Telah diedit sebanyak ${count.toString()} kali.`;
}

export default class AnnounceEdit implements CommandComponent {
  help = {
    name: 'editannounce',
    description: 'Edit the announce.',
    usage: 'editannounce <id_message>'
  }

  config = {
    aliases: ['edann'],
    cooldown: 5,
    direct_message: true
  }

  async run(client: Client, message: Message, args: string[]) {
    let embed = new RichEmbed()
      .setColor(client.config.embed_color)
      .setTimestamp()
      .setTitle(`${message.author.tag} disini!`)
      .setThumbnail(message.author.displayAvatarURL);


  }
}
