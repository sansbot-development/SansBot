import { Client, GuildMember } from '@type/Bot'

export default (client: Client, member: GuildMember) => {
  console.log(member.user.tag);
}