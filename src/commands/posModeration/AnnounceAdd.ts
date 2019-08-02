import { Client, Message, CommandComponent, TextChannel } from '@type/Bot';
import { RichEmbed, Collection, GuildChannel } from 'discord.js';

type TArgsCollection = 'MENTION' | 'ROLE' | 'TEXT';
interface IRole {
  role_id: string;
  type: 'ROLE' | 'MEMBER' | 'UNKNOWN';
}
interface IMention {
  everyone?: boolean;
  here?: boolean;
}

export default class AnnounceAdd implements CommandComponent {
  help = {
    name: 'addannounce',
    description: 'Add announce into #announcement channel.',
    usage: 'addannounce [--everyone|--here] [id_user:any[]|role:any[]] <text>'
  }

  config = {
    aliases: ['adann'],
    cooldown: 5,
    direct_message: true
  }

  private isFlag = (value: string): boolean => {
    return value.startsWith('--') ? true : false;
  }

  private isRole = (value: string): boolean => {
    return value.startsWith('[') && value.endsWith(']') ? true : false;
  }

  private getArray = (value: string, message: Message): Promise<IRole[]> => {
    var newVal = value.slice(1, -1).split('|');
    let ret: IRole[] = [];
    return new Promise((resolve, reject) => {
      newVal.forEach(async id => {
        let member = await message.guild.members.get(id) || null;
        let role = await message.guild.roles.get(id) || null;

        if (member) ret.push({
          role_id: id,
          type: 'MEMBER'
        });
        else if (role) ret.push({
          role_id: id,
          type: 'ROLE'
        });
        else ret.push({
          role_id: id,
          type: 'UNKNOWN'
        });
      });
      resolve(ret);
    });
  }

  private checkArgs = (args: string[], message: Message): Promise<Collection<TArgsCollection, string | IRole[] | IMention>> => {
    let ret = new Collection<TArgsCollection, string | IRole[] | IMention>();
    let textCollect: string[] = [];
    let reachedArgs = args.slice(0, 2);

    return new Promise(async (resolve) => {
      await reachedArgs.forEach(async arg => {

        if (this.isFlag(arg)) {
          switch (arg) {
            case '--everyone':
              ret.set('MENTION', {
                everyone: true
              });
              break;
            case '--here':
              ret.set('MENTION', {
                here: true
              });
              break;
            default:
              textCollect.push(arg);
              break;
          }
        }
        else if (this.isRole(arg)) {
          let arr = await this.getArray(arg, message);
          let retRole: IRole[] = [];
          arr.forEach(ar => {
            if (ar.type === 'UNKNOWN') {
              textCollect.push(ar.role_id);
            }
            else {
              retRole.push(ar);
            }
          });
          ret.set('ROLE', retRole);
        }
        else {
          textCollect.push(arg);
        }

      });
      textCollect.push(args.slice(2).join(' '));
      ret.set('TEXT', textCollect.join(' '));
      resolve(ret);
    })
  }

  private captcha = (): string => {
    let randCharacter = 'QWERTYUIOPASDFGHJKLZXCVBNM';
    let arrCharacter = randCharacter.split('');
    let ret = '';
    for (let i = 0; i < 5; i++) {
      let randNumber = Math.floor(Math.random() * arrCharacter.length);
      ret += arrCharacter[randNumber];
    }
    return ret;
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

    let capcay = this.captcha();
    let rules = (msg: Message) => msg.content.toUpperCase() === capcay
      && msg.author.id === message.author.id;

    message.channel.send('Apakah anda yakin ingin mengirim pengumuman tersebut.\n' +
      `Balas pesan ini dengan kode berikut: \`${capcay}\``)
      .then((_msg: any) => {
        let msg: Message = _msg;
        message.channel.awaitMessages(rules, { max: 1, time: 300000, errors: ['time'] })
          .then(async (collected) => {
            let collectionArg = await this.checkArgs(args, message);
            let messageSend: string = '';
            // console.log(collectionArg);

            // <@&id> -> Role
            // <@!id> -> ID
            let _roleGet: any = collectionArg.get('ROLE');
            if (_roleGet) {
              let roleGet: IRole[] = _roleGet;
              roleGet.forEach((role) => {
                messageSend += role.type === 'MEMBER'
                  ? `<@!${role.role_id}> `
                  : `<@&${role.role_id}> `
              });
            }

            // If has mention
            let _mentionGet: any = collectionArg.get('MENTION');
            if (_mentionGet) {
              let mentionGet: IMention = _mentionGet;
              if (mentionGet.everyone) {
                messageSend += '@everyone ';
              }
              if (mentionGet.here) {
                messageSend += '@here ';
              }
            }
            // console.log(messageSend);

            // Text here
            let textGet: any = collectionArg.get('TEXT');
            embed
              .setFooter(`${client.constant.announcer.before_revision} | ${message.author.id}`, client.user.displayAvatarURL)
              .setDescription(textGet);

            let _gilda: any = message.guild.channels.get(client.constant.announcer.channel);
            if (!_gilda) return message.reply(client.constant.errorReport('WRONG_ANNOUNCER_ID'));

            let gilda: TextChannel = _gilda;
            await gilda.send(messageSend, { embed: embed });

            // Delete all the message
            await msg.delete();
            collected.forEach(col => {
              col.delete();
            });
            message.delete();

            await message.reply(`pesan terkirim! Cek di <#${client.constant.announcer.channel}>`);
          })
          .catch((err) => {
            message.reply('waktu habis!');
            msg.delete();
          });
      });
  }
}
