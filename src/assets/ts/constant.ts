export default class Constant {
  public defaultMomentTemplate: string = 'MMMM Do YYYY [@] h:mm:ss A [UTC]Z';

  public usage(prefix: string, usage: string): string {
    return `the correct usage of this command is:\n**\`\`\`${prefix}${usage}\`\`\`**`;
  }

  public errorReport(message: string): string {
    return `Whoa! You get some error. Screenshot this error with your command that you execute and tell the developer why it's error.\n\`\`\`${message}\`\`\``;
  }

  public announcer = {
    channel: <string>process.env.POS_ANNOUNCE_CHANNEL,
    before_revision: 'Belum direvisi.',
    after_revision: (count: number): string => {
      return `Telah diubah sebanyak ${count} kali.`;
    }
  }
}