import { Client, Message, CommandComponent, TextChannel } from '@type/Bot';
import { RichEmbed, GuildChannel } from 'discord.js';

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
    let member = message.member;
    let embed = new RichEmbed()
      .setColor(client.config.embed_color)
      .setTimestamp()
      .setTitle(`${message.author.tag} disini!`)
      .setThumbnail(message.author.displayAvatarURL);

    if (!member.hasPermission('ADMINISTRATOR') || !member.hasPermission('MANAGE_CHANNELS'))
      return message.reply('kamu tidak mempunyai akses untuk menggunakan command ini.');

    // avoid error
    if (!args[0]) {
      return message.reply(client.constant.usage(client.prefix, this.help.usage));
    }

    // Get Channel
    let _channelFetch = <any>message.guild.channels.get(
      client.constant.announcer.channel
    );
    let channelFetch: TextChannel;
    if (_channelFetch) channelFetch = _channelFetch;
    else return message.reply(client.constant.errorReport('WRONG_ANNOUNCER_ID'));

    // Get message
    let msgEdit = await channelFetch.fetchMessage(args[0]);
    if (!msgEdit) return message.reply(client.constant.usage(client.prefix, this.help.usage));

    // Check the embed
    if (msgEdit.author.id !== client.user.id) {
      return message.reply(client.constant.usage(client.prefix, this.help.usage));
    }
    let footer = msgEdit.embeds[0].footer.text;
    if (footer.split(' | ')[0] !== client.constant.announcer.before_revision) {
      if (!footer.split(' | ')[0].startsWith('Telah diubah')) {
        return message.reply(client.constant.usage(client.prefix, this.help.usage));
      }
    }
    // message.channel.send('This is announce');

    // Check the member based embed
    let memID: string = footer.split(' | ')[1];
    if (memID !== message.author.id) {
      return message.reply('hanya yang menulis pengumuman tersebut yang dapat mengubah pengumuman itu.');
    }

    // Ancang2 sebelum edit message 
    let ancang: any = await message.channel.send(
      'Anda memiliki waktu hingga 10 menit untuk mengubah pesan dalam pengumuman tersebut.\n' +
      'Silahkan ketik dimulai dari sekarang.'
    );
    message.channel.awaitMessages(
      (msgRules: Message) => msgRules.author.id === message.author.id,
      {
        time: (10 * 60) * 1000,
        max: 1,
        errors: ['time']
      }
    )
      .then(async (collect) => {
        let messCollect = collect.first().content;
        if (messCollect.length > 2048) {
          return message.reply(client.constant.errorReport('The long of the text is more than 2048 character.'));
        }

        // Get the number
        let postedFooter = '';
        let footStriker = footer.split(' | ')[0];
        if (footStriker === client.constant.announcer.before_revision) {
          postedFooter = client.constant.announcer.after_revision(1);
        }
        else {
          let _getNumber: any = footStriker.match(/\d/g);
          // console.log(_getNumber);
          let getNumber: number = 0;
          if (_getNumber[0]) {
            getNumber = parseInt(_getNumber.join(''));
            postedFooter = client.constant.announcer.after_revision(getNumber + 1);
          }
          else {
            return message.reply(client.constant.errorReport('FOOTER_DETECTOR: Anomaly number counter.'));
          }
        }
        // console.log(postedFooter);

        // RENAME IT!
        embed
          .setDescription(messCollect)
          .setFooter(`${postedFooter} | ${message.author.id}`);
        msgEdit.edit(msgEdit.content, { embed: embed });

        // Delete all the message
        message.delete();
        collect.first().delete();
        ancang.delete();

        message.reply('pesan telah diubah!');
      })
      .catch((collect) => {
        message.reply('waktu habis!');
        // console.log(collect);
      })
  }
}
