import { Client, Message, CommandComponent, TextChannel } from '@type/Bot';
import { RichEmbed } from 'discord.js';

const AnnouncementChannel: string = "401532703301828610";

export default class FunkyAnnouncer implements CommandComponent {
  help = {
    name: 'announce',
    description: 'Announce with style.',
    usage: 'announce <--edit <id_message>> | <<text> [pict|file]>'
  }

  config = {
    aliases: ['announcement'],
    cooldown: 5,
    direct_message: true
  }

  async run(client: Client, message: Message, args: string[]) {
    let embed = new RichEmbed()
      .setColor(client.config.embed_color)
      .setTimestamp()
      .setFooter(`(C) ${new Date().getFullYear()} - ${client.config.bot_name}`)
      .setTitle(`${message.author.tag} disini!`)
      .setThumbnail(message.author.displayAvatarURL)
      .setImage(message.attachments.first().url);

    if (args[0] !== '--edit') {
      let text = args.join(' ');
      let author = message.author.id;

      if (text.length > 2048) {
        return message.reply('Anda tidak bisa mengirim pesan lebih dari 2048 karakter.');
      }
      if (message.attachments.size > 1) {
        return message.reply('Anda tidak bisa mengirim pesan lebih dari 1 attachment.');
      }

      message.channel.send('Anda mempunyai 1 menit untuk melihat pesan tersebut.\nApakah anda yakin ingin menampilkan pesan tersebut? (Y/N)');

      message.channel.awaitMessages(
        (m: Message) =>
          m.author.id === author &&
          (m.content.toUpperCase().startsWith('Y') || m.content.toUpperCase().startsWith('N')),
        {
          max: 1,
          time: 60000,
          errors: ['time']
        }
      )
        .then(collected => {
          let content = collected.first().content.toUpperCase();

          switch (content) {

            case 'Y':
              embed.setDescription(text);
              try {
                let ch = <TextChannel>client.channels.get(AnnouncementChannel);
                ch.send('aa', {
                  embed: embed
                })
                message.channel.send('Pesan terkirim!');
              } catch (error) {
                message.reply(client.constant.errorReport(error.message));
              }
              break;

            case 'N':
              message.channel.send('Pesan dibatalkan!');
              break;
          }
        })
        .catch(error => {
          message.reply('waktu habis! Silahkan umumkan kembali!');
          message.delete();
        });
    }
    else {
      message.channel.send('edit mode');
    }
  }
}
