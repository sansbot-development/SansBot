import { Client, Message, CommandComponent, TextChannel } from '@type/Bot';
import { RichEmbed, Collection } from 'discord.js';

const AnnouncementChannel: string = '336877836680036352';
const NotRevision: string = 'Belum direvisi.';
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

    console.log(await this.checkArgs(args, message));
  }
}
